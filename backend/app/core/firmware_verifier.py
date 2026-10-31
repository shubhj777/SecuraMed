"""
Secure Firmware Update Verification Module
Enforces multi-layer cryptographic and architectural firmware validation:
1. Size limit enforcement
2. SHA-256 cryptographic hash integrity verification
3. ML-DSA-65 (NIST FIPS 204) digital signature verification against authorized manufacturer keys
4. Device model compatibility matching
5. Monotonic security version anti-rollback enforcement
"""

import json
import hashlib
import os
from datetime import datetime, timezone
from typing import Tuple, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models.models import FirmwareUpdate
from backend.app.core.signature_manager import signature_manager

class FirmwareVerifier:
    def __init__(self):
        # In a real environment, keys are loaded from an HSM or pinned manufacturer root certificate.
        # For the hackathon gateway, we generate a deterministic authorized manufacturer ML-DSA-65 keypair.
        self._authorized_keys: Dict[str, bytes] = {}
        self._init_trusted_keys()

    def _init_trusted_keys(self):
        """Initializes authorized manufacturer signing keys."""
        # Key ID: FIRMWARE-KEY-01 (Authorized SecureMed Manufacturer Root Key)
        pk, sk = signature_manager.generate_keypair()
        self._authorized_keys["FIRMWARE-KEY-01"] = pk
        self._manufacturer_signing_sk = sk  # Kept internally for test packager utility

    def get_trusted_public_key(self, key_id: str) -> Optional[bytes]:
        return self._authorized_keys.get(key_id)

    def get_manufacturer_signing_keypair(self) -> Tuple[bytes, bytes]:
        """Provides manufacturer keys for genuine firmware generation in emulator/demos."""
        return self._authorized_keys["FIRMWARE-KEY-01"], self._manufacturer_signing_sk

    @staticmethod
    def canonicalize_manifest(manifest_dict: dict) -> bytes:
        """
        Produces canonical deterministic UTF-8 JSON representation for signature verification.
        Keys are sorted to avoid whitespace or ordering mismatches.
        """
        return json.dumps(manifest_dict, sort_keys=True, separators=(',', ':')).encode('utf-8')

    def verify_firmware_package(
        self, 
        db: Session, 
        firmware_bytes: bytes, 
        manifest_dict: dict, 
        signature_bytes: bytes
    ) -> Tuple[bool, dict, str]:
        """
        Executes full 10-step verification of firmware package.
        Returns: (is_approved: bool, record_dict: dict, reason: str)
        """
        # 1. Size check
        if len(firmware_bytes) > settings.MAX_FIRMWARE_SIZE_BYTES:
            return False, {}, f"Firmware binary exceeds size limit of {settings.MAX_FIRMWARE_SIZE_BYTES} bytes"

        # 2. Manifest required fields check
        required_fields = ["firmware_id", "device_model", "firmware_version", "security_version", "sha256", "signing_key_id"]
        for f in required_fields:
            if f not in manifest_dict:
                return False, {}, f"Manifest missing mandatory field: {f}"

        firmware_id = manifest_dict["firmware_id"]
        device_model = manifest_dict["device_model"]
        firmware_version = manifest_dict["firmware_version"]
        security_version = int(manifest_dict["security_version"])
        expected_hash = manifest_dict["sha256"].lower().strip()
        signing_key_id = manifest_dict["signing_key_id"]

        # 3. Calculate SHA-256 of firmware binary
        calculated_hash = hashlib.sha256(firmware_bytes).hexdigest().lower()
        integrity_status = "MATCH" if calculated_hash == expected_hash else "MISMATCH"

        # 4. Check if signing key is authorized
        trusted_pk = self.get_trusted_public_key(signing_key_id)
        if not trusted_pk:
            sig_status = "UNTRUSTED_KEY"
        else:
            canonical_manifest = self.canonicalize_manifest(manifest_dict)
            is_valid_sig = signature_manager.verify(trusted_pk, canonical_manifest, signature_bytes)
            sig_status = "VERIFIED" if is_valid_sig else "INVALID"

        # 5. Device model compatibility check
        known_models = ["PATIENT_MONITOR", "ECG_MONITOR", "INFUSION_PUMP"]
        compatibility_status = "COMPATIBLE" if device_model in known_models else "INCOMPATIBLE"

        # 6. Anti-rollback check: compare against highest approved security version for this model
        latest_approved = db.query(FirmwareUpdate).filter(
            FirmwareUpdate.device_model == device_model,
            FirmwareUpdate.verification_result == "APPROVED"
        ).order_by(FirmwareUpdate.security_version.desc()).first()

        anti_rollback_status = "PASSED"
        if latest_approved and security_version < latest_approved.security_version:
            anti_rollback_status = "ROLLBACK_DETECTED"

        # 7. Final decision logic
        rejection_reasons = []
        if integrity_status != "MATCH":
            rejection_reasons.append(f"SHA-256 integrity mismatch: calculated {calculated_hash} != manifest {expected_hash}")
        if sig_status == "UNTRUSTED_KEY":
            rejection_reasons.append(f"Signing key '{signing_key_id}' is not in the gateway trusted manufacturer keystore")
        elif sig_status == "INVALID":
            rejection_reasons.append("ML-DSA-65 post-quantum digital signature verification failed on manifest")
        if compatibility_status != "COMPATIBLE":
            rejection_reasons.append(f"Target device model '{device_model}' is incompatible with gateway fleet")
        if anti_rollback_status == "ROLLBACK_DETECTED":
            rejection_reasons.append(f"Anti-rollback violation: security version {security_version} < currently active version {latest_approved.security_version}")

        is_approved = len(rejection_reasons) == 0
        verification_result = "APPROVED" if is_approved else "REJECTED"
        final_reason = "Firmware passed all cryptographic, integrity, compatibility, and anti-rollback verifications" if is_approved else "; ".join(rejection_reasons)

        # 8. Record in database
        saved_file_path = None
        if is_approved:
            os.makedirs(settings.FIRMWARE_STORAGE_PATH, exist_ok=True)
            saved_file_path = os.path.join(settings.FIRMWARE_STORAGE_PATH, f"{firmware_id}_{firmware_version}.bin")
            with open(saved_file_path, "wb") as f:
                f.write(firmware_bytes)

        record = FirmwareUpdate(
            firmware_id=firmware_id,
            device_model=device_model,
            firmware_version=firmware_version,
            security_version=security_version,
            file_hash=calculated_hash,
            signing_key_id=signing_key_id,
            signature_status=sig_status,
            integrity_status=integrity_status,
            compatibility_status=compatibility_status,
            anti_rollback_status=anti_rollback_status,
            verification_result=verification_result,
            reason=final_reason,
            file_path=saved_file_path,
            created_at=datetime.now(timezone.utc)
        )
        db.add(record)
        db.commit()

        result_dict = {
            "firmware_id": firmware_id,
            "device_model": device_model,
            "firmware_version": firmware_version,
            "security_version": security_version,
            "file_hash": calculated_hash,
            "signing_key_id": signing_key_id,
            "signature_status": sig_status,
            "integrity_status": integrity_status,
            "compatibility_status": compatibility_status,
            "anti_rollback_status": anti_rollback_status,
            "verification_result": verification_result,
            "reason": final_reason,
            "created_at": record.created_at
        }
        return is_approved, result_dict, final_reason

firmware_verifier = FirmwareVerifier()
