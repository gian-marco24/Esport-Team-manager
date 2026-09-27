import React from 'react';
import { Link } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export const RegisterForm: React.FC = () => {
  const { register, handleSubmit, errors, isSubmitting, authError } = useRegisterForm();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {authError && (
        <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start space-x-2 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      <Input
        label="Nombre / Nickname"
        type="text"
        placeholder="ej. GamaraPlayer"
        leftIcon={<UserIcon className="w-4 h-4" />}
        error={errors.displayName?.message}
        {...register('displayName')}
      />

      <Input
        label="Correo Electrónico"
        type="email"
        placeholder="jugador@ursgamara.gg"
        leftIcon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        leftIcon={<Lock className="w-4 h-4" />}
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Confirmar Contraseña"
        type="password"
        placeholder="••••••••"
        leftIcon={<Lock className="w-4 h-4" />}
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button
        type="submit"
        variant="secondary"
        className="w-full mt-3 py-3"
        isLoading={isSubmitting}
        rightIcon={<ArrowRight className="w-4 h-4" />}
      >
        Crear Perfil URS Gamara
      </Button>

      <div className="text-center pt-2">
        <p className="text-xs text-gray-400">
          ¿Ya formas parte del equipo?{' '}
          <Link to="/login" className="text-[#8B44F7] hover:text-[#E2B86E] font-semibold underline transition-colors">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </form>
  );
};
