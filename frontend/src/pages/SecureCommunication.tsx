import React, { useState } from 'react';
import { 
  Lock, ShieldCheck, CheckCircle2, ChevronDown, ChevronUp, 
  Layers, KeyRound, Cpu, ShieldAlert, Sparkles, Activity
} from 'lucide-react';

export const SecureCommunication: React.FC = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Five Understandable Stages for Hospital IT & Management
  const stages = [
    {
      stageNum: 1,
      title: 'Device Identity Verification',
      description: 'Confirming that the connected medical device is registered and trusted.',
      status: 'Verified',
      statusType: 'success',
      techName: 'ML-DSA-65 (NIST FIPS 204)',
      techDetail: 'Device signs a fresh random challenge with its registered post-quantum private key to mathematically prove identity without revealing secrets.'
    },
    {
      stageNum: 2,
      title: 'Secure Connection Establishment',
      description: 'Establishing a protected connection between the medical device and gateway.',
      status: 'Established',
      statusType: 'success',
      techName: 'ML-KEM-768 (NIST FIPS 203)',
      techDetail: 'Lattice-based key encapsulation establishes a 256-bit quantum-resistant shared secret between the device and the gateway.'
    },
    {
      stageNum: 3,
      title: 'Communication Encryption',
      description: 'Protecting medical device information while it travels across the network.',
      status: 'Protected',
      statusType: 'success',
      techName: 'AES-256-GCM + HKDF-SHA256',
      techDetail: 'Independent session keys are derived using HKDF and numerical vital signs are encrypted with authenticated AES-256-GCM.'
    },
    {
      stageNum: 4,
      title: 'Message Integrity Verification',
      description: 'Checking that messages have not been altered or modified during communication.',
      status: 'Verified',
      statusType: 'success',
      techName: 'Associated Authenticated Data (AAD)',
      techDetail: 'The 128-bit GHASH authentication tag binds telemetry ciphertext directly to device ID, session ID, and sequence metadata to prevent tampering.'
    },
    {
      stageNum: 5,
      title: 'Duplicate Message Protection',
      description: 'Preventing previously captured messages from being submitted again.',
      status: 'Protected',
      statusType: 'success',
      techName: 'Sequence Monotonicity & Sliding Window',
      techDetail: 'Strictly monotonic sequence numbers and session sliding window reject captured or repeated transmissions.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-400" />
          Secure Device Communication
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Monitor how medical devices establish trusted connections and securely exchange information with hospital systems.
        </p>
      </div>

      {/* 5 Understandable Communication Stages */}
      <div className="space-y-3">
        {stages.map((stg) => (
          <div 
            key={stg.stageNum} 
            className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-cyan-500/30 transition-all shadow-sm"
          >
            <div className="flex items-start space-x-4">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-bold text-base flex items-center justify-center shrink-0">
                0{stg.stageNum}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Stage {stg.stageNum}: {stg.title}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700">
                    {stg.techName}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-2xl">
                  {stg.description}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {stg.techDetail}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center md:flex-col items-end justify-center">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {stg.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Security Details Section (Expandable for Technical Personnel) */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden shadow-md">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Advanced Security Details</h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
              Technical Architecture & Wire Format
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
            <span>{showAdvanced ? 'Hide Technical Details' : 'View Technical Details'}</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showAdvanced && (
          <div className="p-5 border-t border-slate-800 space-y-5 bg-slate-950/40 text-xs">
            {/* Cryptographic Technologies List */}
            <div>
              <div className="text-xs font-semibold text-slate-200 mb-2">Underlying Cryptographic Standards:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-mono text-cyan-300 font-bold">ML-KEM-768</div>
                  <div className="text-[11px] text-slate-400 mt-1">NIST FIPS 203 — Module Lattice Key Encapsulation (Security Category 3)</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-mono text-cyan-300 font-bold">ML-DSA-65</div>
                  <div className="text-[11px] text-slate-400 mt-1">NIST FIPS 204 — Module Lattice Digital Signatures for proof-of-possession</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-mono text-cyan-300 font-bold">AES-256-GCM</div>
                  <div className="text-[11px] text-slate-400 mt-1">NIST SP 800-38D — Galois/Counter Mode authenticated symmetric bulk cipher</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-mono text-cyan-300 font-bold">HKDF-SHA256</div>
                  <div className="text-[11px] text-slate-400 mt-1">RFC 5869 — Extract-and-expand key derivation with transcript binding</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-mono text-cyan-300 font-bold">Authenticated Associated Data (AAD)</div>
                  <div className="text-[11px] text-slate-400 mt-1">RFC 5116 — Authenticates device ID, session ID & sequence number in GHASH</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="font-mono text-cyan-300 font-bold">Replay Protection</div>
                  <div className="text-[11px] text-slate-400 mt-1">Sequence-number-based tracking with in-memory window and DB constraints</div>
                </div>
              </div>
            </div>

            {/* Wire Payload & AAD Inspector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300 font-mono">Standardized Wire Payload Format:</div>
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
                <div className="text-xs font-semibold text-slate-300 font-mono">Associated Authenticated Data (AAD):</div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2">
                  <div className="text-amber-400 font-bold">AAD String: "MED-001|SES-D9C1A52B8E04|101"</div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    The medical device ID, session ID, and strictly increasing sequence number are bound directly into the AES-GCM GHASH tag.
                    If an attacker tampers with the sequence number, replaces the device ID, or injects a duplicate message, the authentication tag fails and the gateway drops the packet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
