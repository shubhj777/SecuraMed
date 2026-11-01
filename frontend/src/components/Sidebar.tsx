import React from 'react';
import { 
  LayoutDashboard, ShieldCheck, Radio, Activity, ShieldAlert, 
  BarChart3, AlertTriangle, ScrollText, HardDriveDownload, Lock,
  ChevronRight, X, User, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MedNexusLogo } from './MedNexusLogo';

interface SidebarProps {
  currentPage: string;
  onSelectPage: (page: string) => void;
  activeSessions: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  onSelectPage, 
  activeSessions,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { user } = useAuth();

  const primaryNavItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'crypto', label: 'Hospital Security', icon: ShieldCheck, badge: 'PQC' },
    { id: 'devices', label: 'Device Monitoring', icon: Radio },
    { id: 'telemetry', label: 'Device Simulator', icon: Activity, badge: 'LIVE' },
    { id: 'attacks', label: 'Attack Simulation', icon: ShieldAlert, highlight: true },
    { id: 'events', label: 'Threat Intelligence', icon: AlertTriangle },
    { id: 'communication', label: 'Secure Communication', icon: Lock },
    { id: 'firmware', label: 'Firmware Protection', icon: HardDriveDownload },
    { id: 'audit', label: 'Audit Logs', icon: ScrollText },
  ];

  const handleSelect = (id: string) => {
    onSelectPage(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Floating Dark Navy Sidebar Card (GeneX Style with Red & Black Dark Theme) */}
      <aside className={`
        fixed lg:sticky top-4 bottom-4 left-4 lg:top-6 lg:bottom-auto z-40
        w-64 bg-[#0B1733] dark:bg-[#0C0305] text-white rounded-3xl border border-[#1C3560] dark:border-[#2A0910] shadow-2xl dark:shadow-[0_10px_35px_rgba(220,38,38,0.08)]
        flex flex-col justify-between shrink-0 select-none transition-transform duration-300 ease-in-out p-4 md:p-5
        lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto custom-scrollbar
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Navigation Section */}
        <div className="space-y-4">
          {/* Brand Header */}
          <div className="pb-3 border-b border-[#1C3560] dark:border-[#2A0910] flex items-center justify-between">
            <MedNexusLogo size="sm" showSubtitle={false} forceWhiteText={true} />
            <button 
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#142B50] dark:bg-gradient-to-r dark:from-[#2D0A11] dark:to-[#170508] text-white shadow-md border border-[#35C5E8]/40 dark:border-red-600/50'
                      : 'text-slate-400 hover:text-white hover:bg-[#142B50]/50 dark:hover:bg-[#1C070C]/70'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#35C5E8] dark:text-[#EF4444]' : item.highlight ? 'text-[#E94B5B] dark:text-[#DC2626]' : 'text-slate-400 group-hover:text-slate-200'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                        item.badge === 'LIVE' 
                          ? 'bg-[#19B77A]/20 text-[#19B77A]' 
                          : 'bg-[#35C5E8]/20 text-[#35C5E8] dark:bg-red-950/60 dark:text-red-400 dark:border dark:border-red-900/50'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {item.highlight && (
                      <span className="w-2 h-2 rounded-full bg-[#E94B5B] dark:bg-[#EF4444] animate-pulse" />
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Snippet (Like Hanna Kenter Card in GeneX reference) */}
        <div className="pt-4 border-t border-[#1C3560]/80 dark:border-[#2A0910] mt-4">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-[#142B50]/60 dark:bg-[#160509]/80 border border-[#1C3560] dark:border-[#2A0910] hover:border-[#35C5E8]/30 dark:hover:border-red-600/40 transition-all cursor-pointer">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#0B1733] dark:bg-[#20060B] border border-[#35C5E8]/50 dark:border-red-500/50 flex items-center justify-center text-[#35C5E8] dark:text-[#EF4444] font-bold text-xs shrink-0">
                  {user?.full_name ? user.full_name.charAt(0) : 'R'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#19B77A] dark:bg-[#EF4444] border-2 border-[#0B1733] dark:border-[#0C0305]" />
              </div>

              <div className="truncate text-left leading-tight">
                <div className="text-xs font-bold text-white truncate">
                  {user?.full_name || 'Dr. Rajesh Sharma'}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                  <span>IoMT Defense</span>
                  <span className="text-[#19B77A] dark:text-[#EF4444] font-semibold">Active &gt;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
