import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, ShieldAlert, Search, Filter, RefreshCw, 
  X, Info, CheckCircle2, ShieldCheck, Terminal
} from 'lucide-react';
import { SecurityEvent } from '../types';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { formatEventToHospitalLanguage } from '../utils/securityLanguage';

export const SecurityEvents: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getSecurityEvents(100);
      setEvents(data);
    } catch (e) {
      console.error('Failed to load security events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesSeverity = severityFilter === 'ALL' || e.severity === severityFilter;
    const matchesSearch = 
      (e.device_id && e.device_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.event_type && e.event_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.attack_type && e.attack_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.reason && e.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2A0910] gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0B1733] dark:text-white flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-[#F5A623]" />
            Threat Intelligence & Security Activity Feed
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time intrusion detection audit stream recording all mitigated attacks and policy enforcements.
          </p>
        </div>

        <button
          onClick={fetchEvents}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#20070E] hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2A0910] self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#35C5E8]' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#120508] rounded-xl p-4 border border-slate-200 dark:border-[#2A0910] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events, devices, threat codes..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#35C5E8]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-500">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-800 dark:text-white focus:outline-none focus:border-[#35C5E8]"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white dark:bg-[#120508] rounded-2xl border border-slate-200 dark:border-[#2A0910] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#18060B] text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-[#2A0910]">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Target Device</th>
                <th className="py-3 px-4">Threat Description</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Enforced Action</th>
                <th className="py-3 px-4">Gateway Outcome</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2A0910]/60 text-slate-700 dark:text-slate-300">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((evt) => {
                  const friendly = formatEventToHospitalLanguage(evt.event_type, evt.attack_type, evt.result, evt.reason);
                  return (
                    <tr 
                      key={evt.id} 
                      onClick={() => setSelectedEvent(evt)}
                      className="hover:bg-slate-50 dark:hover:bg-[#260810]/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#35C5E8]">
                        {evt.device_id || 'GATEWAY'}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-[#0B1733] dark:text-white">{friendly.friendlyTitle}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{friendly.plainReason}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge type={evt.severity} />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold font-mono ${
                          friendly.actionColor === 'rose' ? 'bg-[#E94B5B]/15 text-[#E94B5B] border border-[#E94B5B]/30' :
                          friendly.actionColor === 'emerald' ? 'bg-[#19B77A]/15 text-[#19B77A] border border-[#19B77A]/30' :
                          'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30'
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
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#20070E] hover:bg-slate-200 text-slate-700 dark:text-white text-[11px] border border-slate-200 dark:border-[#2A0910]"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No security events matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#120508] border border-slate-200 dark:border-[#2A0910] rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2A0910] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0B1733] dark:text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#35C5E8]" />
                  Threat Incident Forensics
                </h3>
                <div className="text-xs font-mono text-[#35C5E8] mt-0.5">
                  EVENT: {selectedEvent.event_id}
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] space-y-1">
                <span className="text-slate-400 font-medium">Hospital Context:</span>
                <div className="font-bold text-sm text-[#0B1733] dark:text-white">
                  {formatEventToHospitalLanguage(selectedEvent.event_type, selectedEvent.attack_type, selectedEvent.result, selectedEvent.reason).friendlyTitle}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  {formatEventToHospitalLanguage(selectedEvent.event_type, selectedEvent.attack_type, selectedEvent.result, selectedEvent.reason).plainReason}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910]">
                  <span className="text-slate-400 text-[10px]">Medical Device</span>
                  <div className="font-bold text-[#0B1733] dark:text-white mt-0.5">{selectedEvent.device_id || 'GATEWAY'}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910]">
                  <span className="text-slate-400 text-[10px]">Timestamp</span>
                  <div className="text-slate-700 dark:text-white mt-0.5">{new Date(selectedEvent.timestamp).toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910]">
                  <span className="text-slate-400 text-[10px]">Threat Severity</span>
                  <div className="mt-1"><Badge type={selectedEvent.severity} /></div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910]">
                  <span className="text-slate-400 text-[10px]">Gateway Outcome</span>
                  <div className="mt-1"><Badge type={selectedEvent.result} /></div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] font-mono text-[11px] space-y-1">
                <div><span className="text-slate-400">Event Code:</span> <span className="text-[#35C5E8]">{selectedEvent.event_type}</span></div>
                <div><span className="text-slate-400">Detection Engine:</span> <span className="text-[#19B77A]">{selectedEvent.detection_module}</span></div>
                <div className="pt-1">
                  <span className="text-slate-400">Cryptographic Defense Log:</span>
                  <div className="mt-1 p-2 rounded bg-white dark:bg-[#0B1733] border border-slate-200 dark:border-[#2A0910] text-slate-700 dark:text-slate-300">
                    {selectedEvent.reason}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-[#2A0910] pt-3 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#20070E] text-slate-700 dark:text-white text-xs font-semibold"
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

export default SecurityEvents;
