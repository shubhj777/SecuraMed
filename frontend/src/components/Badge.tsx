import React from 'react';

interface BadgeProps {
  type: 'TRUSTED' | 'REVOKED' | 'SUSPICIOUS' | 'ONLINE' | 'OFFLINE' | 'APPROVED' | 'REJECTED' | 'BLOCKED' | 'MITIGATED' | 'SUCCESS' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | string;
  label?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, label }) => {
  const t = type.toUpperCase();
  const text = label || type;

  // Green
  if (['TRUSTED', 'ONLINE', 'APPROVED', 'SUCCESS', 'VERIFIED', 'COMPATIBLE', 'MATCH', 'PASSED'].includes(t)) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        {text}
      </span>
    );
  }

  // Red
  if (['REVOKED', 'REJECTED', 'BLOCKED', 'CRITICAL', 'INVALID', 'UNTRUSTED_KEY', 'MISMATCH', 'ROLLBACK_DETECTED', 'INCOMPATIBLE'].includes(t)) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-400"></span>
        {text}
      </span>
    );
  }

  // Orange / Yellow
  if (['SUSPICIOUS', 'WARNING', 'MITIGATED', 'HIGH', 'MEDIUM'].includes(t)) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-400"></span>
        {text}
      </span>
    );
  }

  // Default Blue / Info / Offline
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-cyan-400"></span>
      {text}
    </span>
  );
};
