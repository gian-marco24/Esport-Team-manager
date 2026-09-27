import { z } from 'zod';

export type UserRole = 'player' | 'coach' | 'analyst' | 'manager' | 'staff';

export interface UserStats {
  kda: string;
  winrate: number;
  matchesPlayed: number;
  hsPercentage: number;
  mvpCount: number;
  mainAgentOrHero: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  teamId: string;
  teamName: string;
  position?: string;
  bio?: string;
  stats: UserStats;
  createdAt: string;
}

export const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  displayName: z.string().min(3, 'El nombre o nickname debe tener al menos 3 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
