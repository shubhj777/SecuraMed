import React, { useState, useEffect } from 'react';
import { AlertTriangle, Filter, RefreshCw, ShieldAlert, Search } from 'lucide-react';
import { SecurityEvent } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

export const SecurityEvents: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getSecurityEvents(100);
      setEvents(data);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filtered = events.filter(evt => {
    if (severityFilter !== 'ALL' && evt.severity !== severityFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = evt.event_id.toLowerCase().includes(term);
      const matchType = evt.event_type.toLowerCase().includes(term);
      const matchDevice = (evt.device_id || '').toLowerCase().includes(term);
      const matchReason = evt.reason.toLowerCase().includes(term);
      return matchId || matchType || matchDevice || matchReason;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-cyan-400" />
            Central Security Event Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time centralized log of authentication attempts, attack mitigations, replay catches, and policy violations.
          </p>
        </div>

        <button
          onClick={fetchEvents}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 max-w-md bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Event ID, Device ID, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-white outline-none w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 font-medium">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-cyan-500 font-mono text-xs"
          >
            <option value="ALL">ALL SEVERITIES</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="INFO">INFO</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Filtered Events ({filtered.length})</span>
          <span className="text-xs font-mono text-slate-400">Total in Database: {events.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Attack Vector</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Detection Engine</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{evt.event_id}</td>
                  <td className="py-3 px-4 font-semibold text-white">{evt.event_type}</td>
                  <td className="py-3 px-4 font-mono text-rose-300 text-[11px]">{evt.attack_type}</td>
                  <td className="py-3 px-4 font-mono text-cyan-300">{evt.device_id || 'GATEWAY'}</td>
                  <td className="py-3 px-4"><Badge type={evt.severity} /></td>
                  <td className="py-3 px-4"><Badge type={evt.result} /></td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{evt.detection_module}</td>
                  <td className="py-3 px-4 text-slate-400 max-w-sm truncate" title={evt.reason}>{evt.reason}</td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleString()}
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
