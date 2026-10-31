"""
Replay Protection Module
Prevents replay attacks by enforcing monotonically increasing sequence numbers and tracking received sequence states.
Protects against concurrent retransmission via database-level uniqueness constraints and atomic verification.
"""

from datetime import datetime, timezone
import threading
from typing import Tuple, Dict, Set
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.app.models.models import ReplayState, DeviceSession

class ReplayProtectionManager:
    """
    Tracks and validates sequence numbers per (device_id, session_id).
    Supports:
    1. Duplicate sequence rejection.
    2. Out-of-window / stale packet rejection.
    3. Thread-safe in-memory cache with database-backed atomic deduplication.
    """

    def __init__(self, window_size: int = 100):
        self.window_size = window_size
        self._lock = threading.Lock()
        # In-memory lookup: (device_id, session_id) -> (highest_seq, set_of_recent_seqs)
        self._state_cache: Dict[Tuple[str, str], Tuple[int, Set[int]]] = {}

    def validate_and_record(
        self, 
        db: Session, 
        device_id: str, 
        session_id: str, 
        sequence_number: int
    ) -> Tuple[bool, str]:
        """
        Validates if a sequence number is acceptable and records it.
        Returns: (is_valid: bool, reason: str)
        """
        if sequence_number <= 0:
            return False, f"Invalid sequence number {sequence_number} (must be positive)"

        key = (device_id, session_id)

        with self._lock:
            if key not in self._state_cache:
                # Load latest from database if available
                session_rec = db.query(DeviceSession).filter(
                    DeviceSession.session_id == session_id,
                    DeviceSession.device_id == device_id
                ).first()
                
                if not session_rec:
                    return False, f"Session {session_id} not found for device {device_id}"

                recent_records = db.query(ReplayState.sequence_number).filter(
                    ReplayState.device_id == device_id,
                    ReplayState.session_id == session_id
                ).order_by(ReplayState.sequence_number.desc()).limit(self.window_size).all()
                
                recent_seqs = {r[0] for r in recent_records}
                highest = session_rec.last_sequence_number
                self._state_cache[key] = (highest, recent_seqs)

            highest_seq, recent_seqs = self._state_cache[key]

            # 1. Check duplicate
            if sequence_number in recent_seqs:
                return False, f"Duplicate sequence number {sequence_number} detected (Replay Attack)"

            # 2. Check window bounds (reject packets that fall behind the sliding window)
            if sequence_number < (highest_seq - self.window_size):
                return False, f"Stale message: sequence number {sequence_number} is older than replay window (highest: {highest_seq})"

            # 3. Database atomic verification to defend against concurrent race conditions
            try:
                new_state = ReplayState(
                    device_id=device_id,
                    session_id=session_id,
                    sequence_number=sequence_number,
                    received_at=datetime.now(timezone.utc)
                )
                db.add(new_state)
                
                # Update session record highest sequence
                session_rec = db.query(DeviceSession).filter(
                    DeviceSession.session_id == session_id
                ).first()
                if session_rec and sequence_number > session_rec.last_sequence_number:
                    session_rec.last_sequence_number = sequence_number
                    session_rec.last_activity = datetime.now(timezone.utc)
                
                db.commit()

            except IntegrityError:
                db.rollback()
                return False, f"Concurrent duplicate sequence {sequence_number} detected and blocked at database layer"
            except Exception as e:
                db.rollback()
                return False, f"Database error during replay verification: {str(e)}"

            # 4. Update in-memory state
            new_highest = max(highest_seq, sequence_number)
            recent_seqs.add(sequence_number)
            # Prune memory if cache exceeds 2x window size
            if len(recent_seqs) > self.window_size * 2:
                recent_seqs = {s for s in recent_seqs if s >= (new_highest - self.window_size)}
            self._state_cache[key] = (new_highest, recent_seqs)

            return True, "Sequence number verified"

    def reset_session(self, device_id: str, session_id: str):
        """Cleans up cache when session expires or is replaced."""
        with self._lock:
            self._state_cache.pop((device_id, session_id), None)

replay_protection = ReplayProtectionManager()
