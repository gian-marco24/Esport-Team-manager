import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'purple' | 'gold' | 'dark' | 'outline' | 'success' | 'danger' | 'emerald' | 'blue';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'purple', className = '' }) => {
  const variantStyles = {
    purple: 'bg-[#522B80]/60 text-[#8B44F7] border border-[#8B44F7]/40',
    gold: 'bg-[#A88144]/25 text-[#E2B86E] border border-[#E2B86E]/40',
    dark: 'bg-[#0D0914] text-gray-300 border border-[#26143E]',
    outline: 'border border-gray-600 text-gray-300',
    success: 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30',
    danger: 'bg-red-950/60 text-red-400 border border-red-500/30',
    emerald: 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30',
    blue: 'bg-blue-950/60 text-blue-400 border border-blue-500/30',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold uppercase tracking-wider ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
