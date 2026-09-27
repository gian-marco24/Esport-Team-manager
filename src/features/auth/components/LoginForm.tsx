import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export const LoginForm: React.FC = () => {
  const { register, handleSubmit, errors, isSubmitting, authError } = useLoginForm();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {authError && (
        <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start space-x-2 text-red-300 text-xs animate-shake">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

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

      <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-[#522B80] bg-[#180d29] text-[#8B44F7] focus:ring-[#8B44F7]"
            {...register('rememberMe')}
          />
          <span>Recordarme</span>
        </label>
        <a href="#forgot" className="text-[#E2B86E] hover:underline font-medium">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full mt-2 py-3"
        isLoading={isSubmitting}
        rightIcon={<ArrowRight className="w-4 h-4" />}
      >
        Ingresar al Portal
      </Button>

      <div className="text-center pt-2">
        <p className="text-xs text-gray-400">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/register" className="text-[#E2B86E] hover:text-[#8B44F7] font-semibold underline transition-colors">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </form>
  );
};
