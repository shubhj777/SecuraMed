# REST API Specification — SecureMed Gateway

## Base URL
`http://127.0.0.1:8000/api`

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Operator login using Argon2id password hashing. Returns JWT bearer token.
- **Request Body**: `{"username": "admin", "password": "SecureMedAdmin2026!"}`
- **Response (200)**: `{"access_token": "...", "token_type": "bearer", "role": "ADMIN", "username": "admin"}`

### `GET /api/auth/me`
Retrieves current authenticated operator profile.

---

## 2. Device Management Endpoints

### `GET /api/devices`
Lists all registered medical devices, trust status, and connection health.

### `POST /api/devices/register`
Registers a new medical device and binds its verified ML-DSA-65 public key.
- **Request Body**:
  ```json
  {
    "device_id": "MED-003",
    "device_name": "Bedside Monitor ICU-03",
    "device_type": "PATIENT_MONITOR",
    "public_key": "<3904 hex chars representing 1952 bytes ML-DSA-65 PK>"
  }
  ```

### `POST /api/devices/{device_id}/revoke`
Revokes trust for a compromised or retired device. Invalidates all active sessions.

### `GET /api/devices/{device_id}/events`
Retrieves historical security events logged specifically for this device.

---

## 3. Cryptography & Security Handshake Endpoints

### `POST /api/security/handshake/init`
Step 1 of Post-Quantum Authenticated Key Exchange:
- **Request Body**: `{"device_id": "MED-001", "client_random": "<16 bytes hex>"}`
- **Response (200)**:
  ```json
  {
    "gateway_id": "SECUREMED-GW-01",
    "device_id": "MED-001",
    "challenge": "<32 bytes hex>",
    "gateway_kem_public_key": "<1184 bytes hex ML-KEM-768 PK>",
    "timestamp": "2026-10-31T20:30:00Z"
  }
  ```

### `POST /api/security/handshake/complete`
Step 2 of Post-Quantum Authenticated Key Exchange:
- **Request Body**:
  ```json
  {
    "device_id": "MED-001",
    "challenge": "<32 bytes hex>",
    "client_signature": "<3309 bytes hex ML-DSA-65 signature on challenge>",
    "kem_ciphertext": "<1088 bytes hex ML-KEM-768 encapsulation>"
  }
  ```
- **Response (200)**: `{"session_id": "SES-...", "status": "ESTABLISHED", "expires_at": "..."}`

### `GET /api/security/crypto-status`
Returns live availability of ML-KEM-768, ML-DSA-65, AES-256-GCM, HKDF, and session metrics.

### `POST /api/security/benchmark`
Executes real in-process cryptographic benchmarking measuring latency and payload overhead.

---

## 4. Telemetry & Secure Communication

### `POST /api/telemetry/ingest`
Receives and cryptographically verifies an encrypted medical IoT packet:
- **Request Body**:
  ```json
  {
    "device_id": "MED-001",
    "session_id": "SES-...",
    "sequence_number": 101,
    "nonce": "<12 bytes hex>",
    "ciphertext": "<hex>",
    "authentication_tag": "<16 bytes hex>"
  }
  ```
- **Response (200)**: `{"status": "ACCEPTED", "result": "VERIFIED", "sequence_number": 101}`

### `GET /api/telemetry/history/{device_id}`
Returns numerical vital sign telemetry history for charts.

---

## 5. Secure Firmware Update Endpoints

### `POST /api/firmware/verify`
Submits a firmware package for SHA-256 integrity, ML-DSA-65 signature, and anti-rollback verification:
- **Request Body**: `{"firmware_binary_base64": "...", "manifest": {...}, "signature_hex": "..."}`

### `GET /api/firmware/demo-packages`
Provides genuine, tampered, untrusted-key, and rollback packages for live judging demonstration.

---

## 6. Attack Simulation & Audit

### `POST /api/attacks/simulate`
Executes actual security defense checks against one of the 6 attack vectors.

### `POST /api/audit/verify-chain`
Cryptographically verifies the SHA-256 hash chaining of the complete audit log.
