from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, ForeignKey, 
    UniqueConstraint, Index, Boolean
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(64), unique=True, index=True, nullable=False)
    device_name = Column(String(128), nullable=False)
    device_type = Column(String(64), nullable=False, default="PATIENT_MONITOR")
    public_key = Column(Text, nullable=False)  # Hex-encoded ML-DSA-65 public key
    trust_status = Column(String(32), nullable=False, default="TRUSTED")  # TRUSTED, SUSPICIOUS, REVOKED
    connection_status = Column(String(32), nullable=False, default="OFFLINE")  # ONLINE, OFFLINE
    registered_at = Column(DateTime, default=utcnow, nullable=False)
    last_seen = Column(DateTime, default=utcnow, nullable=False)
    revoked_at = Column(DateTime, nullable=True)

    sessions = relationship("DeviceSession", back_populates="device", cascade="all, delete-orphan")
    telemetry = relationship("Telemetry", back_populates="device", cascade="all, delete-orphan")

class DeviceSession(Base):
    __tablename__ = "device_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True, nullable=False)
    device_id = Column(String(64), ForeignKey("devices.device_id"), nullable=False, index=True)
    session_status = Column(String(32), default="ACTIVE", nullable=False)  # ACTIVE, CLOSED, EXPIRED
    session_key_fingerprint = Column(String(64), nullable=True)  # SHA-256 fingerprint of derived key
    last_sequence_number = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    last_activity = Column(DateTime, default=utcnow, nullable=False)

    device = relationship("Device", back_populates="sessions")

class ReplayState(Base):
    __tablename__ = "replay_states"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(64), nullable=False, index=True)
    session_id = Column(String(64), nullable=False, index=True)
    sequence_number = Column(Integer, nullable=False)
    received_at = Column(DateTime, default=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("device_id", "session_id", "sequence_number", name="uq_device_session_seq"),
        Index("ix_replay_lookup", "device_id", "session_id", "sequence_number"),
    )

class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(64), ForeignKey("devices.device_id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=utcnow, nullable=False)
    heart_rate = Column(Float, nullable=True)
    spo2 = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    respiratory_rate = Column(Float, nullable=True)
    data_source = Column(String(32), default="SYNTHETIC", nullable=False)
    raw_payload_hash = Column(String(64), nullable=True)

    device = relationship("Device", back_populates="telemetry")

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(64), unique=True, index=True, nullable=False)
    event_type = Column(String(64), nullable=False, index=True)
    attack_type = Column(String(64), default="NONE", nullable=False)
    device_id = Column(String(64), nullable=True, index=True)
    severity = Column(String(32), default="INFO", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL, INFO
    result = Column(String(32), nullable=False)  # SUCCESS, BLOCKED, MITIGATED, REJECTED
    reason = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utcnow, nullable=False, index=True)
    detection_module = Column(String(64), nullable=False)

class FirmwareUpdate(Base):
    __tablename__ = "firmware_updates"

    id = Column(Integer, primary_key=True, index=True)
    firmware_id = Column(String(64), index=True, nullable=False)
    device_model = Column(String(64), nullable=False)
    firmware_version = Column(String(32), nullable=False)
    security_version = Column(Integer, nullable=False)
    file_hash = Column(String(64), nullable=False)  # SHA-256
    signing_key_id = Column(String(64), nullable=False)
    signature_status = Column(String(32), nullable=False)  # VERIFIED, INVALID, UNTRUSTED_KEY
    integrity_status = Column(String(32), nullable=False)  # MATCH, MISMATCH
    compatibility_status = Column(String(32), nullable=False)  # COMPATIBLE, INCOMPATIBLE
    anti_rollback_status = Column(String(32), nullable=False)  # PASSED, ROLLBACK_DETECTED
    verification_result = Column(String(32), nullable=False)  # APPROVED, REJECTED
    reason = Column(Text, nullable=False)
    file_path = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), default="ADMIN", nullable=False)  # ADMIN, IT_ADMIN, SECURITY_ANALYST, OPERATOR
    email = Column(String(128), nullable=True)
    full_name = Column(String(128), nullable=True)
    hospital_name = Column(String(128), nullable=True, default="St. Jude Memorial Hospital")
    last_login = Column(DateTime, nullable=True)
    password_updated_at = Column(DateTime, default=utcnow, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(64), nullable=False, index=True)
    actor = Column(String(64), nullable=False)
    event_data = Column(Text, nullable=False)
    previous_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False)
    timestamp = Column(DateTime, default=utcnow, nullable=False)
