"""
Device Authentication & Handshake Protocol Module
Implements authenticated post-quantum key establishment binding ML-DSA-65 identity verification
with ML-KEM-768 key encapsulation and HKDF-SHA256 session key derivation.
"""

import os
import time
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, Tuple, Optional
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models.models import Device, DeviceSession, SecurityEvent
from backend.app.core.pqc_manager import pqc_manager
from backend.app.core.signature_manager import signature_manager
from backend.app.core.encryption import encryption_manager

class DeviceAuthManager:
    def __init__(self):
        # Pending handshake challenges: device_id -> {challenge: bytes, kem_sk: bytes, kem_pk: bytes, expires_at: float}
        self._pending_challenges: Dict[str, dict] = {}
        # Active session encryption keys (in-memory vault, NEVER stored in plain DB): session_id -> bytes
        self._session_keys: Dict[str, bytes] = {}

    def initiate_handshake(self, db: Session, device_id: str, client_random_hex: str) -> Tuple[bool, dict, str]:
        """
        Step 1: Process device handshake initiation.
        Validates device registration and trust status, generates ephemeral challenge and gateway ML-KEM keypair.
        """
        device = db.query(Device).filter(Device.device_id == device_id).first()
        if not device:
            return False, {}, "Device is not registered in SecureMed Gateway registry"
        
        if device.trust_status == "REVOKED":
            return False, {}, f"Device {device_id} has been REVOKED and is denied network access"

        if device.trust_status == "SUSPICIOUS":
            # Allowed only with scrutiny or flagged
            pass

        # Generate fresh 32-byte challenge
        challenge = os.urandom(32)
        
        # Generate ephemeral gateway ML-KEM-768 keypair
        gw_kem_pk, gw_kem_sk = pqc_manager.generate_kem_keypair()

        # Cache pending state with 60-second TTL
        self._pending_challenges[device_id] = {
            "challenge": challenge,
            "gw_kem_pk": gw_kem_pk,
            "gw_kem_sk": gw_kem_sk,
            "client_random": bytes.fromhex(client_random_hex) if client_random_hex else b"",
            "expires_at": time.time() + 60.0
        }

        response_data = {
            "gateway_id": settings.GATEWAY_IDENTITY_ID,
            "device_id": device_id,
            "challenge": challenge.hex(),
            "gateway_kem_public_key": gw_kem_pk.hex(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        return True, response_data, "Handshake challenge generated successfully"

    def complete_handshake(
        self, 
        db: Session, 
        device_id: str, 
        challenge_hex: str, 
        signature_hex: str, 
        kem_ciphertext_hex: str
    ) -> Tuple[bool, dict, str]:
        """
        Step 2: Complete handshake.
        Verifies device ML-DSA-65 signature on challenge, decapsulates shared secret, derives AES key, creates session.
        """
        device = db.query(Device).filter(Device.device_id == device_id).first()
        if not device:
            return False, {}, f"Device {device_id} not found"

        if device.trust_status == "REVOKED":
            return False, {}, f"Device {device_id} is REVOKED"

        pending = self._pending_challenges.get(device_id)
        if not pending:
            return False, {}, "No active handshake challenge found for this device or challenge expired"

        if time.time() > pending["expires_at"]:
            self._pending_challenges.pop(device_id, None)
            return False, {}, "Handshake challenge timed out"

        expected_challenge = pending["challenge"]
        if bytes.fromhex(challenge_hex) != expected_challenge:
            return False, {}, "Supplied challenge does not match active gateway challenge"

        # 1. Verify ML-DSA-65 digital signature using device's registered public key
        try:
            device_signing_pubkey = bytes.fromhex(device.public_key)
            signature_bytes = bytes.fromhex(signature_hex)
        except Exception:
            return False, {}, "Invalid hex encoding in public key or signature"

        sig_valid = signature_manager.verify(device_signing_pubkey, expected_challenge, signature_bytes)
        if not sig_valid:
            # Device failed proof-of-possession
            return False, {}, "Device authentication failed: ML-DSA-65 signature verification failed"

        # 2. Decapsulate shared secret using ephemeral gateway KEM secret key
        try:
            ciphertext_bytes = bytes.fromhex(kem_ciphertext_hex)
            shared_secret = pqc_manager.decapsulate(pending["gw_kem_sk"], ciphertext_bytes)
        except Exception as e:
            return False, {}, f"ML-KEM-768 decapsulation error: {str(e)}"

        # 3. Derive 256-bit AES session key using HKDF-SHA256
        # Salt binds challenge + gateway public key + client random
        salt = hashlib.sha256(expected_challenge + pending["gw_kem_pk"] + pending["client_random"]).digest()
        session_key = encryption_manager.derive_session_key(
            shared_secret=shared_secret,
            salt=salt,
            context_info=f"SecureMed|{device_id}|{settings.GATEWAY_IDENTITY_ID}".encode("utf-8")
        )

        # 4. Generate session record
        session_id = f"SES-{uuid.uuid4().hex[:12].upper()}"
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.SESSION_EXPIRATION_SECONDS)

        # Compute SHA-256 fingerprint of session key for auditing (NEVER store session key itself in DB)
        key_fingerprint = hashlib.sha256(session_key).hexdigest()

        # Invalidate any prior active sessions for this device
        db.query(DeviceSession).filter(
            DeviceSession.device_id == device_id,
            DeviceSession.session_status == "ACTIVE"
        ).update({"session_status": "CLOSED"})

        db_session = DeviceSession(
            session_id=session_id,
            device_id=device_id,
            session_status="ACTIVE",
            session_key_fingerprint=key_fingerprint,
            last_sequence_number=0,
            created_at=datetime.now(timezone.utc),
            expires_at=expires_at,
            last_activity=datetime.now(timezone.utc)
        )
        db.add(db_session)

        # Update device status
        device.connection_status = "ONLINE"
        device.last_seen = datetime.now(timezone.utc)
        db.commit()

        # Store session key in memory vault
        self._session_keys[session_id] = session_key

        # Clean up ephemeral challenge state
        self._pending_challenges.pop(device_id, None)

        response_data = {
            "session_id": session_id,
            "gateway_id": settings.GATEWAY_IDENTITY_ID,
            "device_id": device_id,
            "status": "ESTABLISHED",
            "expires_at": expires_at.isoformat(),
            "message": "Authenticated post-quantum secure session successfully established"
        }
        return True, response_data, "Session established"

    def get_session_key(self, session_id: str) -> Optional[bytes]:
        """Retrieves session key from secure in-memory vault."""
        return self._session_keys.get(session_id)

    def close_session(self, db: Session, session_id: str):
        """Closes and wipes session from memory vault and marks DB session closed."""
        self._session_keys.pop(session_id, None)
        sess = db.query(DeviceSession).filter(DeviceSession.session_id == session_id).first()
        if sess:
            sess.session_status = "CLOSED"
            db.commit()

    def get_active_sessions_count(self) -> int:
        return len(self._session_keys)

device_auth = DeviceAuthManager()
