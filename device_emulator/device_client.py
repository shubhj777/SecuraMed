"""
Secure Medical Device Client Emulator
Implements the complete client-side Post-Quantum Authenticated Key Exchange (PQC-AKE)
and AES-256-GCM telemetry transmission protocol.
"""

import os
import json
import hashlib
from typing import Optional, Dict, Any, Tuple
import httpx
from pqcrypto.kem import ml_kem_768
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from device_emulator.device_identity import DeviceIdentity
from device_emulator.telemetry_generator import TelemetryGenerator

class DeviceClient:
    def __init__(self, identity: DeviceIdentity, gateway_url: str = "http://127.0.0.1:8000"):
        self.identity = identity
        self.gateway_url = gateway_url.rstrip("/")
        self.generator = TelemetryGenerator(identity.device_id, identity.device_type)
        
        # Session state
        self.session_id: Optional[str] = None
        self.session_key: Optional[bytes] = None
        self.sequence_number: int = 0
        self.is_authenticated: bool = False

    def register(self, client: Optional[httpx.Client] = None) -> bool:
        """Registers device public key in gateway registry."""
        http = client or httpx.Client()
        url = f"{self.gateway_url}/api/devices/register"
        payload = {
            "device_id": self.identity.device_id,
            "device_name": self.identity.device_name,
            "device_type": self.identity.device_type,
            "public_key": self.identity.get_public_key_hex()
        }
        try:
            resp = http.post(url, json=payload, timeout=10.0)
            if resp.status_code in [200, 201, 409]:  # 409 means already registered
                return True
            return False
        except Exception as e:
            return False

    def authenticate_and_handshake(self, client: Optional[httpx.Client] = None) -> Tuple[bool, str]:
        """
        Executes two-stage Authenticated PQC Handshake:
        Stage 1: Challenge request + Gateway Ephemeral ML-KEM-768 public key receipt
        Stage 2: ML-DSA-65 signature on challenge + ML-KEM encapsulation + HKDF derivation
        """
        http = client or httpx.Client()
        
        # Stage 1: Init
        client_random = os.urandom(16)
        init_payload = {
            "device_id": self.identity.device_id,
            "client_random": client_random.hex()
        }
        init_url = f"{self.gateway_url}/api/security/handshake/init"
        try:
            r1 = http.post(init_url, json=init_payload, timeout=10.0)
            if r1.status_code != 200:
                return False, f"Handshake Init failed ({r1.status_code}): {r1.text}"
            init_data = r1.json()
        except Exception as e:
            return False, f"Connection error during Handshake Init: {str(e)}"

        challenge_bytes = bytes.fromhex(init_data["challenge"])
        gw_kem_pk = bytes.fromhex(init_data["gateway_kem_public_key"])
        gateway_id = init_data["gateway_id"]

        # Stage 2: Sign Challenge with ML-DSA-65
        client_signature = self.identity.sign_challenge(challenge_bytes)

        # Stage 3: Encapsulate shared secret using Gateway's ML-KEM-768 public key
        kem_ciphertext, shared_secret = ml_kem_768.encaps(gw_kem_pk)

        # Stage 4: Derive Session Key using HKDF-SHA256
        salt = hashlib.sha256(challenge_bytes + gw_kem_pk + client_random).digest()
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            info=f"SecureMed|{self.identity.device_id}|{gateway_id}".encode("utf-8")
        )
        derived_session_key = hkdf.derive(shared_secret)

        # Stage 5: Send Complete payload
        complete_payload = {
            "device_id": self.identity.device_id,
            "challenge": init_data["challenge"],
            "client_signature": client_signature.hex(),
            "kem_ciphertext": bytes(kem_ciphertext).hex()
        }
        complete_url = f"{self.gateway_url}/api/security/handshake/complete"
        try:
            r2 = http.post(complete_url, json=complete_payload, timeout=10.0)
            if r2.status_code != 200:
                return False, f"Handshake Complete failed ({r2.status_code}): {r2.text}"
            complete_data = r2.json()
        except Exception as e:
            return False, f"Connection error during Handshake Complete: {str(e)}"

        self.session_id = complete_data["session_id"]
        self.session_key = derived_session_key
        self.sequence_number = 0
        self.is_authenticated = True

        return True, f"Session established: {self.session_id}"

    def send_telemetry(self, client: Optional[httpx.Client] = None, custom_payload: Optional[dict] = None) -> Tuple[bool, dict]:
        """
        Encrypts synthetic readings with AES-256-GCM (binding AAD) and transmits to gateway.
        """
        if not self.is_authenticated or not self.session_key or not self.session_id:
            raise RuntimeError("Device is not authenticated. Perform handshake first.")

        http = client or httpx.Client()
        self.sequence_number += 1

        payload_dict = custom_payload or self.generator.generate_reading()
        plaintext_bytes = json.dumps(payload_dict).encode("utf-8")

        # AES-256-GCM authenticated encryption
        nonce = os.urandom(12)
        aad = f"{self.identity.device_id}|{self.session_id}|{self.sequence_number}".encode("utf-8")
        
        aesgcm = AESGCM(self.session_key)
        ct_with_tag = aesgcm.encrypt(nonce, plaintext_bytes, aad)
        ciphertext = ct_with_tag[:-16]
        tag = ct_with_tag[-16:]

        ingest_payload = {
            "device_id": self.identity.device_id,
            "session_id": self.session_id,
            "sequence_number": self.sequence_number,
            "nonce": nonce.hex(),
            "ciphertext": ciphertext.hex(),
            "authentication_tag": tag.hex()
        }

        url = f"{self.gateway_url}/api/telemetry/ingest"
        try:
            resp = http.post(url, json=ingest_payload, timeout=10.0)
            return resp.status_code == 200, resp.json()
        except Exception as e:
            return False, {"error": str(e)}
