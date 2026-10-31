import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const SecureMedLogo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showSubtitle = true 
}) => {
  const iconDimensions = {
    sm: { box: 'w-8 h-8', svg: 'w-7 h-7', text: 'text-sm', badge: 'text-[9px] px-1' },
    md: { box: 'w-10 h-10', svg: 'w-9 h-9', text: 'text-base', badge: 'text-[10px] px-1.5' },
    lg: { box: 'w-12 h-12', svg: 'w-11 h-11', text: 'text-lg', badge: 'text-xs px-2' },
    xl: { box: 'w-16 h-16', svg: 'w-14 h-14', text: 'text-2xl', badge: 'text-xs px-2.5' },
  }[size];

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Red Healthcare Heart Icon - Pure #E63946 with recognizable medical pulse */}
      <div className={`relative ${iconDimensions.box} flex items-center justify-center shrink-0`}>
        <svg 
          viewBox="0 0 24 24" 
          className={`${iconDimensions.svg} filter drop-shadow-sm`}
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Solid Red/Crimson Heart - Primary Colour #E63946 */}
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="#E63946"
          />

          {/* Crisp Medical Heartbeat / Pulse Symbol (Pure White #FFFFFF) */}
          <path
            d="M3.2 10.8h4.5l1.4-3.5 2.4 7.5 2-5.5 1.1 2.5h4.2"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Ambient Pulsing Glow Indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E63946] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E63946]"></span>
        </span>
      </div>

      {/* Brand Name & Tag */}
      <div>
        <div className={`font-extrabold ${iconDimensions.text} tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 transition-colors`}>
          SecureMed
          <span className={`${iconDimensions.badge} py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono font-bold tracking-wider`}>
            GATEWAY
          </span>
        </div>
        {showSubtitle && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
            Connected Medical Device Defense
          </div>
        )}
      </div>
    </div>
  );
};
