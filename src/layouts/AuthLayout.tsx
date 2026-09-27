import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';
import { URS_GAMARA_TEAM } from '../features/teams/config/currentTeam.config';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0D0914] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#522B80]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#8B44F7]/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Brand logo header */}
      <div className="mb-6 text-center z-10">
        <Link to="/" className="inline-flex items-center space-x-3 group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B44F7] via-[#522B80] to-[#26143E] border border-[#E2B86E]/40 flex items-center justify-center shadow-lg shadow-[#8B44F7]/30 group-hover:scale-105 transition-transform duration-300">
            <Shield className="w-7 h-7 text-[#E2B86E]" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E2B86E] to-[#8B44F7]">
              {URS_GAMARA_TEAM.name}
            </h1>
            <p className="text-xs text-gray-400 flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-[#E2B86E]" /> Team Management System
            </p>
          </div>
        </Link>
      </div>

      {/* Form card container */}
      <div className="w-full max-w-md bg-[#26143E]/50 border border-[#8B44F7]/30 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 z-10">
        <Outlet />
      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-gray-500 z-10">
        <p>© {new Date().getFullYear()} {URS_GAMARA_TEAM.name} Esports. Todos los derechos reservados.</p>
      </div>
    </div>
  );
};
