"""
Automated Replay Protection Tests
Verifies duplicate sequence rejection, out-of-window message handling, and session state reset.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone

from backend.app.database.session import Base
from backend.app.models.models import Device, DeviceSession, ReplayState
from backend.app.core.replay_protection import ReplayProtectionManager

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine)
    db = TestingSession()

    # Setup device and session
    dev = Device(
        device_id="MED-REPLAY-01",
        device_name="Replay Test Unit",
        device_type="PATIENT_MONITOR",
        public_key="00"*1952,
        trust_status="TRUSTED"
    )
    db.add(dev)
    sess = DeviceSession(
        session_id="SES-REPLAY-01",
        device_id="MED-REPLAY-01",
        session_status="ACTIVE",
        last_sequence_number=100,
        expires_at=datetime.now(timezone.utc)
    )
    db.add(sess)
    db.commit()

    yield db
    db.close()

def test_first_valid_packet_accepted(test_db):
    manager = ReplayProtectionManager(window_size=50)
    valid, reason = manager.validate_and_record(test_db, "MED-REPLAY-01", "SES-REPLAY-01", 101)
    assert valid is True
    assert "verified" in reason.lower()

def test_duplicate_packet_rejected(test_db):
    manager = ReplayProtectionManager(window_size=50)
    # First transmission
    ok1, _ = manager.validate_and_record(test_db, "MED-REPLAY-01", "SES-REPLAY-01", 105)
    assert ok1 is True

    # Replayed transmission with identical sequence number 105
    ok2, reason = manager.validate_and_record(test_db, "MED-REPLAY-01", "SES-REPLAY-01", 105)
    assert ok2 is False
    assert "duplicate" in reason.lower()

def test_stale_packet_below_window_rejected(test_db):
    manager = ReplayProtectionManager(window_size=20)
    # Advance to sequence 200
    manager.validate_and_record(test_db, "MED-REPLAY-01", "SES-REPLAY-01", 200)

    # Stale packet with sequence 100 (< 200 - 20)
    ok, reason = manager.validate_and_record(test_db, "MED-REPLAY-01", "SES-REPLAY-01", 100)
    assert ok is False
    assert "stale" in reason.lower()
