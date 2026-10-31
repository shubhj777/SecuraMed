"""
Attack Detection and Security Event Logging Engine
Coordinates with cryptographic, sequence tracking, and policy enforcement engines
to record structured security events into the persistent registry.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import SecurityEvent

class AttackDetector:
    @staticmethod
    def log_security_event(
        db: Session,
        event_type: str,
        result: str,
        reason: str,
        detection_module: str,
        severity: str = "INFO",
        attack_type: str = "NONE",
        device_id: Optional[str] = None
    ) -> SecurityEvent:
        """
        Creates and stores a persistent, queryable security event record.
        """
        event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
        event = SecurityEvent(
            event_id=event_id,
            event_type=event_type,
            attack_type=attack_type,
            device_id=device_id,
            severity=severity,
            result=result,
            reason=reason,
            detection_module=detection_module,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

attack_detector = AttackDetector()
