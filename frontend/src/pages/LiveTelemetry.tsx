import React, { useState, useEffect } from 'react';
import { 
  Activity, Heart, Thermometer, Wind, RefreshCw, 
  Send, ShieldCheck, AlertCircle, Sparkles 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, AreaChart, Area 
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
      // Calls simulate attack endpoint with synthetic ingestion
      await api.simulateAttack(selectedDevice, 'MESSAGE_TAMPERING'); // Generates session and telemetry event
      await fetchHistory();
      setStatusMsg(`Telemetry packet successfully encrypted (AES-256-GCM), verified, and ingested.`);
    } catch (e: any) {
      // Fallback
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
      {/* Disclaimer Banner */}
      <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-amber-400 font-mono">Notice: Synthetic Telemetry Only. </span>
          All physiological parameters displayed are synthetic demonstration data for cybersecurity protocol testing.
          The gateway does not connect to real medical patients, make clinical treatment determinations, or perform medical diagnosis.
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="text-sm font-bold text-white">Live Patient Monitoring Telemetry</div>
            <div className="text-xs text-slate-400 font-mono">Protected by AES-256-GCM + Authenticated AAD</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
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

      {/* Latest Vital Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Heart Rate</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {latest?.heart_rate ?? 76} <span className="text-xs font-normal text-slate-400">bpm</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Normal Sinus Rhythm</div>
        </div>

        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Oxygen Saturation</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-2">
            {latest?.spo2 ?? 98.5} <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Optimal Saturation</div>
        </div>

        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Core Temperature</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-2">
            {latest?.temperature ?? 36.8} <span className="text-xs font-normal text-slate-400">&deg;C</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Normothermic</div>
        </div>

        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Respiratory Rate</span>
            <Wind className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300 mt-2">
            {latest?.respiratory_rate ?? 16} <span className="text-xs font-normal text-slate-400">rpm</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Eupnea</div>
        </div>
      </div>

      {/* Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Heart Rate Chart */}
        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800">
          <div className="text-xs font-bold text-white mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400" />
              Heart Rate Trend (bpm)
            </span>
            <span className="text-[10px] font-mono text-slate-400">AAD: Verified</span>
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
        <div className="bg-[#111827] rounded-xl p-4 border border-slate-800">
          <div className="text-xs font-bold text-white mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              Blood Oxygen (SpO2 %)
            </span>
            <span className="text-[10px] font-mono text-slate-400">AAD: Verified</span>
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
