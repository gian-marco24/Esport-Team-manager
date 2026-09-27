import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'none' | 'purple' | 'gold';
}

export const Card: React.FC<CardProps> = ({ children, className = '', glow = 'none' }) => {
  const glowStyles = {
    none: '',
    purple: 'hover:shadow-[0_0_25px_rgba(139,68,247,0.25)] border-[#8B44F7]/40',
    gold: 'hover:shadow-[0_0_25px_rgba(226,184,110,0.25)] border-[#E2B86E]/40',
  };

  return (
    <div
      className={`bg-[#26143E]/40 border border-[#522B80]/40 backdrop-blur-md rounded-xl p-5 transition-all duration-300 ${glowStyles[glow]} ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`mb-4 pb-3 border-b border-[#522B80]/40 ${className}`}>{children}</div>;

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <h3 className={`text-lg font-bold text-[#E2B86E] ${className}`}>{children}</h3>;
