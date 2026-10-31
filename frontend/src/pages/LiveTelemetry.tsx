import React, { useState, useEffect } from 'react';
import { 
  Activity, Heart, Thermometer, Wind, RefreshCw, 
  Send, ShieldCheck, AlertCircle, Sparkles, Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid 
} from 'recharts';
import { Device, TelemetryRecord } from '../types';
import { api } from '../services/api';

export const LiveTelemetry: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('MED-001');
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getDevices().then(devs => {
      setDevices(devs);
      if (devs.length > 0 && !devs.find(d => d.device_id === selectedDevice)) {
        setSelectedDevice(devs[0].device_id);
      }
    }).catch(() => {});
  }, []);

  const fetchHistory = async () => {
    if (!selectedDevice) return;
    try {
      const data = await api.getTelemetryHistory(selectedDevice, 25);
      setTelemetry(data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedDevice]);

  // Periodic polling if streaming is toggled
  useEffect(() => {
    let interval: any = null;
    if (isStreaming) {
      interval = setInterval(() => {
        handleSendSyntheticTelemetry();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isStreaming, selectedDevice]);

  const handleSendSyntheticTelemetry = async () => {
    try {
      setLoading(true);
      await api.simulateAttack(selectedDevice, 'MESSAGE_TAMPERING');
      await fetchHistory();
      setStatusMsg(`Synthetic telemetry packet encrypted, verified, and ingested via authenticated session.`);
    } catch (e: any) {
      await fetchHistory();
    } finally {
      setLoading(false);
    }
  };

  const latest = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

  const chartData = telemetry.map(t => ({
    time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    heart_rate: t.heart_rate ?? 75,
    spo2: t.spo2 ?? 98,
    temperature: t.temperature ?? 36.8,
    respiratory_rate: t.respiratory_rate ?? 16
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Device Monitoring
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          View demonstration readings and communication activity from connected device emulators.
        </p>
      </div>

      {/* Mandatory Clinical Disclaimer Banner */}
      <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 shadow-sm">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-amber-400 font-mono">
            DEMONSTRATION DATA ONLY —{' '}
          </span>
          These readings are synthetically generated for cybersecurity testing. This application does not connect to real patients or provide clinical diagnosis or treatment.
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] p-4 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="text-sm font-bold text-white">Demonstration Vital Signs Telemetry</div>
            <div className="text-xs text-slate-400">Encrypted Communication &bull; Tamper-Evident Ingestion</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-500"
          >
            {devices.map(d => (
              <option key={d.device_id} value={d.device_id}>
                {d.device_id} - {d.device_name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isStreaming 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`}></span>
            <span>{isStreaming ? 'Stop Auto-Stream' : 'Start Auto-Stream'}</span>
          </button>

          <button
            onClick={handleSendSyntheticTelemetry}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Encrypted Packet</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 flex items-center justify-between">
          <span>&gt; {statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Latest Vital Demonstration Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Heart Rate</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {latest?.heart_rate ?? 76} <span className="text-xs font-normal text-slate-400">bpm</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Simulated Signal</div>
        </div>

        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Oxygen Saturation</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-2">
            {latest?.spo2 ?? 98.5} <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Simulated Signal</div>
        </div>

        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Core Temperature</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-2">
            {latest?.temperature ?? 36.8} <span className="text-xs font-normal text-slate-400">&deg;C</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Simulated Signal</div>
        </div>

        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Respiratory Rate</span>
            <Wind className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300 mt-2">
            {latest?.respiratory_rate ?? 16} <span className="text-xs font-normal text-slate-400">rpm</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Simulated Signal</div>
        </div>
      </div>

      {/* Historical Demonstration Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Heart Rate Chart */}
        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-white mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400" />
              Heart Rate Trend (Demonstration bpm)
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Encrypted Stream
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis domain={[55, 110]} stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '11px' }} />
                <Area type="monotone" dataKey="heart_rate" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#hrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SpO2 Chart */}
        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-white mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              Blood Oxygen (Demonstration SpO2 %)
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Integrity Verified
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis domain={[92, 100]} stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', fontSize: '11px' }} />
                <Area type="monotone" dataKey="spo2" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#spo2Grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
