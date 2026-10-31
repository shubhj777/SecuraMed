# Technical Judging & Defense Questions — SecureMed Gateway

This document provides technically accurate answers to the key questions expected from cybersecurity and cryptography judges.

---

### QUESTION 1: Why do connected medical devices need post-quantum cryptography?
**Answer:**
Connected medical devices (bedside patient monitors, infusion pumps, surgical robots) transmit highly sensitive personal health information and operate with deployment lifespans of 10 to 15 years. Under the **"Harvest Now, Decrypt Later"** threat model, adversaries intercept and record encrypted medical traffic today. Once Cryptanalytically Relevant Quantum Computers (CRQCs) emerge, Shor’s algorithm will break RSA and Elliptic Curve Cryptography (ECC), exposing historical clinical telemetry. NIST-standardized Post-Quantum Cryptography (ML-KEM-768 and ML-DSA-65) relies on the hardness of Module Learning with Errors (M-LWE) lattice problems, which are mathematically resistant to both classical and quantum attacks.

---

### QUESTION 2: Why use ML-KEM instead of directly encrypting data with it?
**Answer:**
ML-KEM (NIST FIPS 203) is a Key Encapsulation Mechanism designed specifically to negotiate a symmetric shared secret. Asymmetric lattice operations are computationally intensive and result in large ciphertexts (1,088 bytes for ML-KEM-768). In contrast, AES-256-GCM is hardware-accelerated (AES-NI / ARM Cryptography Extensions) and processes bulk data with near-zero overhead. Standard hybrid cryptography dictates using ML-KEM to establish a 256-bit symmetric key, and then using AES-256-GCM for streaming clinical telemetry.

---

### QUESTION 3: Does ML-KEM authenticate the device?
**Answer:**
**No.** Raw ML-KEM does not provide peer authentication; an adversary could mount a Man-in-the-Middle (MitM) attack by encapsulating their own key. For this reason, SecureMed Gateway implements an **Authenticated Key Exchange (AKE)** protocol. Before session key derivation, the connecting device must prove possession of its registered identity by signing an ephemeral gateway challenge using its NIST FIPS 204 ML-DSA-65 private key.

---

### QUESTION 4: What happens if a message is modified in transit?
**Answer:**
All telemetry communication uses AES-256-GCM authenticated encryption. The 16-byte GHASH authentication tag authenticates both the ciphertext and the Associated Authenticated Data (AAD: device ID, session ID, sequence number). Any bit modification causes cryptographic tag verification failure during decryption. The gateway immediately drops the packet and logs a CRITICAL security event. Plaintext is never released on tag mismatch.

---

### QUESTION 5: How do you prevent replay attacks?
**Answer:**
Replay protection is enforced through two complementary mechanisms:
1. **AAD Sequence Binding**: The sequence number is fed into the AES-GCM GHASH tag. An adversary cannot modify the sequence number without causing tag failure.
2. **Server-Side Replay Window**: The gateway maintains an in-memory sliding window cache backed by database-level unique constraints on `(device_id, session_id, sequence_number)`. Resending a previously accepted sequence number triggers immediate duplicate detection and rejection (HTTP 409).

---

### QUESTION 6: How do you verify firmware updates?
**Answer:**
Firmware verification follows an atomic 5-stage validation pipeline:
1. **Size check**: Rejects payloads exceeding 10MB to prevent memory exhaustion DoS.
2. **Cryptographic Hash (SHA-256)**: Calculates the digest of `firmware.bin` and compares it to the canonical manifest.
3. **ML-DSA-65 Digital Signature**: Verifies the manufacturer’s signature on the canonical manifest using pinned authorized public keys.
4. **Model Compatibility**: Ensures the firmware is explicitly targeted for the device’s hardware model.
5. **Anti-Rollback Enforcement**: Compares the manifest’s `security_version` against the highest currently approved version. Downgrade attempts to older vulnerable versions are rejected.

---

### QUESTION 7: What happens if a medical device is compromised or stolen?
**Answer:**
The administrator executes **Device Revocation**. The gateway updates the device’s trust state to `REVOKED`, purges active session encryption keys from the in-memory vault, and closes active sessions in the database. Any subsequent connection or ingestion attempts from the revoked device ID or public key are rejected at the edge.

---

### QUESTION 8: What if the gateway itself is compromised?
**Answer:**
The architecture enforces least privilege and defense in depth:
1. **No Stored Plaintext Private Keys**: Devices and manufacturer root signing private keys are never stored on the gateway.
2. **Cryptographic Hash-Chained Audit Logs**: Audit entries are linked using SHA-256 hash chains (`current_hash = SHA256(prev_hash + data)`). Retroactive alteration of past events invalidates the chain.
3. **Device-Side Independent Verification**: In production, medical devices must independently perform firmware signature checks prior to flashing.

---

### QUESTION 9: Are you using real physical medical devices?
**Answer:**
No. The hackathon implementation uses an isolated software device emulator that generates synthetic physiological readings. Connecting unvalidated security gateways to physical clinical devices in an active patient environment would violate medical safety protocols. Real deployment requires medical-device manufacturer collaboration and regulatory approval (e.g., FDA 510(k), EU MDR).

---

### QUESTION 10: Does the system guarantee medical data accuracy?
**Answer:**
No. Cryptography provides **authenticity, integrity, and confidentiality**. It guarantees that the readings originated from the genuine, uncompromised device and were not tampered with during transmission. It does not calibrate sensors, diagnose illnesses, or validate clinical accuracy.

---

### QUESTION 11: What happens if PQC causes excessive latency on constrained devices?
**Answer:**
Lattice-based operations take ~1-3 milliseconds on modern hardware, and key negotiation only occurs during initial connection establishment. Once the session is established, high-frequency telemetry uses AES-256-GCM, which requires less than 0.05 milliseconds per packet. The gateway-assisted architecture amortizes handshake latency across long-lived clinical sessions.

---

### QUESTION 12: What happens if the gateway goes offline?
**Answer:**
The gateway implements real-time health checks (`/api/health`). For a production hospital deployment, high-availability (HA) active-passive or active-active gateway clusters with redundant load balancing must be deployed to ensure zero downtime for patient monitoring.
