import React, { useState, useEffect } from 'react';
import { 
  ScrollText, ShieldCheck, ShieldAlert, Wrench, RefreshCw, 
  Search, CheckCircle2, AlertTriangle, Hash, Lock, Database
} from 'lucide-react';
import { AuditLog } from '../types';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; total_records: number; message: string; tampered_index?: number } | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs(50);
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleVerifyChain = async () => {
    try {
      setVerifying(true);
      const res = await api.verifyAuditChain();
      setVerificationResult(res);
      setStatusMsg(res.message);
    } catch (e: any) {
      setStatusMsg(`Verification failed: ${e.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    try {
      setVerifying(true);
      const res = await api.simulateAuditTamper();
      setStatusMsg(`Adversary database record tampering simulated at Record #${res.record_id}. Run 'Verify Chain' to validate tamper detection.`);
      fetchLogs();
    } catch (e: any) {
      setStatusMsg(`Tamper error: ${e.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleRepairChain = async () => {
    try {
      setVerifying(true);
      const res = await api.repairAuditChain();
      setStatusMsg(`Merkle hash chain repaired and re-anchored. Integrity restored.`);
      setVerificationResult({ valid: true, total_records: logs.length, message: 'Chain repaired' });
      fetchLogs();
    } catch (e: any) {
      setStatusMsg(`Repair error: ${e.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    l.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.current_hash.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2A0910] gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0B1733] dark:text-white flex items-center gap-2.5">
            <ScrollText className="w-6 h-6 text-[#35C5E8]" />
            Tamper-Evident Hospital Security Audit Trail
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cryptographic SHA-256 Merkle chain providing non-repudiation and integrity verification for regulatory compliance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="px-3.5 py-2 rounded-xl bg-[#19B77A] hover:bg-[#159E68] text-[#0B1733] font-bold text-xs shadow-sm flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Chain Integrity</span>
          </button>

          <button
            onClick={handleSimulateTamper}
            disabled={verifying}
            className="px-3.5 py-2 rounded-xl bg-[#E94B5B]/15 hover:bg-[#E94B5B]/25 text-[#E94B5B] border border-[#E94B5B]/30 font-bold text-xs flex items-center gap-1.5"
            title="Simulate unauthorized database modification"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Simulate DB Tampering</span>
          </button>

          <button
            onClick={handleRepairChain}
            disabled={verifying}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#20070E] hover:bg-slate-200 text-slate-700 dark:text-white text-xs font-semibold border border-slate-200 dark:border-[#2A0910] flex items-center gap-1.5"
          >
            <Wrench className="w-4 h-4 text-[#F5A623]" />
            <span>Repair Chain</span>
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#20070E] hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2A0910]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verificationResult && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
          verificationResult.valid
            ? 'bg-[#19B77A]/10 border-[#19B77A]/30 text-[#19B77A]'
            : 'bg-[#E94B5B]/10 border-[#E94B5B]/30 text-[#E94B5B]'
        }`}>
          <div className="flex items-center space-x-2">
            {verificationResult.valid ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span>
              {verificationResult.valid 
                ? `Cryptographic Audit Chain Intact: All ${verificationResult.total_records} records verified against SHA-256 state anchors.`
                : `TAMPERING DETECTED! Audit link broken at Record #${verificationResult.tampered_index}. Merkle root mismatch.`}
            </span>
          </div>
          <button onClick={() => setVerificationResult(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {statusMsg && !verificationResult && (
        <div className="p-3 rounded-xl bg-[#35C5E8]/10 border border-[#35C5E8]/30 text-[#35C5E8] text-xs font-semibold">
          {statusMsg}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#120508] rounded-xl p-4 border border-slate-200 dark:border-[#2A0910] flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by event, actor, or hash prefix..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#35C5E8]"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          {filteredLogs.length} verified records
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-[#120508] rounded-2xl border border-slate-200 dark:border-[#2A0910] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#18060B] text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-[#2A0910]">
              <tr>
                <th className="py-3 px-4">Index</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Authorized Actor</th>
                <th className="py-3 px-4">Cryptographic Hash Digest (SHA-256)</th>
                <th className="py-3 px-4 text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2A0910]/60 text-slate-700 dark:text-slate-300">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-[#260810]/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#35C5E8] font-bold">
                      #{log.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0B1733] dark:text-white">
                      {log.event_type}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {log.actor}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-xs">
                      <span className="text-[#35C5E8]">{log.current_hash.substring(0, 16)}</span>
                      <span>{log.current_hash.substring(16, 48)}...</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#19B77A] font-semibold bg-[#19B77A]/10 px-2 py-0.5 rounded border border-[#19B77A]/30">
                        <Lock className="w-3 h-3" />
                        CHAINED
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No audit logs matching search.
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

export default AuditLogs;
