import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Radio, Activity, Lock, 
  ArrowUpRight, AlertTriangle, CheckCircle2, HardDriveDownload,
  Server, Clock, Info, X, ShieldX, RefreshCw, Cpu, Zap,
  TrendingUp, Wifi, Check, AlertCircle, Eye, ArrowRight, Database,
  Heart, Droplets, Sliders, ToggleLeft, ToggleRight, Stethoscope
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid
} from 'recharts';
import { SecurityStats, SecurityEvent } from '../types';
import { Badge } from '../components/Badge';
import { api } from '../services/api';
import { formatEventToHospitalLanguage } from '../utils/securityLanguage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface OverviewProps {
  stats: SecurityStats | null;
  onNavigate: (page: string) => void;
}

interface BedsideTelemetryDevice {
  id: string;
  name: string;
  type: string;
  location: string;
  patient: string;
  physician: string;
  primaryMetric: {
    label: string;
    value: string;
    unit: string;
    status: string;
  };
  secondaryMetric: {
    label: string;
    value: string;
    unit: string;
    status: string;
  };
  security: string;
  hasWaveform?: boolean;
}

const BEDSIDE_DEVICES: BedsideTelemetryDevice[] = [
  {
    id: 'MED-001',
    name: 'Bedside ECG Monitor',
    type: 'Cardiac Monitor',
    location: 'ICU Ward 04',
    patient: 'Aarav Sharma',
    physician: 'Dr. Sarah Jenkins',
    primaryMetric: { label: 'Heart Rate', value: '74', unit: 'bpm', status: 'Sinus Rhythm' },
    secondaryMetric: { label: 'Blood Oxygen', value: '98%', unit: 'SpO2', status: 'Optimum' },
    security: 'AES-256-GCM (Payload Tag Valid)',
    hasWaveform: true,
  },
  {
    id: 'MED-002',
    name: 'Smart Infusion Pump',
    type: 'Infusion Pump',
    location: 'ICU Ward 07',
    patient: 'Emily Carter',
    physician: 'Dr. Rajesh Sharma',
    primaryMetric: { label: 'Infusion Rate', value: '125', unit: 'mL/h', status: 'Flow Normal' },
    secondaryMetric: { label: 'Total Volume', value: '450', unit: 'mL', status: 'Target OK' },
    security: 'ML-KEM-768 (PQC Session Active)',
    hasWaveform: false,
  },
  {
    id: 'MED-003',
    name: 'Intensive Ventilator',
    type: 'Mechanical Ventilator',
    location: 'Critical Care 02',
    patient: 'Vikram Malhotra',
    physician: 'Dr. Elena Rostova',
    primaryMetric: { label: 'Respiration Rate', value: '16', unit: 'bpm', status: 'Synchronized' },
    secondaryMetric: { label: 'Tidal Volume', value: '480', unit: 'mL', status: 'Stable' },
    security: 'Anti-Replay Window (#1042 Verified)',
    hasWaveform: false,
  },
  {
    id: 'MED-004',
    name: 'Vital Signs Monitor',
    type: 'Multiparameter Monitor',
    location: 'Emergency 01',
    patient: 'Priya Patel',
    physician: 'Dr. Marcus Vance',
    primaryMetric: { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', status: 'Normotensive' },
    secondaryMetric: { label: 'Pulse Rate', value: '76', unit: 'bpm', status: 'Normal' },
    security: 'ML-DSA-65 (Signature Validated)',
    hasWaveform: false,
  },
  {
    id: 'MED-005',
    name: 'Bedside Dialysis Unit',
    type: 'Hemodialysis System',
    location: 'Renal Care 03',
    patient: 'David Miller',
    physician: 'Dr. Arjun Nair',
    primaryMetric: { label: 'Blood Flow', value: '300', unit: 'mL/min', status: 'Prescribed' },
    secondaryMetric: { label: 'Dialysate Temp', value: '36.8', unit: '°C', status: 'Normothermic' },
    security: 'NIST FIPS 203 Validated',
    hasWaveform: false,
  },
];

export const Overview: React.FC<OverviewProps> = ({ stats, onNavigate }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [selectedTopologyNode, setSelectedTopologyNode] = useState<string>('gateway');
  const [selectedBedsideId, setSelectedBedsideId] = useState<string>('MED-001');

  const currentBedside = BEDSIDE_DEVICES.find(d => d.id === selectedBedsideId) || BEDSIDE_DEVICES[0];

  // Interactive Defense Module Toggles (Visual parity with Supplements Plan in reference)
  const [defenseToggles, setDefenseToggles] = useState({
    pqcHandshake: true,
    digitalSignatures: true,
    antiReplay: true,
    tamperDefense: true
  });

  const toggleModule = (key: keyof typeof defenseToggles) => {
    setDefenseToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Metrics calculations
  const totalDevices = stats?.total_devices ?? 12;
  const onlineDevices = stats?.online_devices ?? 10;
  const offlineDevices = stats?.offline_devices ?? 2;
  const suspiciousDevices = stats?.suspicious_devices ?? 0;
  const revokedDevices = stats?.revoked_devices ?? 0;
  const attacksBlocked = stats?.attacks_blocked ?? 24;
  const activeSessions = stats?.active_sessions ?? 8;
  const criticalAlerts = stats?.recent_events?.filter(e => e.severity === 'CRITICAL').length ?? 0;

  const trustedCount = Math.max(0, totalDevices - suspiciousDevices - revokedDevices);
  const trustScore = totalDevices > 0 ? Math.round((trustedCount / totalDevices) * 100) : 98;

  // Ultra-smooth spline wave data (Matching GeneX Health Analytics curve)
  const waveAnalyticsData = [
    { month: 'Jan', throughput: 180, threats: 4 },
    { month: 'Feb', throughput: 230, threats: 6 },
    { month: 'Mar', throughput: 195, threats: 2 },
    { month: 'Apr', throughput: 310, threats: 8 },
    { month: 'May', throughput: 280, threats: 5 },
    { month: 'Jun', throughput: 360, threats: 3 },
  ];

  const recentIncidents = stats?.recent_events && stats.recent_events.length > 0 
    ? stats.recent_events.slice(0, 2) 
    : [
        {
          id: 1,
          event_id: 'EVT-9042',
          event_type: 'TAMPERING_DETECTION',
          attack_type: 'MESSAGE_TAMPERING',
          device_id: 'MED-003',
          severity: 'HIGH' as const,
          result: 'BLOCKED' as const,
          reason: 'AES-GCM authentication tag mismatch. Packet dropped in transit.',
          timestamp: new Date().toISOString(),
          detection_module: 'GCM_TAG_VERIFIER'
        },
        {
          id: 2,
          event_id: 'EVT-9041',
          event_type: 'REPLAY_ATTACK',
          attack_type: 'REPLAY_ATTACK',
          device_id: 'MED-001',
          severity: 'HIGH' as const,
          result: 'REJECTED' as const,
          reason: 'Duplicate sequence counter #1024 rejected by anti-replay sliding window.',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          detection_module: 'REPLAY_WINDOW'
        }
      ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* =========================================================================
          ROW 1: HERO WELCOME + DEVICE TRUST SCORE + ACTIVE DEFENSE INCIDENTS
          (Matches exact layout composition with Red & Black Dark Theme)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Hero Card (approx 55% / col-span-7) */}
        <div className="lg:col-span-7 bg-white dark:bg-gradient-to-br dark:from-[#150508] dark:via-[#0E0305] dark:to-[#070102] rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-[#2A0910] shadow-sm dark:shadow-[0_12px_40px_rgba(220,38,38,0.1)] relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-2 max-w-md">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B1733] dark:text-white tracking-tight">
              Hello, <span className="text-[#0B1733] dark:text-white">{user?.full_name || 'Dr. Rajesh Sharma'}</span>!
            </h1>
            <p className="text-xs text-slate-500 dark:text-red-400 font-medium flex items-center gap-1.5">
              <span>Hospital IoMT Critical Cardiac & Bedside Security is active &gt;</span>
            </p>
          </div>

          {/* Futuristic Cyber-Medical Visual Art: Cyber-Cardiac Heart in Dark, Cryptographic Lattice in Light */}
          <div className="my-4 relative h-36 md:h-44 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-slate-50/60 via-[#35C5E8]/10 to-slate-50/60 dark:from-[#090204] dark:via-[#1A050A]/70 dark:to-[#090204] border border-slate-100 dark:border-[#2A0910]">
            {isDark ? (
              /* Cyber-Cardiac Glowing Red Heart & Pulsing ECG Waveform (CardioLife Reference Parity) */
              <svg viewBox="0 0 600 160" fill="none" className="w-full h-full object-cover">
                <defs>
                  <radialGradient id="cardioGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity="0.4" />
                    <stop offset="65%" stopColor="#991B1B" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#080204" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="ecgGradRed" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7F1D1D" stopOpacity="0.2" />
                    <stop offset="25%" stopColor="#DC2626" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
                    <stop offset="75%" stopColor="#EF4444" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0.2" />
                  </linearGradient>
                  <filter id="crimsonBloom" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Ambient Red Heart Glow Bloom */}
                <circle cx="300" cy="80" r="95" fill="url(#cardioGlow)" />

                {/* High-tech Stylized 3D Anatomical Heart Geometry */}
                <g transform="translate(258, 28) scale(0.68)">
                  {/* Heart Muscle Body Silhouette */}
                  <path
                    d="M 65 30 C 45 12, 15 18, 10 50 C 5 78, 38 108, 65 135 C 92 108, 125 78, 120 50 C 115 18, 85 12, 65 30 Z"
                    fill="#35060B"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                    filter="url(#crimsonBloom)"
                  />
                  {/* Coronary Vascular Networks */}
                  <path d="M 65 38 Q 60 72, 42 92 M 65 38 Q 75 75, 90 100 M 45 62 Q 32 72, 22 68 M 80 66 Q 98 72, 108 68" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.85" />
                  {/* Aorta and major vessels */}
                  <path d="M 55 30 V 12 C 55 6, 75 6, 75 12 V 30" stroke="#EF4444" strokeWidth="2.2" fill="#580810" />
                  <path d="M 42 32 Q 36 16, 26 16" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M 88 32 Q 94 16, 104 16" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </g>

                {/* Subtle Cardiac Grid Lines */}
                <line x1="20" y1="40" x2="580" y2="40" stroke="#2A0910" strokeWidth="0.8" strokeDasharray="4 4" />
                <line x1="20" y1="80" x2="580" y2="80" stroke="#3A0C14" strokeWidth="0.8" strokeDasharray="4 4" />
                <line x1="20" y1="120" x2="580" y2="120" stroke="#2A0910" strokeWidth="0.8" strokeDasharray="4 4" />

                {/* Glowing Red ECG Cardiac Rhythm (P-Q-R-S-T wave pulse) */}
                <path
                  d="M 20 80 H 130 L 140 73 L 148 80 L 155 80 L 165 92 L 175 20 L 188 124 L 198 80 L 210 80 L 225 65 L 245 80 H 330 L 340 73 L 348 80 L 355 80 L 365 92 L 375 20 L 388 124 L 398 80 L 410 80 L 425 65 L 445 80 H 580"
                  stroke="url(#ecgGradRed)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="animate-ecg-line"
                  filter="url(#crimsonBloom)"
                />

                {/* R-Peak Detection Nodes on Heartbeat */}
                <circle cx="175" cy="20" r="3.5" fill="#FFFFFF" className="animate-ping" opacity="0.8" />
                <circle cx="175" cy="20" r="3" fill="#EF4444" />
                <circle cx="375" cy="20" r="3.5" fill="#FFFFFF" className="animate-ping" opacity="0.8" />
                <circle cx="375" cy="20" r="3" fill="#EF4444" />
              </svg>
            ) : (
              /* Hospital IoMT Cybersecurity Defense Architecture Grid in Light Mode (Static, Zero Distraction) */
              <div className="w-full h-full p-3.5 flex flex-col justify-between select-none">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 h-full items-stretch">
                  {/* Pillar 1: Clinical Bedside Fleet */}
                  <div className="p-3 rounded-2xl bg-white/95 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 font-mono flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-[#0284C7]" />
                          <span>Clinical IoMT Fleet</span>
                        </span>
                        <span className="w-2 h-2 rounded-full bg-[#19B77A]" />
                      </div>
                      <div className="mt-2 text-xs font-bold text-[#0B1733]">
                        Bedside Medical Devices
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ECG • Infusion • Ventilator
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1.5 border-t border-slate-100">
                      <span>Payload Guard:</span>
                      <span className="text-[#0284C7] font-bold">AES-256-GCM</span>
                    </div>
                  </div>

                  {/* Pillar 2: SecuraMed Zero-Trust Gateway */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-50/90 to-cyan-50/70 border border-sky-200/90 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-sky-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 font-mono flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#19B77A]" />
                          <span>IoMT Gateway Core</span>
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold">
                          FIPS 203
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-bold text-[#0B1733]">
                        ML-KEM-768 Decryption
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Post-Quantum Key Exchange
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1.5 border-t border-sky-100">
                      <span>Interception:</span>
                      <span className="text-[#19B77A] font-bold">100% Zero-Trust</span>
                    </div>
                  </div>

                  {/* Pillar 3: Hospital Central SOC & Merkle Audit */}
                  <div className="p-3 rounded-2xl bg-white/95 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 font-mono flex items-center gap-1.5">
                          <Server className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Central SOC Server</span>
                        </span>
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      </div>
                      <div className="mt-2 text-xs font-bold text-[#0B1733]">
                        Anti-Replay & Merkle Logs
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Tamper-Proof Audit Chain
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1.5 border-t border-slate-100">
                      <span>Audit Integrity:</span>
                      <span className="text-indigo-700 font-bold">SHA-256 Synced</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Glowing floating status badge inside art */}
            <div className="absolute right-4 bottom-3 px-3 py-1 rounded-full bg-white/95 dark:bg-[#0A0204]/90 backdrop-blur-md border border-slate-200/80 dark:border-red-600/40 text-[10px] font-mono text-[#0B1733] dark:text-[#F87171] font-bold shadow-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#19B77A] dark:bg-[#EF4444] animate-pulse" />
              <span>{isDark ? 'CARDIAC IoMT SECURE • 74 BPM' : 'HOSPITAL CLINICAL IoMT SECURED • VLAN 10'}</span>
            </div>
          </div>

          {/* Quick Sub-Stats Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 border-t border-slate-100 dark:border-[#2A0910]">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Protected Bedside Nodes: <strong className="text-[#35C5E8] dark:text-[#EF4444] font-mono">{totalDevices}</strong>
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="font-semibold text-[#19B77A] dark:text-red-400">
              100% Interception Rate
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
              NIST FIPS 203 / 204
            </span>
          </div>
        </div>

        {/* Center: Device Trust Score Card (approx 25% / col-span-2) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#120508] rounded-3xl p-6 border border-slate-200/80 dark:border-[#2A0910] shadow-sm dark:shadow-[0_8px_30px_rgba(220,38,38,0.06)] flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Fleet Trust Score
            </div>
            <div className="mt-2 text-4xl font-black text-[#0B1733] dark:text-white font-mono tracking-tight">
              {trustScore}<span className="text-lg font-normal text-slate-400 dark:text-slate-500">%</span>
            </div>
            <div className="text-[11px] text-[#19B77A] dark:text-[#EF4444] font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Optimal Security State</span>
            </div>
          </div>

          {/* Mini Sparkline Chart */}
          <div className="h-16 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { m: 'Jan', v: 92 }, { m: 'Feb', v: 94 }, { m: 'Mar', v: 91 },
                { m: 'Apr', v: 97 }, { m: 'May', v: 98 }
              ]}>
                <defs>
                  <linearGradient id="trustMini" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "#EF4444" : "#35C5E8"} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={isDark ? "#EF4444" : "#35C5E8"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={isDark ? "#EF4444" : "#35C5E8"} strokeWidth={2} fill="url(#trustMini)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-[#2A0910] text-xs space-y-1">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-slate-400">Verified:</span>
              <span className="font-bold text-[#19B77A] dark:text-[#EF4444]">{trustedCount} devices</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-slate-400">Attention:</span>
              <span className="font-bold text-[#F5A623] dark:text-amber-400">{suspiciousDevices + revokedDevices} devices</span>
            </div>
          </div>
        </div>

        {/* Right: Active Defense Incidents Feed (Signature Red Card in Dark Mode - GeneX & CardioLife Parity) */}
        <div className="lg:col-span-3 bg-white dark:bg-gradient-to-br dark:from-[#881337] dark:via-[#7F1D1D] dark:to-[#450A0A] rounded-3xl p-6 border border-slate-200/80 dark:border-red-600/40 shadow-sm dark:shadow-[0_12px_40px_rgba(220,38,38,0.25)] flex flex-col justify-between text-[#0B1733] dark:text-white">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-red-800/40">
              <span className="text-xs font-bold text-[#0B1733] dark:text-white">Active Defense Incidents</span>
              <span className="text-[10px] font-mono text-[#E94B5B] dark:text-white bg-[#E94B5B]/10 dark:bg-white/20 px-2 py-0.5 rounded font-bold">
                {recentIncidents.length} Logged
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {recentIncidents.map((inc) => (
                <div 
                  key={inc.id}
                  onClick={() => setSelectedEvent(inc)}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-black/35 border border-slate-100 dark:border-red-900/40 hover:border-[#35C5E8]/40 dark:hover:border-white/50 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#35C5E8] dark:text-white">{inc.device_id}</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#E94B5B]/15 dark:bg-white/20 text-[#E94B5B] dark:text-white">
                      {inc.result}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#0B1733] dark:text-white truncate">
                    {inc.attack_type?.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-red-200 font-mono">
                    {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('attacks')}
            className="w-full mt-3 py-2 px-3 rounded-2xl bg-slate-100 dark:bg-white hover:bg-slate-200 dark:hover:bg-slate-100 text-[#0B1733] dark:text-[#7F1D1D] text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <span>Launch Attack Simulator</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#35C5E8] dark:text-[#7F1D1D]" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: CRYPTOGRAPHIC ENFORCEMENT PILLS + DEFENSE TOGGLES + VITALS + WAVE CHART
          (Matches GeneX row with Red & Black Dark Theme styling)
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
        {/* Card A: Bedside Telemetry Stream with Multi-Device Switcher (Strictly Hospital IoMT) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#120508] rounded-3xl p-6 border border-slate-200/80 dark:border-[#2A0910] shadow-sm dark:shadow-[0_8px_30px_rgba(220,38,38,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#2A0910]">
              <span className="text-xs font-bold text-[#0B1733] dark:text-white">Bedside Telemetry Stream</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#19B77A] dark:text-red-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#19B77A] dark:bg-[#EF4444] animate-pulse" />
                <span>LIVE FLEET</span>
              </span>
            </div>

            {/* Device Switcher Tab Pills */}
            <div className="pt-2 pb-1">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {BEDSIDE_DEVICES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedBedsideId(d.id)}
                    className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold transition-all shrink-0 ${
                      selectedBedsideId === d.id
                        ? 'bg-[#0B1733] text-white dark:bg-gradient-to-r dark:from-red-600 dark:to-rose-700 shadow-sm border border-[#35C5E8]/40 dark:border-red-500'
                        : 'bg-slate-100 dark:bg-[#1A060C] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                    }`}
                  >
                    {d.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Device Meta (Ward, Patient, Attending Physician) */}
            <div className="mt-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-black/35 border border-slate-100 dark:border-red-950/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B1733] dark:text-white truncate">
                  {currentBedside.name}
                </span>
                <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-red-950/60 text-sky-800 dark:text-red-300">
                  {currentBedside.location}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-0.5">
                <span>Pt: <strong className="text-slate-700 dark:text-slate-200">{currentBedside.patient}</strong></span>
                <span>Dr: <strong className="text-slate-700 dark:text-slate-200">{currentBedside.physician}</strong></span>
              </div>
            </div>

            {/* Vitals Telemetry Metrics */}
            <div className="mt-3 space-y-3">
              {/* Primary Metric */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E94B5B]/10 dark:bg-red-950/50 text-[#E94B5B] dark:text-[#EF4444] flex items-center justify-center">
                    <Heart className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">{currentBedside.primaryMetric.label}</div>
                    <div className="text-base font-extrabold text-[#0B1733] dark:text-white font-mono">
                      {currentBedside.primaryMetric.value} <span className="text-[11px] font-normal text-slate-400">{currentBedside.primaryMetric.unit}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#19B77A] dark:text-red-400 bg-[#19B77A]/10 dark:bg-red-950/40 px-2 py-0.5 rounded font-semibold border border-transparent dark:border-red-900/40">
                  {currentBedside.primaryMetric.status}
                </span>
              </div>

              {/* Dynamic Live ECG Rhythm Waveform if ECG */}
              {currentBedside.hasWaveform && (
                <div className="w-full h-7 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-red-950/60 px-3 py-1 flex items-center overflow-hidden">
                  <svg viewBox="0 0 240 20" fill="none" className="w-full h-full">
                    <path
                      d="M 0 10 H 30 L 36 6 L 42 10 L 46 10 L 52 16 L 58 2 L 64 19 L 68 10 L 76 10 L 84 5 L 92 10 H 130 L 136 6 L 142 10 L 146 10 L 152 16 L 158 2 L 164 19 L 168 10 L 176 10 L 184 5 L 192 10 H 240"
                      stroke={isDark ? "#EF4444" : "#0284C7"}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-ecg-line"
                    />
                  </svg>
                </div>
              )}

              {/* Secondary Metric */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#35C5E8]/10 dark:bg-red-950/40 text-[#35C5E8] dark:text-[#F87171] flex items-center justify-center">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">{currentBedside.secondaryMetric.label}</div>
                    <div className="text-base font-extrabold text-[#35C5E8] dark:text-white font-mono">
                      {currentBedside.secondaryMetric.value} <span className="text-[11px] font-normal text-slate-400">{currentBedside.secondaryMetric.unit}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#35C5E8] dark:text-red-400 bg-[#35C5E8]/10 dark:bg-red-950/40 px-2 py-0.5 rounded font-semibold border border-transparent dark:border-red-900/40">
                  {currentBedside.secondaryMetric.status}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#2A0910] flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400">Payload Security:</span>
            <span className="text-[#19B77A] dark:text-[#EF4444] font-bold truncate ml-1">{currentBedside.security}</span>
          </div>
        </div>

        {/* Card B: Autonomous Defense Modules with Toggles (col-span-4) (Like Supplements Plan) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#120508] rounded-3xl p-6 border border-slate-200/80 dark:border-[#2A0910] shadow-sm dark:shadow-[0_8px_30px_rgba(220,38,38,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2A0910]">
              <span className="text-xs font-bold text-[#0B1733] dark:text-white">Autonomous Defense Protocols</span>
              <span className="text-[10px] font-mono text-[#19B77A] dark:text-red-400 font-bold">ACTIVE</span>
            </div>

            {/* Toggle List */}
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#1A060C] border border-transparent dark:border-[#2A0910]/60">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#35C5E8] dark:bg-[#EF4444]" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">ML-KEM Key Exchange</span>
                </div>
                <button 
                  onClick={() => toggleModule('pqcHandshake')}
                  className="text-slate-400 hover:text-[#35C5E8] dark:hover:text-[#EF4444] transition-colors"
                >
                  {defenseToggles.pqcHandshake ? (
                    <span className="text-[#19B77A] dark:text-[#EF4444] font-black text-[11px] font-mono">ON</span>
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px]">OFF</span>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#1A060C] border border-transparent dark:border-[#2A0910]/60">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#19B77A] dark:bg-[#DC2626]" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">ML-DSA Signatures</span>
                </div>
                <button 
                  onClick={() => toggleModule('digitalSignatures')}
                  className="text-slate-400 hover:text-[#19B77A] dark:hover:text-[#EF4444] transition-colors"
                >
                  {defenseToggles.digitalSignatures ? (
                    <span className="text-[#19B77A] dark:text-[#EF4444] font-black text-[11px] font-mono">ON</span>
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px]">OFF</span>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#1A060C] border border-transparent dark:border-[#2A0910]/60">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#818CF8] dark:bg-[#B91C1C]" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Anti-Replay Window</span>
                </div>
                <button 
                  onClick={() => toggleModule('antiReplay')}
                  className="text-slate-400 hover:text-[#818CF8] dark:hover:text-[#EF4444] transition-colors"
                >
                  {defenseToggles.antiReplay ? (
                    <span className="text-[#19B77A] dark:text-[#EF4444] font-black text-[11px] font-mono">ON</span>
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px]">OFF</span>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#1A060C] border border-transparent dark:border-[#2A0910]/60">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#F5A623] dark:bg-[#F87171]" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Tamper Tag Verification</span>
                </div>
                <button 
                  onClick={() => toggleModule('tamperDefense')}
                  className="text-slate-400 hover:text-[#F5A623] dark:hover:text-[#EF4444] transition-colors"
                >
                  {defenseToggles.tamperDefense ? (
                    <span className="text-[#19B77A] dark:text-[#EF4444] font-black text-[11px] font-mono">ON</span>
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px]">OFF</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 text-center font-mono">
            Zero-Trust Hospital Network Boundary
          </div>
        </div>

        {/* Card C: Ultra-Smooth Spline Health & Threat Wave Chart (col-span-5) (Like Health Analytics) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#120508] rounded-3xl p-6 border border-slate-200/80 dark:border-[#2A0910] shadow-sm dark:shadow-[0_8px_30px_rgba(220,38,38,0.06)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#2A0910]">
            <div>
              <span className="text-xs font-bold text-[#0B1733] dark:text-white">Protected Throughput Trends</span>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Authenticated monthly telemetry packet volume</p>
            </div>
            <span className="text-xs font-mono text-[#35C5E8] dark:text-red-400 font-bold">Jan - Jun</span>
          </div>

          <div className="h-44 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={waveAnalyticsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="waveGradDyn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "#EF4444" : "#35C5E8"} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={isDark ? "#EF4444" : "#35C5E8"} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke={isDark ? "#7F1D1D" : "#94A3B8"} fontSize={10} tickLine={false} />
                <YAxis stroke={isDark ? "#7F1D1D" : "#94A3B8"} fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDark ? '#120508' : '#0B1733', borderColor: isDark ? '#2A0910' : '#1C3560', borderRadius: '12px', fontSize: '11px' }}
                  itemStyle={{ color: isDark ? '#EF4444' : '#35C5E8' }}
                />
                <Area type="natural" dataKey="throughput" stroke={isDark ? "#EF4444" : "#35C5E8"} strokeWidth={3} fillOpacity={1} fill="url(#waveGradDyn)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500">
            <span>Peak Bandwidth: <strong className="text-slate-700 dark:text-slate-200">360 pkts/s</strong></span>
            <span className="text-[#19B77A] dark:text-red-400 font-bold">100% Cryptographically Intact</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: INTERACTIVE HOSPITAL NETWORK ARCHITECTURE & TOPOLOGY
         ========================================================================= */}
      <div className="bg-white dark:bg-[#120508] rounded-3xl border border-slate-200/80 dark:border-[#2A0910] p-6 md:p-8 shadow-sm dark:shadow-[0_8px_30px_rgba(220,38,38,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-[#2A0910] gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Wifi className="w-5 h-5 text-[#35C5E8] dark:text-[#EF4444]" />
              <h2 className="text-base font-bold text-[#0B1733] dark:text-white">
                Hospital IoMT Defense Architecture & Network Topology
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualizing end-to-end communication from Bedside Medical Devices to Central Security Dashboard.
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#19B77A]/15 dark:bg-red-950/40 text-[#19B77A] dark:text-red-400 font-semibold border border-[#19B77A]/30 dark:border-red-900/40">
              <span className="w-2 h-2 rounded-full bg-[#19B77A] dark:bg-red-500 animate-pulse" />
              Active Topology
            </span>
          </div>
        </div>

        {/* Interactive Architecture Flow Diagram */}
        <div className="pt-6 pb-2">
          {/* Animated Inter-Layer Quantum Packet Transit Pipeline (Active in both Light & Dark modes) */}
          <div className="hidden md:block relative w-full h-4 mb-3 overflow-hidden px-10">
            <svg viewBox="0 0 1000 16" fill="none" className="w-full h-full">
              {/* Static Guide Rail */}
              <line 
                x1="40" 
                y1="8" 
                x2="960" 
                y2="8" 
                stroke={isDark ? "#3A0A12" : "#CBD5E1"} 
                strokeWidth="2" 
                strokeDasharray="6 6" 
              />
              {/* Dynamic Traveling Encrypted Signal Packet */}
              <line 
                x1="40" 
                y1="8" 
                x2="960" 
                y2="8" 
                stroke={isDark ? "#EF4444" : "#0284C7"} 
                strokeWidth="3.2" 
                strokeLinecap="round" 
                className="animate-packet-transit" 
              />
              {/* Layer Waypoint Markers */}
              <circle cx="125" cy="8" r="4.5" fill={isDark ? "#EF4444" : "#0284C7"} />
              <circle cx="375" cy="8" r="4.5" fill={isDark ? "#EF4444" : "#19B77A"} />
              <circle cx="625" cy="8" r="4.5" fill={isDark ? "#EF4444" : "#818CF8"} />
              <circle cx="875" cy="8" r="4.5" fill={isDark ? "#EF4444" : "#F5A623"} />
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1: Medical Devices */}
            <div 
              onClick={() => setSelectedTopologyNode('devices')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedTopologyNode === 'devices'
                  ? 'bg-[#35C5E8]/10 dark:bg-red-950/40 border-[#35C5E8] dark:border-[#EF4444] shadow-md dark:shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                  : 'bg-slate-50 dark:bg-[#1A060C] border-slate-200/80 dark:border-[#2A0910] hover:border-[#35C5E8]/40 dark:hover:border-red-600/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#35C5E8] dark:text-red-400 font-mono">Layer 1</span>
                <span className="w-2 h-2 rounded-full bg-[#19B77A] dark:bg-red-500" />
              </div>
              <h3 className="font-bold text-sm text-[#0B1733] dark:text-white flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-[#35C5E8] dark:text-[#EF4444]" />
                Medical Devices
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                ECG, Infusion Pumps, Ventilators & Patient Monitors.
              </p>
              <div className="mt-3 flex flex-wrap gap-1 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#2A0A12] dark:text-red-200">MED-001</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#2A0A12] dark:text-red-200">MED-003</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#2A0A12] dark:text-red-200">+10</span>
              </div>
            </div>

            {/* Step 2: Hospital IoMT Gateway */}
            <div 
              onClick={() => setSelectedTopologyNode('gateway')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedTopologyNode === 'gateway'
                  ? 'bg-[#19B77A]/10 dark:bg-red-950/40 border-[#19B77A] dark:border-[#EF4444] shadow-md dark:shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                  : 'bg-slate-50 dark:bg-[#1A060C] border-slate-200/80 dark:border-[#2A0910] hover:border-[#19B77A]/40 dark:hover:border-red-600/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#19B77A] dark:text-red-400 font-mono">Layer 2 (PQC)</span>
                <span className="w-2 h-2 rounded-full bg-[#19B77A] dark:bg-red-500 animate-pulse" />
              </div>
              <h3 className="font-bold text-sm text-[#0B1733] dark:text-white flex items-center gap-1.5">
                <Server className="w-4 h-4 text-[#19B77A] dark:text-[#EF4444]" />
                IoMT Gateway
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                ML-KEM-768 Handshake & AES-256 Decryption Engine.
              </p>
              <div className="mt-3 flex flex-wrap gap-1 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-[#19B77A]/20 dark:bg-red-950/60 text-[#19B77A] dark:text-red-300">ML-KEM</span>
                <span className="px-1.5 py-0.5 rounded bg-[#19B77A]/20 dark:bg-red-950/60 text-[#19B77A] dark:text-red-300">AES-GCM</span>
              </div>
            </div>

            {/* Step 3: Central Security Server */}
            <div 
              onClick={() => setSelectedTopologyNode('server')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedTopologyNode === 'server'
                  ? 'bg-[#818CF8]/10 dark:bg-red-950/40 border-[#818CF8] dark:border-[#EF4444] shadow-md dark:shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                  : 'bg-slate-50 dark:bg-[#1A060C] border-slate-200/80 dark:border-[#2A0910] hover:border-[#818CF8]/40 dark:hover:border-red-600/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#818CF8] dark:text-red-400 font-mono">Layer 3</span>
                <span className="w-2 h-2 rounded-full bg-[#818CF8] dark:bg-red-500" />
              </div>
              <h3 className="font-bold text-sm text-[#0B1733] dark:text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#818CF8] dark:text-[#EF4444]" />
                Security Server
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Anomaly Detection, Replay Window & Merkle Chain.
              </p>
              <div className="mt-3 flex flex-wrap gap-1 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#2A0A12] dark:text-red-200">SHA-256</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#2A0A12] dark:text-red-200">Argon2id</span>
              </div>
            </div>

            {/* Step 4: Security Dashboard */}
            <div 
              onClick={() => setSelectedTopologyNode('soc')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedTopologyNode === 'soc'
                  ? 'bg-[#F5A623]/10 dark:bg-red-950/40 border-[#F5A623] dark:border-[#EF4444] shadow-md dark:shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                  : 'bg-slate-50 dark:bg-[#1A060C] border-slate-200/80 dark:border-[#2A0910] hover:border-[#F5A623]/40 dark:hover:border-red-600/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5A623] dark:text-red-400 font-mono">Layer 4</span>
                <span className="w-2 h-2 rounded-full bg-[#F5A623] dark:bg-red-500" />
              </div>
              <h3 className="font-bold text-sm text-[#0B1733] dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#F5A623] dark:text-[#EF4444]" />
                Security Dashboard
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Real-time alerts, device telemetry & attack simulation lab.
              </p>
              <div className="mt-3 flex flex-wrap gap-1 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#2A0A12] dark:text-red-200">SOC Live</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#2A0A12] dark:text-red-200">JWT RBAC</span>
              </div>
            </div>
          </div>

          {/* Node Details Inspection Bar */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-100 dark:bg-[#0E0305] border border-slate-200/80 dark:border-[#2A0910] flex flex-col md:flex-row items-center justify-between text-xs gap-3 font-mono">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <span className="text-[#35C5E8] dark:text-[#EF4444] font-bold">Selected Node:</span>
              <span className="font-bold uppercase text-white bg-[#0B1733] dark:bg-[#7F1D1D] px-2.5 py-0.5 rounded-md">
                {selectedTopologyNode === 'gateway' ? 'SECUREMED-GW-01 (Active Post-Quantum Gateway)' :
                 selectedTopologyNode === 'devices' ? '12 Bedside IoMT Medical Endpoints' :
                 selectedTopologyNode === 'server' ? 'FastAPI Central Intrusion Engine' :
                 'Security Analyst Operations Center'}
              </span>
            </div>

            <div className="flex items-center space-x-4 text-slate-500 dark:text-slate-400">
              <span>Latency: <strong className="text-[#19B77A] dark:text-red-400">1.4ms</strong></span>
              <span>Encryption: <strong className="text-[#35C5E8] dark:text-white">100%</strong></span>
              <span>Defense: <strong className="text-[#19B77A] dark:text-red-400">ACTIVE</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 4: RECENT SECURITY ACTIVITY TABLE WITH FORENSIC INSPECTOR
         ========================================================================= */}
      <div className="bg-white dark:bg-[#120508] rounded-3xl border border-slate-200/80 dark:border-[#2A0910] overflow-hidden shadow-sm dark:shadow-[0_8px_30px_rgba(220,38,38,0.06)]">
        <div className="p-5 md:p-6 border-b border-slate-100 dark:border-[#2A0910] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-[#35C5E8] dark:text-[#EF4444]" />
            <div>
              <h2 className="text-sm font-bold text-[#0B1733] dark:text-white">Recent Security Activity & Alerts</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live threat notifications and cryptographic defense actions.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="text-xs font-semibold text-[#35C5E8] dark:text-red-400 hover:text-[#2CB3D5] dark:hover:text-red-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Activity Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0E0305] text-slate-500 dark:text-red-300/80 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-[#2A0910]">
              <tr>
                <th className="py-3.5 px-4">Time</th>
                <th className="py-3.5 px-4">Target Device</th>
                <th className="py-3.5 px-4">Threat Description</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Defense Action</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Forensics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2A0910]/70 text-slate-700 dark:text-slate-300">
              {stats?.recent_events && stats.recent_events.length > 0 ? (
                stats.recent_events.slice(0, 6).map((evt) => {
                  const friendly = formatEventToHospitalLanguage(evt.event_type, evt.attack_type, evt.result, evt.reason);
                  return (
                    <tr 
                      key={evt.id} 
                      onClick={() => setSelectedEvent(evt)}
                      className="hover:bg-slate-50 dark:hover:bg-[#1C070D] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#35C5E8] dark:text-[#EF4444]">
                        {evt.device_id || 'GATEWAY'}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-[#0B1733] dark:text-white">{friendly.friendlyTitle}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{friendly.plainReason}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge type={evt.severity} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold font-mono ${
                          friendly.actionColor === 'rose' ? 'bg-[#E94B5B]/15 text-[#E94B5B] border border-[#E94B5B]/30' :
                          friendly.actionColor === 'emerald' ? 'bg-[#19B77A]/15 text-[#19B77A] border border-[#19B77A]/30' :
                          'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30'
                        }`}>
                          {friendly.actionTaken}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge type={evt.result} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#1E070E] hover:bg-slate-200 dark:hover:bg-[#2B0A14] text-slate-700 dark:text-red-200 text-[11px] font-medium border border-slate-200 dark:border-[#2A0910]"
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
                    No threat events recorded. Run a controlled test in the Attack Simulation Lab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Inspection Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#120508] border border-slate-200 dark:border-[#2A0910] rounded-3xl w-full max-w-xl p-6 shadow-2xl dark:shadow-[0_20px_60px_rgba(220,38,38,0.2)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2A0910] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0B1733] dark:text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#35C5E8] dark:text-[#EF4444]" />
                  Cryptographic Forensic Inspection
                </h3>
                <div className="text-xs font-mono text-[#35C5E8] dark:text-red-400 mt-0.5">
                  EVENT ID: {selectedEvent.event_id}
                </div>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1A060C] border border-slate-200 dark:border-[#2A0910] space-y-1.5">
                <div className="text-slate-500 dark:text-slate-400 font-medium">Incident Summary:</div>
                <div className="text-[#0B1733] dark:text-white font-bold text-sm">
                  {formatEventToHospitalLanguage(selectedEvent.event_type, selectedEvent.attack_type, selectedEvent.result, selectedEvent.reason).friendlyTitle}
                </div>
                <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {formatEventToHospitalLanguage(selectedEvent.event_type, selectedEvent.attack_type, selectedEvent.result, selectedEvent.reason).plainReason}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1A060C] border border-slate-200 dark:border-[#2A0910]">
                  <div className="text-slate-500 text-[10px]">Medical Device</div>
                  <div className="text-[#0B1733] dark:text-white font-bold mt-0.5">{selectedEvent.device_id || 'GATEWAY'}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1A060C] border border-slate-200 dark:border-[#2A0910]">
                  <div className="text-slate-500 text-[10px]">Timestamp</div>
                  <div className="text-[#0B1733] dark:text-white mt-0.5">{new Date(selectedEvent.timestamp).toLocaleString()}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1A060C] border border-slate-200 dark:border-[#2A0910]">
                  <div className="text-slate-500 text-[10px]">Threat Severity</div>
                  <div className="mt-1"><Badge type={selectedEvent.severity} /></div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1A060C] border border-slate-200 dark:border-[#2A0910]">
                  <div className="text-slate-500 text-[10px]">Defense Outcome</div>
                  <div className="mt-1"><Badge type={selectedEvent.result} /></div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#1A060C] border border-slate-200 dark:border-[#2A0910] text-[11px] font-mono space-y-1">
                <div className="text-slate-500 dark:text-slate-400 font-sans font-semibold text-xs">Technical Forensics:</div>
                <div><span className="text-slate-500">Event Code:</span> <span className="text-[#35C5E8] dark:text-red-400">{selectedEvent.event_type}</span></div>
                <div><span className="text-slate-500">Attack Type:</span> <span className="text-[#E94B5B] dark:text-[#EF4444]">{selectedEvent.attack_type}</span></div>
                <div><span className="text-slate-500">Detection Module:</span> <span className="text-[#19B77A] dark:text-red-300">{selectedEvent.detection_module}</span></div>
                <div className="pt-1">
                  <span className="text-slate-500">Raw Cryptographic Reason:</span>
                  <div className="mt-1 p-2 rounded-xl bg-white dark:bg-[#0E0305] border border-slate-200 dark:border-[#2A0910] text-slate-700 dark:text-slate-300">
                    {selectedEvent.reason}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-[#2A0910] pt-3 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#7F1D1D] hover:bg-slate-200 dark:hover:bg-[#991B1B] text-slate-700 dark:text-white text-xs font-semibold shadow-sm"
              >
                Close Forensics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
