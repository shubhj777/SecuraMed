import React from 'react';

interface BadgeProps {
  type: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  type, 
  label, 
  size = 'md',
  className = '' 
}) => {
  const normalizedType = (type || '').toUpperCase().trim();
  const displayLabel = label || normalizedType.replace(/_/g, ' ');

  // Color variants
  let colors = {
    bg: 'bg-[#35C5E8]/10 dark:bg-[#35C5E8]/15',
    text: 'text-[#0882A4] dark:text-[#35C5E8]',
    border: 'border-[#35C5E8]/30 dark:border-[#35C5E8]/40',
    dot: 'bg-[#35C5E8]',
  };

  // Success / Trusted / Online / Approved
  if ([
    'TRUSTED', 'ONLINE', 'APPROVED', 'SUCCESS', 'VERIFIED', 
    'COMPATIBLE', 'MATCH', 'PASSED', 'HEALTHY', 'OPERATIONAL', 'PROTECTED'
  ].includes(normalizedType)) {
    colors = {
      bg: 'bg-[#19B77A]/10 dark:bg-[#19B77A]/15',
      text: 'text-[#0E8A59] dark:text-[#19B77A]',
      border: 'border-[#19B77A]/30 dark:border-[#19B77A]/40',
      dot: 'bg-[#19B77A]',
    };
  }
  // Danger / Critical / Blocked / Revoked / Tampered
  else if ([
    'REVOKED', 'REJECTED', 'BLOCKED', 'CRITICAL', 'INVALID', 
    'UNTRUSTED_KEY', 'MISMATCH', 'ROLLBACK_DETECTED', 'INCOMPATIBLE', 
    'OFFLINE', 'FAILED', 'TAMPERED', 'BREACH', 'ATTACK'
  ].includes(normalizedType)) {
    colors = {
      bg: 'bg-[#E94B5B]/10 dark:bg-[#E94B5B]/15',
      text: 'text-[#D02B3C] dark:text-[#E94B5B]',
      border: 'border-[#E94B5B]/30 dark:border-[#E94B5B]/40',
      dot: 'bg-[#E94B5B]',
    };
  }
  // Warning / Suspicious / High / Medium
  else if ([
    'SUSPICIOUS', 'WARNING', 'MITIGATED', 'HIGH', 'MEDIUM', 'ATTENTION', 'REPAIRING'
  ].includes(normalizedType)) {
    colors = {
      bg: 'bg-[#F5A623]/10 dark:bg-[#F5A623]/15',
      text: 'text-[#C67D0A] dark:text-[#F5A623]',
      border: 'border-[#F5A623]/30 dark:border-[#F5A623]/40',
      dot: 'bg-[#F5A623]',
    };
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold font-mono rounded-full border shadow-sm transition-colors ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0 animate-pulse`} />
      <span className="truncate">{displayLabel}</span>
    </span>
  );
};

export default Badge;
