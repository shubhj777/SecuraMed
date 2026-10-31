import React from 'react';
import { Lock, ArrowRight, ShieldCheck, CheckCircle2, KeyRound, Cpu, Layers } from 'lucide-react';

export const SecureCommunication: React.FC = () => {
  const protocolSteps = [
    {
      step: '01',
      title: 'Identity Authentication & Challenge',
      tech: 'ML-DSA-65 (NIST FIPS 204)',
      desc: 'Gateway checks registered device public key. Issues fresh ephemeral random challenge. Device signs challenge with registered private key to prove identity and prevent MitM.',
      badge: 'Identity Verified'
    },
    {
      step: '02',
      title: 'Quantum-Resistant Key Establishment',
      tech: 'ML-KEM-768 (NIST FIPS 203)',
      desc: 'Gateway provides ephemeral ML-KEM-768 public key. Connecting device encapsulates a 256-bit shared secret. Gateway decapsulates using ephemeral private key.',
      badge: 'PQC Shared Secret'
    },
    {
      step: '03',
      title: 'Domain-Separated Key Derivation',
      tech: 'HKDF-SHA256 (RFC 5869)',
      desc: 'Shared secret, challenge salt, and session transcript are processed through HKDF to derive independent 256-bit session keys. Eliminates cross-protocol key reuse.',
      badge: 'AES-256 Session Key'
    },
    {
      step: '04',
      title: 'Authenticated Telemetry Encryption',
      tech: 'AES-256-GCM + Authenticated AAD',
      desc: 'Device encrypts numerical vital signs with fresh 96-bit nonce. Metadata (device_id, session_id, sequence_number) is authenticated as Associated Data (AAD).',
      badge: 'Tamper-Evident'
    },
    {
      step: '05',
      title: 'Replay Protection & Ingestion',
      tech: 'Sliding Window & Unique Constraints',
      desc: 'Gateway verifies authentication tag, rejects replayed or duplicate sequence numbers, checks device permissions, and stores authorized synthetic readings.',
      badge: 'Replay Defended'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-400" />
          Secure Device-to-Gateway Communication Architecture
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Detailed specification and cryptographic execution flow of the Post-Quantum Authenticated Key Exchange (PQC-AKE).
        </p>
      </div>

      {/* Protocol Visual Cards */}
      <div className="space-y-3">
        {protocolSteps.map((s) => (
          <div key={s.step} className="bg-[#111827] rounded-xl p-4 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-cyan-500/30 transition-all">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                {s.step}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{s.title}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {s.tech}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">{s.desc}</p>
              </div>
            </div>
            <div className="shrink-0 flex md:flex-col items-end justify-center">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {s.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Packet Structure Inspector */}
      <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Cryptographic Packet Structure & AAD Binding</h2>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">RFC 5116 Authenticated Construction</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">Standardized Wire Payload Format:</div>
            <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
{`{
  "device_id": "MED-001",
  "session_id": "SES-D9C1A52B8E04",
  "sequence_number": 101,
  "nonce": "7f8b92c10a44de889012bb44",
  "ciphertext": "3e9f4a10bc...",
  "authentication_tag": "99bcae7104f210a56611328900bbca12"
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">Associated Authenticated Data (AAD):</div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2">
              <div className="text-amber-400">AAD String: "MED-001|SES-D9C1A52B8E04|101"</div>
              <p className="text-[11px] text-slate-400 font-sans leading-normal">
                The device ID, session ID, and sequence number are fed directly into the AES-GCM GHASH authenticator.
                If an attacker attempts to alter the sequence number or replace the device ID, the authentication tag
                verification will fail and the message is instantly dropped.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
