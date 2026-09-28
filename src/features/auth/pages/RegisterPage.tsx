import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { ShieldAlert, Sparkles, Clock, UserCheck, Shield, Lock, ArrowLeft } from 'lucide-react';
import { RegisterForm } from '../components/RegisterForm';
import { teamService } from '../../teams/services/teamService';
import type { Invitation } from '../../teams/types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';
import { useAuthContext } from '../../../app/providers/AuthProvider';

export const RegisterPage: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthContext();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    let timerId: any;

    const checkInvitation = async () => {
      if (isAuthLoading || isAuthenticated || !code) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorStatus(null);

      try {
        const inv = await teamService.getInvitationByCode(code);
        if (!inv) {
          setErrorStatus('El código de invitación es inválido o no existe en el sistema. Infórmale al CEO para que te genere un nuevo enlace.');
          setLoading(false);
          return;
        }

        if (inv.used) {
          setErrorStatus('Este código de invitación ya ha sido utilizado. Infórmale al CEO si necesitas un nuevo enlace de acceso.');
          setLoading(false);
          return;
        }

        const expiresAt = new Date(inv.expiresAt).getTime();
        const now = Date.now();

        if (now > expiresAt) {
          setErrorStatus('El código de invitación ha expirado (duración máxima de 30 minutos). Infórmale al CEO de tu equipo para que te genere uno nuevo.');
          setLoading(false);
          return;
        }

        setInvitation(inv);

        // Update countdown every second
        const updateCountdown = () => {
          const currentNow = Date.now();
          const diffMs = expiresAt - currentNow;

          if (diffMs <= 0) {
            setErrorStatus('El código de invitación ha expirado (duración máxima de 30 minutos). Infórmale al CEO de tu equipo para que te genere uno nuevo.');
            setInvitation(null);
            clearInterval(timerId);
          } else {
            const minutes = Math.floor(diffMs / 60000);
            const seconds = Math.floor((diffMs % 60000) / 1000);
            setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
          }
        };

        updateCountdown();
        timerId = setInterval(updateCountdown, 1000);
      } catch (e) {
        setErrorStatus((e as Error).message || 'Error al validar el enlace de invitación.');
      } finally {
        setLoading(false);
      }
    };

    checkInvitation();

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [code, isAuthenticated, isAuthLoading]);

  // Automatic redirects
  if (isAuthLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  // If user is already logged in, send them directly to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not logged in and NO invite token code parameter -> redirect to home page
  if (!code) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <LoadingSpinner />
        <p className="text-xs text-gray-400">Verificando vigencia del enlace privado...</p>
      </div>
    );
  }

  if (errorStatus || !invitation) {
    return (
      <Card glow="purple" className="p-8 text-center space-y-6 max-w-md mx-auto border border-red-500/40 bg-[#140b21]">
        <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-500/20">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-950/60 border border-red-500/40 rounded-full text-[10px] font-bold text-red-300 uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>Código Expirado o Inválido</span>
          </div>
          <h2 className="text-xl font-black text-white">Invitación Vencida</h2>
          <p className="text-xs text-gray-300 leading-relaxed font-medium">{errorStatus}</p>
        </div>

        <div className="p-4 bg-[#1b0c30] border border-[#522B80]/60 rounded-xl text-left space-y-2 text-xs text-gray-400">
          <div className="flex items-center space-x-2 text-[#E2B86E] font-semibold">
            <Shield className="w-4 h-4" />
            <span>Política de invitación de URS Gamara:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Los enlaces de invitación privados caducan a los <strong>30 minutos</strong> de ser generados por el CEO para proteger la plantilla del equipo.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            to="/login"
            className="flex-1 py-2.5 px-4 bg-[#522B80] hover:bg-[#8B44F7] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir a Iniciar Sesión</span>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner for Invitation */}
      <div className="p-5 bg-gradient-to-r from-[#26143E] via-[#1b0c30] to-[#26143E] border border-[#8B44F7]/40 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#8B44F7]/20 border border-[#8B44F7]/50 rounded-full text-[11px] font-bold text-[#E2B86E] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Invitación Oficial Privada</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-950/60 border border-amber-500/40 rounded-full text-xs font-mono font-bold text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Expira en {timeLeft}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1 border-t border-[#8B44F7]/20">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block">Nickname Asignado por CEO</span>
            <div className="flex items-center space-x-2 text-lg font-black text-white">
              <UserCheck className="w-5 h-5 text-[#E2B86E]" />
              <span>{invitation.nick}</span>
            </div>
          </div>

          <div className="space-y-1 sm:text-right">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block">Rol Pre-asignado</span>
            <Badge variant="gold" className="text-xs px-3 py-1 font-bold">
              {invitation.teamRole}
            </Badge>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <Card glow="purple" className="p-6">
        <h3 className="text-lg font-bold text-white mb-1">Completa tus Datos</h3>
        <p className="text-xs text-gray-400 mb-5">Ingresa tus credenciales y datos de residencia para activar tu perfil.</p>
        <RegisterForm invitation={invitation} />
      </Card>
    </div>
  );
};
