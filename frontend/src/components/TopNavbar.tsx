import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, RefreshCw, Sun, Moon, 
  MoreVertical, User, Key, Shield, LogOut, X, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { SecurityStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

interface TopNavbarProps {
  stats: SecurityStats | null;
  onRefresh: () => void;
  onLaunchAttack: () => void;
  isLoading: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ 
  stats, 
  onRefresh, 
  onLaunchAttack, 
  isLoading 
}) => {
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'profile' | 'password' | 'security' | null>(null);

  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
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

  const getRoleBadge = (role: string = '') => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Hospital Administrator', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' };
      case 'IT_ADMIN':
        return { label: 'IT Administrator', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' };
      case 'SECURITY_ANALYST':
        return { label: 'Cybersecurity Analyst', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' };
      case 'OPERATOR':
        return { label: 'Security Operator', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' };
      default:
        return { label: role || 'Hospital Staff', color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <>
      <header className="h-16 border-b border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F172A]/90 backdrop-blur-md px-6 flex items-center justify-between z-20 sticky top-0 transition-colors duration-200">
        {/* Left: Device Protection Status & Live Connections (Gateway Node SECUREMED-GW-01 completely removed) */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Device Protection Active</span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-[#64748B] dark:text-slate-400 bg-[#F5F7FA] dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700/60 px-3 py-1 rounded-full">
            <span>Active Connections:</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">
              {stats?.active_sessions ?? 0}
            </span>
          </div>
        </div>

        {/* Right: Actions, Theme Toggle, & Hospital Admin Profile Dropdown */}
        <div className="flex items-center space-x-2.5">
          {/* Security Testing Lab Button */}
          <button
            onClick={onLaunchAttack}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-600/20 dark:hover:bg-rose-600/30 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-all shadow-sm"
            title="Open Security Testing Lab"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span className="hidden md:inline">Security Testing Lab</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#172033] dark:text-slate-300 transition-all border border-[#E2E8F0] dark:border-slate-700"
            title="Refresh Dashboard State"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-500 dark:text-cyan-400' : ''}`} />
          </button>

          {/* Day / Night Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all border border-[#E2E8F0] dark:border-slate-700"
            title={isDark ? "Switch to Hospital Light Mode" : "Switch to Cybersecurity Dark Mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Hospital Profile Dropdown Menu */}
          <div className="relative pl-2 border-l border-[#E2E8F0] dark:border-slate-800" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
              title="Hospital Admin Menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E63946] to-rose-700 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {user?.full_name ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'HA'}
              </div>

              <div className="hidden lg:block">
                <div className="text-xs font-bold text-[#172033] dark:text-slate-100 leading-tight">
                  {user?.full_name || 'Hospital Admin'}
                </div>
                <div className="text-[10px] text-[#64748B] dark:text-slate-400 font-sans leading-tight">
                  {roleInfo.label}
                </div>
              </div>

              <MoreVertical className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
            </button>

            {/* Dropdown Options */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#111827] rounded-xl shadow-2xl border border-[#E2E8F0] dark:border-slate-800 py-1.5 z-50 text-[#172033] dark:text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User quick info */}
                <div className="px-4 py-2.5 border-b border-[#E2E8F0] dark:border-slate-800">
                  <div className="text-xs font-bold text-[#172033] dark:text-white truncate">
                    {user?.full_name || user?.username}
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">
                    {user?.email || 'admin@hospital.org'}
                  </div>
                  <div className="mt-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border border-red-200 text-[#E63946] bg-red-50 dark:bg-red-500/10 dark:border-red-500/20">
                    {user?.hospital_name || 'St. Jude Memorial Hospital'}
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => { setActiveModal('profile'); setDropdownOpen(false); }}
                    className="w-full flex items-center px-4 py-2 text-xs hover:bg-[#F5F7FA] dark:hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => { setActiveModal('password'); setDropdownOpen(false); }}
                    className="w-full flex items-center px-4 py-2 text-xs hover:bg-[#F5F7FA] dark:hover:bg-slate-800 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                    <span>Change Password</span>
                  </button>

                  <button
                    onClick={() => { setActiveModal('security'); setDropdownOpen(false); }}
                    className="w-full flex items-center px-4 py-2 text-xs hover:bg-[#F5F7FA] dark:hover:bg-slate-800 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                    <span>Account Security</span>
                  </button>
                </div>

                <div className="border-t border-[#E2E8F0] dark:border-slate-800 pt-1 mt-1">
                  <button
                    onClick={() => { logout(); setDropdownOpen(false); }}
                    className="w-full flex items-center px-4 py-2 text-xs text-[#E63946] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 1. My Profile Modal */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E2E8F0] dark:border-slate-800 shadow-2xl text-[#172033] dark:text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-[#E63946]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Hospital Personnel Profile</h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">Authenticated medical cyber operator</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-[#E2E8F0] dark:border-slate-800">
                <span className="text-slate-400 font-medium">Full Name</span>
                <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200">{user?.full_name || 'Dr. Sarah Jenkins'}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-[#E2E8F0] dark:border-slate-800">
                <span className="text-slate-400 font-medium">Hospital Email</span>
                <span className="col-span-2 font-mono text-slate-800 dark:text-slate-200">{user?.email || 'admin@hospital.org'}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-[#E2E8F0] dark:border-slate-800">
                <span className="text-slate-400 font-medium">Hospital Facility</span>
                <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200">{user?.hospital_name || 'St. Jude Memorial Hospital'}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-[#E2E8F0] dark:border-slate-800">
                <span className="text-slate-400 font-medium">Designation / Role</span>
                <span className="col-span-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-[#E2E8F0] dark:border-slate-800">
                <span className="text-slate-400 font-medium">Account Username</span>
                <span className="col-span-2 font-mono font-semibold">{user?.username}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-[#E2E8F0] dark:border-slate-800">
                <span className="text-slate-400 font-medium">Status</span>
                <span className="col-span-2 flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active &amp; Authorized</span>
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#E63946] text-white hover:bg-[#D62839]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Change Password Modal */}
      {activeModal === 'password' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E2E8F0] dark:border-slate-800 shadow-2xl text-[#172033] dark:text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-[#E63946]">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Change Account Password</h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">Argon2id password verification</p>
                </div>
              </div>
              <button
                onClick={() => { setActiveModal(null); setPasswordError(null); setPasswordSuccess(null); }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#E63946]" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E63946]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E63946]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E63946]"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 rounded-xl bg-[#E63946] text-white hover:bg-[#D62839] font-semibold disabled:opacity-50"
                >
                  {passwordLoading ? 'Verifying...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Account Security Modal */}
      {activeModal === 'security' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E2E8F0] dark:border-slate-800 shadow-2xl text-[#172033] dark:text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Account Security &amp; Audit</h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">Session and cryptographic verification status</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F5F7FA] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Active Hospital Sessions</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current verified operator tokens</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {user?.active_sessions ?? 1} Session Active
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F5F7FA] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Login Activity</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Timestamp</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Current Session'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F5F7FA] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Password Update Information</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last changed</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {user?.password_updated_at ? new Date(user.password_updated_at).toLocaleDateString() : 'Initial Credential'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Account Security Status: High Assurance</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400/80">
                  Secured with Argon2id password hashing, single-use reset tokens, and NIST PQC ML-KEM-768 session defense.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#E63946] text-white hover:bg-[#D62839]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
