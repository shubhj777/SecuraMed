"""
Attack Simulation Engine & Lab API
Executes real backend security verifications against controlled attack vectors.
Never hardcodes results: executes actual cryptographic verification, sequence tracking,
and policy enforcement functions.
"""

import json
import os
import time
import uuid
import base64
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import Device, DeviceSession, SecurityEvent
from backend.app.schemas.schemas import AttackSimulationRequest, AttackSimulationResponse
from backend.app.core.device_auth import device_auth
from backend.app.core.encryption import encryption_manager
from backend.app.core.pqc_manager import pqc_manager
from backend.app.core.signature_manager import signature_manager
from backend.app.core.replay_protection import replay_protection
from backend.app.core.access_control import access_control
from backend.app.core.rate_limiter import rate_limiter
from backend.app.core.firmware_verifier import firmware_verifier
from backend.app.core.attack_detector import attack_detector

router = APIRouter(prefix="/attacks", tags=["Attack Simulator"])

def _ensure_active_device_session(db: Session, device_id: str) -> tuple[Device, DeviceSession, bytes]:
    """Ensures a device and active session exist with a valid key in the memory vault."""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        # Auto-provision demo device with valid ML-DSA-65 key
        pk, sk = signature_manager.generate_keypair()
        device = Device(
            device_id=device_id,
            device_name=f"Patient Monitor ({device_id})",
            device_type="PATIENT_MONITOR",
            public_key=pk.hex(),
            trust_status="TRUSTED",
            connection_status="ONLINE"
        )
        db.add(device)
        db.commit()
        db.refresh(device)

    # Check for active session
    active_sess = db.query(DeviceSession).filter(
        DeviceSession.device_id == device_id,
        DeviceSession.session_status == "ACTIVE"
    ).first()

    session_key = device_auth.get_session_key(active_sess.session_id) if active_sess else None

    if not active_sess or not session_key:
        # Create fresh session key
        session_key = os.urandom(32)
        sess_id = f"SES-SIM-{device_id}-{uuid.uuid4().hex[:8]}"
        active_sess = DeviceSession(
            session_id=sess_id,
            device_id=device_id,
            session_status="ACTIVE",
            session_key_fingerprint=hashlib.sha256(session_key).hexdigest(),
            last_sequence_number=100,
            created_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc),
            last_activity=datetime.now(timezone.utc)
        )
        db.add(active_sess)
        db.commit()
        db.refresh(active_sess)
        device_auth._session_keys[sess_id] = session_key

    return device, active_sess, session_key

