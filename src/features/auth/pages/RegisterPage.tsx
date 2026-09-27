import React from 'react';
import { RegisterForm } from '../components/RegisterForm';
import { Sparkles } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#A88144]/25 border border-[#E2B86E]/40 rounded-full text-[11px] font-semibold text-[#E2B86E] uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Nuevo Integrante</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-wide">Registro de Jugador / Staff</h2>
        <p className="text-xs text-gray-400">Crea tu cuenta oficial para integrarte a la plantilla de URS Gamara</p>
      </div>

      <RegisterForm />
    </div>
  );
};
