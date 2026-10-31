import React, { useState, useEffect } from 'react';
import { ScrollText, ShieldCheck, ShieldAlert, RefreshCw, CheckCircle2, Wrench, Bug } from 'lucide-react';
import { AuditLog } from '../types';
import { api } from '../services/api';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    total_records: number;
    tampered_index: number | null;
    message: string;
  } | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs(50);
      setLogs(data);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleVerifyChain = async () => {
    try {
      setLoading(true);
      const res = await api.verifyAuditChain();
      setVerificationResult(res);
      setStatusMsg(`Chain audit complete: ${res.message}`);
    } catch (e: any) {
      setStatusMsg(`Error verifying audit chain: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateTamper = async () => {
    try {
      setLoading(true);
      const res = await api.simulateAuditTamper();
      setStatusMsg(`Deliberate tamper simulated on record ID ${res.record_id}. Click "Verify Chain Integrity" to demonstrate tamper detection.`);
      await fetchLogs();
    } catch (e: any) {
      setStatusMsg(`Error simulating tamper: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRepairChain = async () => {
    try {
      setLoading(true);
      const res = await api.repairAuditChain();
      setStatusMsg(`Audit chain hashes re-anchored and repaired.`);
      setVerificationResult(null);
      await fetchLogs();
    } catch (e: any) {
      setStatusMsg(`Error repairing chain: ${e.message}`);
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
            <ScrollText className="w-5 h-5 text-cyan-400" />
            Cryptographic Audit Logging & Hash Chaining
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Immutable, SHA-256 hash-chained audit trail. Each record anchors to its predecessor's cryptographic digest.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleVerifyChain}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Chain Integrity</span>
          </button>

          <button
            onClick={handleSimulateTamper}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs border border-rose-500/30 transition-all flex items-center gap-1.5"
            title="Demonstrate that the chain catches unauthorized SQL data changes"
          >
            <Bug className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate DB Tampering</span>
          </button>

          <button
            onClick={handleRepairChain}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>Repair Chain</span>
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 flex items-center justify-between">
          <span>&gt; {statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Verification Banner */}
      {verificationResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          verificationResult.valid 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {verificationResult.valid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <div className="font-bold">
              {verificationResult.valid ? 'CRYPTO HASH CHAIN VERIFIED VALID' : 'AUDIT CHAIN TAMPERING DETECTED!'}
            </div>
            <div className="font-mono text-[11px] leading-relaxed">
              {verificationResult.message}
            </div>
            {verificationResult.tampered_index && (
              <div className="text-rose-400 font-bold font-mono text-xs">
                Flagged Corrupted Record ID: #{verificationResult.tampered_index}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Monotonically Hash-Linked Audit Records ({logs.length})</span>
          <span className="text-[10px] font-mono text-slate-400">Genesis: 0000000000000000...</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4"># ID</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Payload Data</th>
                <th className="py-3 px-4">Previous Hash</th>
                <th className="py-3 px-4">Current Hash (SHA-256)</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.map((log) => {
                const isTampered = verificationResult && !verificationResult.valid && verificationResult.tampered_index === log.id;
                return (
                  <tr key={log.id} className={`transition-colors ${isTampered ? 'bg-rose-950/40 border border-rose-500' : 'hover:bg-slate-800/30'}`}>
                    <td className="py-2.5 px-4 font-bold text-cyan-400">#{log.id}</td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-white">{log.event_type}</td>
                    <td className="py-2.5 px-4 text-cyan-300">{log.actor}</td>
                    <td className="py-2.5 px-4 text-slate-400 max-w-xs truncate" title={log.event_data}>
                      {log.event_data}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400" title={log.previous_hash}>
                      {log.previous_hash.substring(0, 10)}...
                    </td>
                    <td className="py-2.5 px-4 font-bold text-emerald-400" title={log.current_hash}>
                      {log.current_hash.substring(0, 10)}...
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
