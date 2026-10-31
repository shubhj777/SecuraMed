import React from 'react';
import { 
  ShieldCheck, ShieldAlert, Radio, Activity, Cpu, 
  ArrowUpRight, AlertTriangle, CheckCircle2, Lock 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { SecurityStats } from '../types';
import { Badge } from '../components/Badge';

interface OverviewProps {
  stats: SecurityStats | null;
  onNavigate: (page: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ stats, onNavigate }) => {
  const attackChartData = [
    { name: 'Impersonation', count: 4 },
    { name: 'Tampering', count: 6 },
    { name: 'Replay', count: 8 },
    { name: 'Unauth Cmd', count: 3 },
    { name: 'Firmware', count: 5 },
    { name: 'Flooding', count: 7 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950/40 p-6 border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono mb-3 border border-cyan-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Post-Quantum Active Defense Engine
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">SecureMed Gateway Overview</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              NIST-standardized post-quantum cybersecurity gateway safeguarding connected medical device communication, firmware integrity, and clinical telemetry.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('attacks')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs shadow-lg shadow-rose-900/30 transition-all flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Launch Attack Lab</span>
            </button>
            <button
              onClick={() => onNavigate('telemetry')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Live Telemetry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Registered Devices</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{stats?.total_devices ?? 0}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {stats?.online_devices ?? 0} Online & Protected
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Radio className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Attacks Blocked</div>
            <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">
              {stats?.attacks_blocked ?? 0} <span className="text-xs text-slate-400 font-normal">/ {stats?.total_attacks_simulated ?? 0}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">100% Mitigated at Gateway</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Active PQC Sessions</div>
            <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">{stats?.active_sessions ?? 0}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">ML-KEM-768 Ephemeral Keys</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Lock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Firmware Failures</div>
            <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">{stats?.firmware_failures ?? 0}</div>
            <div className="text-[11px] text-slate-400 mt-1">Anti-Rollback & Signatures Enforced</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Core Defense Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div 
          onClick={() => onNavigate('communication')}
          className="bg-[#111827] rounded-xl p-5 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          </div>
          <h3 className="font-bold text-white text-base mt-3">Post-Quantum Key Establishment</h3>
          <p className="text-xs text-slate-400 mt-1">
            Authenticated handshake binding ML-DSA-65 proof-of-possession with ML-KEM-768 shared secrets and AES-256-GCM.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span>FIPS 203 + FIPS 204</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('firmware')}
          className="bg-[#111827] rounded-xl p-5 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
          </div>
          <h3 className="font-bold text-white text-base mt-3">Secure Firmware Verification</h3>
          <p className="text-xs text-slate-400 mt-1">
            Validates canonical manifest SHA-256 hashes, verified ML-DSA-65 manufacturer signatures, and anti-rollback monotonic versions.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span>Anti-Rollback Active</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('attacks')}
          className="bg-[#111827] rounded-xl p-5 border border-slate-800 hover:border-rose-500/40 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
          </div>
          <h3 className="font-bold text-white text-base mt-3">Attack Simulation Lab</h3>
          <p className="text-xs text-slate-400 mt-1">
            Interactive test lab triggering real backend cryptographic verification against impersonation, tampering, replay, and flooding.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-mono text-rose-400">
            <span>6 Controlled Attack Vectors</span>
          </div>
        </div>
      </div>

      {/* Recent Security Events Table */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Recent Gateway Security Events</h2>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="text-xs text-cyan-400 hover:underline font-medium"
          >
            View All Events &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Event ID</th>
                <th className="py-2.5 px-4">Event Type</th>
                <th className="py-2.5 px-4">Device</th>
                <th className="py-2.5 px-4">Severity</th>
                <th className="py-2.5 px-4">Result</th>
                <th className="py-2.5 px-4">Reason</th>
                <th className="py-2.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {stats?.recent_events && stats.recent_events.length > 0 ? (
                stats.recent_events.slice(0, 6).map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-cyan-400">{evt.event_id}</td>
                    <td className="py-2.5 px-4 font-semibold">{evt.event_type}</td>
                    <td className="py-2.5 px-4 font-mono">{evt.device_id || 'GATEWAY'}</td>
                    <td className="py-2.5 px-4"><Badge type={evt.severity} /></td>
                    <td className="py-2.5 px-4"><Badge type={evt.result} /></td>
                    <td className="py-2.5 px-4 text-slate-400 max-w-xs truncate">{evt.reason}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    No security events recorded yet. Run an attack or stream telemetry to generate events.
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
