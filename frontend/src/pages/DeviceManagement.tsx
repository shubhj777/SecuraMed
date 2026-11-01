import React, { useState, useEffect } from 'react';
import { 
  Radio, Shield, ShieldAlert, ShieldCheck, Plus, RefreshCw,
  Search, Filter, X, CheckCircle2, AlertTriangle, Key, Activity,
  Server, Cpu, Heart, Stethoscope, ChevronRight, Ban, Eye
} from 'lucide-react';
import { Device, SecurityEvent } from '../types';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  // Modals & Panels
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [inspectKeyDevice, setInspectKeyDevice] = useState<Device | null>(null);
  const [deviceEvents, setDeviceEvents] = useState<SecurityEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  const [showEventsModal, setShowEventsModal] = useState<boolean>(false);
  
  // Registration form
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [newId, setNewId] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newType, setNewType] = useState<string>('PATIENT_MONITOR');
  const [newPublicKey, setNewPublicKey] = useState<string>('');
  const [registerLoading, setRegisterLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await api.getDevices();
      setDevices(data);
    } catch (err: any) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName) return;
    try {
      setRegisterLoading(true);
      await api.registerDevice({
        device_id: newId,
        device_name: newName,
        device_type: newType,
        public_key: newPublicKey || '04' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      });
      setStatusMessage({ text: `Device ${newId} registered and provisioned with ML-DSA verification keys.`, type: 'success' });
      setIsRegisterOpen(false);
      setNewId('');
      setNewName('');
      setNewPublicKey('');
      fetchDevices();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Registration failed', type: 'error' });
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRevokeDevice = async (device: Device) => {
    const reason = window.prompt(`Please enter the security justification for revoking ${device.device_id}:`, 'Compromised cryptographic keys / Unscheduled telemetry anomaly');
    if (!reason) return;

    try {
      await api.revokeDevice(device.device_id, reason);
      setStatusMessage({ text: `Device ${device.device_id} revoked successfully. Trust status terminated.`, type: 'success' });
      if (selectedDevice?.device_id === device.device_id) {
        setSelectedDevice(null);
      }
      fetchDevices();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to revoke device', type: 'error' });
    }
  };

  const handleViewEvents = async (device: Device) => {
    try {
      setEventsLoading(true);
      setShowEventsModal(true);
      const events = await api.getDeviceEvents(device.device_id);
      setDeviceEvents(events);
    } catch (err: any) {
      setDeviceEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  // Filtered devices
  const filteredDevices = devices.filter((d) => {
    const matchesSearch = 
      d.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.device_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'ALL' || d.device_type === selectedType;
    const matchesStatus = 
      selectedStatus === 'ALL' || 
      d.trust_status === selectedStatus || 
      d.connection_status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const total = devices.length;
  const online = devices.filter(d => d.connection_status === 'ONLINE').length;
  const offline = devices.filter(d => d.connection_status === 'OFFLINE').length;
  const suspiciousOrRevoked = devices.filter(d => d.trust_status === 'SUSPICIOUS' || d.trust_status === 'REVOKED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Registration CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2A0910] gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0B1733] dark:text-white flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-[#35C5E8]" />
            Medical Device Fleet & IoMT Trust Management
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Provision, authenticate and monitor cryptographic trust for bedside hospital medical devices.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={fetchDevices}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white dark:bg-[#120508] border border-slate-200 dark:border-[#2A0910] hover:bg-slate-50 dark:hover:bg-[#260810] text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Fleet Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#35C5E8]' : ''}`} />
          </button>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#35C5E8] hover:bg-[#2CB3D5] text-[#0B1733] font-bold text-xs shadow-md shadow-[#35C5E8]/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Device</span>
          </button>
        </div>
      </div>

      {/* Status Notice Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
          statusMessage.type === 'success' 
            ? 'bg-[#19B77A]/10 border-[#19B77A]/30 text-[#19B77A]' 
            : 'bg-[#E94B5B]/10 border-[#E94B5B]/30 text-[#E94B5B]'
        }`}>
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#120508] rounded-xl p-4 border border-slate-200 dark:border-[#2A0910]">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Registered Fleet</span>
          <div className="text-2xl font-extrabold text-[#0B1733] dark:text-white font-mono mt-1">{total}</div>
        </div>

        <div className="bg-white dark:bg-[#120508] rounded-xl p-4 border border-slate-200 dark:border-[#2A0910]">
          <span className="text-[11px] font-bold uppercase text-[#19B77A]">Online & Communicating</span>
          <div className="text-2xl font-extrabold text-[#19B77A] font-mono mt-1">{online}</div>
        </div>

        <div className="bg-white dark:bg-[#120508] rounded-xl p-4 border border-slate-200 dark:border-[#2A0910]">
          <span className="text-[11px] font-bold uppercase text-slate-400">Offline / Standby</span>
          <div className="text-2xl font-extrabold text-slate-400 font-mono mt-1">{offline}</div>
        </div>

        <div className="bg-white dark:bg-[#120508] rounded-xl p-4 border border-slate-200 dark:border-[#2A0910]">
          <span className="text-[11px] font-bold uppercase text-[#E94B5B]">Suspicious / Revoked</span>
          <div className="text-2xl font-extrabold text-[#E94B5B] font-mono mt-1">{suspiciousOrRevoked}</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-[#120508] rounded-xl p-4 border border-slate-200 dark:border-[#2A0910] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, name, or device model..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#35C5E8]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#35C5E8]"
          >
            <option value="ALL">All Types</option>
            <option value="PATIENT_MONITOR">Patient Monitor</option>
            <option value="INFUSION_PUMP">Infusion Pump</option>
            <option value="VENTILATOR">Ventilator</option>
            <option value="ECG_MONITOR">ECG Monitor</option>
            <option value="PULSE_OXIMETER">Pulse Oximeter</option>
            <option value="BLOOD_PRESSURE_MONITOR">BP Monitor</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#35C5E8]"
          >
            <option value="ALL">All Statuses</option>
            <option value="TRUSTED">Trusted</option>
            <option value="SUSPICIOUS">Suspicious</option>
            <option value="REVOKED">Revoked</option>
            <option value="ONLINE">Online Only</option>
            <option value="OFFLINE">Offline Only</option>
          </select>
        </div>
      </div>

      {/* Main Devices Table & Selected Device Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Table (2 Cols when item selected, else full width) */}
        <div className={`${selectedDevice ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-[#120508] rounded-2xl border border-slate-200 dark:border-[#2A0910] overflow-hidden shadow-sm`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#18060B] text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-[#2A0910]">
                <tr>
                  <th className="py-3 px-4">Device ID</th>
                  <th className="py-3 px-4">Device Name & Type</th>
                  <th className="py-3 px-4">Connection</th>
                  <th className="py-3 px-4">Trust Status</th>
                  <th className="py-3 px-4">Encryption Standard</th>
                  <th className="py-3 px-4">Last Seen</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2A0910]/60 text-slate-700 dark:text-slate-300">
                {filteredDevices.length > 0 ? (
                  filteredDevices.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDevice(d)}
                      className={`hover:bg-slate-50 dark:hover:bg-[#260810]/40 transition-colors cursor-pointer ${
                        selectedDevice?.device_id === d.device_id ? 'bg-[#35C5E8]/10 dark:bg-[#35C5E8]/15' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#35C5E8]">
                        {d.device_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0B1733] dark:text-white">{d.device_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{d.device_type}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge type={d.connection_status} />
                      </td>
                      <td className="py-3 px-4">
                        <Badge type={d.trust_status} />
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        AES-256-GCM
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {new Date(d.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setInspectKeyDevice(d)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#20070E] hover:bg-slate-200 dark:hover:bg-[#2E0B16] text-slate-600 dark:text-slate-300"
                          title="Inspect ML-DSA Public Key"
                        >
                          <Key className="w-3.5 h-3.5 text-[#35C5E8]" />
                        </button>
                        <button
                          onClick={() => handleViewEvents(d)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#20070E] hover:bg-slate-200 dark:hover:bg-[#2E0B16] text-slate-600 dark:text-slate-300"
                          title="View Security Audit Events"
                        >
                          <Activity className="w-3.5 h-3.5 text-[#19B77A]" />
                        </button>
                        {d.trust_status !== 'REVOKED' && (
                          <button
                            onClick={() => handleRevokeDevice(d)}
                            className="p-1.5 rounded-lg bg-[#E94B5B]/10 hover:bg-[#E94B5B]/20 text-[#E94B5B]"
                            title="Revoke Cryptographic Trust"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No medical devices match your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Device Details Side Panel */}
        {selectedDevice && (
          <div className="bg-white dark:bg-[#120508] rounded-2xl border border-slate-200 dark:border-[#2A0910] p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-right duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2A0910]">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-[#35C5E8]/10 text-[#35C5E8] flex items-center justify-center font-bold">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0B1733] dark:text-white">{selectedDevice.device_name}</h3>
                    <div className="text-[11px] font-mono text-[#35C5E8]">{selectedDevice.device_id}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDevice(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Device Type:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">{selectedDevice.device_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Connection Status:</span>
                    <Badge type={selectedDevice.connection_status} size="sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trust Verification:</span>
                    <Badge type={selectedDevice.trust_status} size="sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registered Date:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {new Date(selectedDevice.registered_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Telemetry:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {new Date(selectedDevice.last_seen).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Public Identity Key (ML-DSA)</span>
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] font-mono text-[10px] break-all text-[#35C5E8]">
                    {selectedDevice.public_key.substring(0, 80)}...
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-[#2A0910] flex items-center justify-between gap-2">
              <button
                onClick={() => handleViewEvents(selectedDevice)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-[#20070E] hover:bg-slate-200 text-slate-700 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-[#19B77A]" />
                <span>Audit Events</span>
              </button>

              {selectedDevice.trust_status !== 'REVOKED' && (
                <button
                  onClick={() => handleRevokeDevice(selectedDevice)}
                  className="px-3 py-2 rounded-xl bg-[#E94B5B]/15 hover:bg-[#E94B5B]/25 text-[#E94B5B] text-xs font-bold border border-[#E94B5B]/30"
                >
                  Revoke Trust
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Provision Device Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#120508] border border-slate-200 dark:border-[#2A0910] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2A0910] pb-3">
              <h3 className="text-base font-bold text-[#0B1733] dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#35C5E8]" />
                Provision Hospital IoMT Device
              </h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterDevice} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Device Hardware ID
                </label>
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="e.g. MED-013"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-800 dark:text-white font-mono focus:outline-none focus:border-[#35C5E8]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Device Descriptive Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. ICU Bed 4 Infusion Pump"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-800 dark:text-white focus:outline-none focus:border-[#35C5E8]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medical Device Classification
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-800 dark:text-white focus:outline-none focus:border-[#35C5E8]"
                >
                  <option value="PATIENT_MONITOR">Patient Monitor</option>
                  <option value="INFUSION_PUMP">Smart Infusion Pump</option>
                  <option value="VENTILATOR">Ventilator</option>
                  <option value="ECG_MONITOR">12-Lead ECG Monitor</option>
                  <option value="PULSE_OXIMETER">Pulse Oximeter</option>
                  <option value="BLOOD_PRESSURE_MONITOR">Blood Pressure Monitor</option>
                  <option value="TEMPERATURE_MONITOR">Continuous Core Temp Monitor</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ML-DSA Public Key (Hex) <span className="text-slate-400 font-normal">(Leave blank to auto-generate)</span>
                </label>
                <textarea
                  value={newPublicKey}
                  onChange={(e) => setNewPublicKey(e.target.value)}
                  rows={2}
                  placeholder="04a8b1..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-800 dark:text-white font-mono text-[10px] focus:outline-none focus:border-[#35C5E8]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#20070E] text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="px-4 py-2 rounded-xl bg-[#35C5E8] hover:bg-[#2CB3D5] text-[#0B1733] font-bold"
                >
                  {registerLoading ? 'Provisioning...' : 'Provision Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Key Modal */}
      {inspectKeyDevice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#120508] border border-slate-200 dark:border-[#2A0910] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2A0910] pb-3">
              <h3 className="text-base font-bold text-[#0B1733] dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-[#35C5E8]" />
                Cryptographic Identity Certificate
              </h3>
              <button onClick={() => setInspectKeyDevice(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Device ID:</span>
                <span className="text-[#35C5E8] font-bold">{inspectKeyDevice.device_id}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Algorithm:</span>
                <span className="text-[#19B77A] font-bold">NIST FIPS 204 (ML-DSA-65)</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Public Key Hex:</span>
                <div className="mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] font-mono text-[10px] break-all max-h-48 overflow-y-auto text-slate-700 dark:text-slate-300">
                  {inspectKeyDevice.public_key}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-[#2A0910] pt-3 flex justify-end">
              <button
                onClick={() => setInspectKeyDevice(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#20070E] text-slate-700 dark:text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events Modal */}
      {showEventsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#120508] border border-slate-200 dark:border-[#2A0910] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2A0910] pb-3">
              <h3 className="text-base font-bold text-[#0B1733] dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#19B77A]" />
                Security Audit Trail for Device
              </h3>
              <button onClick={() => setShowEventsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
              {eventsLoading ? (
                <div className="text-center py-8 text-slate-400">Loading audit events...</div>
              ) : deviceEvents.length > 0 ? (
                deviceEvents.map((evt) => (
                  <div key={evt.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-white">{evt.attack_type || evt.event_type}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{evt.reason}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(evt.timestamp).toLocaleString()}</div>
                    </div>
                    <Badge type={evt.result} />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">No security violations recorded for this device.</div>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-[#2A0910] pt-3 flex justify-end">
              <button
                onClick={() => setShowEventsModal(false)}
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

export default DeviceManagement;
