import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, RefreshCw, Zap, Server } from 'lucide-react';
import { SecurityStats } from '../types';

interface TopNavbarProps {
  stats: SecurityStats | null;
  onRefresh: () => void;
  onLaunchAttack: () => void;
  isLoading: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ stats, onRefresh, onLaunchAttack, isLoading }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md px-6 flex items-center justify-between z-10 sticky top-0">
      {/* Left: Gateway Node Status */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono text-slate-400">Node:</span>
          <span className="text-xs font-mono font-semibold text-slate-200">SECUREMED-GW-01</span>
        </div>

        <div className="hidden sm:flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>FIPS 203/204 Defense Active</span>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <span>Active Sessions:</span>
          <span className="text-cyan-400 font-bold">{stats?.active_sessions ?? 0}</span>
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onLaunchAttack}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600/30 text-xs font-semibold transition-all shadow-sm"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Attack Lab</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
          title="Refresh Dashboard State"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
            AD
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-200">Admin</div>
            <div className="text-[10px] text-slate-400 font-mono">SecuraMed Ops</div>
          </div>
        </div>
      </div>
    </header>
  );
};
