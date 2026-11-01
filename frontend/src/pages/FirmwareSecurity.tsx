import React, { useState, useEffect } from 'react';
import { 
  HardDriveDownload, ShieldCheck, ShieldAlert, CheckCircle2, 
  XCircle, FileCode, Key, ArrowDownCircle, RefreshCw, AlertTriangle, Eye
} from 'lucide-react';
import { FirmwareRecord } from '../types';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

export const FirmwareSecurity: React.FC = () => {
  const [history, setHistory] = useState<FirmwareRecord[]>([]);
  const [demoPackages, setDemoPackages] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDecision, setActiveDecision] = useState<FirmwareRecord | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [hist, demos] = await Promise.all([
        api.getFirmwareHistory(),
        api.getDemoPackages()
      ]);
      setHistory(hist);
      setDemoPackages(demos);
      if (hist.length > 0 && !activeDecision) {
        setActiveDecision(hist[0]);
      }
    } catch (e) {
      console.error('Failed to load firmware history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleTestPackage = async (type: 'genuine' | 'tampered_binary' | 'untrusted_key' | 'rollback_exploit') => {
    if (!demoPackages || !demoPackages[type]) return;
    try {
      setVerifying(true);
      const pkg = demoPackages[type];
      const res = await api.verifyFirmware(pkg);
      setActiveDecision(res);
      setStatusMsg(`Verification complete: ${res.verification_result} - ${res.reason}`);
      fetchHistory();
    } catch (e: any) {
      setStatusMsg(`Verification error: ${e.message}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2A0910] gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0B1733] dark:text-white flex items-center gap-2.5">
            <HardDriveDownload className="w-6 h-6 text-[#19B77A]" />
            Medical Device Firmware Integrity & Anti-Rollback Defense
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pre-flash cryptographic validation enforcing ML-DSA-65 signatures, SHA-256 integrity, and monotonic version counters.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#20070E] hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2A0910] self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#35C5E8]' : ''}`} />
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-[#35C5E8]/10 border border-[#35C5E8]/30 text-[#35C5E8] text-xs font-semibold">
          {statusMsg}
        </div>
      )}

      {/* 4 Demo Testing Scenarios */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          Run 1-Click Firmware Verification Scenarios:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Genuine */}
          <button
            onClick={() => handleTestPackage('genuine')}
            disabled={verifying}
            className="p-4 rounded-xl border border-slate-200 dark:border-[#2A0910] bg-white dark:bg-[#120508] hover:border-[#19B77A] text-left transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#19B77A]/15 text-[#19B77A]">
                VALID PACKAGE
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#19B77A]" />
            </div>
            <div className="font-bold text-xs text-[#0B1733] dark:text-white">Genuine Firmware v2.1.0</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Authorized manufacturer key, intact hash, compatible hardware.
            </p>
          </button>

          {/* Tampered */}
          <button
            onClick={() => handleTestPackage('tampered_binary')}
            disabled={verifying}
            className="p-4 rounded-xl border border-slate-200 dark:border-[#2A0910] bg-white dark:bg-[#120508] hover:border-[#E94B5B] text-left transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#E94B5B]/15 text-[#E94B5B]">
                TAMPERED BINARY
              </span>
              <XCircle className="w-4 h-4 text-[#E94B5B]" />
            </div>
            <div className="font-bold text-xs text-[#0B1733] dark:text-white">Modified Firmware Binary</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Payload altered by attacker. SHA-256 hash check fails immediately.
            </p>
          </button>

          {/* Untrusted Key */}
          <button
            onClick={() => handleTestPackage('untrusted_key')}
            disabled={verifying}
            className="p-4 rounded-xl border border-slate-200 dark:border-[#2A0910] bg-white dark:bg-[#120508] hover:border-[#E94B5B] text-left transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E94B5B]/15 text-[#E94B5B]">
                ROGUE SIGNER
              </span>
              <Key className="w-4 h-4 text-[#E94B5B]" />
            </div>
            <div className="font-bold text-xs text-[#0B1733] dark:text-white">Untrusted Signing Key</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Signed with unauthorized private key. Certificate rejected.
            </p>
          </button>

          {/* Rollback Exploit */}
          <button
            onClick={() => handleTestPackage('rollback_exploit')}
            disabled={verifying}
            className="p-4 rounded-xl border border-slate-200 dark:border-[#2A0910] bg-white dark:bg-[#120508] hover:border-[#F5A623] text-left transition-all space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F5A623]/15 text-[#F5A623]">
                VERSION ROLLBACK
              </span>
              <ArrowDownCircle className="w-4 h-4 text-[#F5A623]" />
            </div>
            <div className="font-bold text-xs text-[#0B1733] dark:text-white">Older Vulnerable Version</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Attacker attempts downgrade attack. Monotonic counter blocks.
            </p>
          </button>
        </div>
      </div>

      {/* Active Decision Breakdown */}
      {activeDecision && (
        <div className="bg-white dark:bg-[#120508] rounded-2xl border border-slate-200 dark:border-[#2A0910] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2A0910]">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                Verification Report: {activeDecision.firmware_id}
              </span>
              <h3 className="text-base font-bold text-[#0B1733] dark:text-white mt-0.5">
                Model: {activeDecision.device_model} (v{activeDecision.firmware_version})
              </h3>
            </div>
            <Badge type={activeDecision.verification_result} size="lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            {/* Pillar 1: Integrity */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] space-y-1">
              <span className="text-slate-400 text-[10px]">1. Binary Integrity</span>
              <div className="font-bold text-slate-800 dark:text-white">{activeDecision.integrity_status}</div>
              <div className="text-[10px] text-slate-400">SHA-256 Digest</div>
            </div>

            {/* Pillar 2: Digital Signature */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] space-y-1">
              <span className="text-slate-400 text-[10px]">2. Digital Signature</span>
              <div className="font-bold text-slate-800 dark:text-white">{activeDecision.signature_status}</div>
              <div className="text-[10px] text-slate-400">ML-DSA-65 Validated</div>
            </div>

            {/* Pillar 3: Compatibility */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] space-y-1">
              <span className="text-slate-400 text-[10px]">3. Hardware Profile</span>
              <div className="font-bold text-slate-800 dark:text-white">{activeDecision.compatibility_status}</div>
              <div className="text-[10px] text-slate-400">OEM Model Match</div>
            </div>

            {/* Pillar 4: Anti-Rollback */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] space-y-1">
              <span className="text-slate-400 text-[10px]">4. Anti-Rollback Protection</span>
              <div className="font-bold text-slate-800 dark:text-white">{activeDecision.anti_rollback_status}</div>
              <div className="text-[10px] text-slate-400">Counter: #{activeDecision.security_version}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-xs">
            <span className="text-slate-400 font-mono text-[11px] font-bold">Cryptographic Evaluation Verdict:</span>
            <div className="font-medium text-slate-800 dark:text-white mt-0.5">
              {activeDecision.reason}
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white dark:bg-[#120508] rounded-2xl border border-slate-200 dark:border-[#2A0910] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-[#2A0910] font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
          Historical Firmware Verification Audits
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#18060B] text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-[#2A0910]">
              <tr>
                <th className="py-3 px-4">Firmware ID</th>
                <th className="py-3 px-4">Device Model</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Anti-Rollback Counter</th>
                <th className="py-3 px-4">Integrity Hash</th>
                <th className="py-3 px-4">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2A0910]/60 text-slate-700 dark:text-slate-300">
              {history.map((rec) => (
                <tr 
                  key={rec.firmware_id} 
                  onClick={() => setActiveDecision(rec)}
                  className="hover:bg-slate-50 dark:hover:bg-[#260810]/40 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono font-bold text-[#35C5E8]">
                    {rec.firmware_id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#0B1733] dark:text-white">
                    {rec.device_model}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    v{rec.firmware_version}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    #{rec.security_version}
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-xs">
                    {rec.file_hash.substring(0, 16)}...
                  </td>
                  <td className="py-3 px-4">
                    <Badge type={rec.verification_result} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FirmwareSecurity;
