import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Heart, Thermometer, Wind, RefreshCw, 
  Send, ShieldCheck, AlertCircle, Droplets, Gauge, 
  Radio, CheckCircle2, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid 
} from 'recharts';
import { Device, TelemetryRecord } from '../types';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export const LiveTelemetry: React.FC = () => {
  const { isDark } = useTheme();

  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('MED-001');
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load all registered demonstration devices
  const loadDevices = async () => {
    try {
      const devs = await api.getDevices();
      setDevices(devs);
      if (devs.length > 0 && !devs.find(d => d.device_id === selectedDeviceId)) {
        setSelectedDeviceId(devs[0].device_id);
      }
    } catch (err: any) {
      setErrorMessage('Failed to load registered medical devices from gateway.');
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const selectedDevice = useMemo(() => {
    return devices.find(d => d.device_id === selectedDeviceId);
  }, [devices, selectedDeviceId]);

  // Fetch telemetry history for selected device
  const fetchHistory = async () => {
    if (!selectedDeviceId) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await api.getTelemetryHistory(selectedDeviceId, 30);
      setTelemetry(data);
    } catch (err: any) {
      setErrorMessage('Failed to fetch telemetry history for ' + selectedDeviceId);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedDeviceId]);

  // Ingest synthetic telemetry packet through backend ingestion pipeline
  const handleSendTelemetryPacket = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const record = await api.streamDemoTelemetry(selectedDeviceId);
      setStatusMsg(`Packet successfully verified & ingested: Heart Rate ${record.heart_rate ?? 'N/A'} bpm, SpO2 ${record.spo2 ?? 'N/A'}% [Hash: SHA-256 verified]`);
      // Re-fetch to update graph and cards
      await fetchHistory();
      // Also refresh device status in list
      loadDevices();
    } catch (err: any) {
      setStatusMsg(`Ingestion rejected: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Periodic auto-stream using backend ingestion
  useEffect(() => {
    let interval: any = null;
    if (isStreaming) {
      interval = setInterval(() => {
        handleSendTelemetryPacket();
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isStreaming, selectedDeviceId]);

  const latest = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

  // Format timestamps for recharts
  const chartData = useMemo(() => {
    return telemetry.map(t => {
      const d = new Date(t.timestamp);
      return {
        time: isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        heart_rate: t.heart_rate,
        spo2: t.spo2,
        temperature: t.temperature,
        respiratory_rate: t.respiratory_rate,
      };
    });
  }, [telemetry]);

  // Theme styling for charts
  const gridStroke = isDark ? '#1F2937' : '#E2E8F0';
  const axisStroke = isDark ? '#64748B' : '#94A3B8';
  const tooltipStyle = isDark
    ? { backgroundColor: '#111827', borderColor: '#374151', color: '#F3F4F6', fontSize: '11px', borderRadius: '8px' }
    : { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#172033', fontSize: '11px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' };

  // Render device-specific metrics cards based on device type
  const renderMetricCards = () => {
    const devType = selectedDevice?.device_type || 'PATIENT_MONITOR';

    switch (devType) {
      case 'PATIENT_MONITOR':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Heart Rate</span>
                <Heart className="w-4 h-4 text-[#E63946]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#172033] dark:text-white mt-2">
                {latest?.heart_rate ?? '--'} <span className="text-xs font-normal text-slate-400">bpm</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION DATA ONLY</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Oxygen Saturation</span>
                <Activity className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-300 mt-2">
                {latest?.spo2 ?? '--'} <span className="text-xs font-normal text-slate-400">%</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION DATA ONLY</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Core Temperature</span>
                <Thermometer className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-300 mt-2">
                {latest?.temperature ?? '--'} <span className="text-xs font-normal text-slate-400">&deg;C</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION DATA ONLY</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Respiratory Rate</span>
                <Wind className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-300 mt-2">
                {latest?.respiratory_rate ?? '--'} <span className="text-xs font-normal text-slate-400">rpm</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION DATA ONLY</div>
            </div>
          </div>
        );

      case 'PULSE_OXIMETER':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Blood Oxygen Saturation (SpO2)</span>
                <Activity className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-3xl font-bold font-mono text-cyan-600 dark:text-cyan-300 mt-2">
                {latest?.spo2 ?? '--'} <span className="text-xs font-normal text-slate-400">%</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION DATA ONLY</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Pulse Rate</span>
                <Heart className="w-4 h-4 text-[#E63946]" />
              </div>
              <div className="text-3xl font-bold font-mono text-[#172033] dark:text-white mt-2">
                {latest?.heart_rate ?? '--'} <span className="text-xs font-normal text-slate-400">bpm</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION DATA ONLY</div>
            </div>
          </div>
        );

      case 'INFUSION_PUMP':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Infusion Flow Rate</span>
                <Droplets className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-2">
                25.0 <span className="text-xs font-normal text-slate-400">mL/h</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">OPERATIONAL • DEMONSTRATION</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Occlusion Pressure</span>
                <Gauge className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
                4.2 <span className="text-xs font-normal text-slate-400">psi</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">NORMAL RANGE</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Pump State</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                INFUSING
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">VOL INFUSED: 124.5 mL</div>
            </div>
          </div>
        );

      case 'VENTILATOR':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Respiratory Rate</span>
                <Wind className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-300 mt-2">
                {latest?.respiratory_rate ?? 18} <span className="text-xs font-normal text-slate-400">rpm</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION ONLY</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>PEEP Pressure</span>
                <Gauge className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-300 mt-2">
                5.0 <span className="text-xs font-normal text-slate-400">cmH2O</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">TARGET LEVEL</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Tidal Volume</span>
                <Wind className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-2">
                480 <span className="text-xs font-normal text-slate-400">mL</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">SYNTHETIC VITAL</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>FiO2 Delivered</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                35.0 <span className="text-xs font-normal text-slate-400">%</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION ONLY</div>
            </div>
          </div>
        );

      case 'BLOOD_PRESSURE_MONITOR':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Systolic Pressure</span>
                <Gauge className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-3xl font-bold font-mono text-[#172033] dark:text-white mt-2">
                122 <span className="text-xs font-normal text-slate-400">mmHg</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION DATA</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Diastolic Pressure</span>
                <Gauge className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-300 mt-2">
                81 <span className="text-xs font-normal text-slate-400">mmHg</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION DATA</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Pulse Rate</span>
                <Heart className="w-4 h-4 text-[#E63946]" />
              </div>
              <div className="text-3xl font-bold font-mono text-[#172033] dark:text-white mt-2">
                {latest?.heart_rate ?? 74} <span className="text-xs font-normal text-slate-400">bpm</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION DATA</div>
            </div>
          </div>
        );

      case 'TEMPERATURE_MONITOR':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Body Temperature</span>
                <Thermometer className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
                {latest?.temperature ?? 37.1} <span className="text-xs font-normal text-slate-400">&deg;C</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION DATA ONLY</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Sensor Status</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                CALIBRATED
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">NIST FIPS 204 SIGNED</div>
            </div>
          </div>
        );

      case 'ECG_MONITOR':
      default:
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Heart Rate (Lead II)</span>
                <Heart className="w-4 h-4 text-[#E63946]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#172033] dark:text-white mt-2">
                {latest?.heart_rate ?? 75} <span className="text-xs font-normal text-slate-400">bpm</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION DATA ONLY</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>Oxygen Saturation</span>
                <Activity className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-300 mt-2">
                {latest?.spo2 ?? 98.2} <span className="text-xs font-normal text-slate-400">%</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">DEMONSTRATION DATA ONLY</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>ST Segment</span>
                <Activity className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-2">
                0.02 <span className="text-xs font-normal text-slate-400">mV</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">NORMAL SINUS</div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs">
                <span>PR Interval</span>
                <Activity className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-2">
                160 <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">SYNTHETIC READING</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 text-[#172033] dark:text-[#F3F4F6] transition-colors duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#E63946]" />
          <span>Device Monitoring</span>
        </h1>
        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Monitor real-time demonstration telemetry, vital trend curves, and cryptographic transmission records across registered hospital IoMT devices.
        </p>
      </div>

      {/* Mandatory Clinical Disclaimer Banner */}
      <div className="rounded-xl p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-start gap-3 shadow-sm">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono">
            DEMONSTRATION DATA ONLY —{' '}
          </span>
          All vital signs and operational readings are synthetically generated for cybersecurity evaluation and device verification. This platform does not connect to real human patients and does not provide clinical diagnosis or treatment.
        </div>
      </div>

      {/* Control Bar & Device Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111827] p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-[#E63946]">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">Connected Medical Device Telemetry</div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400">
              {selectedDevice ? `${selectedDevice.device_name} • ${selectedDevice.device_type}` : 'Selecting Device...'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Device Selector with all 12 Registered Devices */}
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#F5F7FA] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 text-xs font-mono font-semibold text-[#172033] dark:text-cyan-300 outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent max-w-xs truncate"
          >
            {devices.map(d => (
              <option key={d.device_id} value={d.device_id}>
                {d.device_id} — {d.device_name} ({d.connection_status})
              </option>
            ))}
          </select>

          {/* Auto-Stream Toggle */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
              isStreaming 
                ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30' 
                : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-[#E63946] animate-ping' : 'bg-emerald-500'}`}></span>
            <span>{isStreaming ? 'Stop Auto-Stream' : 'Start Auto-Stream'}</span>
          </button>

          {/* Send Encrypted Packet Button */}
          <button
            onClick={handleSendTelemetryPacket}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-[#E63946] hover:bg-[#D62839] active:bg-[#C51F30] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            title="Ingest an authenticated, encrypted synthetic packet into SQLite"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Encrypted Packet</span>
          </button>
        </div>
      </div>

      {/* Selected Device Status Pill Bar */}
      {selectedDevice && (
        <div className="flex flex-wrap items-center justify-between text-xs px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="text-slate-400">Device ID:</span>
              <span className="font-mono font-bold">{selectedDevice.device_id}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="text-slate-400">Type:</span>
              <span className="font-semibold">{selectedDevice.device_type}</span>
            </span>
            <span className="hidden md:flex items-center space-x-1.5">
              <span className="text-slate-400">Last Seen:</span>
              <span className="font-mono text-[11px]">{new Date(selectedDevice.last_seen).toLocaleTimeString()}</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 mt-1 sm:mt-0">
            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              selectedDevice.connection_status === 'ONLINE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${selectedDevice.connection_status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              <span>{selectedDevice.connection_status}</span>
            </span>

            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              selectedDevice.trust_status === 'TRUSTED'
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                : selectedDevice.trust_status === 'SUSPICIOUS'
                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
            }`}>
              <ShieldCheck className="w-3 h-3" />
              <span>{selectedDevice.trust_status}</span>
            </span>
          </div>
        </div>
      )}

      {/* Real-time Status Notification */}
      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 text-xs font-mono text-emerald-800 dark:text-cyan-300 flex items-center justify-between">
          <span className="truncate">&gt; {statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white ml-2 text-base leading-none">&times;</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#E63946]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dynamic Device Metric Cards */}
      {renderMetricCards()}

      {/* Historical Telemetry Graphs (Heart Rate Trend & Blood Oxygen) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* A. Heart Rate Graph */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-[#E63946]" />
              <span>Heart Rate Trend (Demonstration bpm)</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
              Encrypted Telemetry
            </span>
          </div>

          <div className="h-60 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
                <Heart className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                <p className="font-semibold text-slate-600 dark:text-slate-400">No telemetry recorded for this device yet</p>
                <p className="text-[11px] text-slate-400 mt-1">Click "Send Encrypted Packet" to ingest an initial reading</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E63946" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#E63946" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="time" stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <YAxis domain={['auto', 'auto']} stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [`${val} bpm`, 'Heart Rate']} />
                  <Area 
                    type="monotone" 
                    dataKey="heart_rate" 
                    stroke="#E63946" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#hrGrad)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 text-[10px] text-slate-400 text-center font-mono">
            X-Axis: Local Time &bull; Y-Axis: Demonstration BPM &bull; SQLite Verified
          </div>
        </div>

        {/* B. Blood Oxygen (SpO2) Graph */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-500" />
              <span>Blood Oxygen (Demonstration SpO2 %)</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-500/20">
              Integrity Verified
            </span>
          </div>

          <div className="h-60 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
                <Activity className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                <p className="font-semibold text-slate-600 dark:text-slate-400">No telemetry recorded for this device yet</p>
                <p className="text-[11px] text-slate-400 mt-1">Click "Send Encrypted Packet" to ingest an initial reading</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="time" stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <YAxis domain={[90, 100]} stroke={axisStroke} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [`${val}%`, 'Oxygen Saturation']} />
                  <Area 
                    type="monotone" 
                    dataKey="spo2" 
                    stroke="#06b6d4" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#spo2Grad)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 text-[10px] text-slate-400 text-center font-mono">
            X-Axis: Local Time &bull; Y-Axis: Oxygen Saturation (%) &bull; SQLite Verified
          </div>
        </div>
      </div>
    </div>
  );
};
