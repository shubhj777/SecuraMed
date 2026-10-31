import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const SecureMedLogo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showSubtitle = true 
}) => {
  const iconDimensions = {
    sm: { box: 'w-8 h-8', svg: 'w-5 h-5', text: 'text-sm', badge: 'text-[9px] px-1' },
    md: { box: 'w-10 h-10', svg: 'w-6 h-6', text: 'text-base', badge: 'text-[10px] px-1.5' },
    lg: { box: 'w-12 h-12', svg: 'w-8 h-8', text: 'text-lg', badge: 'text-xs px-2' },
  }[size];

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Red Healthcare Heart Icon Container */}
      <div className={`relative ${iconDimensions.box} rounded-xl bg-gradient-to-br from-[#FF5A65] via-[#E63946] to-[#C62828] p-0.5 flex items-center justify-center shadow-lg shadow-red-900/30 border border-red-400/40 shrink-0`}>
        {/* Subtle Cyber Shield Accent Behind Heart */}
        <svg 
          viewBox="0 0 24 24" 
          className={`${iconDimensions.svg} text-white drop-shadow-md`}
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Recognizable Red Heart Shape */}
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="url(#heartGradient)"
          />
          {/* Medical Pulse / Heartbeat Line Across the Heart */}
          <path
            d="M3.5 10.5h4.2l1.3-3.2 2.2 7 1.8-5 1 2.2h4.5"
            stroke="#FFFFFF"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Small Cybersecurity Shield Badge Overlay at Bottom Right */}
          <path
            d="M17 14.5v2.8c0 1.6-1.3 3.1-2.5 3.7-1.2-.6-2.5-2.1-2.5-3.7v-2.8l2.5-1.2 2.5 1.2z"
            fill="#0B1220"
            stroke="#38BDF8"
            strokeWidth="1"
          />
          {/* Lock Keyhole in Shield */}
          <circle cx="14.5" cy="16.5" r="0.75" fill="#38BDF8" />
          <path d="M14.5 17.2v1" stroke="#38BDF8" strokeWidth="0.8" strokeLinecap="round" />

          {/* Gradients */}
          <defs>
            <linearGradient id="heartGradient" x1="2" y1="3" x2="22" y2="21.35" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF5A65" />
              <stop offset="0.5" stopColor="#E63946" />
              <stop offset="1" stopColor="#C62828" />
            </linearGradient>
          </defs>
        </svg>

        {/* Ambient Pulsing Glow Indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white/50"></span>
        </span>
      </div>

      {/* Brand Name & Tag */}
      <div>
        <div className={`font-extrabold ${iconDimensions.text} tracking-tight text-white flex items-center gap-1.5`}>
          SecureMed
          <span className={`${iconDimensions.badge} py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold tracking-wider`}>
            PQC
          </span>
        </div>
        {showSubtitle && (
          <div className="text-[11px] text-slate-400 font-medium tracking-tight">
            Hospital Security Gateway
          </div>
        )}
      </div>
    </div>
  );
};
