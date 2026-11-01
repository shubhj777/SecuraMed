import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, RefreshCw, Sun, Moon, 
  Search, Bell, User, Key, Shield, LogOut, X, CheckCircle2, AlertCircle,
  Clock, Menu, ChevronDown, ExternalLink, ArrowUpRight
} from 'lucide-react';
import { SecurityStats } from '../types';
import { MedNexusLogo } from './MedNexusLogo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

interface TopNavbarProps {
  stats: SecurityStats | null;
  onRefresh: () => void;
  onLaunchAttack: () => void;
  isLoading: boolean;
  currentPage?: string;
  onSelectPage?: (page: string) => void;
  onToggleMobileMenu?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ 
  stats, 
  onRefresh, 
  onLaunchAttack, 
  isLoading,
  currentPage = 'overview',
  onSelectPage,
  onToggleMobileMenu
}) => {
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'profile' | 'password' | 'security' | null>(null);

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
      setTimeout(() => {
        setActiveModal(null);
        setPasswordSuccess(null);
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const navLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'crypto', label: 'Hospital Security' },
    { id: 'devices', label: 'Device Monitoring' },
    { id: 'telemetry', label: 'Device Simulator' },
    { id: 'attacks', label: 'Attack Lab' },
    { id: 'audit', label: 'Audit Logs' },
  ];

  const recentAlerts = stats?.recent_events?.slice(0, 5) || [];
  const unreadCount = stats?.recent_events?.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH').length || 0;

  return (
    <header className="w-full bg-white dark:bg-[#0C0305] rounded-3xl border border-slate-200/80 dark:border-[#2A0910] px-6 py-3.5 shadow-sm dark:shadow-[0_4px_25px_rgba(220,38,38,0.06)] mb-6 flex items-center justify-between transition-colors duration-200 z-30 select-none">
      {/* Left: Brand Logo & Mobile Toggle */}
      <div className="flex items-center space-x-3 shrink-0 mr-4">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-[#160509] text-slate-700 dark:text-slate-200 hover:text-[#35C5E8] dark:hover:text-[#EF4444]"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <MedNexusLogo size="md" showSubtitle={false} />
      </div>

      {/* Center: Top Navigation Links (Like GeneX Reference) */}
      <nav className="hidden xl:flex items-center space-x-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
        {navLinks.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage && onSelectPage(item.id)}
              className={`transition-all py-1 px-1 relative ${
                isActive
                  ? 'text-[#0B1733] dark:text-[#EF4444] font-bold'
                  : 'hover:text-[#0B1733] dark:hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-[#35C5E8] dark:bg-[#EF4444] rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Status Pill, Notifications, Avatar & CTA Button */}
      <div className="flex items-center space-x-3">
        {/* Status Pill */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-[#19B77A]/10 text-[#0E8A59] dark:bg-red-950/40 dark:text-red-400 border border-[#19B77A]/30 dark:border-red-900/40">
          <span className="w-2 h-2 rounded-full bg-[#19B77A] dark:bg-red-500 animate-pulse" />
          <span>FIPS Protected</span>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-[#120508] border border-slate-200 dark:border-[#2A0910] text-xs font-mono text-slate-500 dark:text-red-300">
          <Clock className="w-3.5 h-3.5 text-[#35C5E8] dark:text-[#EF4444]" />
          <span>{currentTime || 'Syncing...'}</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#160509] dark:hover:bg-[#22070D] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2A0910] transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#35C5E8] dark:text-[#EF4444]' : ''}`} />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#160509] dark:hover:bg-[#22070D] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2A0910] transition-colors relative"
            title="Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E94B5B] dark:bg-[#DC2626] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0D1B3A] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1C3560] p-4 space-y-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1C3560]">
                <div className="flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#35C5E8]" />
                  <span className="text-xs font-bold text-[#0B1733] dark:text-white">Security Alerts</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {stats?.recent_events?.length || 0} events
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
                {recentAlerts.length > 0 ? (
                  recentAlerts.map((evt) => (
                    <div 
                      key={evt.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#071226] border border-slate-100 dark:border-[#1C3560] hover:border-[#35C5E8]/40 transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#0B1733] dark:text-white truncate">
                          {evt.attack_type || evt.event_type}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          evt.severity === 'CRITICAL' ? 'bg-[#E94B5B]/15 text-[#E94B5B]' :
                          evt.severity === 'HIGH' ? 'bg-[#F5A623]/15 text-[#F5A623]' :
                          'bg-[#35C5E8]/15 text-[#35C5E8]'
                        }`}>
                          {evt.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {evt.reason || 'Security boundary enforced.'}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                        <span>Device: {evt.device_id || 'GATEWAY'}</span>
                        <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No active threat alerts detected.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#142B50] dark:hover:bg-[#1C3560] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1C3560] transition-colors"
          title={isDark ? "Hospital Light Mode" : "Cybersecurity Dark Mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-[#F5A623]" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* User Profile Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 p-1 rounded-full bg-slate-100 dark:bg-[#142B50] border border-slate-200 dark:border-[#1C3560] transition-all hover:ring-2 hover:ring-[#35C5E8]/40"
          >
            <div className="w-8 h-8 rounded-full bg-[#0B1733] border border-[#35C5E8]/40 flex items-center justify-center text-[#35C5E8] font-bold text-xs">
              {user?.full_name ? user.full_name.charAt(0) : 'R'}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#120508] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2A0910] py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-[#2A0910]">
                <div className="font-bold text-xs text-[#0B1733] dark:text-white">
                  {user?.full_name || 'Dr. Rajesh Sharma'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'r.sharma@hospital.org'}
                </div>
                <div className="mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-[#35C5E8]/10 text-[#35C5E8] border border-[#35C5E8]/30 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40">
                  {user?.role || 'HOSPITAL_ADMIN'}
                </div>
              </div>

              <div className="py-1 text-xs">
                <button
                  onClick={() => { setDropdownOpen(false); setActiveModal('profile'); }}
                  className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1C070D] flex items-center space-x-2.5"
                >
                  <User className="w-4 h-4 text-[#35C5E8] dark:text-[#EF4444]" />
                  <span>Hospital Profile</span>
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); setActiveModal('password'); }}
                  className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1C070D] flex items-center space-x-2.5"
                >
                  <Key className="w-4 h-4 text-[#F5A623] dark:text-amber-400" />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); setActiveModal('security'); }}
                  className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1C070D] flex items-center space-x-2.5"
                >
                  <Shield className="w-4 h-4 text-[#19B77A] dark:text-red-400" />
                  <span>Security Audit</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-[#2A0910]">
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="w-full px-4 py-2 text-left text-[#E94B5B] dark:text-[#EF4444] hover:bg-[#E94B5B]/10 dark:hover:bg-red-950/30 flex items-center space-x-2.5 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4 text-[#E94B5B] dark:text-[#EF4444]" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action CTA Button (GeneX Reference with Red & Black styling in dark mode) */}
        <button
          onClick={onLaunchAttack}
          className="hidden md:flex items-center space-x-2 px-5 py-2 rounded-full bg-[#0B1733] hover:bg-[#142B50] dark:bg-gradient-to-r dark:from-red-600 dark:to-rose-700 dark:hover:from-red-500 dark:hover:to-rose-600 text-white text-xs font-bold transition-all shadow-md shadow-[#0B1733]/20 dark:shadow-red-950/40 group"
        >
          <span>Launch Attack Lab</span>
          <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
            <ArrowUpRight className="w-3 h-3 text-[#35C5E8] dark:text-white" />
          </div>
        </button>
      </div>

      {/* Modals */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#120508] border border-slate-200 dark:border-[#2A0910] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2A0910] pb-3">
              <h3 className="text-base font-bold text-[#0B1733] dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-[#35C5E8] dark:text-[#EF4444]" />
                Security Personnel Profile
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A060C] border border-slate-200 dark:border-[#2A0910] space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Full Name:</span><span className="font-semibold text-[#0B1733] dark:text-white">{user?.full_name || 'Dr. Rajesh Sharma'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Username:</span><span className="font-mono text-[#35C5E8] dark:text-red-400">{user?.username || 'admin'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Email:</span><span className="text-[#0B1733] dark:text-white">{user?.email || 'r.sharma@hospital.org'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Hospital:</span><span className="text-[#0B1733] dark:text-white">{user?.hospital_name || 'Metro Health'}</span></div>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1E070E] hover:dark:bg-[#2A0A14] text-xs font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {activeModal === 'password' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#120508] border border-slate-200 dark:border-[#2A0910] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2A0910] pb-3">
              <h3 className="text-base font-bold text-[#0B1733] dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-[#F5A623] dark:text-amber-400" />
                Update Password
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            {passwordError && <div className="p-3 rounded-xl bg-[#E94B5B]/10 text-[#E94B5B] text-xs">{passwordError}</div>}
            {passwordSuccess && <div className="p-3 rounded-xl bg-[#19B77A]/10 text-[#19B77A] text-xs">{passwordSuccess}</div>}
            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A0910] bg-slate-50 dark:bg-[#1A060C]" required />
              </div>
              <div>
                <label className="block font-semibold mb-1">New Password (min 8 chars)</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A0910] bg-slate-50 dark:bg-[#1A060C]" required />
              </div>
              <div>
                <label className="block font-semibold mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#2A0910] bg-slate-50 dark:bg-[#1A060C]" required />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1E070E] text-xs">Cancel</button>
                <button type="submit" disabled={passwordLoading} className="px-4 py-2 rounded-xl bg-[#35C5E8] dark:bg-[#DC2626] text-[#0B1733] dark:text-white font-bold text-xs">{passwordLoading ? 'Updating...' : 'Update'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Details Modal */}
      {activeModal === 'security' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#120508] border border-slate-200 dark:border-[#2A0910] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2A0910] pb-3">
              <h3 className="text-base font-bold text-[#0B1733] dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#19B77A] dark:text-red-400" />
                Security Standards Active
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A060C] border border-slate-200 dark:border-[#2A0910] space-y-2 text-xs font-mono">
              <div className="flex justify-between"><span className="text-slate-500">KEM Standard:</span><span className="text-[#19B77A] dark:text-red-400 font-bold">ML-KEM-768</span></div>
              <div className="flex justify-between"><span className="text-slate-500">DSA Standard:</span><span className="text-[#19B77A] dark:text-red-400 font-bold">ML-DSA-65</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Symmetric Cipher:</span><span className="text-[#35C5E8] dark:text-white font-bold">AES-256-GCM</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Password Hashing:</span><span className="text-white">Argon2id</span></div>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1E070E] hover:dark:bg-[#2A0A14] text-xs font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default TopNavbar;
