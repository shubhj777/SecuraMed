import React, { useState, useEffect } from 'react';
import { ScrollText, ShieldCheck, ShieldAlert, RefreshCw, CheckCircle2, Wrench, Bug, Clock, UserCheck, Shield } from 'lucide-react';
import { AuditLog } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

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
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    } finally {
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
      setStatusMsg(`Deliberate tamper simulated on record ID #${res.record_id}. Click "Verify Chain Integrity" to demonstrate tamper detection.`);
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

  // Helper to parse event data for hospital presentation
  const parseEventDetails = (eventDataStr: string, eventType: string) => {
    try {
      const parsed = JSON.parse(eventDataStr);
      const action = parsed.action || parsed.reason || parsed.event || eventType.replace(/_/g, ' ');
      const prevStatus = parsed.previous_status || parsed.old_status || (parsed.previous_hash ? 'Anchored' : 'Initial');
      const result = parsed.result || 'RECORDED';
      return { action, prevStatus, result, raw: parsed };
    } catch {
      return { action: eventType.replace(/_/g, ' '), prevStatus: 'Anchored', result: 'RECORDED', raw: eventDataStr };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-cyan-400" />
            Audit Logs & Cryptographic Accountability
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Immutable, SHA-256 hash-chained hospital audit trail guaranteeing compliance and tamper-evident logging for all gateway actions.
          </p>
        </div>

        {/* Action Controls */}
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
            title="Demonstrate that the chain catches unauthorized database tampering"
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
            title="Refresh Logs"
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

      {/* Verification Result Banner */}
      {verificationResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-md ${
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
            <div className="font-bold text-sm">
              {verificationResult.valid ? 'AUDIT LOG INTEGRITY VERIFIED — CHAIN INTACT' : 'AUDIT CHAIN TAMPERING DETECTED!'}
            </div>
            <div className="text-xs leading-relaxed">
              {verificationResult.message}
            </div>
            {verificationResult.tampered_index && (
              <div className="text-rose-400 font-bold font-mono text-xs">
                Flagged Compromised Record ID: #{verificationResult.tampered_index}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Logs Table with Required Hospital Display Fields */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">
            Hash-Chained Medical Audit Records ({logs.length})
          </span>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Cryptographic Proof Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">User / Device Responsible</th>
                <th className="py-3 px-4">Action Performed</th>
                <th className="py-3 px-4">Previous Status</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Integrity Status</th>
                <th className="py-3 px-4">Hash Digest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.map((log) => {
                const details = parseEventDetails(log.event_data, log.event_type);
                const isTampered = verificationResult && !verificationResult.valid && verificationResult.tampered_index === log.id;
                
                return (
                  <tr 
                    key={log.id} 
                    className={`transition-colors ${isTampered ? 'bg-rose-950/40 border border-rose-500' : 'hover:bg-slate-800/30'}`}
                  >
                    {/* Date & Time */}
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    {/* User / Device Responsible */}
                    <td className="py-3 px-4 font-semibold text-cyan-300 font-mono">
                      {log.actor || 'SYSTEM'}
                    </td>

                    {/* Action Performed */}
                    <td className="py-3 px-4 font-medium text-white max-w-xs">
                      <div className="font-semibold text-slate-200 capitalize">{details.action}</div>
                      <div className="text-[10px] font-mono text-slate-400 truncate" title={log.event_data}>
                        {log.event_type}
                      </div>
                    </td>

                    {/* Previous Status */}
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {details.prevStatus}
                      </span>
                    </td>

                    {/* Result */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {details.result}
                      </span>
                    </td>

                    {/* Integrity Verification Status */}
                    <td className="py-3 px-4">
                      {isTampered ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          TAMPERED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          VERIFIED
                        </span>
                      )}
                    </td>

                    {/* Hash Digest */}
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]" title={`Current Hash: ${log.current_hash}\nPrev Hash: ${log.previous_hash}`}>
                      <span className="text-emerald-400 font-semibold">{log.current_hash.substring(0, 8)}...</span>
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
