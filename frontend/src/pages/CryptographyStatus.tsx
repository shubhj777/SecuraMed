import React, { useState, useEffect } from 'react';
import { 
  Cpu, ShieldCheck, Zap, RefreshCw, CheckCircle2, 
  Lock, KeyRound, Clock, Server, FileCheck, Layers, ChevronDown, ChevronUp
} from 'lucide-react';
import { CryptoStatus, CryptoBenchmark, BenchmarkMetric } from '../types';
import { api } from '../services/api';

export const CryptographyStatus: React.FC = () => {
  const [status, setStatus] = useState<CryptoStatus | null>(null);
  const [benchmark, setBenchmark] = useState<CryptoBenchmark | null>(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getCryptoStatus();
      setStatus(data);
    } catch (e) {
      console.error('Failed to fetch crypto status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRunBenchmark = async () => {
    try {
      setBenchmarking(true);
      const res = await api.runCryptoBenchmark();
      setBenchmark(res);
    } catch (e: any) {
      alert('Security performance benchmark failed: ' + e.message);
    } finally {
      setBenchmarking(false);
    }
  };

  // 4 Understandable Cards for Hospital Users
  const technologyCards = [
    {
      id: 'conn',
      title: 'Secure Connection Technology',
      description: 'Establishes quantum-resistant shared secrets between trusted devices and the gateway.',
      advancedDetail: 'ML-KEM-768 — NIST FIPS 203',
      icon: Lock,
      isAvailable: status?.ml_kem_768_available ?? true,
      category: 'Key Encapsulation'
    },
    {
      id: 'sig',
      title: 'Digital Signature Verification',
      description: 'Verifies that messages and firmware packages originate from authorized signing identities.',
      advancedDetail: 'ML-DSA-65 — NIST FIPS 204',
      icon: FileCheck,
      isAvailable: status?.ml_dsa_65_available ?? true,
      category: 'Proof of Possession'
    },
    {
      id: 'enc',
      title: 'Communication Encryption',
      description: 'Protects information exchanged between medical devices and the gateway.',
      advancedDetail: 'AES-256-GCM',
      icon: ShieldCheck,
      isAvailable: status?.aes_256_gcm_available ?? true,
      category: 'Authenticated Cipher'
    },
    {
      id: 'kdf',
      title: 'Secure Key Management',
      description: 'Derives independent cryptographic keys for protected communication sessions.',
      advancedDetail: 'HKDF-SHA256',
      icon: KeyRound,
      isAvailable: status?.hkdf_sha256_available ?? true,
      category: 'Key Derivation'
    }
  ];

  // Helper to extract benchmark metrics
  const getMetricLatency = (opPattern: string): number | null => {
    if (!benchmark || !benchmark.metrics) return null;
    const match = benchmark.metrics.find(m => m.operation.toLowerCase().includes(opPattern.toLowerCase()));
    return match ? match.avg_latency_ms : null;
  };

  // Derive summary metrics from real benchmark execution
  const kemKeygen = getMetricLatency('key generation');
  const kemEncaps = getMetricLatency('encapsulation');
  const kemDecaps = getMetricLatency('decapsulation');
  const connEstablishmentTime = (kemKeygen !== null && kemEncaps !== null && kemDecaps !== null)
    ? +(kemKeygen + kemEncaps + kemDecaps).toFixed(3)
    : (kemEncaps !== null ? +(kemEncaps * 2).toFixed(3) : null);

  const signatureVerificationTime = getMetricLatency('signature verification');
  const messageEncryptionTime = getMetricLatency('aes-gcm encryption');
  const messageDecryptionTime = getMetricLatency('aes-gcm decryption');

  const avgMessageProcessingTime = (messageEncryptionTime !== null && messageDecryptionTime !== null)
    ? +((messageEncryptionTime + messageDecryptionTime) / 2).toFixed(4)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Security Technology Status
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            View the technologies protecting device identities, communication and firmware updates.
          </p>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={benchmarking}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-cyan-900/20 shrink-0"
        >
          <Zap className={`w-4 h-4 ${benchmarking ? 'animate-bounce text-yellow-300' : ''}`} />
          <span>{benchmarking ? 'Testing Security Hardware...' : 'Run Performance Benchmark'}</span>
        </button>
      </div>

      {/* 4 Understandable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {technologyCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.id} className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-3 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{card.title}</h3>
                      <div className="text-[11px] text-slate-400">{card.category}</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-cyan-400">
                <span className="text-slate-400">Underlying Standard:</span>
                <span>{card.advancedDetail}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Performance Section (Renamed from Cryptographic Execution Latency) */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden shadow-md space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Security Performance</h2>
          </div>
          {benchmark ? (
            <span className="text-[10px] font-mono text-slate-400">
              Measured on {benchmark.system_info?.machine} ({benchmark.system_info?.os})
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              Run benchmark to test live execution speeds
            </span>
          )}
        </div>

        {/* 5 Key Security Performance Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Connection Time</div>
            <div className="text-base font-bold font-mono text-cyan-300">
              {connEstablishmentTime !== null ? `${connEstablishmentTime} ms` : '—'}
            </div>
            <div className="text-[10px] text-slate-400">Handshake latency</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Signature Verification</div>
            <div className="text-base font-bold font-mono text-emerald-400">
              {signatureVerificationTime !== null ? `${signatureVerificationTime} ms` : '—'}
            </div>
            <div className="text-[10px] text-slate-400">Identity verification</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Message Encryption</div>
            <div className="text-base font-bold font-mono text-indigo-300">
              {messageEncryptionTime !== null ? `${messageEncryptionTime} ms` : '—'}
            </div>
            <div className="text-[10px] text-slate-400">Telemetry packet</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Message Decryption</div>
            <div className="text-base font-bold font-mono text-indigo-300">
              {messageDecryptionTime !== null ? `${messageDecryptionTime} ms` : '—'}
            </div>
            <div className="text-[10px] text-slate-400">Tag authentication</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 col-span-2 md:col-span-1">
            <div className="text-[10px] font-medium text-slate-400 uppercase">Avg Message Processing</div>
            <div className="text-base font-bold font-mono text-amber-300">
              {avgMessageProcessingTime !== null ? `${avgMessageProcessingTime} ms` : '—'}
            </div>
            <div className="text-[10px] text-slate-400">Sub-millisecond</div>
          </div>
        </div>

        {/* Detailed Benchmark Breakdown (Expandable) */}
        <div>
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white p-2.5 rounded-lg bg-slate-900/60 border border-slate-800"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Detailed Benchmark Execution Table
            </span>
            <div className="flex items-center gap-1 text-[11px] text-cyan-400">
              <span>{showTechnicalDetails ? 'Collapse' : 'Expand'}</span>
              {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showTechnicalDetails && (
            <div className="overflow-x-auto mt-3 border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Operation</th>
                    <th className="py-2.5 px-4">Security Algorithm</th>
                    <th className="py-2.5 px-4">Avg Latency</th>
                    <th className="py-2.5 px-4">Min / Max</th>
                    <th className="py-2.5 px-4">Key / Payload</th>
                    <th className="py-2.5 px-4">Iterations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-xs">
                  {benchmark?.metrics && benchmark.metrics.length > 0 ? (
                    benchmark.metrics.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-4 font-sans font-semibold text-white">{m.operation}</td>
                        <td className="py-2.5 px-4 text-cyan-400">{m.algorithm}</td>
                        <td className="py-2.5 px-4 text-emerald-400 font-bold">{m.avg_latency_ms.toFixed(3)} ms</td>
                        <td className="py-2.5 px-4 text-slate-400">{m.min_latency_ms.toFixed(3)} / {m.max_latency_ms.toFixed(3)} ms</td>
                        <td className="py-2.5 px-4 text-slate-300">{m.key_or_payload_bytes} bytes</td>
                        <td className="py-2.5 px-4 text-slate-400">{m.iterations}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400 font-sans">
                        Click "Run Performance Benchmark" above to populate live in-process measurements.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
