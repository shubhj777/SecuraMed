import React, { useState, useEffect } from 'react';
import { 
  HardDriveDownload, ShieldCheck, ShieldAlert, CheckCircle2, 
  XCircle, AlertTriangle, FileCode, RefreshCw, KeyRound, ChevronDown, ChevronUp, Layers
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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getFirmwareHistory();
      setHistory(data);
      const demoPkgs = await api.getDemoPackages();
      setDemoPackages(demoPkgs);
    } catch (e) {
      console.error('Failed to load firmware records:', e);
    } finally {
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
      // Real backend firmware verification call
      const res = await api.verifyFirmware(pkg);
      setActiveDecision(res);
      setStatusMsg(`Firmware evaluation complete. Result: ${res.verification_result}`);
      await fetchHistory();
    } catch (e: any) {
      setStatusMsg(`Error submitting firmware package: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Convert technical verification reason to hospital-friendly explanation
  const getPlainFirmwareExplanation = (rec: FirmwareRecord) => {
    if (rec.verification_result === 'APPROVED') {
      return {
        headline: 'Genuine Firmware Package Approved',
        text: 'Firmware verified successfully. The package is trusted and eligible for the next update stage.',
        type: 'success'
      };
    }
    const r = rec.reason.toLowerCase();
    if (r.includes('tamper') || r.includes('hash mismatch') || rec.integrity_status === 'MISMATCH') {
      return {
        headline: 'Modified Firmware Detected',
        text: 'Warning: This firmware package has been modified. The update has been rejected.',
        type: 'danger'
      };
    }
    if (r.includes('untrusted') || r.includes('rogue') || rec.signature_status === 'UNTRUSTED_KEY') {
      return {
        headline: 'Untrusted Manufacturer Signature',
        text: 'Warning: The firmware was not signed by an authorized manufacturer identity.',
        type: 'warning'
      };
    }
    if (r.includes('rollback') || r.includes('older') || rec.anti_rollback_status === 'ROLLBACK_DETECTED') {
      return {
        headline: 'Older Version Rejected',
        text: 'Warning: This update attempts to install an older software version. The update has been rejected.',
        type: 'warning'
      };
    }
    return {
      headline: 'Firmware Update Rejected',
      text: `Warning: Verification failed. ${rec.reason}`,
      type: 'danger'
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <HardDriveDownload className="w-5 h-5 text-cyan-400" />
            Firmware Protection
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Ensure that medical devices receive only trusted and verified software updates.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          title="Refresh History"
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

      {/* 4 Demonstration Scenarios Cards with Hospital-Friendly Terminology */}
      <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            Controlled Update Verification Tests
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            Validated against Authorized Manufacturer Identities
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Demo 1: Genuine */}
          <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Genuine Package</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">v2.1.0</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Authentic hospital device package signed by authorized manufacturer identity (v2.1.0, Security Level 5).
              </p>
            </div>
            <button
              onClick={() => handleTestDemoPackage('genuine')}
              disabled={loading}
              className="mt-3 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow"
            >
              Verify Genuine Update
            </button>
          </div>

          {/* Demo 2: Tampered Binary */}
          <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 space-y-2 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Modified Package</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono">Altered</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Software update was modified after signing. Gateway file integrity check detects tampering.
              </p>
            </div>
            <button
              onClick={() => handleTestDemoPackage('tampered_binary')}
              disabled={loading}
              className="mt-3 w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow"
            >
              Test Modified Package
            </button>
          </div>

          {/* Demo 3: Untrusted Key */}
          <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Untrusted Signing Key</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">Unauthorized</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Package signed by an unapproved rogue identity not present in the hospital manufacturer trust store.
              </p>
            </div>
            <button
              onClick={() => handleTestDemoPackage('untrusted_key')}
              disabled={loading}
              className="mt-3 w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow"
            >
              Test Untrusted Key
            </button>
          </div>

          {/* Demo 4: Rollback Exploit */}
          <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-2 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Older Version Attempt</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">v1.0.0</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Attempts to downgrade device to an older software version with known vulnerabilities.
              </p>
            </div>
            <button
              onClick={() => handleTestDemoPackage('rollback_exploit')}
              disabled={loading}
              className="mt-3 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow"
            >
              Test Older Version
            </button>
          </div>
        </div>
      </div>

      {/* Active Verification Inspection Result */}
      {activeDecision && (() => {
        const plainExp = getPlainFirmwareExplanation(activeDecision);
        return (
          <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Latest Update Verification Report: {activeDecision.firmware_id}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Device Model: {activeDecision.device_model} &bull; Software Version: {activeDecision.firmware_version}
                </div>
              </div>
              <Badge type={activeDecision.verification_result} />
            </div>

            {/* Plain Language Verdict Banner */}
            <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
              plainExp.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' :
              plainExp.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' :
              'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}>
              <div className="font-bold text-sm flex items-center gap-2">
                {plainExp.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                {plainExp.headline}
              </div>
              <div>{plainExp.text}</div>
            </div>

            {/* 4 Core Verification Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 font-medium">File Integrity</div>
                <div className="mt-1 font-mono"><Badge type={activeDecision.integrity_status} /></div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 font-medium">Digital Signature</div>
                <div className="mt-1 font-mono"><Badge type={activeDecision.signature_status} /></div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 font-medium">Version Compatibility</div>
                <div className="mt-1 font-mono"><Badge type={activeDecision.compatibility_status} /></div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 font-medium">Anti-Rollback Check</div>
                <div className="mt-1 font-mono"><Badge type={activeDecision.anti_rollback_status} /></div>
              </div>
            </div>

            {/* Expandable Technical Details */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white p-2.5 rounded-lg bg-slate-900/60 border border-slate-800"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  View Technical Verification Details
                </span>
                <div className="flex items-center gap-1 text-[11px] text-cyan-400">
                  <span>{showTechnicalDetails ? 'Hide' : 'Show'}</span>
                  {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {showTechnicalDetails && (
                <div className="mt-3 p-3.5 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] space-y-2 text-slate-300">
                  <div><span className="text-slate-500">SHA-256 Digest:</span> <span className="text-cyan-400 break-all">{activeDecision.file_hash}</span></div>
                  <div><span className="text-slate-500">ML-DSA Signature Status:</span> <span className="text-emerald-400">{activeDecision.signature_status} (FIPS 204 Verified)</span></div>
                  <div><span className="text-slate-500">Signing Key ID:</span> <span className="text-amber-300">{activeDecision.signing_key_id}</span></div>
                  <div><span className="text-slate-500">Device Model Compatibility:</span> <span className="text-white">{activeDecision.device_model} ({activeDecision.compatibility_status})</span></div>
                  <div><span className="text-slate-500">Monotonic Security Version:</span> <span className="text-white">{activeDecision.security_version}</span></div>
                  <div><span className="text-slate-500">Anti-Rollback Result:</span> <span className="text-indigo-300">{activeDecision.anti_rollback_status}</span></div>
                  <div className="pt-1">
                    <span className="text-slate-500">Gateway Decision Reason:</span>
                    <div className="text-slate-200 font-sans mt-0.5 bg-slate-900 p-2 rounded border border-slate-800">
                      {activeDecision.reason}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Historical Verification Records Table */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Firmware Verification History</span>
          <span className="text-xs font-mono text-slate-400">{history.length} logged packages</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Firmware Package</th>
                <th className="py-3 px-4">Device Model</th>
                <th className="py-3 px-4">Software Version</th>
                <th className="py-3 px-4">Manufacturer Identity</th>
                <th className="py-3 px-4">File Integrity</th>
                <th className="py-3 px-4">Digital Signature</th>
                <th className="py-3 px-4">Version Compatibility</th>
                <th className="py-3 px-4">Update Approval Status</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {history.map((rec, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 text-cyan-400 font-mono font-bold">{rec.firmware_id}</td>
                  <td className="py-2.5 px-4 font-sans font-medium text-white">{rec.device_model}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-300">{rec.firmware_version}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px] truncate max-w-[120px]" title={rec.signing_key_id}>
                    {rec.signing_key_id}
                  </td>
                  <td className="py-2.5 px-4"><Badge type={rec.integrity_status} /></td>
                  <td className="py-2.5 px-4"><Badge type={rec.signature_status} /></td>
                  <td className="py-2.5 px-4"><Badge type={rec.anti_rollback_status} /></td>
                  <td className="py-2.5 px-4"><Badge type={rec.verification_result} /></td>
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
