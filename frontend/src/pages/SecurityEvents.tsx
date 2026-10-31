import React, { useState, useEffect } from 'react';
import { AlertTriangle, Filter, RefreshCw, ShieldAlert, Search, Eye, X, Info } from 'lucide-react';
import { SecurityEvent } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { formatEventToHospitalLanguage } from '../utils/securityLanguage';

export const SecurityEvents: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getSecurityEvents(100);
      setEvents(data);
    } catch (e) {
      console.error('Failed to fetch security events:', e);
    } finally {
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
      const friendly = formatEventToHospitalLanguage(evt.event_type, evt.attack_type, evt.result, evt.reason);
      const matchId = evt.event_id.toLowerCase().includes(term);
      const matchType = evt.event_type.toLowerCase().includes(term);
      const matchFriendly = friendly.friendlyTitle.toLowerCase().includes(term);
      const matchDevice = (evt.device_id || '').toLowerCase().includes(term);
      const matchReason = evt.reason.toLowerCase().includes(term);
      return matchId || matchType || matchFriendly || matchDevice || matchReason;
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
            Threat & Security Activity
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Review detected cyber threats, security activity, and automated gateway protections across connected medical equipment.
          </p>
        </div>

        <button
          onClick={fetchEvents}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all self-start sm:self-auto"
          title="Refresh Events"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center space-x-2 flex-1 max-w-md bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Device, Event, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-white outline-none w-full text-xs"
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

      {/* Events Table with Understandable Hospital Descriptions */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">
            Security Activity Log ({filtered.length} matching events)
          </span>
          <span className="text-xs font-mono text-slate-400">Total Recorded: {events.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Medical Device</th>
                <th className="py-3 px-4">Security Event</th>
                <th className="py-3 px-4">Threat Scenario</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((evt) => {
                const friendly = formatEventToHospitalLanguage(evt.event_type, evt.attack_type, evt.result, evt.reason);
                return (
                  <tr 
                    key={evt.id} 
                    onClick={() => setSelectedEvent(evt)}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-cyan-300">
                      {evt.device_id || 'GATEWAY'}
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-sm">
                      <div className="font-semibold text-slate-200">{friendly.friendlyTitle}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{friendly.plainReason}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-300 text-[11px]">
                      {evt.attack_type !== 'NONE' ? evt.attack_type : 'ROUTINE'}
                    </td>
                    <td className="py-3 px-4"><Badge type={evt.severity} /></td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        friendly.actionColor === 'rose' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        friendly.actionColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {friendly.actionTaken}
                      </span>
                    </td>
                    <td className="py-3 px-4"><Badge type={evt.result} /></td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors border border-slate-700 group-hover:border-cyan-500/30"
                      >
                        <Eye className="w-3 h-3 inline mr-1" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal with Original Event Codes Available Under Event Details */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-cyan-400" />
                  Security Activity Inspection
                </h3>
                <div className="text-xs font-mono text-cyan-400 mt-0.5">
                  Event Reference: {selectedEvent.event_id}
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
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
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
                  <div className="text-slate-400 text-[10px]">Date & Time</div>
                  <div className="text-white mt-0.5">{new Date(selectedEvent.timestamp).toLocaleString()}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Severity</div>
                  <div className="mt-1"><Badge type={selectedEvent.severity} /></div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Gateway Result</div>
                  <div className="mt-1"><Badge type={selectedEvent.result} /></div>
                </div>
              </div>

              {/* Technical Details: Keep original event codes available */}
              <div className="p-3.5 rounded-xl bg-black/50 border border-slate-800 font-mono text-[11px] space-y-1.5">
                <div className="text-slate-400 font-sans font-semibold text-xs mb-1">
                  Technical Security Reference:
                </div>
                <div><span className="text-slate-500">Original Event Code:</span> <span className="text-cyan-300 font-bold">{selectedEvent.event_type}</span></div>
                <div><span className="text-slate-500">Threat Classification:</span> <span className="text-rose-300">{selectedEvent.attack_type}</span></div>
                <div><span className="text-slate-500">Detection Module:</span> <span className="text-emerald-400">{selectedEvent.detection_module}</span></div>
                <div className="pt-1">
                  <span className="text-slate-500">Raw Technical Reason:</span>
                  <div className="text-slate-300 mt-1 bg-slate-900 p-2 rounded border border-slate-800 font-sans text-xs leading-relaxed">
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
