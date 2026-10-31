# Cryptographic Architecture & Specification — SecureMed Gateway

## 1. Cryptographic Algorithms & Standards

SecureMed Gateway uses standardized, NIST-approved post-quantum and symmetric cryptographic algorithms. No experimental or unvetted ciphers are implemented.

```
+------------------------------------------------------------------------------------------------------+
| Algorithm       | Standard          | Key / Sig Size        | Role in SecureMed Gateway              |
+-----------------+-------------------+-----------------------+----------------------------------------+
| ML-KEM-768      | NIST FIPS 203     | PK: 1,184 B, CT: 1,088| Ephemeral Quantum-Resistant Key Exchange|
| ML-DSA-65       | NIST FIPS 204     | PK: 1,952 B, SIG: 3,30| Device Proof-of-Possession & Firmware  |
| AES-256-GCM     | NIST SP 800-38D   | Key: 32 B, Tag: 16 B  | Bulk Telemetry Authenticated Encryption|
| HKDF-SHA256     | RFC 5869          | Salt: 32 B, Key: 32 B | Domain-Separated Key Derivation        |
| SHA-256         | NIST FIPS 180-4   | Digest: 32 B (256-bit)| Firmware Hash & Audit Hash Chaining    |
| Argon2id        | RFC 9106          | Salt: 16 B, Mem: 64MB | Administrator Password Hashing         |
+------------------------------------------------------------------------------------------------------+
```

---

## 2. Authenticated Post-Quantum Handshake Protocol (PQC-AKE)

ML-KEM-768 alone is an unauthenticated Key Encapsulation Mechanism. To prevent Man-in-the-Middle (MitM) attacks, SecureMed Gateway implements an Authenticated Key Exchange (AKE) binding ML-DSA-65 identity verification with ephemeral ML-KEM encapsulation:

```
Device (Registered ID: MED-001)                                Gateway (SECUREMED-GW-01)
========================================================================================
1. Handshake Request
   { device_id, client_random }  ------------------------->
                                                           Verify device_id is registered
                                                           Check trust_status != REVOKED
                                                           Generate challenge (32 random bytes)
                                                           Generate (gw_kem_pk, gw_kem_sk)

2. Challenge Response
   <--------------------------------------------------------
   { gateway_id, challenge, gateway_kem_public_key }

3. Authentication & Key Encapsulation
   Sign challenge using device ML-DSA-65 private key
   Encapsulate shared secret using gateway_kem_public_key
   Derive session_key = HKDF(shared_secret, salt, info)

4. Complete Handshake
   { device_id, challenge, client_sig, kem_ciphertext } --->
                                                           Verify client_sig with registered PK
                                                           Decapsulate shared_secret via gw_kem_sk
                                                           Derive session_key = HKDF(...)
                                                           Create session_id (e.g. SES-D9C1A52B8E04)
                                                           Store session_key in in-memory vault

5. Confirmation
   <--------------------------------------------------------
   { session_id, status: "ESTABLISHED", expires_at }
```

---

## 3. Associated Authenticated Data (AAD) Metadata Binding

To prevent ciphertext splicing, identity substitution, and replay attacks, all AES-256-GCM telemetry payloads authenticate metadata as Associated Data:

$$\text{AAD} = \text{device\_id} \mathbin{\Vert} \text{session\_id} \mathbin{\Vert} \text{sequence\_number}$$

If an adversary attempts to modify the sequence number or replace the device ID in transit, the GCM authentication tag verification will fail, dropping the message immediately.
