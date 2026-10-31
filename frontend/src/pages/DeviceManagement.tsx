import React, { useState, useEffect } from 'react';
import { 
  Radio, ShieldAlert, Plus, RefreshCw, Key, ShieldX, 
  CheckCircle, AlertCircle, Clock, Eye, Info, X, ShieldCheck
} from 'lucide-react';
import { Device, SecurityEvent } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceEvents, setDeviceEvents] = useState<SecurityEvent[]>([]);
  const [inspectKeyDevice, setInspectKeyDevice] = useState<Device | null>(null);
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
      setStatusMessage({ text: 'Failed to load medical devices: ' + e.message, type: 'error' });
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
      setStatusMessage({ text: `Device ${newId} registered successfully with verified identity binding.`, type: 'success' });
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
    const reason = window.prompt(
      `Enter reason for revoking trust for device ${deviceId} (e.g. Compromised, Stolen, Decommissioned):`,
      'Suspected compromise or unauthorized physical removal'
    );
    if (!reason) return;

    try {
      setLoading(true);
      await api.revokeDevice(deviceId, reason);
      setStatusMessage({ 
        text: `Device ${deviceId} has been REVOKED. Active sessions terminated and all gateway communication blocked.`, 
        type: 'success' 
      });
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

  // Device status badge with hospital-friendly explanations
  const renderTrustBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'TRUSTED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400"></span>
          Trusted
        </span>
      );
    }
    if (s === 'SUSPICIOUS') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-400"></span>
          Suspicious
        </span>
      );
    }
    if (s === 'REVOKED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-400"></span>
          Revoked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
        Verification Required
      </span>
    );
  };

  const revokedCount = devices.filter(d => d.trust_status === 'REVOKED').length;
  const suspiciousCount = devices.filter(d => d.trust_status === 'SUSPICIOUS').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            Medical Device Management
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            View, register and manage medical devices connected to your hospital security gateway.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadDevices}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Refresh Fleet"
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

      {/* Hospital Trust Alerts (If Revoked or Suspicious Devices Exist) */}
      {(revokedCount > 0 || suspiciousCount > 0) && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs space-y-1">
          <div className="font-bold text-rose-300 flex items-center gap-2 text-sm">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Hospital Device Trust Advisory
          </div>
          <div className="text-slate-300 leading-relaxed text-[11px]">
            {revokedCount > 0 && (
              <div>
                &bull; <span className="font-semibold text-rose-300">{revokedCount} Revoked Device(s):</span> Trust has been permanently severed. Active sessions were terminated and subsequent communication is rejected at the gateway.
              </div>
            )}
            {suspiciousCount > 0 && (
              <div>
                &bull; <span className="font-semibold text-amber-300">{suspiciousCount} Suspicious Device(s):</span> Anomalous activity detected. Verification is required before full communication is permitted.
              </div>
            )}
          </div>
        </div>
      )}

      {statusMessage && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
          statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Device Table */}
      <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">
            Hospital Medical Device Fleet ({devices.length} registered)
          </span>
          <span className="text-xs font-mono text-cyan-400">
            Protected by Verified Identity Binding
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Device ID</th>
                <th className="py-3 px-4">Device Name</th>
                <th className="py-3 px-4">Clinical Profile</th>
                <th className="py-3 px-4">Identity Key</th>
                <th className="py-3 px-4">Trust Status</th>
                <th className="py-3 px-4">Connection</th>
                <th className="py-3 px-4">Last Activity</th>
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
                  {/* Public Key Hidden from ordinary users; viewable via technical modal */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setInspectKeyDevice(dev)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 font-mono text-[11px] transition-colors"
                      title="Inspect Cryptographic Key"
                    >
                      <Key className="w-3 h-3 text-cyan-400" />
                      <span>View Key</span>
                    </button>
                  </td>
                  <td className="py-3 px-4">{renderTrustBadge(dev.trust_status)}</td>
                  <td className="py-3 px-4"><Badge type={dev.connection_status} /></td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {dev.last_seen ? new Date(dev.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleViewEvents(dev)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
                      title="View Security History"
                    >
                      <Eye className="w-3 h-3 inline mr-1" />
                      History
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
                      <span className="text-[11px] text-rose-400 font-mono font-semibold px-2 py-0.5 rounded bg-rose-950/50 border border-rose-900">
                        REVOKED
                      </span>
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
                <label className="block text-slate-300 font-medium mb-1">Device ID (Asset Identifier)</label>
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
                <label className="block text-slate-300 font-medium mb-1">Medical Device Name & Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Infusion Pump Ward 3B"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Clinical Profile</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                >
                  <option value="PATIENT_MONITOR">Bedside Patient Monitor (ICU)</option>
                  <option value="ECG_MONITOR">ECG Telemetry Unit (Cardiology)</option>
                  <option value="INFUSION_PUMP">Smart Infusion Pump</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-medium">Device Identity Public Key (ML-DSA-65)</label>
                  <button
                    type="button"
                    onClick={() => {
                      fetch('/api/devices/MED-001')
                        .then(r => r.json())
                        .then(d => setNewPublicKey(d.public_key))
                        .catch(() => {});
                    }}
                    className="text-[10px] text-cyan-400 hover:underline font-mono"
                  >
                    Load Sample Verified Key
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter 3904 hex characters (1952 bytes) representing the ML-DSA-65 device identity public key..."
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
                  <span>Register & Bind Device</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cryptographic Key Inspection Modal (Technical Personnel Only) */}
      {inspectKeyDevice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  Cryptographic Identity Details
                </h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Device: {inspectKeyDevice.device_name} ({inspectKeyDevice.device_id})
                </div>
              </div>
              <button onClick={() => setInspectKeyDevice(null)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px]">Identity Algorithm Standard:</div>
                <div className="text-cyan-300 font-mono font-bold">NIST FIPS 204 (ML-DSA-65) — Module Lattice Digital Signatures</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px]">Key Length & Format:</div>
                <div className="text-slate-200 font-mono">1,952 bytes (3,904 hexadecimal characters)</div>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Registered Public Key Hex:</label>
                <textarea
                  readOnly
                  rows={5}
                  value={inspectKeyDevice.public_key}
                  className="w-full p-2.5 rounded-lg bg-black/60 border border-slate-800 font-mono text-[10px] text-cyan-300 select-all outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setInspectKeyDevice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Key View
              </button>
            </div>
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
                <div className="text-xs text-slate-400 font-mono mt-0.5">Profile: {selectedDevice.device_type}</div>
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
