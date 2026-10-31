"""
Secure Telemetry Ingestion and Retrieval API
Processes encrypted medical device messages, enforces AAD binding, sequence integrity,
and stores verified synthetic vital signs for visualization.
"""

import json
import hashlib
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import Device, DeviceSession, Telemetry, SecurityEvent
from backend.app.schemas.schemas import (
    EncryptedMessagePayload, MessageVerificationResponse, TelemetryRecordResponse
)
from backend.app.core.device_auth import device_auth
from backend.app.core.encryption import encryption_manager
from backend.app.core.replay_protection import replay_protection
from backend.app.core.access_control import access_control
from backend.app.core.attack_detector import attack_detector

router = APIRouter(prefix="/telemetry", tags=["Telemetry & Secure Communication"])

@router.post("/ingest", response_model=MessageVerificationResponse)
def ingest_encrypted_message(payload: EncryptedMessagePayload, db: Session = Depends(get_db)):
    """
    Receives and cryptographically verifies an encrypted medical IoT packet.
    1. Authenticates session
    2. Validates sequence number against replay window
    3. Verifies AES-256-GCM authentication tag and AAD
    4. Evaluates device command authorization policy
    5. Stores verified synthetic telemetry
    """
    device = db.query(Device).filter(Device.device_id == payload.device_id).first()
    if not device:
        attack_detector.log_security_event(
            db,
            event_type="UNAUTHORIZED_ACCESS",
            attack_type="DEVICE_IMPERSONATION",
            device_id=payload.device_id,
            severity="HIGH",
            result="BLOCKED",
            reason=f"Ingestion attempt from unregistered device ID {payload.device_id}",
            detection_module="device_auth"
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown device identifier")

    if device.trust_status == "REVOKED":
        attack_detector.log_security_event(
            db,
            event_type="UNAUTHORIZED_ACCESS",
            attack_type="DEVICE_IMPERSONATION",
            device_id=payload.device_id,
            severity="CRITICAL",
            result="BLOCKED",
            reason=f"Communication rejected: Device {payload.device_id} is REVOKED",
            detection_module="device_auth"
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Device has been revoked")

    # 1. Verify Session
    session_rec = db.query(DeviceSession).filter(
        DeviceSession.session_id == payload.session_id,
        DeviceSession.device_id == payload.device_id,
        DeviceSession.session_status == "ACTIVE"
    ).first()

    if not session_rec:
        attack_detector.log_security_event(
            db,
            event_type="SESSION_VALIDATION",
            attack_type="NONE",
            device_id=payload.device_id,
            severity="MEDIUM",
            result="REJECTED",
            reason=f"Active session {payload.session_id} not found or expired",
            detection_module="device_auth"
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")

    session_key = device_auth.get_session_key(payload.session_id)
    if not session_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session key vault miss (session may have been terminated)")

    # 2. Replay Protection Verification
    is_seq_valid, seq_reason = replay_protection.validate_and_record(
        db, payload.device_id, payload.session_id, payload.sequence_number
    )
    if not is_seq_valid:
        attack_detector.log_security_event(
            db,
            event_type="REPLAY_DETECTION",
            attack_type="REPLAY_ATTACK",
            device_id=payload.device_id,
            severity="HIGH",
            result="BLOCKED",
            reason=seq_reason,
            detection_module="replay_protection"
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"ATTACK BLOCKED: {seq_reason}")

    # 3. Decrypt and Verify AES-256-GCM Authentication Tag with AAD
    try:
        nonce_bytes = bytes.fromhex(payload.nonce)
        ciphertext_bytes = bytes.fromhex(payload.ciphertext)
        tag_bytes = bytes.fromhex(payload.authentication_tag)
    except Exception:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Malformed hex in cryptographic fields")

    plaintext_bytes = encryption_manager.decrypt_payload(
        session_key=session_key,
        nonce=nonce_bytes,
        ciphertext=ciphertext_bytes,
        tag=tag_bytes,
        device_id=payload.device_id,
        session_id=payload.session_id,
        sequence_number=payload.sequence_number
    )

    if plaintext_bytes is None:
        attack_detector.log_security_event(
            db,
            event_type="TAMPERING_DETECTION",
            attack_type="MESSAGE_TAMPERING",
            device_id=payload.device_id,
            severity="CRITICAL",
            result="BLOCKED",
            reason="AES-GCM authentication tag verification failed. Ciphertext or AAD metadata was altered in transit.",
            detection_module="encryption"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ATTACK BLOCKED: Message authentication failed. Modified ciphertext or invalid auth tag detected."
        )

    # 4. Parse payload and enforce device command permissions
    try:
        data = json.loads(plaintext_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Decrypted plaintext is not valid UTF-8 JSON")

    # Check if packet contains a control command
    if "command" in data:
        cmd = data["command"]
        cmd_ok, cmd_reason = access_control.validate_device_command(device.device_type, cmd)
        if not cmd_ok:
            attack_detector.log_security_event(
                db,
                event_type="UNAUTHORIZED_COMMAND",
                attack_type="UNAUTHORIZED_COMMAND",
                device_id=payload.device_id,
                severity="HIGH",
                result="BLOCKED",
                reason=cmd_reason,
                detection_module="access_control"
            )
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"ATTACK BLOCKED: {cmd_reason}")

    # 5. Store verified synthetic telemetry
    readings = data.get("readings", {})
    now = datetime.now(timezone.utc)
    
    telemetry_entry = Telemetry(
        device_id=payload.device_id,
        timestamp=now,
        heart_rate=readings.get("heart_rate"),
        spo2=readings.get("spo2"),
        temperature=readings.get("temperature"),
        respiratory_rate=readings.get("respiratory_rate"),
        data_source="SYNTHETIC",
        raw_payload_hash=hashlib.sha256(ciphertext_bytes).hexdigest()
    )
    db.add(telemetry_entry)

    # Update device activity
    device.connection_status = "ONLINE"
    device.last_seen = now
    db.commit()

    return MessageVerificationResponse(
        status="ACCEPTED",
        result="VERIFIED",
        message="Message authenticated, sequence validated, and synthetic telemetry stored.",
        sequence_number=payload.sequence_number,
        device_id=payload.device_id,
        timestamp=now.isoformat()
    )

@router.get("/latest/{device_id}", response_model=Optional[TelemetryRecordResponse])
def get_latest_telemetry(device_id: str, db: Session = Depends(get_db)):
    record = db.query(Telemetry).filter(
        Telemetry.device_id == device_id
    ).order_by(Telemetry.timestamp.desc()).first()
    return record

@router.get("/history/{device_id}", response_model=List[TelemetryRecordResponse])
def get_telemetry_history(device_id: str, limit: int = 50, db: Session = Depends(get_db)):
    records = db.query(Telemetry).filter(
        Telemetry.device_id == device_id
    ).order_by(Telemetry.timestamp.desc()).limit(limit).all()
    # Reverse so the frontend chart receives chronological order
    return list(reversed(records))
