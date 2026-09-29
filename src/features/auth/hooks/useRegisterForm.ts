import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { createRegisterSchema, type RegisterFormData } from '../types';
import type { TeamRole } from '../../teams/types';
import { authService } from '../services/authService';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { customZodResolver } from '../../../utils/zodResolver';

export const useRegisterForm = (invitationCode: string, teamRole?: TeamRole) => {
  const [authError, setAuthError] = useState<string | null>(null);
  const { setUser } = useAuthContext();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: customZodResolver(createRegisterSchema(teamRole)),
    defaultValues: {
      code: invitationCode,
      email: '',
      gameTag: '',
      password: '',
      confirmPassword: '',
      birthDate: '',
      country: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setAuthError(null);
    try {
      const user = await authService.register({
        ...data,
        code: invitationCode,
      });
      setUser(user);
      navigate('/dashboard/team', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado al registrar el usuario.';
      setAuthError(message);
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    setValue,
    errors,
    isSubmitting,
    authError,
  };
};
