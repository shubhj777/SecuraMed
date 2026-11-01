import React, { useState } from 'react';
import { MedNexusLogo } from './MedNexusLogo';
import { ShieldCheck, Lock, Mail, Phone, ExternalLink, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 4000);
  };

  return (
    <footer className="w-full bg-[#0B1733] dark:bg-[#0A0204] text-white rounded-3xl p-8 md:p-12 shadow-2xl dark:shadow-[0_15px_50px_rgba(220,38,38,0.08)] border border-[#1C3560] dark:border-[#2A0910] mt-10 select-none transition-colors duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-8 border-b border-[#1C3560] dark:border-[#2A0910]">
        {/* Brand & Mission (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <MedNexusLogo size="lg" showSubtitle={false} />
          <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed max-w-sm mt-3">
            Dedicated to protecting connected medical devices and hospital healthcare networks against cyberattacks through post-quantum cryptography, real-time intrusion defense, and zero-trust device verification.
          </p>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-[#35C5E8] dark:text-[#EF4444] pt-2">
            <ShieldCheck className="w-4 h-4 text-[#19B77A] dark:text-[#EF4444]" />
            <span>NIST FIPS 203 & 204 Validated Defense</span>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <span className="w-8 h-8 rounded-full bg-[#142B50] dark:bg-[#160509] border border-[#1C3560] dark:border-[#2A0910] flex items-center justify-center text-xs text-slate-300 hover:text-white hover:border-[#35C5E8] dark:hover:border-[#EF4444] transition-colors cursor-pointer">
              in
            </span>
            <span className="w-8 h-8 rounded-full bg-[#142B50] dark:bg-[#160509] border border-[#1C3560] dark:border-[#2A0910] flex items-center justify-center text-xs text-slate-300 hover:text-white hover:border-[#35C5E8] dark:hover:border-[#EF4444] transition-colors cursor-pointer">
              𝕏
            </span>
            <span className="w-8 h-8 rounded-full bg-[#142B50] dark:bg-[#160509] border border-[#1C3560] dark:border-[#2A0910] flex items-center justify-center text-xs text-slate-300 hover:text-white hover:border-[#35C5E8] dark:hover:border-[#EF4444] transition-colors cursor-pointer">
              yt
            </span>
          </div>
        </div>

        {/* Platform Navigation */}
        <div className="space-y-3 text-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-red-400 font-mono">
            Platform Capabilities
          </div>
          <ul className="space-y-2 text-slate-300 dark:text-slate-400 font-medium">
            <li className="hover:text-[#35C5E8] dark:hover:text-[#EF4444] transition-colors cursor-pointer">IoMT Fleet Monitoring</li>
            <li className="hover:text-[#35C5E8] dark:hover:text-[#EF4444] transition-colors cursor-pointer">Device Simulator Lab</li>
            <li className="hover:text-[#35C5E8] dark:hover:text-[#EF4444] transition-colors cursor-pointer">Adversary Attack Simulation</li>
            <li className="hover:text-[#35C5E8] dark:hover:text-[#EF4444] transition-colors cursor-pointer">Post-Quantum Cryptography</li>
            <li className="hover:text-[#35C5E8] dark:hover:text-[#EF4444] transition-colors cursor-pointer">Firmware Anti-Rollback</li>
            <li className="hover:text-[#35C5E8] dark:hover:text-[#EF4444] transition-colors cursor-pointer">Merkle Audit Trail</li>
          </ul>
        </div>

        {/* Emergency Hotline & Support */}
        <div className="space-y-3 text-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-red-400 font-mono">
            Emergency SOC Contact
          </div>
          <ul className="space-y-2 text-slate-300 dark:text-slate-400 font-mono text-[11px]">
            <li className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-[#19B77A] dark:text-[#EF4444]" />
              <span className="text-white font-bold tracking-wide">+91 8844336600</span>
            </li>
            <li className="flex items-center space-x-2">
              <Mail className="w-3.5 h-3.5 text-[#35C5E8] dark:text-[#EF4444]" />
              <span className="text-slate-200">Securemed@hospital.org</span>
            </li>
            <li className="pt-2 text-slate-400 dark:text-slate-500 leading-normal font-sans">
              2180 Innovation Drive, Suite 310<br />
              Cybersecurity Operations Center
            </li>
          </ul>
        </div>

        {/* Newsletter / Threat Intelligence Bulletin */}
        <div className="space-y-3 text-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-red-400 font-mono">
            Stay Updated on IoMT Threats
          </div>
          <p className="text-slate-300 dark:text-slate-400 text-[11px] leading-relaxed">
            Receive the latest CVE vulnerability bulletins, post-quantum research updates, and clinical security advisories.
          </p>

          <form onSubmit={handleSubscribe} className="space-y-2">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter hospital email..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#142B50] dark:bg-[#160509] border border-[#1C3560] dark:border-[#2A0910] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#35C5E8] dark:focus:border-[#EF4444]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-100 dark:bg-gradient-to-r dark:from-red-600 dark:to-rose-700 dark:hover:from-red-500 dark:hover:to-rose-600 text-[#0B1733] dark:text-white font-bold text-xs transition-all shadow-md"
            >
              {subscribed ? 'Subscribed to Alerts ✓' : 'Subscribe to Advisories'}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-3 border-t border-transparent dark:border-[#2A0910]/40">
        <div>
          © 2026 SecuraMed Technologies Inc. • Securing Every Connection. Protecting Every Life.
        </div>
        <div className="flex items-center space-x-6 font-mono text-[11px]">
          <span className="hover:text-white dark:hover:text-[#EF4444] cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-white dark:hover:text-[#EF4444] cursor-pointer transition-colors">Terms of Operations</span>
          <span className="hover:text-white dark:hover:text-[#EF4444] cursor-pointer transition-colors">HIPAA Compliance</span>
          <span className="hover:text-white dark:hover:text-[#EF4444] cursor-pointer transition-colors">NIST FIPS 203/204</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