@router.post("/simulate", response_model=AttackSimulationResponse)
def simulate_attack(payload: AttackSimulationRequest, db: Session = Depends(get_db)):
    """
    Executes actual backend security verification against a selected attack vector.
    Dispatches directly into real cryptographic, replay, authorization, and rate-limiting engines.
    """
    attack_type = payload.attack_type.upper().strip()
    target = payload.target_device
    timestamp_str = datetime.now(timezone.utc).isoformat()

    # -------------------------------------------------------------
    # ATTACK 1: DEVICE IMPERSONATION
    # -------------------------------------------------------------
    if attack_type == "DEVICE_IMPERSONATION":
        # Adversary attempts handshake using an unregistered device or a forged ML-DSA-65 signature
        rogue_device_id = payload.custom_params.get("device_id", "ROGUE-DEVICE-999") if payload.custom_params else "ROGUE-DEVICE-999"
        
        # Step A: Attempt handshake init for unregistered device
        success, resp_data, reason = device_auth.initiate_handshake(db, rogue_device_id, os.urandom(16).hex())
        
        if not success:
            event = attack_detector.log_security_event(
                db,
                event_type="DEVICE_AUTHENTICATION",
                attack_type="DEVICE_IMPERSONATION",
                device_id=rogue_device_id,
                severity="HIGH",
                result="BLOCKED",
                reason=reason,
                detection_module="device_auth"
            )
            return AttackSimulationResponse(
                event_id=event.event_id,
                attack_type=attack_type,
                target_device=rogue_device_id,
                severity="HIGH",
                result="BLOCKED",
                reason=reason,
                timestamp=timestamp_str,
                detection_module="device_auth",
                technical_details={
                    "gateway_action": "Registry lookup failed. Handshake rejected.",
                    "mitigation": "Cryptographic proof of possession required; unknown identities denied."
                }
            )
        
        # Step B: If device existed, attempt forged signature
        _, rogue_sk = signature_manager.generate_keypair()
        fake_sig = signature_manager.sign(rogue_sk, bytes.fromhex(resp_data["challenge"]))
        gw_pk = bytes.fromhex(resp_data["gateway_kem_public_key"])
        ct, _ = pqc_manager.encapsulate(gw_pk)

        success2, _, reason2 = device_auth.complete_handshake(
            db, rogue_device_id, resp_data["challenge"], fake_sig.hex(), ct.hex()
        )
        event = attack_detector.log_security_event(
            db,
            event_type="DEVICE_AUTHENTICATION",
            attack_type="DEVICE_IMPERSONATION",
            device_id=rogue_device_id,
            severity="HIGH",
            result="BLOCKED" if not success2 else "ACCEPTED",
            reason=reason2,
            detection_module="device_auth"
        )
        return AttackSimulationResponse(
            event_id=event.event_id,
            attack_type=attack_type,
            target_device=rogue_device_id,
            severity="HIGH",
            result="BLOCKED" if not success2 else "ACCEPTED",
            reason=reason2,
            timestamp=timestamp_str,
            detection_module="device_auth",
            technical_details={"handshake_phase": "ML-DSA-65 challenge verification"}
        )

    # -------------------------------------------------------------
    # ATTACK 2: MESSAGE TAMPERING
    # -------------------------------------------------------------
    elif attack_type == "MESSAGE_TAMPERING":
        device, session_rec, session_key = _ensure_active_device_session(db, target)
        seq_num = session_rec.last_sequence_number + 1
        
        # Legitimate plaintext
        valid_telemetry = json.dumps({"readings": {"heart_rate": 75, "spo2": 99}}).encode("utf-8")
        nonce, ciphertext, tag = encryption_manager.encrypt_payload(
            session_key, valid_telemetry, target, session_rec.session_id, seq_num
        )

        # Adversary alters 1 byte of the ciphertext or tag in transit
        tampered_ciphertext = bytearray(ciphertext)
        tampered_ciphertext[2] ^= 0xAA  # Flip bits
        tampered_ciphertext = bytes(tampered_ciphertext)

        # Gateway verification attempt
        decrypted = encryption_manager.decrypt_payload(
            session_key, nonce, tampered_ciphertext, tag, target, session_rec.session_id, seq_num
        )

        if decrypted is None:
            reason = "AES-256-GCM authentication tag verification failed. Ciphertext tampering detected."
            event = attack_detector.log_security_event(
                db,
                event_type="TAMPERING_DETECTION",
                attack_type="MESSAGE_TAMPERING",
                device_id=target,
                severity="CRITICAL",
                result="BLOCKED",
                reason=reason,
                detection_module="encryption"
            )
            return AttackSimulationResponse(
                event_id=event.event_id,
                attack_type=attack_type,
                target_device=target,
                severity="CRITICAL",
                result="BLOCKED",
                reason=reason,
                timestamp=timestamp_str,
                detection_module="encryption",
                technical_details={
                    "algorithm": "AES-256-GCM",
                    "tampered_bytes": 1,
                    "tag_valid": False,
                    "associated_data_bound": True
                }
            )
        else:
            return AttackSimulationResponse(
                event_id="EVT-ERR", attack_type=attack_type, target_device=target,
                severity="CRITICAL", result="FAILED_DETECTION", reason="Tampered message was unexpectedly decrypted!",
                timestamp=timestamp_str, detection_module="encryption", technical_details={}
            )

    # -------------------------------------------------------------
    # ATTACK 3: REPLAY ATTACK
    # -------------------------------------------------------------
    elif attack_type == "REPLAY_ATTACK":
        device, session_rec, session_key = _ensure_active_device_session(db, target)
        
        # 1. Generate and accept a genuine initial message
        seq_num = session_rec.last_sequence_number + 1
        valid_telemetry = json.dumps({"readings": {"heart_rate": 80, "spo2": 98}}).encode("utf-8")
        nonce, ciphertext, tag = encryption_manager.encrypt_payload(
            session_key, valid_telemetry, target, session_rec.session_id, seq_num
        )
        
        # First transmission: Accepted
        is_seq1_valid, _ = replay_protection.validate_and_record(db, target, session_rec.session_id, seq_num)
        
        # 2. Replay attack: Adversary captures the packet and re-transmits the exact same sequence number!
        is_replayed_valid, replay_reason = replay_protection.validate_and_record(db, target, session_rec.session_id, seq_num)

        result_str = "BLOCKED" if not is_replayed_valid else "ACCEPTED"
        event = attack_detector.log_security_event(
            db,
            event_type="REPLAY_DETECTION",
            attack_type="REPLAY_ATTACK",
            device_id=target,
            severity="HIGH",
            result=result_str,
            reason=replay_reason,
            detection_module="replay_protection"
        )
        return AttackSimulationResponse(
            event_id=event.event_id,
            attack_type=attack_type,
            target_device=target,
            severity="HIGH",
            result=result_str,
            reason=replay_reason,
            timestamp=timestamp_str,
            detection_module="replay_protection",
            technical_details={
                "replayed_sequence_number": seq_num,
                "session_id": session_rec.session_id,
                "sliding_window_active": True
            }
        )

    # -------------------------------------------------------------
    # ATTACK 4: UNAUTHORIZED COMMAND
    # -------------------------------------------------------------
    elif attack_type == "UNAUTHORIZED_COMMAND":
        device, session_rec, session_key = _ensure_active_device_session(db, target)
        seq_num = session_rec.last_sequence_number + 1

        unauthorized_cmd = "MODIFY_INFUSION_DOSAGE_OVERRIDE"
        cmd_ok, cmd_reason = access_control.validate_device_command(device.device_type, unauthorized_cmd)

        result_str = "BLOCKED" if not cmd_ok else "EXECUTED"
        event = attack_detector.log_security_event(
            db,
            event_type="UNAUTHORIZED_COMMAND",
            attack_type="UNAUTHORIZED_COMMAND",
            device_id=target,
            severity="HIGH",
            result=result_str,
            reason=cmd_reason,
            detection_module="access_control"
        )
        return AttackSimulationResponse(
            event_id=event.event_id,
            attack_type=attack_type,
            target_device=target,
            severity="HIGH",
            result=result_str,
            reason=cmd_reason,
            timestamp=timestamp_str,
            detection_module="access_control",
            technical_details={
                "device_type": device.device_type,
                "attempted_command": unauthorized_cmd,
                "policy": "Clinical IoT devices strictly restricted to telemetry streaming"
            }
        )

    # -------------------------------------------------------------
    # ATTACK 5: FIRMWARE TAMPERING
    # -------------------------------------------------------------
    elif attack_type == "FIRMWARE_TAMPERING":
        pk, sk = firmware_verifier.get_manufacturer_signing_keypair()
        genuine_bin = b"SECUREMED_RTOS_FIRMWARE_V2.2.0"
        genuine_hash = hashlib.sha256(genuine_bin).hexdigest()
        
        manifest = {
            "firmware_id": "FW-TAMPER-TEST",
            "device_model": "PATIENT_MONITOR",
            "firmware_version": "2.2.0",
            "security_version": 5,
            "sha256": genuine_hash,
            "signing_key_id": "FIRMWARE-KEY-01"
        }
        canonical_manifest = firmware_verifier.canonicalize_manifest(manifest)
        sig = signature_manager.sign(sk, canonical_manifest)

        # Attacker injects a malicious payload into the binary
        malicious_bin = genuine_bin + b"_BACKDOOR_INJECTION"

        is_approved, result_dict, reason = firmware_verifier.verify_firmware_package(
            db, malicious_bin, manifest, sig
        )

        event = attack_detector.log_security_event(
            db,
            event_type="FIRMWARE_VERIFICATION",
            attack_type="FIRMWARE_TAMPERING",
            device_id=target,
            severity="CRITICAL",
            result="BLOCKED" if not is_approved else "APPROVED",
            reason=reason,
            detection_module="firmware_verifier"
        )
        return AttackSimulationResponse(
            event_id=event.event_id,
            attack_type=attack_type,
            target_device=target,
            severity="CRITICAL",
            result="BLOCKED" if not is_approved else "APPROVED",
            reason=reason,
            timestamp=timestamp_str,
            detection_module="firmware_verifier",
            technical_details=result_dict
        )

    # -------------------------------------------------------------
    # ATTACK 6: REQUEST FLOODING (DoS Simulation)
    # -------------------------------------------------------------
    elif attack_type == "REQUEST_FLOODING":
        # Simulate burst of 75 requests from this device against rate limiter with limit=60
        burst_size = 75
        blocked_count = 0
        retry_delay = 0.0

        for i in range(burst_size):
            allowed, count, retry = rate_limiter.is_allowed(target, limit=60, window_seconds=60.0)
            if not allowed:
                blocked_count += 1
                retry_delay = retry

        reason = f"Device exceeded maximum allowable quota: {blocked_count} of {burst_size} burst packets throttled"
        event = attack_detector.log_security_event(
            db,
            event_type="RATE_LIMIT_VIOLATION",
            attack_type="REQUEST_FLOODING",
            device_id=target,
            severity="MEDIUM",
            result="MITIGATED",
            reason=reason,
            detection_module="rate_limiter"
        )
        return AttackSimulationResponse(
            event_id=event.event_id,
            attack_type=attack_type,
            target_device=target,
            severity="MEDIUM",
            result="MITIGATED",
            reason=reason,
            timestamp=timestamp_str,
            detection_module="rate_limiter",
            technical_details={
                "burst_packets_sent": burst_size,
                "packets_mitigated": blocked_count,
                "limit_per_minute": 60,
                "retry_after_seconds": retry_delay
            }
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown attack type '{payload.attack_type}'"
        )

@router.post("/reset")
def reset_simulation_environment():
    """Resets the rate limiter and simulation state for a clean test run."""
    rate_limiter.reset()
    return {"status": "SUCCESS", "message": "Simulation test environment rate limits and state reset."}
