import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Radio, Activity, Lock, 
  ArrowUpRight, AlertTriangle, CheckCircle2, HardDriveDownload,
  Server, Clock, Info, X, ShieldX, RefreshCw
} from 'lucide-react';
import { SecurityStats, SecurityEvent } from '../types';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { formatEventToHospitalLanguage } from '../utils/securityLanguage';

interface OverviewProps {
  stats: SecurityStats | null;
  onNavigate: (page: string) => void;
}

interface GatewayHealthData {
  status: string;
  gateway_id: string;
  uptime_seconds?: number;
  timestamp: string;
  error?: string;
}

export const Overview: React.FC<OverviewProps> = ({ stats, onNavigate }) => {
  const [health, setHealth] = useState<GatewayHealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const fetchHealth = async () => {
    try {
      setHealthLoading(true);
      const data = await api.getHealth();
      setHealth(data);
    } catch (e: any) {
      setHealth({
        status: 'OFFLINE',
        gateway_id: 'SECUREMED-GW-01',
        timestamp: new Date().toISOString(),
        error: e.message || 'Cannot reach gateway backend'
      });
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return 'Available';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  };

  // Determine Gateway Health Status
  const getGatewayStatus = () => {
    if (!health || health.status === 'OFFLINE') {
      return { label: 'Offline', color: 'rose', badge: 'CRITICAL', desc: 'Backend service unreachable' };
    }
    if ((stats?.suspicious_devices ?? 0) > 0 || (stats?.firmware_failures ?? 0) > 2) {
      return { label: 'Warning', color: 'amber', badge: 'WARNING', desc: 'Suspicious devices or firmware alerts detected' };
    }
    if (health.status === 'HEALTHY') {
      return { label: 'Operational', color: 'emerald', badge: 'OPERATIONAL', desc: 'All gateway defense systems operational' };
    }
    return { label: 'Operational', color: 'emerald', badge: 'OPERATIONAL', desc: 'Normal operation' };
  };

  const gatewayStatus = getGatewayStatus();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 p-6 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium mb-3 border border-red-500/20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Hospital Healthcare Device Protection
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Hospital Security Overview</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Monitor connected medical devices, communication security, firmware integrity and potential cyber threats across your hospital network.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('attacks')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs shadow-lg shadow-rose-900/30 transition-all flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Security Testing Lab</span>
            </button>
            <button
              onClick={() => onNavigate('telemetry')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Device Monitoring</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gateway Health Indicator Card */}
      <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              gatewayStatus.color === 'emerald' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
              gatewayStatus.color === 'amber' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' :
              'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Gateway Security Node</span>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  {health?.gateway_id || 'SECUREMED-GW-01'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{gatewayStatus.desc}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              gatewayStatus.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
              gatewayStatus.color === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
              'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                gatewayStatus.color === 'emerald' ? 'bg-emerald-400 animate-pulse' :
                gatewayStatus.color === 'amber' ? 'bg-amber-400' : 'bg-rose-400'
              }`}></span>
              Status: {gatewayStatus.label}
            </span>
            <button
              onClick={fetchHealth}
              disabled={healthLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Refresh Gateway Health"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Health Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <div className="text-slate-400 font-medium">Gateway Uptime</div>
            <div className="text-base font-bold text-slate-200 mt-1 font-mono">
              {formatUptime(health?.uptime_seconds)}
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 inline" /> Continuous Service
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <div className="text-slate-400 font-medium">Last Health Check</div>
            <div className="text-base font-bold text-slate-200 mt-1 font-mono">
              {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Pending'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Automated Heartbeat</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <div className="text-slate-400 font-medium">Active Device Connections</div>
            <div className="text-base font-bold text-cyan-400 mt-1 font-mono">
              {stats?.active_sessions ?? 0}
            </div>
            <div className="text-[11px] text-cyan-300/80 mt-0.5">Protected Sessions</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <div className="text-slate-400 font-medium">Recent Comm Failures</div>
            <div className="text-base font-bold mt-1 font-mono text-amber-400">
              {stats?.failed_auth_attempts ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Intercepted & Defended</div>
          </div>
        </div>
      </div>

      {/* Main Statistics Cards (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Registered Devices */}
        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered Devices</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">{stats?.total_devices ?? 0}</div>
            <div className="text-[11px] text-slate-400 mt-1 leading-snug">All registered medical devices</div>
          </div>
        </div>

        {/* Card 2: Protected Devices */}
        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Protected Devices</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 font-mono">{stats?.online_devices ?? 0}</div>
            <div className="text-[11px] text-emerald-400/90 mt-1 leading-snug">
              {stats?.online_devices ?? 0} devices currently verified
            </div>
          </div>
        </div>

        {/* Card 3: Threats Blocked */}
        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Threats Blocked</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-400 font-mono">{stats?.attacks_blocked ?? 0}</div>
            <div className="text-[11px] text-slate-400 mt-1 leading-snug">Potential cyber threats prevented</div>
          </div>
        </div>

        {/* Card 4: Active Secure Connections */}
        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Active Secure Connections</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-cyan-400 font-mono">{stats?.active_sessions ?? 0}</div>
            <div className="text-[11px] text-slate-400 mt-1 leading-snug">Devices communicating securely</div>
          </div>
        </div>

        {/* Card 5: Firmware Verification Failures / Alerts */}
        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Firmware Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <HardDriveDownload className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-400 font-mono">{stats?.firmware_failures ?? 0}</div>
            <div className="text-[11px] text-slate-400 mt-1 leading-snug">
              {(stats?.firmware_failures ?? 0) === 1
                ? 'One firmware package requires attention'
                : (stats?.firmware_failures ?? 0) > 1
                ? `${stats?.firmware_failures} packages require attention`
                : 'All firmware verified authentic'}
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Security Capabilities Quick Nav */}
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
          <h3 className="font-bold text-white text-base mt-3">Secure Connection</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Protected device sessions establishing quantum-resistant keys and encrypted communication across hospital networks.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-cyan-400">
            <span>5-Stage Protection Active &rarr;</span>
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
          <h3 className="font-bold text-white text-base mt-3">Firmware Protection</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Verifies manufacturer authenticity and protects against older or modified software versions before updates install.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-400">
            <span>Protection Against Older Firmware &rarr;</span>
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
          <h3 className="font-bold text-white text-base mt-3">Security Testing Lab</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Controlled security tests to evaluate how the gateway protects connected medical devices against cyber threats.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-rose-400">
            <span>6 Threat Scenarios &rarr;</span>
          </div>
        </div>
      </div>

      {/* Recent Security Activity Table (Renamed from Recent Gateway Security Events) */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Recent Security Activity</h2>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="text-xs text-cyan-400 hover:underline font-medium"
          >
            View All Activity &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Time</th>
                <th className="py-2.5 px-4">Device</th>
                <th className="py-2.5 px-4">Security Event</th>
                <th className="py-2.5 px-4">Severity</th>
                <th className="py-2.5 px-4">Action Taken</th>
                <th className="py-2.5 px-4">Current Status</th>
                <th className="py-2.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {stats?.recent_events && stats.recent_events.length > 0 ? (
                stats.recent_events.slice(0, 6).map((evt) => {
                  const friendly = formatEventToHospitalLanguage(evt.event_type, evt.attack_type, evt.result, evt.reason);
                  return (
                    <tr 
                      key={evt.id} 
                      onClick={() => setSelectedEvent(evt)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-cyan-300">
                        {evt.device_id || 'GATEWAY'}
                      </td>
                      <td className="py-3 px-4 font-medium text-white max-w-xs">
                        <div className="font-semibold text-slate-200">{friendly.friendlyTitle}</div>
                        <div className="text-[11px] text-slate-400 truncate">{friendly.plainReason}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge type={evt.severity} />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          friendly.actionColor === 'rose' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          friendly.actionColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {friendly.actionTaken}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge type={evt.result} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors border border-slate-700 group-hover:border-cyan-500/30"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No security events recorded yet. Connect devices or run a controlled test in the Security Testing Lab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Modal for Hospital Administrators & Technical Personnel */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-cyan-400" />
                  Security Activity Details
                </h3>
                <div className="text-xs font-mono text-cyan-400 mt-0.5">
                  ID: {selectedEvent.event_id}
                </div>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-slate-400 font-medium">Hospital-Friendly Explanation:</div>
                <div className="text-slate-100 font-semibold text-sm">
                  {formatEventToHospitalLanguage(selectedEvent.event_type, selectedEvent.attack_type, selectedEvent.result, selectedEvent.reason).friendlyTitle}
                </div>
                <div className="text-slate-300 text-xs leading-relaxed">
                  {formatEventToHospitalLanguage(selectedEvent.event_type, selectedEvent.attack_type, selectedEvent.result, selectedEvent.reason).plainReason}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Medical Device</div>
                  <div className="text-white font-bold mt-0.5">{selectedEvent.device_id || 'GATEWAY'}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Timestamp</div>
                  <div className="text-white mt-0.5">{new Date(selectedEvent.timestamp).toLocaleString()}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Severity</div>
                  <div className="mt-1"><Badge type={selectedEvent.severity} /></div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Gateway Outcome</div>
                  <div className="mt-1"><Badge type={selectedEvent.result} /></div>
                </div>
              </div>

              {/* Technical Security Evidence (Expandable for Technical Personnel) */}
              <div className="p-3 rounded-xl bg-black/40 border border-slate-800 text-[11px] space-y-1.5 font-mono">
                <div className="text-slate-400 font-sans font-semibold text-xs">Technical Forensic Details:</div>
                <div><span className="text-slate-400">Event Code:</span> <span className="text-cyan-300">{selectedEvent.event_type}</span></div>
                <div><span className="text-slate-400">Threat Scenario:</span> <span className="text-rose-300">{selectedEvent.attack_type}</span></div>
                <div><span className="text-slate-400">Detection Engine:</span> <span className="text-emerald-400">{selectedEvent.detection_module}</span></div>
                <div className="pt-1">
                  <span className="text-slate-400">Raw Cryptographic Reason:</span>
                  <div className="text-slate-300 mt-1 font-sans text-xs bg-slate-900 p-2 rounded border border-slate-800">
                    {selectedEvent.reason}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
