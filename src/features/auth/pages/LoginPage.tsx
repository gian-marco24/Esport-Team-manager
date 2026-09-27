import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#522B80]/40 border border-[#8B44F7]/30 rounded-full text-[11px] font-semibold text-[#E2B86E] uppercase tracking-wider mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>Acceso Restringido Escuadra</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-wide">Iniciar Sesión</h2>
        <p className="text-xs text-gray-400">Ingresa tus credenciales para acceder al sistema de URS Gamara</p>
      </div>

      <LoginForm />
    </div>
  );
};
