# Threat Model & Risk Analysis — SecureMed Gateway

## 1. Threat Landscape for Connected Medical Devices

Medical IoT devices operate in safety-critical hospital networks. Compromise of device communication or firmware can lead to patient harm, data exfiltration, or hospital infrastructure disruption.

### Primary Threat Actors
1. **Nation-State / Quantum Adversaries ("Harvest Now, Decrypt Later")**: Passively recording clinical device traffic today to decrypt long-term patient records once cryptanalytically relevant quantum computers exist.
2. **Malware / Ransomware Operators**: Attempting device takeover, unauthorized command execution, or ransomware deployment via firmware updates.
3. **Malicious Network Intruders (Man-in-the-Middle)**: Attempting to modify telemetry, spoof sensor alerts, or replay stale packets.

---

## 2. STRIDE Threat Analysis Matrix

| Threat Category | Potential Attack Vector | Gateway Security Countermeasure |
| :--- | :--- | :--- |
| **Spoofing (Identity)** | Rogue device impersonates legitimate patient monitor using cloned device ID. | ML-DSA-65 Proof-of-Possession Challenge: Connecting device must sign an ephemeral nonce with registered private key. |
| **Tampering (Integrity)** | Adversary intercepts telemetry in transit and flips vital sign bits (e.g. lowering heart rate). | AES-256-GCM authenticated encryption with AAD binding. Tampered bytes invalidate the 16-byte GHASH tag, dropping packet. |
| **Repudiation** | Operator or service denies executing firmware updates or device revocation. | SHA-256 Hash-Chained Audit Ledger: Monotonically linked cryptographic audit entries preventing retroactive tampering. |
| **Information Disclosure** | Adversary eavesdrops on hospital wireless telemetry streams. | AES-256-GCM symmetric encryption using keys derived from NIST FIPS 203 ML-KEM-768 shared secrets. |
| **Denial of Service** | Malicious device floods gateway with connection requests or packets. | Sliding-window rate limiter enforcing 60 req/min quotas per device, mitigating resource exhaustion. |
| **Elevation of Privilege** | Clinical telemetry device attempts to issue device reconfiguration commands. | Least-privilege access control: Clinical profiles strictly limited to streaming numerical telemetry. |

---

## 3. Medical Safety & Availability Safeguards

1. **No Autonomous Treatment Modification**: The gateway operates purely as an authentication, telemetry ingestion, and verification barrier. It does not issue clinical treatment decisions or drug infusion rate adjustments.
2. **Fail-Secure vs. Fail-Safe Awareness**: While cryptographically invalid messages are rejected, the gateway differentiates between security anomalies and emergency clinical alerts.
3. **Controlled Rate Limiting**: Flooding defense throttles excessive requests without blacklisting critical clinical channels indefinitely.
