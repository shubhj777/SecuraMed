"""
Post-Quantum Digital Signature Manager - NIST FIPS 204 (ML-DSA-65)
Provides quantum-resistant digital signature generation and verification.
Used for device authentication challenges and firmware update manifest verification.
"""

from typing import Tuple
from pqcrypto.sign import ml_dsa_65
from pqcrypto import InvalidSignatureError

class SignatureManager:
    """
    Manages ML-DSA-65 (NIST FIPS 204) Digital Signature operations.
    Follows NIST FIPS 204 parameters:
    - Public Key Size: 1952 bytes
    - Secret Key Size: 4032 bytes
    - Signature Size: 3309 bytes
    """

    @staticmethod
    def generate_keypair() -> Tuple[bytes, bytes]:
        """
        Generates an ML-DSA-65 signing keypair.
        Returns: (public_key_bytes, secret_key_bytes)
        """
        pk, sk = ml_dsa_65.keygen()
        return bytes(pk), bytes(sk)

    @staticmethod
    def sign(secret_key: bytes, message: bytes) -> bytes:
        """
        Signs a message using the ML-DSA-65 secret key.
        Returns signature bytes (3309 bytes).
        """
        if len(secret_key) != ml_dsa_65.SECRET_KEY_SIZE:
            raise ValueError(f"Invalid ML-DSA-65 secret key length: {len(secret_key)} (expected {ml_dsa_65.SECRET_KEY_SIZE})")
        
        signature = ml_dsa_65.sign(secret_key, message)
        return bytes(signature)

    @staticmethod
    def verify(public_key: bytes, message: bytes, signature: bytes) -> bool:
        """
        Verifies an ML-DSA-65 signature against the message and public key.
        Returns True if valid, False if invalid or tampered.
        """
        if len(public_key) != ml_dsa_65.PUBLIC_KEY_SIZE:
            return False
        if len(signature) != ml_dsa_65.SIGNATURE_SIZE:
            return False

        try:
            ml_dsa_65.verify(public_key, message, signature)
            return True
        except (InvalidSignatureError, ValueError, Exception):
            return False

    @staticmethod
    def get_specs() -> dict:
        return {
            "algorithm": "ML-DSA-65",
            "standard": "NIST FIPS 204",
            "public_key_bytes": ml_dsa_65.PUBLIC_KEY_SIZE,
            "secret_key_bytes": ml_dsa_65.SECRET_KEY_SIZE,
            "signature_bytes": ml_dsa_65.SIGNATURE_SIZE
        }

signature_manager = SignatureManager()
