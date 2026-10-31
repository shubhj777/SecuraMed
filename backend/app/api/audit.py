"""
Cryptographic Audit Logging & Verification API
Provides immutable, hash-chained audit logging and interactive verification endpoint.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.models import AuditLog
from backend.app.schemas.schemas import AuditLogResponse, AuditChainVerificationResponse
from backend.app.core.audit_manager import audit_manager

router = APIRouter(prefix="/audit", tags=["Audit & Compliance"])

@router.get("/logs", response_model=List[AuditLogResponse])
def get_audit_logs(limit: int = 100, db: Session = Depends(get_db)):
    """Fetches the latest hash-chained audit records."""
    return db.query(AuditLog).order_by(AuditLog.id.desc()).limit(limit).all()

@router.post("/verify-chain", response_model=AuditChainVerificationResponse)
def verify_audit_chain(db: Session = Depends(get_db)):
    """
    Verifies the cryptographic SHA-256 hash chaining of all audit entries.
    Flags any broken links or modified data payloads.
    """
    is_valid, total_records, tampered_id, message = audit_manager.verify_chain_integrity(db)
    return AuditChainVerificationResponse(
        valid=is_valid,
        total_records=total_records,
        tampered_index=tampered_id,
        message=message
    )

@router.post("/simulate-tamper")
def simulate_audit_tampering(db: Session = Depends(get_db)):
    """
    Demonstrates security integrity by deliberately altering a record in the database.
    Allows judges to witness the chain verification catch the tampering instantly.
    """
    last_log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    if not last_log:
        # Create an entry first so we can tamper it
        audit_manager.log_event(db, "INITIAL_ENTRY", "SYSTEM", {"note": "Genesis audit test"})
        last_log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()

    # Modify event data without updating hash
    original_data = last_log.event_data
    last_log.event_data = '{"tampered": true, "unauthorized_modification": "Adversary erased audit evidence"}'
    db.commit()

    return {
        "status": "TAMPERED",
        "record_id": last_log.id,
        "message": f"Audit record {last_log.id} was intentionally altered. Run verify-chain to demonstrate detection."
    }

@router.post("/repair-chain")
def repair_audit_chain(db: Session = Depends(get_db)):
    """Recomputes hashes to restore valid chain after tamper demonstration."""
    records = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    prev = "0" * 64
    for r in records:
        r.previous_hash = prev
        ts_str = audit_manager._format_timestamp(r.timestamp)
        r.current_hash = audit_manager._compute_hash(prev, r.event_type, r.actor, r.event_data, ts_str)
        prev = r.current_hash
    db.commit()
    return {"status": "REPAIRED", "message": "Audit chain hashes successfully recalculated and restored."}
