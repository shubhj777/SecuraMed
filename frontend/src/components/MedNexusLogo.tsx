import React from 'react';

interface MedNexusLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  forceWhiteText?: boolean;
}

export const MedNexusLogo: React.FC<MedNexusLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  forceWhiteText = false,
}) => {
  const sizeMap = {
    sm: { icon: 'w-8 h-8', text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 'w-16 h-16', text: 'text-4xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center space-x-3 select-none group cursor-pointer ${className}`}>
      {/* High-tech SecuraMed IoMT Cyber-Shield Hologram Mark */}
      <div className={`relative ${currentSize.icon} flex items-center justify-center shrink-0`}>
        {/* Animated Cyber-Orbital Radar Halo */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#35C5E8]/25 via-[#19B77A]/20 to-[#35C5E8]/10 dark:from-[#EF4444]/30 dark:via-[#991B1B]/25 dark:to-[#DC2626]/10 blur-sm group-hover:blur-md transition-all duration-300 opacity-80 group-hover:scale-115" />
        
        {/* Rotating Geometric Perimeter Ring */}
        <div className="absolute inset-0 rounded-2xl border border-sky-400/25 dark:border-red-600/30 border-dashed animate-[spin_24s_linear_infinite]" />

        <svg 
          viewBox="0 0 44 44" 
          fill="none" 
          className="w-full h-full relative z-10 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            {/* Light Mode Gradient: Precision Deep Navy & Cyan */}
            <linearGradient id="shieldGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#142B50" />
              <stop offset="45%" stopColor="#0B1733" />
              <stop offset="100%" stopColor="#071226" />
            </linearGradient>

            {/* Dark Mode Gradient: Obsidian Cyber-Crimson */}
            <linearGradient id="shieldGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3E0913" />
              <stop offset="50%" stopColor="#1A0408" />
              <stop offset="100%" stopColor="#080103" />
            </linearGradient>

            {/* Rim Gradient Light */}
            <linearGradient id="rimGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#35C5E8" />
              <stop offset="50%" stopColor="#19B77A" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            {/* Rim Gradient Dark */}
            <linearGradient id="rimGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>

            {/* Live Cardiac Pulse Light Gradient */}
            <linearGradient id="ecgGradLight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#35C5E8" stopOpacity="0.4" />
              <stop offset="35%" stopColor="#35C5E8" stopOpacity="1" />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="80%" stopColor="#19B77A" stopOpacity="1" />
              <stop offset="100%" stopColor="#35C5E8" stopOpacity="0.4" />
            </linearGradient>

            {/* Live Cardiac Pulse Dark Gradient */}
            <linearGradient id="ecgGradDark" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#991B1B" stopOpacity="0.4" />
              <stop offset="35%" stopColor="#EF4444" stopOpacity="1" />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="80%" stopColor="#DC2626" stopOpacity="1" />
              <stop offset="100%" stopColor="#991B1B" stopOpacity="0.4" />
            </linearGradient>

            <filter id="coreBloomGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Multi-Faceted Cyber-Shield Body */}
          <path
            d="M22 3L6 9V21.5C6 31.4 12.8 39.4 22 42C31.2 39.4 38 31.4 38 21.5V9L22 3Z"
            className="fill-[url(#shieldGradLight)] dark:fill-[url(#shieldGradDark)] stroke-[url(#rimGradLight)] dark:stroke-[url(#rimGradDark)]"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Inner Facet / Refraction Contour Line */}
          <path
            d="M22 6.5L9.5 11.5V21C9.5 28.8 14.8 35.4 22 37.8C29.2 35.4 34.5 28.8 34.5 21V11.5L22 6.5Z"
            className="stroke-[#35C5E8]/25 dark:stroke-[#EF4444]/30"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Medical IoMT Coordinate Crosshair */}
          <path
            d="M22 8.5V35.5M10.5 22H33.5"
            className="stroke-[#1C3560]/60 dark:stroke-[#450A0A]/70"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />

          {/* Medical Cross Tech Embellishment at Top Center */}
          <path
            d="M22 10V14M20 12H24"
            className="stroke-[#35C5E8] dark:stroke-[#EF4444]"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Dynamic Cardiac Heartbeat Pulse Waveform (P-Q-R-S-T) */}
          <path
            d="M 9.5 22 H 14.5 L 16.8 15 L 20.2 30.5 L 23.5 13 L 26.2 25 L 28.5 22 H 34.5"
            className="stroke-[url(#ecgGradLight)] dark:stroke-[url(#ecgGradDark)] animate-ecg-line"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#coreBloomGlow)"
          />

          {/* Central Active Quantum Core Detection Node */}
          <circle cx="22" cy="22" r="3.5" className="fill-white opacity-90 animate-ping" />
          <circle cx="22" cy="22" r="2.2" className="fill-[#35C5E8] dark:fill-[#EF4444]" />
        </svg>
      </div>

      {/* SecuraMed Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center leading-none">
          <div className={`font-black tracking-tight ${currentSize.text} font-sans flex items-center`}>
            <span className={`${forceWhiteText ? 'text-white' : 'text-[#0B1733] dark:text-white'} transition-colors duration-200`}>
              Secura
            </span>
            <span className="bg-gradient-to-r from-[#0284C7] to-[#0D9488] dark:from-[#EF4444] dark:to-[#DC2626] bg-clip-text text-transparent font-black ml-0.5">
              Med
            </span>
          </div>
        </div>

        {showSubtitle && (
          <span className={`${currentSize.sub} font-semibold ${forceWhiteText ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'} mt-1 tracking-wider uppercase font-mono truncate`}>
            Securing Every Connection • Protecting Every Life
          </span>
        )}
      </div>
    </div>
  );
};

export default MedNexusLogo;
