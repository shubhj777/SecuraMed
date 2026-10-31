import React, { useState, useEffect } from 'react';
import { 
  Radio, ShieldAlert, Plus, RefreshCw, Key, ShieldX, 
  CheckCircle, AlertCircle, Clock, Eye 
} from 'lucide-react';
import { Device, SecurityEvent } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceEvents, setDeviceEvents] = useState<SecurityEvent[]>([]);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Registration Form State
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('PATIENT_MONITOR');
  const [newPublicKey, setNewPublicKey] = useState('');

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await api.getDevices();
      setDevices(data);
    } catch (e: any) {
      setStatusMessage({ text: 'Failed to load devices', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.registerDevice({
        device_id: newId,
        device_name: newName,
        device_type: newType,
        public_key: newPublicKey.trim(),
      });
      setStatusMessage({ text: `Device ${newId} registered successfully with verified ML-DSA-65 public key.`, type: 'success' });
      setIsRegisterOpen(false);
      setNewId('');
      setNewName('');
      setNewPublicKey('');
      await loadDevices();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Registration failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (deviceId: string) => {
    if (!window.confirm(`Are you sure you want to REVOKE trust for device ${deviceId}? All active cryptographic sessions will be permanently terminated.`)) {
      return;
    }
    try {
      setLoading(true);
      await api.revokeDevice(deviceId, 'Operator initiated security revocation');
      setStatusMessage({ text: `Device ${deviceId} has been REVOKED and blocked from gateway.`, type: 'success' });
      await loadDevices();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Revocation failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewEvents = async (device: Device) => {
    setSelectedDevice(device);
    try {
      const events = await api.getDeviceEvents(device.device_id);
      setDeviceEvents(events);
    } catch (e) {
      setDeviceEvents([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            Medical Device Registry & Identity Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered medical IoT devices with cryptographically bound ML-DSA-65 public keys and trust revocation controls.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadDevices}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-cyan-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Device</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
          statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Device Table */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Connected Medical Fleet ({devices.length} registered)</span>
          <span className="text-xs font-mono text-slate-400">Identity: ML-DSA-65 (FIPS 204)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Device ID</th>
                <th className="py-3 px-4">Device Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Public Key (ML-DSA-65)</th>
                <th className="py-3 px-4">Trust Status</th>
                <th className="py-3 px-4">Connection</th>
                <th className="py-3 px-4">Last Communication</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {devices.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{dev.device_id}</td>
                  <td className="py-3 px-4 font-semibold text-white">{dev.device_name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                      {dev.device_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 max-w-[140px] truncate" title={dev.public_key}>
                    {dev.public_key.substring(0, 16)}...
                  </td>
                  <td className="py-3 px-4"><Badge type={dev.trust_status} /></td>
                  <td className="py-3 px-4"><Badge type={dev.connection_status} /></td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {dev.last_seen ? new Date(dev.last_seen).toLocaleTimeString() : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleViewEvents(dev)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
                      title="View Security History"
                    >
                      <Eye className="w-3 h-3 inline mr-1" />
                      Audit
                    </button>
                    {dev.trust_status !== 'REVOKED' ? (
                      <button
                        onClick={() => handleRevoke(dev.device_id)}
                        className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-[11px] border border-rose-500/30 transition-colors font-medium"
                      >
                        <ShieldX className="w-3 h-3 inline mr-1" />
                        Revoke
                      </button>
                    ) : (
                      <span className="text-[11px] text-rose-400 font-mono">REVOKED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                Register Connected Medical Device
              </h2>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Device ID (Unique Asset Tag)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MED-003"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Device Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bedside Patient Monitor ICU-03"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Device Profile</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                >
                  <option value="PATIENT_MONITOR">PATIENT_MONITOR</option>
                  <option value="ECG_MONITOR">ECG_MONITOR</option>
                  <option value="INFUSION_PUMP">INFUSION_PUMP</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-medium">Registered ML-DSA-65 Public Key (1952 bytes hex)</label>
                  <button
                    type="button"
                    onClick={() => {
                      // Demo utility: generate valid 1952-byte pattern or fetch from demo endpoint
                      fetch('/api/devices/MED-001')
                        .then(r => r.json())
                        .then(d => setNewPublicKey(d.public_key))
                        .catch(() => {});
                    }}
                    className="text-[10px] text-cyan-400 hover:underline font-mono"
                  >
                    Copy Existing Demo Key
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter 3904 hex characters (1952 bytes) representing the ML-DSA-65 public key..."
                  value={newPublicKey}
                  onChange={(e) => setNewPublicKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 shadow"
                >
                  <Key className="w-4 h-4" />
                  <span>Register & Bind Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Device Audit Events Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-cyan-400" />
                  Security History: {selectedDevice.device_name} ({selectedDevice.device_id})
                </h2>
                <div className="text-xs text-slate-400 font-mono mt-0.5">Device Type: {selectedDevice.device_type}</div>
              </div>
              <button onClick={() => setSelectedDevice(null)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {deviceEvents.length > 0 ? (
                deviceEvents.map((evt) => (
                  <div key={evt.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-400 font-semibold">{evt.event_type}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(evt.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-300">{evt.reason}</div>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge type={evt.severity} />
                      <Badge type={evt.result} />
                      <span className="text-[10px] text-slate-400 font-mono">Module: {evt.detection_module}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No security incidents or events recorded for this device.
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 text-right">
              <button
                onClick={() => setSelectedDevice(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
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
