import React from 'react';
import { 
  LayoutDashboard, Radio, Activity, Lock, Cpu, 
  ShieldAlert, HardDriveDownload, AlertTriangle, 
  ScrollText, ShieldCheck
} from 'lucide-react';
import { SecureMedLogo } from './SecureMedLogo';

interface SidebarProps {
  currentPage: string;
  onSelectPage: (page: string) => void;
  activeSessions: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage, activeSessions }) => {
  // Hospital-oriented navigation structure (Architecture & Q&A removed entirely)
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'devices', label: 'Medical Device Management', icon: Radio },
    { id: 'telemetry', label: 'Device Monitoring', icon: Activity },
    { id: 'communication', label: 'Secure Communication', icon: Lock },
    { id: 'crypto', label: 'Security Technology Status', icon: Cpu },
    { id: 'attacks', label: 'Security Testing Lab', icon: ShieldAlert, highlight: true },
    { id: 'firmware', label: 'Firmware Protection', icon: HardDriveDownload },
    { id: 'events', label: 'Threat & Security Activity', icon: AlertTriangle },
    { id: 'audit', label: 'Audit Logs', icon: ScrollText },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header with Recognizable Red Heart Logo */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <SecureMedLogo size="md" showSubtitle={true} />
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Hospital Security Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${item.highlight && !isActive ? 'hover:border-rose-500/30 hover:text-rose-400' : ''}`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : item.highlight ? 'text-rose-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.highlight && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold shrink-0">
                  TEST
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info Box: Hospital Security Status */}
      <div className="p-4 border-t border-slate-800 bg-[#0B0F19]/50">
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-medium text-slate-300">Security Gateway</span>
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> OPERATIONAL
            </span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Active Sessions:</span>
              <span className="text-cyan-400 font-bold font-mono">{activeSessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Post-Quantum:</span>
              <span className="text-emerald-400 font-mono text-[10px]">Active (FIPS 203/204)</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
