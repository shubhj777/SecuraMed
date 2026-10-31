"""
Automated Cryptographic Tests
Verifies NIST FIPS 203 (ML-KEM-768), NIST FIPS 204 (ML-DSA-65),
HKDF key derivation, and AES-256-GCM authenticated encryption.
"""

import pytest
import os
from backend.app.core.pqc_manager import pqc_manager
from backend.app.core.signature_manager import signature_manager
from backend.app.core.encryption import encryption_manager

def test_ml_kem_768_encaps_decaps_matching():
    """ML-KEM-768: Encapsulation and decapsulation produce identical 32-byte shared secret."""
    pk, sk = pqc_manager.generate_kem_keypair()
    assert len(pk) == 1184
    assert len(sk) == 2400

    ciphertext, shared_secret_sender = pqc_manager.encapsulate(pk)
    assert len(ciphertext) == 1088
    assert len(shared_secret_sender) == 32

    shared_secret_receiver = pqc_manager.decapsulate(sk, ciphertext)
    assert len(shared_secret_receiver) == 32
    assert shared_secret_sender == shared_secret_receiver

def test_ml_kem_768_invalid_ciphertext_implicit_rejection():
    """ML-KEM-768: Tampered ciphertext decapsulates to a non-matching pseudorandom secret."""
    pk, sk = pqc_manager.generate_kem_keypair()
    ciphertext, ss_sender = pqc_manager.encapsulate(pk)
    
    # Tamper with 1 byte of ciphertext
    bad_ct = bytearray(ciphertext)
    bad_ct[5] ^= 0xFF
    ss_tampered = pqc_manager.decapsulate(sk, bytes(bad_ct))
    assert ss_sender != ss_tampered

def test_ml_dsa_65_signature_verification():
    """ML-DSA-65: Generates valid signature that verifies successfully."""
    pk, sk = signature_manager.generate_keypair()
    assert len(pk) == 1952
    assert len(sk) == 4032

    message = b"Patient Monitor 01 Gateway Authentication Challenge Token"
    signature = signature_manager.sign(sk, message)
    assert len(signature) == 3309

    is_valid = signature_manager.verify(pk, message, signature)
    assert is_valid is True

def test_ml_dsa_65_tampered_message_rejection():
    """ML-DSA-65: Rejects signature if message was altered."""
    pk, sk = signature_manager.generate_keypair()
    message = b"Original Message"
    signature = signature_manager.sign(sk, message)

    tampered_message = b"Tampered Message"
    assert signature_manager.verify(pk, tampered_message, signature) is False

def test_ml_dsa_65_invalid_signature_rejection():
    """ML-DSA-65: Rejects altered signature bytes."""
    pk, sk = signature_manager.generate_keypair()
    message = b"Valid Message"
    signature = signature_manager.sign(sk, message)

    bad_sig = bytearray(signature)
    bad_sig[20] ^= 0x55
    assert signature_manager.verify(pk, message, bytes(bad_sig)) is False

def test_hkdf_session_key_derivation():
    """HKDF: Derives 256-bit symmetric session key with domain separation."""
    shared_secret = os.urandom(32)
    salt = os.urandom(32)
    key1 = encryption_manager.derive_session_key(shared_secret, salt, b"Context-A")
    key2 = encryption_manager.derive_session_key(shared_secret, salt, b"Context-B")
    assert len(key1) == 32
    assert len(key2) == 32
    assert key1 != key2

def test_aes_256_gcm_encrypt_decrypt_valid():
    """AES-256-GCM: Encrypts with AAD and successfully decrypts valid ciphertext."""
    key = os.urandom(32)
    plaintext = b'{"heart_rate": 78, "spo2": 99}'
    nonce, ciphertext, tag = encryption_manager.encrypt_payload(
        key, plaintext, "MED-001", "SES-001", 101
    )
    assert len(nonce) == 12
    assert len(tag) == 16

    decrypted = encryption_manager.decrypt_payload(
        key, nonce, ciphertext, tag, "MED-001", "SES-001", 101
    )
    assert decrypted == plaintext

def test_aes_256_gcm_tampered_ciphertext_fails():
    """AES-256-GCM: Fails verification if ciphertext is altered."""
    key = os.urandom(32)
    plaintext = b'{"heart_rate": 78}'
    nonce, ciphertext, tag = encryption_manager.encrypt_payload(
        key, plaintext, "MED-001", "SES-001", 101
    )
    bad_ct = bytearray(ciphertext)
    bad_ct[0] ^= 0x01

    decrypted = encryption_manager.decrypt_payload(
        key, nonce, bytes(bad_ct), tag, "MED-001", "SES-001", 101
    )
    assert decrypted is None

def test_aes_256_gcm_aad_tampering_fails():
    """AES-256-GCM: Fails verification if AAD metadata (e.g. sequence number) is altered."""
    key = os.urandom(32)
    plaintext = b'{"heart_rate": 78}'
    nonce, ciphertext, tag = encryption_manager.encrypt_payload(
        key, plaintext, "MED-001", "SES-001", 101
    )

    # Attempt decryption with spliced sequence number 102
    decrypted = encryption_manager.decrypt_payload(
        key, nonce, ciphertext, tag, "MED-001", "SES-001", 102
    )
    assert decrypted is None
