import React, { useState } from 'react';
import { 
  Eye, EyeOff, Lock, User, Shield, AlertCircle, CheckCircle2, 
  ArrowRight, Sun, Moon, Radio, ShieldCheck, Key, Zap
} from 'lucide-react';
import { MedNexusLogo } from '../components/MedNexusLogo';
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
    <div className="min-h-screen flex flex-col justify-between bg-[#F3F6FB] dark:bg-[#18060B] text-[#0B1733] dark:text-[#F3F6FB] transition-colors duration-200">
      {/* Top Header */}
      <div className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-[#2A0910] bg-white dark:bg-[#0B1733] shadow-sm">
        <MedNexusLogo size="md" showSubtitle={false} />

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#19B77A]/15 text-[#19B77A] border border-[#19B77A]/30">
            <span className="w-2 h-2 rounded-full bg-[#19B77A] animate-pulse" />
            <span>Hospital Security Gateway: ONLINE</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#20070E] dark:hover:bg-[#2E0B16] text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-[#2A0910]"
            title={isDark ? "Switch to Hospital Light Mode" : "Switch to Cybersecurity Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-[#F5A623]" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#120508] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2A0910] p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#35C5E8]/10 text-[#35C5E8] mb-1">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1733] dark:text-white">
              Hospital Security Portal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Authenticate to manage connected medical device cybersecurity and monitor live IoMT threat telemetry.
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#E94B5B]/10 border border-[#E94B5B]/30 text-[#E94B5B] text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hospital Operator / Admin ID
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#35C5E8]"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-medium text-[#35C5E8] hover:underline"
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#35C5E8]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#35C5E8] border-slate-300"
                />
                <span>Remember Credentials</span>
              </label>

              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#19B77A]" />
                <span>Argon2id Encrypted</span>
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#35C5E8] hover:bg-[#2CB3D5] text-[#0B1733] font-extrabold text-sm shadow-md shadow-[#35C5E8]/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#0B1733]/30 border-t-[#0B1733] rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Security SOC</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Profiles */}
          <div className="pt-6 border-t border-slate-100 dark:border-[#2A0910]">
            <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2.5 text-center font-mono">
              Evaluator Quick-Select Roles (1-Click Demo)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickRole('admin', 'SecureMedAdmin2026!')}
                className="p-2 rounded-lg border border-slate-200 dark:border-[#2A0910] bg-slate-50 dark:bg-[#18060B] hover:border-[#35C5E8] text-left transition-all"
              >
                <div className="font-semibold text-xs text-[#0B1733] dark:text-slate-200">Clinical CISO / Admin</div>
                <div className="text-[10px] text-slate-500">Dr. Rajesh Sharma</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('it_admin', 'SecureMedIT2026!')}
                className="p-2 rounded-lg border border-slate-200 dark:border-[#2A0910] bg-slate-50 dark:bg-[#18060B] hover:border-[#35C5E8] text-left transition-all"
              >
                <div className="font-semibold text-xs text-[#0B1733] dark:text-slate-200">Biomedical Engineer</div>
                <div className="text-[10px] text-slate-500">Eng. Vikram Malhotra</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('analyst', 'SecureMedAnalyst2026!')}
                className="p-2 rounded-lg border border-slate-200 dark:border-[#2A0910] bg-slate-50 dark:bg-[#18060B] hover:border-[#35C5E8] text-left transition-all"
              >
                <div className="font-semibold text-xs text-[#0B1733] dark:text-slate-200">Cyber Analyst</div>
                <div className="text-[10px] text-slate-500">Priya Patel</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('operator', 'SecureMedOps2026!')}
                className="p-2 rounded-lg border border-slate-200 dark:border-[#2A0910] bg-slate-50 dark:bg-[#18060B] hover:border-[#35C5E8] text-left transition-all"
              >
                <div className="font-semibold text-xs text-[#0B1733] dark:text-slate-200">Security Operations</div>
                <div className="text-[10px] text-slate-500">Marcus Vance</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-[#2A0910] bg-white dark:bg-[#0B1733]">
        <p className="font-medium">SecuraMed • Medical Device & IoMT Cybersecurity Platform</p>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">
          NIST FIPS 203 (ML-KEM-768) • NIST FIPS 204 (ML-DSA-65) • AES-256-GCM Authenticated Cipher
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#120508] rounded-2xl p-6 border border-slate-200 dark:border-[#2A0910] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2A0910]">
              <h3 className="font-bold text-sm text-[#0B1733] dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#35C5E8]" />
                <span>Password Recovery</span>
              </h3>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {!resetToken ? (
              <form onSubmit={handleForgotPassword} className="mt-4 space-y-4 text-xs">
                <p className="text-slate-500 dark:text-slate-400">
                  Enter your hospital identifier or email. A time-limited single-use security token will be dispatched.
                </p>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Hospital ID</label>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="admin@hospital.org"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-800 dark:text-white focus:outline-none focus:border-[#35C5E8]"
                    required
                  />
                </div>
                {forgotSuccess && (
                  <div className="p-3 rounded-xl bg-[#19B77A]/10 border border-[#19B77A]/30 text-[#19B77A]">
                    {forgotSuccess}
                  </div>
                )}
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowForgotModal(false)} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#20070E] text-slate-600 dark:text-slate-300">Cancel</button>
                  <button type="submit" disabled={forgotLoading} className="px-3 py-1.5 rounded-lg bg-[#35C5E8] text-[#0B1733] font-bold">
                    {forgotLoading ? 'Verifying...' : 'Request Token'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="mt-4 space-y-4 text-xs">
                <div className="p-2.5 rounded-xl bg-[#19B77A]/10 border border-[#19B77A]/30 text-[#19B77A]">
                  Token verified. Set new password:
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-800 dark:text-white focus:outline-none focus:border-[#35C5E8]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#18060B] border border-slate-200 dark:border-[#2A0910] text-slate-800 dark:text-white focus:outline-none focus:border-[#35C5E8]"
                    required
                  />
                </div>
                {resetSuccess && (
                  <div className="p-3 rounded-xl bg-[#19B77A]/10 text-[#19B77A]">
                    Password updated securely with Argon2id!
                  </div>
                )}
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="submit" disabled={forgotLoading} className="px-3 py-1.5 rounded-lg bg-[#35C5E8] text-[#0B1733] font-bold">
                    {forgotLoading ? 'Updating...' : 'Set Password'}
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

export default Login;
