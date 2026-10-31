"""
Secure Firmware Update Verification API
Enforces cryptographic hash integrity, ML-DSA-65 signature authentication,
device model compatibility, and anti-rollback policy.
"""

import json
import base64
import hashlib
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import FirmwareUpdate
from backend.app.schemas.schemas import FirmwareVerificationResponse
from backend.app.core.firmware_verifier import firmware_verifier
from backend.app.core.signature_manager import signature_manager
from backend.app.core.attack_detector import attack_detector
from backend.app.core.audit_manager import audit_manager

router = APIRouter(prefix="/firmware", tags=["Firmware Security"])

class FirmwareUploadJSON(BaseModel):
    firmware_binary_base64: str
    manifest: dict
    signature_hex: str

@router.post("/verify", response_model=FirmwareVerificationResponse)
def verify_firmware(payload: FirmwareUploadJSON, db: Session = Depends(get_db)):
    """
    Submits a firmware package for multi-stage cryptographic and anti-rollback verification.
    """
    try:
        firmware_bytes = base64.b64decode(payload.firmware_binary_base64)
        signature_bytes = bytes.fromhex(payload.signature_hex)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Encoding error: {str(e)}")

    is_approved, result_dict, reason = firmware_verifier.verify_firmware_package(
        db, firmware_bytes, payload.manifest, signature_bytes
    )

    attack_type = "NONE"
    if result_dict.get("integrity_status") == "MISMATCH" or result_dict.get("signature_status") in ["INVALID", "UNTRUSTED_KEY"]:
        attack_type = "FIRMWARE_TAMPERING"

    attack_detector.log_security_event(
        db,
        event_type="FIRMWARE_VERIFICATION",
        attack_type=attack_type,
        device_id=payload.manifest.get("device_model", "FIRMWARE"),
        severity="INFO" if is_approved else "CRITICAL",
        result="SUCCESS" if is_approved else "REJECTED",
        reason=reason,
        detection_module="firmware_verifier"
    )

    audit_manager.log_event(
        db,
        event_type="FIRMWARE_VERIFIED",
        actor="FIRMWARE_SERVICE",
        event_data={
            "firmware_id": payload.manifest.get("firmware_id"),
            "result": "APPROVED" if is_approved else "REJECTED",
            "reason": reason
        }
    )

    return FirmwareVerificationResponse(**result_dict)

