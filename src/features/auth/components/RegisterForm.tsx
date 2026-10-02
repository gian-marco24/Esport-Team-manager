import React from 'react';
import { Mail, Lock, Calendar, Globe, AlertCircle, ArrowRight, Hash } from 'lucide-react';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { AMERICAN_COUNTRIES, type Invitation } from '../../teams/types';

interface RegisterFormProps {
  invitation: Invitation;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ invitation }) => {
  const isTagRequired = invitation.teamRole === 'Player';
  const { register, handleSubmit, errors, isSubmitting, authError } = useRegisterForm(
    invitation.code,
    invitation.teamRole
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {authError && (
        <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start space-x-2 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="usuario@ursgamara.gg"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label={isTagRequired ? 'Tag del Juego (Riot Tag / Gamertag) *' : 'Tag del Juego (Opcional)'}
          type="text"
          placeholder={isTagRequired ? 'ej: #LAN o #1234 (Obligatorio)' : 'ej: #LAN o #1234 (Opcional)'}
          leftIcon={<Hash className="w-4 h-4 text-[#E2B86E]" />}
          error={errors.gameTag?.message}
          {...register('gameTag')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          label="Fecha de Nacimiento"
          type="date"
          leftIcon={<Calendar className="w-4 h-4" />}
          error={errors.birthDate?.message}
          {...register('birthDate')}
        />

        <Select
          label="País (América)"
          leftIcon={<Globe className="w-4 h-4" />}
          error={errors.country?.message}
          {...register('country')}
        >
          <option value="">Selecciona tu país...</option>
          {AMERICAN_COUNTRIES.map((country) => (
            <option key={country} value={country} className="bg-[#140b21] text-white">
              {country}
            </option>
          ))}
        </Select>
      </div>

      <Button
        type="submit"
        variant="secondary"
        className="w-full mt-5 py-3 text-sm font-bold shadow-lg shadow-[#8B44F7]/25 text-[#1c0c32]"
        isLoading={isSubmitting}
        rightIcon={<ArrowRight className="w-4 h-4 text-[#1c0c32]" />}
      >
        Completar Registro e Ingresar
      </Button>
    </form>
  );
};
