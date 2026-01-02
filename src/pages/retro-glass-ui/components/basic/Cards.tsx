import React from 'react';

// --- Cards ---
export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`bg-[#fdfbf7] rounded-xl border border-[#d1d5db] paper-shadow p-6 ${className}`}>
      {children}
    </div>
  );
};

export const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`glass-panel rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
};

// --- Badges ---
export const Badge = ({ children, variant = 'neutral' }: { children: React.ReactNode, variant?: 'neutral' | 'success' | 'warning' }) => {
  const variants = {
    neutral: "bg-[#e5e7eb] text-[#374151]",
    success: "bg-[#dcfce7] text-[#166534]",
    warning: "bg-[#fef3c7] text-[#92400e]"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};
