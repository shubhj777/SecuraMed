import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Shield, AlertCircle, CheckCircle2, ArrowRight, Sun, Moon, Stethoscope } from 'lucide-react';
import { SecureMedLogo } from '../components/SecureMedLogo';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('SecureMedAdmin2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both your hospital identifier and password.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const tokenData = await api.login(username.trim(), password);
      // Fetch user profile from /auth/me
      const profile = await api.getMe(tokenData.access_token);
      login(tokenData.access_token, profile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials or inactive hospital account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRole = (roleUser: string, rolePass: string) => {
    setUsername(roleUser);
    setPassword(rolePass);
    setErrorMessage(null);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) return;
    try {
      setForgotLoading(true);
      setForgotSuccess(null);
      const res = await api.forgotPassword(forgotIdentifier.trim());
      setForgotSuccess(res.message);
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
    } catch (err: any) {
      setForgotSuccess('If the account exists in the hospital directory, a verification link has been dispatched.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      setForgotLoading(true);
      await api.resetPassword(resetToken, newPassword);
      setResetSuccess(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setPassword(newPassword);
        setResetSuccess(false);
        setResetToken(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F5F7FA] dark:bg-[#0B0F19] text-[#172033] dark:text-[#F3F4F6] transition-colors duration-200">
      {/* Top utility bar */}
      <div className="w-full px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F172A]/70 backdrop-blur-md">
        <SecureMedLogo size="md" />

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gateway Online &amp; Post-Quantum Active</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
            title={isDark ? "Switch to Hospital Light Mode" : "Switch to Cybersecurity Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-[#E2E8F0] dark:border-slate-800 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 dark:bg-[#E63946]/10 text-[#E63946] mb-3">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
              Hospital Security Portal
            </h1>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-2 max-w-sm mx-auto">
              Secure access to your hospital’s connected medical device security infrastructure.
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#E63946]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300 mb-1.5">
                Hospital Email / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@hospital.org or username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900/80 border border-[#E2E8F0] dark:border-slate-700 text-[#172033] dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E63946]/30 focus:border-[#E63946] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#172033] dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-medium text-[#E63946] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900/80 border border-[#E2E8F0] dark:border-slate-700 text-[#172033] dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E63946]/30 focus:border-[#E63946] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-[#64748B] dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#E63946] focus:ring-[#E63946] border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <span>Remember Me</span>
              </label>

              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span>Argon2id Encrypted</span>
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#E63946] hover:bg-[#D62839] active:bg-[#C51F30] text-white font-semibold text-sm shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Hospital Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Hospital Roles Quick-Select Helper for Demonstrators & Evaluators */}
          <div className="mt-8 pt-6 border-t border-[#E2E8F0] dark:border-slate-800">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2 text-center">
              Hospital Personnel Profiles (1-Click Demo)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickRole('admin', 'SecureMedAdmin2026!')}
                className="p-2 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F5F7FA] dark:bg-slate-900/60 hover:border-[#E63946] dark:hover:border-[#E63946] text-left transition-all"
              >
                <div className="font-semibold text-xs text-[#172033] dark:text-slate-200">Hospital Admin</div>
                <div className="text-[10px] text-slate-500">Dr. Sarah Jenkins</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('it_admin', 'SecureMedIT2026!')}
                className="p-2 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F5F7FA] dark:bg-slate-900/60 hover:border-[#E63946] dark:hover:border-[#E63946] text-left transition-all"
              >
                <div className="font-semibold text-xs text-[#172033] dark:text-slate-200">IT Administrator</div>
                <div className="text-[10px] text-slate-500">Marcus Vance</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('analyst', 'SecureMedAnalyst2026!')}
                className="p-2 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F5F7FA] dark:bg-slate-900/60 hover:border-[#E63946] dark:hover:border-[#E63946] text-left transition-all"
              >
                <div className="font-semibold text-xs text-[#172033] dark:text-slate-200">Cyber Analyst</div>
                <div className="text-[10px] text-slate-500">Alex Chen</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('operator', 'SecureMedOps2026!')}
                className="p-2 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F5F7FA] dark:bg-slate-900/60 hover:border-[#E63946] dark:hover:border-[#E63946] text-left transition-all"
              >
                <div className="font-semibold text-xs text-[#172033] dark:text-slate-200">Security Operator</div>
                <div className="text-[10px] text-slate-500">David Miller</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-[#64748B] dark:text-slate-500 border-t border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F172A]/50">
        <p>SecureMed Gateway • Hospital Connected Medical Device (IoMT) Cybersecurity Platform</p>
        <p className="text-[10px] text-slate-400 mt-1">NIST FIPS 203 (ML-KEM-768) • NIST FIPS 204 (ML-DSA-65) • AES-256-GCM</p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl p-6 border border-[#E2E8F0] dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
              <h3 className="font-bold text-base text-[#172033] dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#E63946]" />
                <span>Password Recovery</span>
              </h3>
              <button
                onClick={() => { setShowForgotModal(false); setForgotSuccess(null); setResetToken(null); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {!resetToken ? (
              <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Enter your hospital email address or username. A time-limited single-use security token will be generated to verify your identity.
                </p>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#172033] dark:text-slate-300">
                    Hospital Identifier
                  </label>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="admin@hospital.org"
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E63946]"
                    required
                  />
                </div>

                {forgotSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs">
                    {forgotSuccess}
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#E63946] text-white hover:bg-[#D62839] disabled:opacity-50"
                  >
                    {forgotLoading ? 'Verifying...' : 'Request Reset Token'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
                  <span className="font-semibold">Reset Token Generated:</span> Single-use 15-minute token verified.
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#172033] dark:text-slate-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E63946]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#172033] dark:text-slate-300">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E63946]"
                    required
                  />
                </div>

                {resetSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Password updated securely with Argon2id!</span>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#E63946] text-white hover:bg-[#D62839] disabled:opacity-50"
                  >
                    {forgotLoading ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
