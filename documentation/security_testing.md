# Security Testing & Verification Report — SecureMed Gateway

## 1. Automated Test Suite Execution

All security mechanisms are covered by automated unit and integration tests using `pytest`.

To run all automated security tests:
```bash
python3 -m pytest tests/ -v
```

### Test Coverage Summary:
- **`tests/test_crypto.py`** (9 Tests):
  - ML-KEM-768 encapsulation / decapsulation produces identical 32-byte shared secrets.
  - ML-KEM-768 implicit rejection verification: corrupted ciphertext yields non-matching secret.
  - ML-DSA-65 digital signature generation and verification.
  - ML-DSA-65 rejection of tampered message payloads.
  - ML-DSA-65 rejection of corrupted signature bytes.
  - HKDF-SHA256 session key derivation with domain separation.
  - AES-256-GCM encryption and decryption with AAD.
  - AES-256-GCM rejection of modified ciphertext.
  - AES-256-GCM rejection of modified sequence number / AAD metadata.

- **`tests/test_devices.py`** (4 Tests):
  - Registration of valid medical devices with ML-DSA-65 keys.
  - Rejection of duplicate device ID registration (HTTP 409).
  - Rejection of unregistered device connection attempts (HTTP 401).
  - Cryptographic revocation enforcement: revoked device immediately denied handshake (HTTP 401).

- **`tests/test_replay.py`** (3 Tests):
  - First valid sequence packet accepted.
  - Duplicate sequence number rejected (HTTP 409 / Replay detection).
  - Stale sequence number below sliding window rejected.

- **`tests/test_firmware.py`** (4 Tests):
  - Genuine manufacturer package approved (SHA-256 match, valid ML-DSA-65 signature).
  - Tampered binary rejected (SHA-256 mismatch detected).
  - Untrusted manufacturer key rejected (unregistered signing key).
  - Anti-rollback downgrade attack rejected (security version 1 < current version 5).

- **`tests/test_attacks.py`** (6 Tests):
  - Attack 1: Device Impersonation blocked by device authentication engine.
  - Attack 2: Message Tampering blocked by AES-256-GCM tag verification.
  - Attack 3: Replay Attack blocked by sequence tracking engine.
  - Attack 4: Unauthorized Command blocked by least-privilege policy.
  - Attack 5: Firmware Tampering blocked by SHA-256 / ML-DSA-65 verifier.
  - Attack 6: Request Flooding mitigated by sliding-window rate limiter.

- **`tests/test_audit.py`** (2 Tests):
  - Verification of valid SHA-256 audit hash chain.
  - Detection of deliberate database tampering and pinpointing of corrupted record ID.

---

## 2. Attack Simulation Scenarios & Defense Summary

| Attack Vector | Simulated Action | Gateway Detection Engine | Expected Result |
| :--- | :--- | :--- | :--- |
| **1. Device Impersonation** | Connect with unregistered ID or forged ML-DSA-65 key | `device_auth` | **BLOCKED** |
| **2. Message Tampering** | Flip 1 byte of encrypted ciphertext in transit | `encryption` | **BLOCKED** |
| **3. Replay Attack** | Resend identical sequence number from valid packet | `replay_protection` | **BLOCKED** |
| **4. Unauthorized Command** | Send clinical override (`MODIFY_INFUSION_DOSAGE`) | `access_control` | **BLOCKED** |
| **5. Firmware Tampering** | Inject backdoor into binary while keeping manifest | `firmware_verifier` | **BLOCKED** |
| **6. Request Flooding** | Send 75 burst requests exceeding 60 req/min quota | `rate_limiter` | **MITIGATED** |