@router.post("/verify-multipart", response_model=FirmwareVerificationResponse)
async def verify_firmware_multipart(
    firmware_file: UploadFile = File(...),
    manifest_file: UploadFile = File(...),
    signature_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts direct multipart file uploads of firmware.bin, manifest.json, and signature.bin.
    """
    firmware_bytes = await firmware_file.read()
    manifest_bytes = await manifest_file.read()
    signature_bytes = await signature_file.read()

    try:
        manifest_dict = json.loads(manifest_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="manifest.json is not valid UTF-8 JSON")

    is_approved, result_dict, reason = firmware_verifier.verify_firmware_package(
        db, firmware_bytes, manifest_dict, signature_bytes
    )

    attack_type = "FIRMWARE_TAMPERING" if not is_approved else "NONE"
    attack_detector.log_security_event(
        db,
        event_type="FIRMWARE_VERIFICATION",
        attack_type=attack_type,
        device_id=manifest_dict.get("device_model", "FIRMWARE"),
        severity="INFO" if is_approved else "CRITICAL",
        result="SUCCESS" if is_approved else "REJECTED",
        reason=reason,
        detection_module="firmware_verifier"
    )

    return FirmwareVerificationResponse(**result_dict)

@router.get("/history", response_model=List[FirmwareVerificationResponse])
def get_firmware_history(db: Session = Depends(get_db)):
    """Returns all historical firmware package verification decisions."""
    return db.query(FirmwareUpdate).order_by(FirmwareUpdate.created_at.desc()).limit(50).all()

@router.get("/demo-packages")
def generate_demo_packages():
    """
    Generates genuine, tampered, untrusted-key, and rollback packages for hackathon judges demonstration.
    All signatures are genuinely computed using real ML-DSA-65 algorithms.
    """
    pk, sk = firmware_verifier.get_manufacturer_signing_keypair()
    
    # 1. Genuine Firmware Package (Version 2.1.0, Security Version 5)
    genuine_bin = b"SECUREMED_FIRMWARE_BINARY_V2.1.0_AUTHENTIC_NIST_PQC_RTOS"
    genuine_hash = hashlib.sha256(genuine_bin).hexdigest()
    genuine_manifest = {
        "firmware_id": "FW-GENUINE-201",
        "device_model": "PATIENT_MONITOR",
        "firmware_version": "2.1.0",
        "security_version": 5,
        "sha256": genuine_hash,
        "signing_key_id": "FIRMWARE-KEY-01",
        "release_timestamp": datetime.now(timezone.utc).isoformat()
    }
    canonical_manifest = firmware_verifier.canonicalize_manifest(genuine_manifest)
    genuine_sig = signature_manager.sign(sk, canonical_manifest)

    # 2. Tampered Binary Package (1 byte modified in binary, manifest kept unchanged)
    tampered_bin = bytearray(genuine_bin)
    tampered_bin[10] ^= 0xFF  # Flip bits
    tampered_bin = bytes(tampered_bin)

    # 3. Untrusted Signing Key Package (Valid format, but signed with an unknown adversary key)
    adv_pk, adv_sk = signature_manager.generate_keypair()
    untrusted_manifest = {
        "firmware_id": "FW-ROGUE-001",
        "device_model": "PATIENT_MONITOR",
        "firmware_version": "2.1.0",
        "security_version": 6,
        "sha256": genuine_hash,
        "signing_key_id": "ROGUE-ADVERSARY-KEY-99",
        "release_timestamp": datetime.now(timezone.utc).isoformat()
    }
    untrusted_sig = signature_manager.sign(adv_sk, firmware_verifier.canonicalize_manifest(untrusted_manifest))

    # 4. Anti-Rollback Exploit Package (Older security version 1 when version 5 is already installed)
    rollback_bin = b"SECUREMED_OLD_VULNERABLE_FIRMWARE_V1.0.0"
    rollback_hash = hashlib.sha256(rollback_bin).hexdigest()
    rollback_manifest = {
        "firmware_id": "FW-ROLLBACK-099",
        "device_model": "PATIENT_MONITOR",
        "firmware_version": "1.0.0",
        "security_version": 1,
        "sha256": rollback_hash,
        "signing_key_id": "FIRMWARE-KEY-01",
        "release_timestamp": datetime.now(timezone.utc).isoformat()
    }
    rollback_sig = signature_manager.sign(sk, firmware_verifier.canonicalize_manifest(rollback_manifest))

    return {
        "genuine": {
            "firmware_binary_base64": base64.b64encode(genuine_bin).decode("utf-8"),
            "manifest": genuine_manifest,
            "signature_hex": genuine_sig.hex(),
            "description": "Genuine manufacturer package signed with authorized ML-DSA-65 key."
        },
        "tampered_binary": {
            "firmware_binary_base64": base64.b64encode(tampered_bin).decode("utf-8"),
            "manifest": genuine_manifest,
            "signature_hex": genuine_sig.hex(),
            "description": "Tampered package: 1 byte flipped in binary while keeping original manifest."
        },
        "untrusted_key": {
            "firmware_binary_base64": base64.b64encode(genuine_bin).decode("utf-8"),
            "manifest": untrusted_manifest,
            "signature_hex": untrusted_sig.hex(),
            "description": "Untrusted key package: signed with an unauthorized external key."
        },
        "rollback_exploit": {
            "firmware_binary_base64": base64.b64encode(rollback_bin).decode("utf-8"),
            "manifest": rollback_manifest,
            "signature_hex": rollback_sig.hex(),
            "description": "Anti-rollback exploit: legitimate older version 1 attempting to overwrite version 5."
        }
    }
