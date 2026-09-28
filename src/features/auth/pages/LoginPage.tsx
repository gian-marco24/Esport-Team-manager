import { Link, Navigate } from 'react-router-dom';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { LoginForm } from '../components/LoginForm';
import { Shield, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-start">
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#140b21] hover:bg-[#26143E] border border-[#522B80]/40 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#E2B86E]" />
          <span>Volver a la Página Principal</span>
        </Link>
      </div>

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
