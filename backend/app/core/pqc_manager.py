"""
Post-Quantum Cryptography Manager - NIST FIPS 203 (ML-KEM-768)
Provides key encapsulation mechanism (KEM) operations for quantum-resistant shared secret establishment.
"""

import os
from typing import Tuple
from pqcrypto.kem import ml_kem_768

class PQCManager:
    """
    Manages ML-KEM-768 (NIST FIPS 203) Key Encapsulation Mechanism operations.
    Follows NIST FIPS 203 parameters:
    - Public Key Size: 1184 bytes
    - Secret Key Size: 2400 bytes
    - Ciphertext Size: 1088 bytes
    - Shared Secret Size: 32 bytes (256 bits)
    """

    @staticmethod
    def generate_kem_keypair() -> Tuple[bytes, bytes]:
        """
        Generates an ephemeral ML-KEM-768 keypair.
        Returns: (public_key_bytes, secret_key_bytes)
        """
        pk, sk = ml_kem_768.keygen()
        return bytes(pk), bytes(sk)

    @staticmethod
    def encapsulate(peer_public_key: bytes) -> Tuple[bytes, bytes]:
        """
        Encapsulates a shared secret using peer's ML-KEM-768 public key.
        Returns: (ciphertext_bytes, shared_secret_bytes)
        """
        if len(peer_public_key) != ml_kem_768.PUBLIC_KEY_SIZE:
            raise ValueError(f"Invalid ML-KEM-768 public key length: {len(peer_public_key)} (expected {ml_kem_768.PUBLIC_KEY_SIZE})")
        
        ciphertext, shared_secret = ml_kem_768.encaps(peer_public_key)
        return bytes(ciphertext), bytes(shared_secret)

    @staticmethod
    def decapsulate(secret_key: bytes, ciphertext: bytes) -> bytes:
        """
        Decapsulates a shared secret using gateway's ML-KEM-768 secret key.
        Note: FIPS 203 uses implicit rejection: invalid ciphertext yields a deterministic pseudorandom
        shared secret that will not match the peer's secret, failing downstream MAC/AEAD authentication.
        """
        if len(secret_key) != ml_kem_768.SECRET_KEY_SIZE:
            raise ValueError(f"Invalid ML-KEM-768 secret key length: {len(secret_key)} (expected {ml_kem_768.SECRET_KEY_SIZE})")
        if len(ciphertext) != ml_kem_768.CIPHERTEXT_SIZE:
            raise ValueError(f"Invalid ML-KEM-768 ciphertext length: {len(ciphertext)} (expected {ml_kem_768.CIPHERTEXT_SIZE})")

        shared_secret = ml_kem_768.decaps(secret_key, ciphertext)
        return bytes(shared_secret)

    @staticmethod
    def get_specs() -> dict:
        return {
            "algorithm": "ML-KEM-768",
            "standard": "NIST FIPS 203",
            "public_key_bytes": ml_kem_768.PUBLIC_KEY_SIZE,
            "secret_key_bytes": ml_kem_768.SECRET_KEY_SIZE,
            "ciphertext_bytes": ml_kem_768.CIPHERTEXT_SIZE,
            "shared_secret_bytes": ml_kem_768.SHARED_SECRET_SIZE
        }

pqc_manager = PQCManager()
