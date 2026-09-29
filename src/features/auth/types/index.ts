import { z } from 'zod';
import type { TeamRole, RosterMemberAssignment, ManagerSubrole, StaffSubrole } from '../../teams/types';

export type UserRole = 'ceo' | 'player' | 'coach' | 'analyst' | 'manager' | 'staff';

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
  gameTag?: string;
  role: UserRole;
  teamRole?: TeamRole;
  rosterAssignments?: RosterMemberAssignment[];
  globalSubrole?: ManagerSubrole | StaffSubrole | string;
  birthDate?: string;
  country?: string;
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

export const createRegisterSchema = (teamRole?: TeamRole) => {
  const isTagRequired = teamRole === 'Player' || teamRole === 'Coach';
  return z
    .object({
      code: z.string().min(1, 'Código de invitación requerido'),
      email: z.string().email('Ingresa un correo electrónico válido'),
      gameTag: z.string().optional(),
      password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
      confirmPassword: z.string().min(6, 'Confirma tu contraseña'),
      birthDate: z.string().min(1, 'Selecciona tu fecha de nacimiento'),
      country: z.string().min(1, 'Selecciona tu país de residencia'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
    })
    .refine(
      (data) => {
        if (isTagRequired) {
          return Boolean(data.gameTag && data.gameTag.trim().length > 0);
        }
        return true;
      },
      {
        message: 'Ingresa tu Tag del juego (obligatorio para Jugadores y Coaches, ej: #LAN, #1234)',
        path: ['gameTag'],
      }
    );
};

export const registerSchema = createRegisterSchema();

export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;
