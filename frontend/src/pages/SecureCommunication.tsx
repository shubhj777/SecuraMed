import React, { useState } from 'react';
import { 
  Lock, ShieldCheck, Key, Shield, CheckCircle2, 
  ArrowRight, Cpu, Zap, Eye, ChevronDown, ChevronUp, Server, Radio
} from 'lucide-react';

export const SecureCommunication: React.FC = () => {
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);

  const stages = [
    {
      num: '01',
      title: 'Mutual Device Authentication',
      standard: 'NIST FIPS 204 (ML-DSA-65)',
      desc: 'The medical device presents its cryptographic identity certificate. The IoMT Gateway verifies the digital signature using post-quantum lattice verification to eliminate device spoofing.',
      badge: 'VERIFIED',
      color: '#35C5E8',
      icon: Key
    },
    {
      num: '02',
      title: 'Post-Quantum Key Encapsulation',
      standard: 'NIST FIPS 203 (ML-KEM-768)',
      desc: 'A quantum-resistant key exchange establishes a shared secret over the hospital wireless link, rendering communications immune to "Harvest Now, Decrypt Later" quantum eavesdropping.',
      badge: 'ESTABLISHED',
      color: '#19B77A',
      icon: Lock
    },
    {
      num: '03',
      title: 'HKDF Session Key Derivation',
      standard: 'RFC 5869 (HKDF-SHA256)',
      desc: 'Cryptographic extract-and-expand key derivation generates isolated 256-bit symmetric session keys and distinct initialization vectors for each communication cycle.',
      badge: 'ACTIVE',
      color: '#818CF8',
      icon: Zap
    },
    {
      num: '04',
      title: 'Authenticated Payload Encryption',
      standard: 'NIST SP 800-38D (AES-256-GCM)',
      desc: 'Patient vitals and clinical commands are encrypted using AES-GCM with a 128-bit authentication tag, guaranteeing confidentiality and immediate detection of message tampering.',
      badge: 'PROTECTED',
      color: '#F5A623',
      icon: ShieldCheck
    },
    {
      num: '05',
      title: 'Anti-Replay Window Verification',
      standard: 'Monotonic Sequence Counters',
      desc: 'Strict sequential nonce validation detects and drops duplicate or out-of-order packets injected by wireless eavesdroppers within the hospital network.',
      badge: 'ENFORCED',
      color: '#19B77A',
      icon: Shield
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2A0910] gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0B1733] dark:text-white flex items-center gap-2.5">
            <Lock className="w-6 h-6 text-[#35C5E8]" />
            5-Stage Quantum-Resistant Medical Encryption Pipeline
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            End-to-end cryptographic encapsulation securing patient physiological streams against interception.
          </p>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-[#19B77A]/15 text-[#19B77A] border border-[#19B77A]/30 flex items-center gap-1.5 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-[#19B77A] animate-pulse" />
          <span>FIPS 203 / 204 Active</span>
        </span>
      </div>

      {/* Visual Pipeline Stages */}
      <div className="space-y-4">
        {stages.map((stg, idx) => {
          const Icon = stg.icon;
          return (
            <div
              key={stg.num}
              className="bg-white dark:bg-[#120508] rounded-2xl border border-slate-200 dark:border-[#2A0910] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#35C5E8]/40 transition-all"
            >
              <div className="flex items-start space-x-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: `${stg.color}15`, color: stg.color, border: `1px solid ${stg.color}40` }}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold font-mono text-slate-400">STAGE {stg.num}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-xs font-mono font-bold" style={{ color: stg.color }}>
                      {stg.standard}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0B1733] dark:text-white">{stg.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                    {stg.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0 self-end md:self-center font-mono">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#19B77A]/15 text-[#19B77A] border border-[#19B77A]/30">
                  {stg.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Cryptographic Specifications Box */}
      <div className="bg-white dark:bg-[#120508] rounded-2xl border border-slate-200 dark:border-[#2A0910] p-6 shadow-sm">
        <div 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-[#35C5E8]" />
            <h3 className="font-bold text-sm text-[#0B1733] dark:text-white">
              NIST Cryptographic Architecture Specifications
            </h3>
          </div>
          {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {showAdvanced && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#2A0910] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] space-y-1.5">
              <span className="text-[#35C5E8] font-bold">ML-KEM-768 Parameters</span>
              <div className="text-slate-600 dark:text-slate-400 text-[11px] space-y-1">
                <div>Public Key Size: 1,184 bytes</div>
                <div>Ciphertext Size: 1,088 bytes</div>
                <div>Shared Secret: 32 bytes (256 bits)</div>
                <div>Security Level: NIST Category 3</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] space-y-1.5">
              <span className="text-[#19B77A] font-bold">ML-DSA-65 Parameters</span>
              <div className="text-slate-600 dark:text-slate-400 text-[11px] space-y-1">
                <div>Public Key Size: 1,952 bytes</div>
                <div>Signature Size: 3,309 bytes</div>
                <div>Lattice Dimension: 6x5 matrix</div>
                <div>Security Level: NIST Category 3</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] space-y-1.5">
              <span className="text-[#F5A623] font-bold">AES-256-GCM Framing</span>
              <div className="text-slate-600 dark:text-slate-400 text-[11px] space-y-1">
                <div>Symmetric Key: 256 bits</div>
                <div>IV / Nonce: 96 bits unique</div>
                <div>Authentication Tag: 128 bits</div>
                <div>Anti-Replay Window: 64 packets</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecureCommunication;
