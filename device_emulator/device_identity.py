"""
Device Identity & Cryptographic Key Store
Generates and maintains ML-DSA-65 (NIST FIPS 204) identity keypairs for medical IoT devices.
"""

from typing import Tuple
from pqcrypto.sign import ml_dsa_65

class DeviceIdentity:
    def __init__(self, device_id: str, device_name: str, device_type: str = "PATIENT_MONITOR"):
        self.device_id = device_id
        self.device_name = device_name
        self.device_type = device_type
        # Generate genuine ML-DSA-65 keypair
        pk, sk = ml_dsa_65.keygen()
        self.public_key: bytes = bytes(pk)
        self.secret_key: bytes = bytes(sk)

    @classmethod
    def from_existing_keys(cls, device_id: str, device_name: str, public_key_hex: str, secret_key_hex: str, device_type: str = "PATIENT_MONITOR"):
        instance = cls.__new__(cls)
        instance.device_id = device_id
        instance.device_name = device_name
        instance.device_type = device_type
        instance.public_key = bytes.fromhex(public_key_hex)
        instance.secret_key = bytes.fromhex(secret_key_hex)
        return instance

    def sign_challenge(self, challenge: bytes) -> bytes:
        """Signs an authentication challenge using device's ML-DSA-65 private key."""
        return bytes(ml_dsa_65.sign(self.secret_key, challenge))

    def get_public_key_hex(self) -> str:
        return self.public_key.hex()
