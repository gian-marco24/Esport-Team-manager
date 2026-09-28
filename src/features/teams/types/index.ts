export type TeamRole = 'CEO' | 'Player' | 'Coach' | 'Manager' | 'Creador de contenido' | 'Staff';

export type PlayerSubrole = 'Player titular' | 'Player suplente';

export type CoachSubrole = 'Head coach' | 'Assistant coach' | 'Performance Coach' | 'Analista';

export type ManagerSubrole = 'Manager general' | 'Manager deportivo' | 'Community manager' | 'Otro';

export type StaffSubrole = 'Moderador' | 'Co-ceo' | 'Finanzas' | 'Logística' | 'Otro';

export interface GamePreset {
  id: string;
  name: string;
  defaultMainPlayers: number;
}

export const GAME_PRESETS: GamePreset[] = [
  { id: 'valorant', name: 'Valorant', defaultMainPlayers: 5 },
  { id: 'lol', name: 'League of Legends', defaultMainPlayers: 5 },
  { id: 'cs2', name: 'Counter-Strike 2', defaultMainPlayers: 5 },
  { id: 'rocket_league', name: 'Rocket League', defaultMainPlayers: 3 },
  { id: 'cod', name: 'Call of Duty', defaultMainPlayers: 4 },
  { id: 'overwatch', name: 'Overwatch 2', defaultMainPlayers: 5 },
  { id: 'r6', name: 'Rainbow Six Siege', defaultMainPlayers: 5 },
  { id: 'apex', name: 'Apex Legends', defaultMainPlayers: 3 },
  { id: 'custom', name: 'Otro / Personalizado', defaultMainPlayers: 5 },
];

export const AMERICAN_COUNTRIES: string[] = [
  'Antigua y Barbuda',
  'Argentina',
  'Bahamas',
  'Barbados',
  'Belice',
  'Bolivia',
  'Brasil',
  'Canadá',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Dominica',
  'Ecuador',
  'El Salvador',
  'Estados Unidos',
  'Granada',
  'Guatemala',
  'Guyana',
  'Haití',
  'Honduras',
  'Jamaica',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'República Dominicana',
  'San Cristóbal y Nieves',
  'San Vicente y las Granadinas',
  'Santa Lucía',
  'Surinam',
  'Trinidad y Tobago',
  'Uruguay',
  'Venezuela',
];

export interface Roster {
  id: string;
  name: string;
  game: string;
  maxMainPlayers: number;
  maxSubstitutes: number; // Siempre hasta 3
  maxCoaches: number; // Siempre hasta 3
  logoUrl?: string;
  createdAt: string;
}

export interface RosterMemberAssignment {
  rosterId: string;
  subrole: PlayerSubrole | CoachSubrole;
}

export interface TeamMember {
  id: string;
  email: string;
  displayName: string; // Nickname
  teamRole: TeamRole;
  rosterAssignments: RosterMemberAssignment[];
  globalSubrole?: ManagerSubrole | StaffSubrole | string;
  birthDate?: string;
  country?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Invitation {
  id: string;
  code: string;
  teamId: string;
  nick: string;
  teamRole: TeamRole;
  createdAt: string;
  expiresAt: string; // createdAt + 30 mins
  used: boolean;
}

export interface CreateRosterInput {
  name?: string;
  game: string;
  maxMainPlayers: number;
  logoUrl?: string;
}

export interface CreateInvitationInput {
  nick: string;
  teamRole: TeamRole;
}
