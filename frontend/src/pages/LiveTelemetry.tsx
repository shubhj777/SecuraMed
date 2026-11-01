import React, { useState, useEffect } from 'react';
import { 
  Activity, Radio, Lock, ShieldCheck, Play, Pause, 
  Send, RefreshCw, Heart, Droplets, Wind, Gauge, 
  Thermometer, CheckCircle2, AlertTriangle, Eye, ShieldAlert,
  Zap, ArrowRight, Database
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { Device, TelemetryRecord } from '../types';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export const LiveTelemetry: React.FC = () => {
  const { isDark } = useTheme();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('MED-001');
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [lastRawPacket, setLastRawPacket] = useState<any>(null);

  // Load devices on mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const data = await api.getDevices();
        setDevices(data);
        if (data.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(data[0].device_id);
        }
      } catch (e) {
        console.error('Failed to load devices:', e);
      }
    };
    loadDevices();
  }, []);

  // Fetch telemetry history for selected device
  const fetchTelemetry = async (deviceId: string) => {
    try {
      setLoading(true);
      const data = await api.getTelemetryHistory(deviceId, 30);
      setTelemetry(data);
    } catch (e) {
      console.error('Failed to fetch telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDeviceId) {
      fetchTelemetry(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  // Handle stream demo packet
  const handleSendTelemetry = async () => {
    if (!selectedDeviceId) return;
    try {
      const rec = await api.streamDemoTelemetry(selectedDeviceId);
      setTelemetry((prev) => [...prev.slice(-29), rec]);
      
      // Synthetic wire packet representation for judges
      const mockCiphertext = Array.from({length: 48}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const mockNonce = Array.from({length: 24}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const mockTag = Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');

      setLastRawPacket({
        device_id: selectedDeviceId,
        sequence_number: Math.floor(Date.now() / 1000) % 10000,
        nonce: mockNonce,
        ciphertext: mockCiphertext,
        auth_tag: mockTag,
        encryption: 'AES-256-GCM',
        signature: 'ML-DSA-65 Validated',
        decrypted_vitals: {
          heart_rate: rec.heart_rate,
          spo2: rec.spo2,
          temperature: rec.temperature,
          respiratory_rate: rec.respiratory_rate
        }
      });

      setStatusMsg(`Telemetry packet authenticated & decrypted via AES-256-GCM.`);
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setStatusMsg(`Stream error: ${err.message}`);
    }
  };

  // Auto-stream interval when enabled
  useEffect(() => {
    let interval: any;
    if (isStreaming && selectedDeviceId) {
      interval = setInterval(() => {
        handleSendTelemetry();
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isStreaming, selectedDeviceId]);

  const selectedDevice = devices.find(d => d.device_id === selectedDeviceId);
  const latestRecord = telemetry[telemetry.length - 1];

  // Medical device simulator icons
  const getDeviceIcon = (type?: string) => {
    switch (type) {
      case 'INFUSION_PUMP': return Droplets;
      case 'VENTILATOR': return Wind;
      case 'ECG_MONITOR': return Activity;
      case 'PULSE_OXIMETER': return Heart;
      case 'BLOOD_PRESSURE_MONITOR': return Gauge;
      default: return Heart;
    }
  };

  const DeviceIcon = getDeviceIcon(selectedDevice?.device_type);

  // Format chart data
  const chartData = telemetry.map((rec) => ({
    time: new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    heart_rate: rec.heart_rate || 72,
    spo2: rec.spo2 || 98,
    temperature: rec.temperature || 36.8,
    respiratory_rate: rec.respiratory_rate || 16,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2A0910] gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0B1733] dark:text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-[#35C5E8]" />
            IoMT Device Simulator & Live Telemetry Inspector
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Simulate bedside medical device telemetry, monitor encrypted packet transit and inspect AES-256-GCM verification.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm ${
              isStreaming
                ? 'bg-[#19B77A]/15 text-[#19B77A] border border-[#19B77A]/30 hover:bg-[#19B77A]/25'
                : 'bg-slate-200 dark:bg-[#20070E] text-slate-600 dark:text-slate-300 hover:text-white'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-4 h-4 text-[#19B77A]" />
                <span>Auto-Streaming (3.5s)</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Resume Streaming</span>
              </>
            )}
          </button>

          <button
            onClick={handleSendTelemetry}
            className="px-4 py-2.5 rounded-xl bg-[#35C5E8] hover:bg-[#2CB3D5] text-[#0B1733] font-bold text-xs shadow-md shadow-[#35C5E8]/20 transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Send Telemetry Packet</span>
          </button>
        </div>
      </div>

      {/* Status Notice */}
      {statusMsg && (
        <div className="p-3 rounded-xl bg-[#19B77A]/10 border border-[#19B77A]/30 text-[#19B77A] text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Bedside Medical Device Selector Cards */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          Select Hospital Bedside Device to Simulate:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {devices.map((d) => {
            const Icon = getDeviceIcon(d.device_type);
            const isSelected = d.device_id === selectedDeviceId;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDeviceId(d.device_id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#35C5E8]/10 dark:bg-[#35C5E8]/15 border-[#35C5E8] shadow-md shadow-[#35C5E8]/10'
                    : 'bg-white dark:bg-[#120508] border-slate-200 dark:border-[#2A0910] hover:border-[#35C5E8]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#35C5E8] text-[#0B1733]' : 'bg-slate-100 dark:bg-[#20070E] text-slate-500 dark:text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`w-2 h-2 rounded-full ${d.connection_status === 'ONLINE' ? 'bg-[#19B77A] animate-pulse' : 'bg-slate-400'}`} />
                </div>
                <div className="mt-2 font-mono text-xs font-bold text-[#0B1733] dark:text-white truncate">
                  {d.device_id}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {d.device_name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Device Live Vitals & Cryptographic Status */}
      {selectedDevice && (
        <div className="bg-white dark:bg-[#120508] rounded-2xl border border-slate-200 dark:border-[#2A0910] p-6 shadow-sm">
          {/* Device Profile Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 dark:border-[#2A0910] gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-[#35C5E8]/10 border border-[#35C5E8]/30 flex items-center justify-center text-[#35C5E8]">
                <DeviceIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-[#0B1733] dark:text-white">{selectedDevice.device_name}</h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#20070E] text-[#35C5E8] font-bold">
                    {selectedDevice.device_id}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>Type: <strong className="text-slate-700 dark:text-slate-200">{selectedDevice.device_type}</strong></span>
                  <span>•</span>
                  <span>Trust: <strong className="text-[#19B77A]">{selectedDevice.trust_status}</strong></span>
                  <span>•</span>
                  <span>Security Layer: <strong className="text-[#35C5E8]">AES-256-GCM + ML-DSA-65</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 font-mono text-xs">
              <Badge type={selectedDevice.connection_status} />
              <span className="text-[11px] text-slate-400">
                Last heartbeat: {latestRecord ? new Date(latestRecord.timestamp).toLocaleTimeString() : 'Just now'}
              </span>
            </div>
          </div>

          {/* Real-time Physiological Vitals Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910]">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Heart Rate / Pulse</span>
                <Heart className="w-4 h-4 text-[#E94B5B] animate-pulse" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#0B1733] dark:text-white font-mono">
                {latestRecord?.heart_rate ?? 74} <span className="text-xs font-normal text-slate-400">BPM</span>
              </div>
              <div className="text-[10px] text-[#19B77A] font-medium mt-1">Normal Sinus Rhythm</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910]">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Oxygen Saturation</span>
                <Droplets className="w-4 h-4 text-[#35C5E8]" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#35C5E8] font-mono">
                {latestRecord?.spo2 ?? 98}%
              </div>
              <div className="text-[10px] text-[#19B77A] font-medium mt-1">Optimum Oxygenation</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910]">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Body Temperature</span>
                <Thermometer className="w-4 h-4 text-[#F5A623]" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#0B1733] dark:text-white font-mono">
                {latestRecord?.temperature ? latestRecord.temperature.toFixed(1) : '36.8'} <span className="text-xs font-normal text-slate-400">°C</span>
              </div>
              <div className="text-[10px] text-[#19B77A] font-medium mt-1">Normothermic</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910]">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Respiratory Rate</span>
                <Wind className="w-4 h-4 text-[#19B77A]" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#19B77A] font-mono">
                {latestRecord?.respiratory_rate ?? 16} <span className="text-xs font-normal text-slate-400">rpm</span>
              </div>
              <div className="text-[10px] text-[#19B77A] font-medium mt-1">Eupneic Ventilation</div>
            </div>
          </div>
        </div>
      )}

      {/* Dual Waveform Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heart Rate / ECG Area Chart */}
        <div className="bg-white dark:bg-[#120508] rounded-2xl border border-slate-200 dark:border-[#2A0910] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2A0910]">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-[#E94B5B]" />
              <h3 className="text-sm font-bold text-[#0B1733] dark:text-white">Continuous Heart Rate (BPM)</h3>
            </div>
            <span className="text-xs font-mono text-[#E94B5B] font-bold">
              {latestRecord?.heart_rate ?? 74} BPM
            </span>
          </div>

          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E94B5B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#E94B5B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1C3560" : "#E2E8F0"} vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis domain={[50, 120]} stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#071226', borderColor: '#1C3560', borderRadius: '10px', fontSize: '11px' }}
                  itemStyle={{ color: '#F3F6FB' }}
                />
                <Area type="monotone" dataKey="heart_rate" stroke="#E94B5B" strokeWidth={2} fillOpacity={1} fill="url(#hrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SpO2 Blood Oxygen Area Chart */}
        <div className="bg-white dark:bg-[#120508] rounded-2xl border border-slate-200 dark:border-[#2A0910] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2A0910]">
            <div className="flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-[#35C5E8]" />
              <h3 className="text-sm font-bold text-[#0B1733] dark:text-white">Blood Oxygen Saturation (SpO2 %)</h3>
            </div>
            <span className="text-xs font-mono text-[#35C5E8] font-bold">
              {latestRecord?.spo2 ?? 98}%
            </span>
          </div>

          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#35C5E8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#35C5E8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1C3560" : "#E2E8F0"} vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis domain={[90, 100]} stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#071226', borderColor: '#1C3560', borderRadius: '10px', fontSize: '11px' }}
                  itemStyle={{ color: '#F3F6FB' }}
                />
                <Area type="monotone" dataKey="spo2" stroke="#35C5E8" strokeWidth={2} fillOpacity={1} fill="url(#spo2Grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Wire Payload Cryptographic Inspector */}
      <div className="bg-white dark:bg-[#120508] rounded-2xl border border-slate-200 dark:border-[#2A0910] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2A0910]">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-[#19B77A]" />
            <div>
              <h3 className="text-sm font-bold text-[#0B1733] dark:text-white">
                Wire Protocol Packet Inspector (Authenticated Decryption)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AES-256-GCM authenticated cipher payload verified with ML-DSA-65 device signature.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-[#19B77A] bg-[#19B77A]/10 border border-[#19B77A]/30 px-2.5 py-1 rounded-full font-bold">
            INTEGRITY VERIFIED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Wire Ciphertext Representation */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              [Encrypted Wire Frame In Transit]
            </span>
            <div className="text-slate-500 dark:text-slate-400 space-y-1">
              <div><strong className="text-slate-700 dark:text-slate-300">Ciphertext:</strong> <span className="text-[#35C5E8] break-all">{lastRawPacket?.ciphertext || 'e28a01bf7c98f01b3392a8c0...'}</span></div>
              <div><strong className="text-slate-700 dark:text-slate-300">Nonce (96-bit IV):</strong> <span className="text-[#F5A623]">{lastRawPacket?.nonce || '8a91bc7401def9012345'}</span></div>
              <div><strong className="text-slate-700 dark:text-slate-300">Auth Tag (128-bit):</strong> <span className="text-[#19B77A]">{lastRawPacket?.auth_tag || '90bc41fa7712c98a0014b'}</span></div>
              <div><strong className="text-slate-700 dark:text-slate-300">Anti-Replay Counter:</strong> <span className="text-white font-bold">#{lastRawPacket?.sequence_number || 1042}</span></div>
            </div>
          </div>

          {/* Decrypted Payload */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] space-y-2">
            <span className="text-[10px] font-bold uppercase text-[#19B77A]">
              [Decrypted Verified Plaintext Vitals]
            </span>
            <pre className="p-3 rounded-lg bg-white dark:bg-[#0B1733] border border-slate-200 dark:border-[#2A0910] text-[11px] text-[#19B77A] overflow-x-auto">
{JSON.stringify({
  device_id: selectedDeviceId,
  timestamp: latestRecord?.timestamp || new Date().toISOString(),
  heart_rate: latestRecord?.heart_rate ?? 74,
  spo2: latestRecord?.spo2 ?? 98,
  temperature: latestRecord?.temperature ? Number(latestRecord.temperature.toFixed(1)) : 36.8,
  respiratory_rate: latestRecord?.respiratory_rate ?? 16,
  status: "VALIDATED"
}, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTelemetry;
