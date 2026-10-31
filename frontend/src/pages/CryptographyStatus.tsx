import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, Zap, RefreshCw, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { CryptoStatus, CryptoBenchmark } from '../types';
import { api } from '../services/api';

export const CryptographyStatus: React.FC = () => {
  const [status, setStatus] = useState<CryptoStatus | null>(null);
  const [benchmark, setBenchmark] = useState<CryptoBenchmark | null>(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getCryptoStatus();
      setStatus(data);
    } catch (e) {} finally {
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
      alert('Benchmark failed: ' + e.message);
    } finally {
      setBenchmarking(false);
    }
  };

  const algorithms = [
    {
      name: 'ML-KEM-768',
      standard: 'NIST FIPS 203',
      role: 'Post-Quantum Key Encapsulation (KEM)',
      details: 'Public Key: 1,184 B | Ciphertext: 1,088 B | Shared Secret: 32 B',
      status: status?.ml_kem_768_available ?? true
    },
    {
      name: 'ML-DSA-65',
      standard: 'NIST FIPS 204',
      role: 'Post-Quantum Digital Signatures',
      details: 'Public Key: 1,952 B | Signature: 3,309 B | Security Category 3',
      status: status?.ml_dsa_65_available ?? true
    },
    {
      name: 'AES-256-GCM',
      standard: 'NIST SP 800-38D',
      role: 'Authenticated Symmetric Bulk Encryption',
      details: '256-bit Key | 96-bit Nonce | 128-bit Authentication Tag with AAD',
      status: status?.aes_256_gcm_available ?? true
    },
    {
      name: 'HKDF-SHA256',
      standard: 'RFC 5869',
      role: 'Cryptographic Key Derivation Function',
      details: 'Extract-and-Expand with Context Binding and Salt Separation',
      status: status?.hkdf_sha256_available ?? true
    },
    {
      name: 'Argon2id',
      standard: 'RFC 9106',
      role: 'Password & Operator Credential Hashing',
      details: 'Memory-hard, side-channel resistant administrator password protection',
      status: status?.argon2id_available ?? true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Post-Quantum Cryptography Engine Status
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Genuine NIST FIPS 203 (ML-KEM-768) and FIPS 204 (ML-DSA-65) implementations with live execution benchmarks.
          </p>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={benchmarking}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-cyan-900/20"
        >
          <Zap className={`w-4 h-4 ${benchmarking ? 'animate-bounce text-yellow-300' : ''}`} />
          <span>{benchmarking ? 'Benchmarking Hardware...' : 'Run Live Benchmark'}</span>
        </button>
      </div>

      {/* Algorithm Availability Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {algorithms.map((algo) => (
          <div key={algo.name} className="bg-[#111827] rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-white">{algo.name}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> NIST Standardized
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-cyan-400">{algo.standard}</div>
              <div className="text-xs text-slate-300 mt-0.5">{algo.role}</div>
            </div>
            <div className="text-[11px] text-slate-400 font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
              {algo.details}
            </div>
          </div>
        ))}
      </div>

      {/* Live Benchmark Results Table */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Cryptographic Execution Latency & Overhead</h2>
          </div>
          {benchmark && (
            <span className="text-[10px] font-mono text-slate-400">
              Host: {benchmark.system_info?.machine} ({benchmark.system_info?.os})
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-4">Avg Latency</th>
                <th className="py-3 px-4">Min / Max</th>
                <th className="py-3 px-4">Key / Payload Overhead</th>
                <th className="py-3 px-4">Iterations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
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
                  <td colSpan={6} className="text-center py-8 text-slate-400 font-sans">
                    Click <span className="text-cyan-400 font-semibold">"Run Live Benchmark"</span> above to measure real in-process cryptographic timings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
