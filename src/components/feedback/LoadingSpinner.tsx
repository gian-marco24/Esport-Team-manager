import React from 'react';

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Cargando...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6 space-y-4">
      <div className="relative w-14 h-14">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border-4 border-t-[#8B44F7] border-r-transparent border-b-[#E2B86E] border-l-transparent animate-spin"></div>
        {/* Inner core */}
        <div className="absolute inset-2 rounded-full bg-[#26143E] flex items-center justify-center text-[#E2B86E] font-bold text-xs tracking-tighter shadow-inner">
          UG
        </div>
      </div>
      {label && <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold animate-pulse">{label}</p>}
    </div>
  );
};
