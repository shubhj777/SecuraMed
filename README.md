# SecureMed Gateway

**Post-Quantum-Ready Cybersecurity Gateway for Connected Medical Devices**

[![Tests](https://img.shields.io/badge/Tests-28%20Passed-10B981?style=flat-square)](#automated-security-tests)
[![PQC Standard](https://img.shields.io/badge/NIST%20PQC-ML--KEM--768%20%7C%20ML--DSA--65-06B6D4?style=flat-square)](#cryptographic-architecture)
[![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-6366F1?style=flat-square)](#cryptographic-architecture)
[![Audit](https://img.shields.io/badge/Audit-SHA--256%20Hash%20Chained-F59E0B?style=flat-square)](#audit-integrity)

---

## 1. Project Overview

**SecureMed Gateway** is a post-quantum-ready cybersecurity platform engineered to protect connected medical devices (IoMT) and their communication with hospital backend infrastructure. 

Medical devices can remain deployed in clinical settings for over a decade. Under the **"Harvest Now, Decrypt Later"** threat model, adversaries intercept encrypted medical traffic today, anticipating that future quantum computers will break classical RSA and Elliptic Curve Cryptography.

SecureMed Gateway introduces an authenticated, quantum-resistant security layer providing:
1. **Device Identity Management**: Cryptographic binding of device IDs to authorized NIST FIPS 204 (ML-DSA-65) public keys.
2. **Authenticated Post-Quantum Handshake (PQC-AKE)**: ML-KEM-768 shared secret negotiation authenticated with ML-DSA-65 proof-of-possession.
3. **Authenticated Telemetry Encryption**: AES-256-GCM authenticated bulk encryption with Associated Authenticated Data (AAD).
4. **Replay Protection**: Strict monotonic sequence tracking with server-side sliding window deduplication.
5. **Secure Firmware Update Verification**: Multi-stage verification enforcing SHA-256 binary hashing, authorized ML-DSA-65 manufacturer signatures, device compatibility, and monotonic anti-rollback.
6. **Interactive Attack Simulation Lab**: Controlled execution of 6 attack vectors against real backend cryptographic defense engines.
7. **Tamper-Evident Audit Logging**: SHA-256 cryptographic hash-chained audit trails.
8. **Medical Device Emulator**: Simulated Patient Monitor streaming synthetic vital signs.

---

## 2. Technology Stack

- **Backend**: Python 3.13, FastAPI, SQLAlchemy, Pydantic, Uvicorn
- **Cryptography**:
  - `pqcrypto` (NIST FIPS 203 ML-KEM-768 & NIST FIPS 204 ML-DSA-65)
  - `cryptography` (AES-256-GCM, HKDF-SHA256, SHA-256)
  - `argon2-cffi` (Argon2id for administrator password hashing)
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide React
- **Database**: SQLite (production-compatible with PostgreSQL)
- **Testing**: Pytest (28 automated security tests)

---

## 3. Quickstart & Installation

### Prerequisites
- Python 3.11+ (Python 3.13 supported)
- Node.js 18+ (Node v20.18 LTS included)
- Git

### 1. Backend Setup
```bash
# From workspace root
python3 -m pip install -r backend/requirements.txt

# Start FastAPI Gateway Backend (Port 8000)
python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
# In a new terminal
cd frontend
npm install
npm run dev
# Dashboard opens at http://localhost:5173
```

### 3. Run Automated Security Tests
```bash
# From workspace root
python3 -m pytest tests/ -v
```
All 28 tests will execute and pass, verifying NIST PQC encapsulation, signatures, replay defense, firmware checks, and attack mitigations.

---

## 4. Hackathon Live Demonstration Walkthrough

Follow this 5-step sequence during judging:

### Step 1: Overview & Cryptography Status
1. Navigate to **Overview** (`http://localhost:5173`). Observe registered devices and active defense status.
2. Open **Cryptography Status**. Review the live status of ML-KEM-768 (FIPS 203) and ML-DSA-65 (FIPS 204).
3. Click **"Run Live Benchmark"** to measure real in-process cryptographic execution times on host hardware.

### Step 2: Interactive Attack Simulation Lab
1. Navigate to **Attack Simulator Lab**.
2. Select target device `MED-001`.
3. Test **Attack 1 (Device Impersonation)**: Notice gateway blocks rogue identity via `device_auth`.
4. Test **Attack 2 (Message Tampering)**: Notice AES-256-GCM authentication tag verification fails and blocks tampered ciphertext.
5. Test **Attack 3 (Replay Attack)**: Resend duplicate sequence packet; notice gateway detects and blocks replay.
6. Test **Attack 4 (Unauthorized Command)**: Attempt to issue clinical override (`MODIFY_INFUSION_DOSAGE`); notice least-privilege access control blocks it.
7. Test **Attack 6 (Request Flooding)**: Send burst traffic; notice sliding-window rate limiter mitigates excess packets.

### Step 3: Secure Firmware Verification
1. Navigate to **Firmware Security**.
2. Click **"Verify Genuine"**: Notice package passes SHA-256, ML-DSA-65 signature, and anti-rollback checks -> **APPROVED**.
3. Click **"Verify Tampered"**: Backdoor injected into binary -> SHA-256 mismatch detected -> **REJECTED**.
4. Click **"Verify Rogue Key"**: Signed by unauthorized key -> **REJECTED**.
5. Click **"Verify Downgrade"**: Version 1 attempting to overwrite version 5 -> Anti-rollback violation detected -> **REJECTED**.

### Step 4: Live Telemetry & Device Revocation
1. Navigate to **Live Telemetry**. View synthetic vital sign streams for `MED-001`.
2. Navigate to **Device Management**. Click **"Revoke"** on `MED-001`.
3. Return to **Live Telemetry** or launch an attack. The revoked device is now rejected at the gateway boundary.

### Step 5: Cryptographic Audit Hash-Chain Verification
1. Navigate to **Audit Logs**.
2. Click **"Verify Chain Integrity"**: All records verified valid.
3. Click **"Simulate DB Tampering"**: Simulates an attacker altering a row in the database.
4. Click **"Verify Chain Integrity"**: The gateway immediately flags the corrupted record ID!
5. Click **"Repair Chain"**: Hashes are restored and verified.

---

## 5. Technical Documentation Index

- [System Architecture](documentation/architecture.md)
- [Threat Model & STRIDE Analysis](documentation/threat_model.md)
- [Cryptographic Protocol Specification](documentation/cryptography.md)
- [Security Testing & Automated Verification](documentation/security_testing.md)
- [REST API Specification](documentation/api_documentation.md)
- [Technical Judging & Defense Q&A](documentation/judging_qa.md)

---

## 6. Safety Notice

*All patient measurements and physiological vitals generated by this platform are SYNTHETIC DEMONSTRATION DATA for cybersecurity protocol testing. SecureMed Gateway does not connect to real medical patients, make clinical treatment determinations, or perform medical diagnosis.*
