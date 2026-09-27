import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterFormData } from '../types';
import { authService } from '../services/authService';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { customZodResolver } from '../../../utils/zodResolver';

export const useRegisterForm = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const { setUser } = useAuthContext();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: customZodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setAuthError(null);
    try {
      const user = await authService.register(data);
      setUser(user);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado al registrar el usuario.';
      setAuthError(message);
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
    authError,
  };
};
