"""
Medical Device Identity Management & Registry API
Handles device registration, cryptographic identity binding, trust status, and revocation.
"""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import Device, DeviceSession, SecurityEvent
from backend.app.schemas.schemas import DeviceCreate, DeviceResponse, DeviceRevoke, SecurityEventResponse
from backend.app.core.audit_manager import audit_manager
from backend.app.core.attack_detector import attack_detector
from backend.app.core.signature_manager import signature_manager
from backend.app.core.device_auth import device_auth

router = APIRouter(prefix="/devices", tags=["Device Management"])

@router.post("/register", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def register_device(payload: DeviceCreate, db: Session = Depends(get_db)):
    """
    Registers a new medical device in the gateway trust registry.
    Binds the device ID to its verified ML-DSA-65 public key.
    """
    existing = db.query(Device).filter(Device.device_id == payload.device_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Device with ID '{payload.device_id}' is already registered."
        )

    # Validate public key format (ML-DSA-65 public key is 1952 bytes)
    try:
        pk_bytes = bytes.fromhex(payload.public_key)
        if len(pk_bytes) != 1952:
            raise ValueError(f"ML-DSA-65 public key must be 1952 bytes (received {len(pk_bytes)} bytes)")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid ML-DSA-65 public key format: {str(e)}"
        )

    device = Device(
        device_id=payload.device_id,
        device_name=payload.device_name,
        device_type=payload.device_type,
        public_key=payload.public_key.strip(),
        trust_status="TRUSTED",
        connection_status="OFFLINE",
        registered_at=datetime.now(timezone.utc),
        last_seen=datetime.now(timezone.utc)
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    # Log Security and Audit Events
    attack_detector.log_security_event(
        db,
        event_type="DEVICE_REGISTRATION",
        result="SUCCESS",
        reason=f"Device {payload.device_id} ({payload.device_name}) registered with verified ML-DSA-65 public key",
        detection_module="device_auth",
        severity="INFO",
        device_id=payload.device_id
    )

    audit_manager.log_event(
        db,
        event_type="DEVICE_REGISTERED",
        actor="OPERATOR",
        event_data={"device_id": payload.device_id, "device_type": payload.device_type}
    )

    return device

@router.get("", response_model=List[DeviceResponse])
def list_devices(db: Session = Depends(get_db)):
    """Lists all registered medical devices and their current trust/connection status."""
    return db.query(Device).order_by(Device.registered_at.desc()).all()

@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(device_id: str, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Device {device_id} not found")
    return device

@router.get("/{device_id}/events", response_model=List[SecurityEventResponse])
def get_device_security_history(device_id: str, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Device {device_id} not found")
    
    events = db.query(SecurityEvent).filter(
        SecurityEvent.device_id == device_id
    ).order_by(SecurityEvent.timestamp.desc()).limit(50).all()
    return events

@router.post("/{device_id}/revoke", response_model=DeviceResponse)
def revoke_device(device_id: str, payload: DeviceRevoke, db: Session = Depends(get_db)):
    """
    Revokes trust for a compromised or retired device.
    Immediately invalidates active sessions and rejects any subsequent communication.
    """
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Device {device_id} not found")

    device.trust_status = "REVOKED"
    device.connection_status = "OFFLINE"
    device.revoked_at = datetime.now(timezone.utc)

    # Invalidate all active sessions for this device
    active_sessions = db.query(DeviceSession).filter(
        DeviceSession.device_id == device_id,
        DeviceSession.session_status == "ACTIVE"
    ).all()
    for s in active_sessions:
        device_auth.close_session(db, s.session_id)

    db.commit()
    db.refresh(device)

    attack_detector.log_security_event(
        db,
        event_type="DEVICE_REVOCATION",
        result="SUCCESS",
        reason=f"Device revoked by administrator. Reason: {payload.reason}",
        detection_module="device_auth",
        severity="HIGH",
        device_id=device_id
    )

    audit_manager.log_event(
        db,
        event_type="DEVICE_REVOKED",
        actor="ADMIN",
        event_data={"device_id": device_id, "reason": payload.reason}
    )

    return device
