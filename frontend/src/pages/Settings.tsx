import React, { useState } from 'react';
import { Settings as SettingsIcon, HelpCircle, ChevronDown, ChevronUp, Server, Shield, Database, Terminal } from 'lucide-react';

export const Settings: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const questions = [
    {
      q: 'Q1: Why do connected medical devices need post-quantum cryptography?',
      a: 'Connected medical devices transmit high-value, long-lived patient telemetry and can remain deployed in hospitals for 10-15 years. Under the "Harvest Now, Decrypt Later" threat model, adversaries record encrypted traffic today to decrypt it once cryptanalytically relevant quantum computers (CRQCs) break RSA and Elliptic Curve Cryptography (ECC). NIST ML-KEM-768 and ML-DSA-65 provide mathematical hardness based on Module Learning with Errors (M-LWE), protecting clinical data against future quantum decryption.'
    },
    {
      q: 'Q2: Why use ML-KEM instead of directly encrypting data with it?',
      a: 'ML-KEM (NIST FIPS 203) is a Key Encapsulation Mechanism designed strictly to establish a shared symmetric secret between parties. Asymmetric lattice operations are computationally heavy and produce 1,088-byte ciphertexts for 32-byte secrets. The standard hybrid cryptographic pattern uses ML-KEM to establish a 256-bit secret, and then uses hardware-accelerated AES-256-GCM for bulk, streaming telemetry data.'
    },
    {
      q: 'Q3: Does ML-KEM authenticate the device?',
      a: 'No. Raw ML-KEM does not authenticate the peer by itself; an attacker could perform a man-in-the-middle attack by encapsulating their own key. Therefore, SecureMed Gateway implements an Authenticated Key Exchange (AKE) protocol where the connecting device must first prove possession of its registered ML-DSA-65 signing key by signing a fresh gateway challenge before session keys are derived.'
    },
    {
      q: 'Q4: What happens if a message is modified in transit?',
      a: 'All device communication uses AES-256-GCM authenticated encryption. The 16-byte authentication tag covers both the ciphertext and the Associated Authenticated Data (AAD: device ID, session ID, sequence number). Any bit modification causes GCM authentication failure during decryption, and the gateway immediately rejects the packet and logs a CRITICAL security event.'
    },
    {
      q: 'Q5: How do you prevent replay attacks?',
      a: 'The gateway binds a strictly monotonically increasing sequence number to the AES-GCM Associated Data (AAD) and tracks sequence states on the server using an in-memory sliding window backed by database-level uniqueness constraints. If an adversary resends a previously valid packet, the duplicate sequence number is detected and blocked.'
    },
    {
      q: 'Q6: How do you verify firmware updates?',
      a: 'Verification follows a 5-step pipeline: (1) Enforce 10MB file size limit, (2) Calculate SHA-256 hash of firmware.bin and verify against canonical manifest, (3) Verify NIST ML-DSA-65 signature on manifest using authorized manufacturer root keys, (4) Verify device model compatibility, and (5) Enforce monotonic anti-rollback policy (security_version >= active version).'
    },
    {
      q: 'Q7: What happens if a medical device is compromised or stolen?',
      a: 'The gateway administrator executes Device Revocation. The device\'s trust status is changed to REVOKED, its public key binding is disabled, all active cryptographic session keys are deleted from memory, and subsequent connection or telemetry ingestion attempts are blocked at the gateway edge.'
    },
    {
      q: 'Q8: What if the gateway itself is compromised?',
      a: 'The gateway operates under the principle of least privilege. In production, master manufacturer firmware signing keys reside in an external HSM/KMS, never on the gateway. Devices independently perform secondary verification before installation. Audit logs use cryptographic hash chaining so retroactive tampering is immediately flagged.'
    },
    {
      q: 'Q9: Are you using real physical medical devices?',
      a: 'No. This prototype uses an isolated software emulator that models real medical device profiles (Patient Monitor, ECG Monitor) and generates synthetic vital signs. Real clinical deployment requires medical-device safety analysis, manufacturer integration, and regulatory validation (FDA/MDR).'
    },
    {
      q: 'Q10: Does the system guarantee medical data accuracy?',
      a: 'No. Post-quantum cryptography guarantees message authenticity, integrity, and confidentiality. It guarantees that readings came from the verified device and were not tampered with, but does not validate sensor calibration or clinical accuracy.'
    },
    {
      q: 'Q11: What happens if PQC causes excessive latency on constrained devices?',
      a: 'ML-KEM and ML-DSA are executed during session establishment (handshake), which takes ~1-3 milliseconds on modern hardware. Once the session is established, high-frequency telemetry uses AES-256-GCM, which requires less than 0.05 milliseconds per packet. The gateway-assisted architecture amortizes PQC handshake overhead over long session lifetimes.'
    },
    {
      q: 'Q12: What happens if the gateway goes offline?',
      a: 'The gateway health monitor reports uptime and node status. In production, high availability (HA) active-passive or active-active gateway clusters with redundant failover are required so patient monitoring is never interrupted.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-cyan-400" />
          Gateway Architecture & Hackathon Judging Q&A
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Technical specifications, cryptographic rationale, security boundaries, and defense in depth architecture.
        </p>
      </div>

      {/* Gateway Environment Configuration */}
      <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-3 text-xs">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          Runtime Environment & Security Boundaries
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-slate-400 text-[10px]">Gateway Node ID</div>
            <div className="text-cyan-300 font-bold mt-1">SECUREMED-GW-01</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-slate-400 text-[10px]">PQC KEM Algorithm</div>
            <div className="text-emerald-400 font-bold mt-1">ML-KEM-768 (FIPS 203)</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-slate-400 text-[10px]">PQC Signature Algorithm</div>
            <div className="text-emerald-400 font-bold mt-1">ML-DSA-65 (FIPS 204)</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-slate-400 text-[10px]">Symmetric Encryption</div>
            <div className="text-indigo-300 font-bold mt-1">AES-256-GCM (SP 800-38D)</div>
          </div>
        </div>
      </div>

      {/* Judging Technical Q&A Accordion */}
      <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white">Technical Judging Panel Reference (12 Questions)</h2>
        </div>

        <div className="space-y-2">
          {questions.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-3.5 flex items-center justify-between text-xs font-semibold text-white hover:bg-slate-800/40 transition-colors"
                >
                  <span className="text-cyan-300">{item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="p-3.5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 font-sans">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
