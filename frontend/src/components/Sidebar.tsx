import React from 'react';
import { 
  LayoutDashboard, Radio, Activity, Lock, Cpu, 
  ShieldAlert, HardDriveDownload, AlertTriangle, 
  ScrollText, Settings, ShieldCheck, HeartPulse
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onSelectPage: (page: string) => void;
  activeSessions: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage, activeSessions }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'devices', label: 'Device Management', icon: Radio },
    { id: 'telemetry', label: 'Live Telemetry', icon: Activity },
    { id: 'communication', label: 'Secure Communication', icon: Lock },
    { id: 'crypto', label: 'Cryptography Status', icon: Cpu },
    { id: 'attacks', label: 'Attack Simulator Lab', icon: ShieldAlert, highlight: true },
    { id: 'firmware', label: 'Firmware Security', icon: HardDriveDownload },
    { id: 'events', label: 'Security Events', icon: AlertTriangle },
    { id: 'audit', label: 'Audit Logs', icon: ScrollText },
    { id: 'settings', label: 'Architecture & Q&A', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              SecureMed
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">PQC</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">IoT Medical Gateway</div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Security Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${item.highlight && !isActive ? 'hover:border-rose-500/30 hover:text-rose-400' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : item.highlight ? 'text-rose-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.highlight && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">LAB</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-800 bg-[#0B0F19]/50">
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>PQC Engines</span>
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ACTIVE
            </span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1 font-mono">
            <div>ML-KEM-768: <span className="text-cyan-400">FIPS 203</span></div>
            <div>ML-DSA-65: <span className="text-cyan-400">FIPS 204</span></div>
          </div>
        </div>
      </div>
    </aside>
  );
};
