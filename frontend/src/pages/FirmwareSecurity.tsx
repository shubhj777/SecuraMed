import React, { useState, useEffect } from 'react';
import { 
  HardDriveDownload, ShieldCheck, ShieldAlert, CheckCircle2, 
  XCircle, AlertTriangle, FileCode, Upload, RefreshCw, KeyRound 
} from 'lucide-react';
import { FirmwareRecord } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

export const FirmwareSecurity: React.FC = () => {
  const [history, setHistory] = useState<FirmwareRecord[]>([]);
  const [demoPackages, setDemoPackages] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeDecision, setActiveDecision] = useState<FirmwareRecord | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getFirmwareHistory();
      setHistory(data);
      const demoPkgs = await api.getDemoPackages();
      setDemoPackages(demoPkgs);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleTestDemoPackage = async (typeKey: string) => {
    if (!demoPackages || !demoPackages[typeKey]) return;
    try {
      setLoading(true);
      setActiveDecision(null);
      setStatusMsg(null);
      const pkg = demoPackages[typeKey];
      const res = await api.verifyFirmware(pkg);
      setActiveDecision(res);
      setStatusMsg(`Firmware package evaluated: ${res.verification_result} - ${res.reason}`);
      await fetchHistory();
    } catch (e: any) {
      setStatusMsg(`Error submitting firmware: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <HardDriveDownload className="w-5 h-5 text-cyan-400" />
            Secure Medical Firmware Verification Module
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Cryptographic SHA-256 hash checking, ML-DSA-65 (NIST FIPS 204) manufacturer signature verification, device model compatibility matching, and anti-rollback monotonic enforcement.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 flex items-center justify-between">
          <span>&gt; {statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* 4 Demonstration Scenarios Cards */}
      <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            Hackathon Verification Scenarios (Real PQC Validation)
          </h2>
          <span className="text-[10px] font-mono text-slate-400">Signed with Authorized ML-DSA-65 Manufacturer Key</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Demo 1: Genuine */}
          <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Genuine Firmware</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">v2.1.0</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Authentic manufacturer package signed with authorized key FIRMWARE-KEY-01 (Security Version 5).
              </p>
            </div>
            <button
              onClick={() => handleTestDemoPackage('genuine')}
              disabled={loading}
              className="mt-3 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow"
            >
              Verify Genuine (Expected: APPROVED)
            </button>
          </div>

          {/* Demo 2: Tampered Binary */}
          <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Tampered Binary</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono">Corrupted</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Adversary flipped 1 byte in firmware.bin while keeping original manifest.
              </p>
            </div>
            <button
              onClick={() => handleTestDemoPackage('tampered_binary')}
              disabled={loading}
              className="mt-3 w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow"
            >
              Verify Tampered (Expected: REJECTED)
            </button>
          </div>

          {/* Demo 3: Untrusted Key */}
          <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Untrusted Key</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">Rogue Key</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Validly structured package signed by unauthorized adversary key ROGUE-ADVERSARY-KEY-99.
              </p>
            </div>
            <button
              onClick={() => handleTestDemoPackage('untrusted_key')}
              disabled={loading}
              className="mt-3 w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow"
            >
              Verify Rogue Key (Expected: REJECTED)
            </button>
          </div>

          {/* Demo 4: Rollback Exploit */}
          <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Anti-Rollback Downgrade</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">v1.0.0</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Legitimate older version 1 attempting to overwrite currently active security version 5.
              </p>
            </div>
            <button
              onClick={() => handleTestDemoPackage('rollback_exploit')}
              disabled={loading}
              className="mt-3 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow"
            >
              Verify Downgrade (Expected: REJECTED)
            </button>
          </div>
        </div>
      </div>

      {/* Active Verification Inspection Result */}
      {activeDecision && (
        <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Latest Verification Audit Report: {activeDecision.firmware_id}
            </h3>
            <Badge type={activeDecision.verification_result} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">SHA-256 Integrity</div>
              <div className="mt-1"><Badge type={activeDecision.integrity_status} /></div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">ML-DSA-65 Signature</div>
              <div className="mt-1"><Badge type={activeDecision.signature_status} /></div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">Model Compatibility</div>
              <div className="mt-1"><Badge type={activeDecision.compatibility_status} /></div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">Anti-Rollback Check</div>
              <div className="mt-1"><Badge type={activeDecision.anti_rollback_status} /></div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="text-slate-400 font-semibold mb-1">Decision Reason:</div>
            <div className={`font-mono ${activeDecision.verification_result === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {activeDecision.reason}
            </div>
          </div>
        </div>
      )}

      {/* Historical Verification Records Table */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Firmware Verification History</span>
          <span className="text-xs font-mono text-slate-400">{history.length} records logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Firmware ID</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Security Ver</th>
                <th className="py-3 px-4">Integrity</th>
                <th className="py-3 px-4">Signature</th>
                <th className="py-3 px-4">Anti-Rollback</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {history.map((rec, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 text-cyan-400 font-bold">{rec.firmware_id}</td>
                  <td className="py-2.5 px-4 font-sans">{rec.device_model}</td>
                  <td className="py-2.5 px-4 text-slate-200">{rec.firmware_version}</td>
                  <td className="py-2.5 px-4">{rec.security_version}</td>
                  <td className="py-2.5 px-4"><Badge type={rec.integrity_status} /></td>
                  <td className="py-2.5 px-4"><Badge type={rec.signature_status} /></td>
                  <td className="py-2.5 px-4"><Badge type={rec.anti_rollback_status} /></td>
                  <td className="py-2.5 px-4"><Badge type={rec.verification_result} /></td>
                  <td className="py-2.5 px-4 text-slate-400">{new Date(rec.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
