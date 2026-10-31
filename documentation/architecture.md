# SecureMed Gateway — System Architecture

## 1. Executive Summary

SecureMed Gateway is an authenticated, post-quantum-ready cybersecurity gateway engineered to defend connected medical devices (IoMT) against current network exploits and future quantum decryption attacks. The gateway acts as a security boundary between clinical devices (such as bedside patient monitors, infusion pumps, and ECG telemetry units) and hospital cloud/backend infrastructure.

```
+-------------------------------------------------------------+
|                CONNECTED MEDICAL DEVICES                    |
|      (Bedside Patient Monitors, ECG Telemetry Units)        |
+-------------------------------------------------------------+
                              |
                              | NIST FIPS 204 Proof-of-Possession
                              | NIST FIPS 203 Ephemeral KEM
                              v
+=============================================================+
|                      SECUREMED GATEWAY                      |
|                                                             |
|  [Device Identity & Trust Registry]                         |
|    - Device Whitelisting & Verified ML-DSA-65 Public Keys   |
|    - Immediate Cryptographic Revocation Enforcement         |
|                                                             |
|  [Post-Quantum Authenticated Key Exchange (PQC-AKE)]        |
|    - ML-KEM-768 Shared Secret Encapsulation/Decapsulation   |
|    - HKDF-SHA256 Domain-Separated Session Key Derivation    |
|    - In-Memory Key Vault (Ephemeral Keys Never Persisted)   |
|                                                             |
|  [Secure Message Processing]                                |
|    - AES-256-GCM Bulk Authenticated Encryption              |
|    - Associated Authenticated Data (AAD) Metadata Binding   |
|    - Sliding-Window Replay Protection Engine                |
|    - Least-Privilege Clinical Device Command Filtering      |
|                                                             |
|  [Secure Firmware Verification Engine]                      |
|    - Canonical JSON Manifest Parsing                        |
|    - SHA-256 Binary Integrity Verification                  |
|    - ML-DSA-65 Manufacturer Root Signature Verification     |
|    - Monotonic Security Version Anti-Rollback Defense       |
|                                                             |
|  [Security Observability & Audit]                           |
|    - Real-Time Attack Detection Engine                      |
|    - Sliding-Window Request Flooding Mitigator              |
|    - SHA-256 Cryptographic Hash-Chained Audit Ledger        |
+=============================================================+
                              |
                              | Verified Synthetic Readings
                              | Structured Audit Trails
                              v
+-------------------------------------------------------------+
|                 HOSPITAL BACKEND & STORAGE                  |
|  - Telemetry Database (Numerical Records Only)              |
|  - Security Event Registry                                  |
|  - Hash-Chained Audit Ledger                                |
|  - Approved Firmware Repository                             |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|              SECURITY MONITORING DASHBOARD                  |
|      (React + Vite + Recharts Dark Cyber Interface)         |
+-------------------------------------------------------------+
```

## 2. Core Functional Modules

### 2.1 Device Identity Management & Registry
- **Cryptographic Binding**: Devices register their unique ID alongside an authorized ML-DSA-65 public key (1,952 bytes).
- **Trust States**: Devices transition across `TRUSTED`, `SUSPICIOUS`, and `REVOKED`.
- **Revocation Enforcement**: Revoked devices are terminated at the gateway edge. Active session keys are purged from memory, and reconnection attempts are rejected with HTTP 401/403.

### 2.2 Post-Quantum Cryptography Engine
- **NIST FIPS 203 (ML-KEM-768)**: Quantum-resistant lattice-based key encapsulation mechanism.
- **NIST FIPS 204 (ML-DSA-65)**: Quantum-resistant lattice-based digital signatures.
- **RFC 5869 (HKDF-SHA256)**: Derives independent, domain-separated AES keys from the PQC shared secret.
- **NIST SP 800-38D (AES-256-GCM)**: Authenticated bulk encryption with 16-byte authentication tags.

### 2.3 Replay Protection Engine
- Enforces strict monotonic sequence numbers per (device, session).
- Evaluates incoming sequence numbers against a sliding window (100 packets).
- Defends against race conditions using SQLite/PostgreSQL unique constraints on `(device_id, session_id, sequence_number)`.

### 2.4 Secure Firmware Update Verification
- Multi-tier inspection pipeline preventing malicious backdoor injection and rollback attacks.
- Enforces 10MB package limits, SHA-256 binary hashing, ML-DSA-65 manufacturer signature verification, device model matching, and anti-rollback monotonic version checks.

### 2.5 Attack Simulation Lab
- Controlled, non-destructive simulation mode executing genuine backend defense algorithms against:
  1. Device Impersonation
  2. Message Tampering
  3. Replay Attacks
  4. Unauthorized Commands
  5. Firmware Tampering
  6. Request Flooding (DoS)
