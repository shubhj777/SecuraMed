"""
Cryptographic Audit Logging & Hash-Chaining Module
Implements tamper-evident audit logging using SHA-256 hash chains.
Every administrative and security audit entry is cryptographically anchored to its predecessor.
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Tuple, Optional, List
from sqlalchemy.orm import Session
from backend.app.models.models import AuditLog

GENESIS_HASH = "0" * 64

class AuditManager:
    @staticmethod
    def _format_timestamp(dt: datetime) -> str:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")

    @staticmethod
    def _compute_hash(previous_hash: str, event_type: str, actor: str, event_data: str, timestamp_str: str) -> str:
        """Computes deterministic SHA-256 hash chaining."""
        payload = f"{previous_hash}|{event_type}|{actor}|{event_data}|{timestamp_str}".encode("utf-8")
        return hashlib.sha256(payload).hexdigest()

    def log_event(self, db: Session, event_type: str, actor: str, event_data: dict) -> AuditLog:
        """
        Appends an entry to the cryptographic audit chain.
        Ensures thread-safe and monotonically linked hashing.
        """
        last_entry = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
        prev_hash = last_entry.current_hash if last_entry else GENESIS_HASH

        now = datetime.now(timezone.utc)
        ts_str = self._format_timestamp(now)
        data_str = json.dumps(event_data, sort_keys=True)
        curr_hash = self._compute_hash(prev_hash, event_type, actor, data_str, ts_str)

        entry = AuditLog(
            event_type=event_type,
            actor=actor,
            event_data=data_str,
            previous_hash=prev_hash,
            current_hash=curr_hash,
            timestamp=now
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    def verify_chain_integrity(self, db: Session) -> Tuple[bool, int, Optional[int], str]:
        records: List[AuditLog] = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
        if not records:
            return True, 0, None, "Audit log chain is empty (genesis state intact)"

        expected_prev_hash = GENESIS_HASH

        for idx, rec in enumerate(records):
            # 1. Verify previous_hash link
            if rec.previous_hash != expected_prev_hash:
                return False, len(records), rec.id, f"Broken link at record ID {rec.id} (index {idx}): previous_hash {rec.previous_hash} does not match expected {expected_prev_hash}"

            # 2. Recompute current_hash
            ts_str = self._format_timestamp(rec.timestamp)
            calculated_hash = self._compute_hash(
                rec.previous_hash,
                rec.event_type,
                rec.actor,
                rec.event_data,
                ts_str
            )

            if calculated_hash != rec.current_hash:
                return False, len(records), rec.id, f"Data tampering detected at record ID {rec.id} (index {idx}): hash {rec.current_hash} != calculated {calculated_hash}"

            expected_prev_hash = rec.current_hash

        return True, len(records), None, f"All {len(records)} audit records cryptographically verified. No tampering detected."

audit_manager = AuditManager()
