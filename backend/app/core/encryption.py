"""
Cryptographic Encryption Module
Implements HKDF key derivation (RFC 5869) and AES-256-GCM authenticated encryption (NIST SP 800-38D).
Binds message metadata (device_id, session_id, sequence_number) as Associated Data (AAD)
to prevent ciphertext splicing, session hijacking, or identity substitution.
"""

import os
from typing import Tuple, Optional
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class EncryptionManager:
    """
    Handles key derivation and authenticated symmetric encryption for medical IoT communication.
    """

    @staticmethod
    def derive_session_key(shared_secret: bytes, salt: bytes, context_info: bytes = b"SecureMed-Gateway-Session-Key-v1") -> bytes:
        """
        Derives a 256-bit (32-byte) AES key from the ML-KEM shared secret using HKDF-SHA256.
        Uses cryptographic domain separation to prevent cross-protocol key reuse.
        """
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            info=context_info,
        )
        return hkdf.derive(shared_secret)

    @staticmethod
    def construct_aad(device_id: str, session_id: str, sequence_number: int) -> bytes:
        """
        Constructs canonical Associated Authenticated Data (AAD).
        This cryptographically binds the message metadata to the ciphertext.
        Any modification to device_id, session_id, or sequence_number will invalidate the GCM auth tag.
        """
        return f"{device_id}|{session_id}|{sequence_number}".encode("utf-8")

    @staticmethod
    def encrypt_payload(
        session_key: bytes, 
        plaintext: bytes, 
        device_id: str, 
        session_id: str, 
        sequence_number: int
    ) -> Tuple[bytes, bytes, bytes]:
        """
        Encrypts plaintext with AES-256-GCM.
        Generates a fresh 96-bit (12-byte) cryptographically secure nonce.
        Returns: (nonce_bytes, ciphertext_bytes, auth_tag_bytes)
        """
        if len(session_key) != 32:
            raise ValueError(f"Invalid session key length: {len(session_key)} (expected 32 bytes for AES-256)")
        
        nonce = os.urandom(12)
        aad = EncryptionManager.construct_aad(device_id, session_id, sequence_number)
        
        aesgcm = AESGCM(session_key)
        # In cryptography library, aesgcm.encrypt returns ciphertext + 16-byte tag appended
        ct_with_tag = aesgcm.encrypt(nonce, plaintext, aad)
        ciphertext = ct_with_tag[:-16]
        tag = ct_with_tag[-16:]
        
        return nonce, ciphertext, tag

    @staticmethod
    def decrypt_payload(
        session_key: bytes, 
        nonce: bytes, 
        ciphertext: bytes, 
        tag: bytes, 
        device_id: str, 
        session_id: str, 
        sequence_number: int
    ) -> Optional[bytes]:
        """
        Decrypts and authenticates AES-256-GCM ciphertext.
        Verifies the 16-byte authentication tag over ciphertext and AAD.
        Returns decrypted plaintext if valid; raises or returns None on tampering.
        """
        if len(session_key) != 32:
            raise ValueError("Invalid session key length")
        if len(nonce) != 12:
            raise ValueError("Invalid nonce length: must be 12 bytes")
        if len(tag) != 16:
            raise ValueError("Invalid auth tag length: must be 16 bytes")

        aad = EncryptionManager.construct_aad(device_id, session_id, sequence_number)
        ct_with_tag = ciphertext + tag
        
        aesgcm = AESGCM(session_key)
        try:
            plaintext = aesgcm.decrypt(nonce, ct_with_tag, aad)
            return plaintext
        except Exception:
            return None

encryption_manager = EncryptionManager()
