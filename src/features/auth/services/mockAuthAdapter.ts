import type { IAuthPort } from './authPort';
import type { User, LoginFormData, RegisterFormData, UserRole } from '../types';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import { teamService } from '../../teams/services/teamService';
import type { TeamMember } from '../../teams/types';

const MOCK_STORAGE_KEY = 'urs_gamara_mock_users';
const MOCK_SESSION_KEY = 'urs_gamara_mock_session';

const defaultStats = {
  kda: '0.00',
  winrate: 0,
  matchesPlayed: 0,
  hsPercentage: 0,
  mvpCount: 0,
  mainAgentOrHero: 'Por definir',
};

const defaultUsers: Record<string, User> = {};

export class MockAuthAdapter implements IAuthPort {
  private listeners: Array<(user: User | null) => void> = [];

  private getStoredUsers(): Record<string, User> {
    try {
      const data = localStorage.getItem(MOCK_STORAGE_KEY);
      return data ? { ...defaultUsers, ...JSON.parse(data) } : defaultUsers;
    } catch {
      return defaultUsers;
    }
  }

  private saveUsers(users: Record<string, User>) {
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save mock user:', e);
    }
  }

  private getStoredSession(): User | null {
    try {
      const data = localStorage.getItem(MOCK_SESSION_KEY);
      if (!data) return null;
      const user: User = JSON.parse(data);
      if (user.email?.toLowerCase() === 'gianm2405@gmail.com') {
        user.role = 'ceo';
        user.teamRole = 'CEO';
      }
      return user;
    } catch {
      return null;
    }
  }

  private setStoredSession(user: User | null) {
    try {
      if (user) {
        if (user.email?.toLowerCase() === 'gianm2405@gmail.com') {
          user.role = 'ceo';
          user.teamRole = 'CEO';
        }
        localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(MOCK_SESSION_KEY);
      }
    } catch (e) {
      console.error('Failed to update mock session:', e);
    }
    this.listeners.forEach((fn) => fn(user));
  }

  async login(credentials: LoginFormData): Promise<User> {
    await new Promise((res) => setTimeout(res, 500));
    const emailLower = credentials.email.toLowerCase();
    const users = this.getStoredUsers();
    let user = users[emailLower];

    const isCeo = emailLower === 'gianm2405@gmail.com';

    if (!user) {
      const newUser: User = {
        id: `mock-${Date.now()}`,
        email: credentials.email,
        displayName: isCeo ? 'Zeyn' : credentials.email.split('@')[0],
        role: isCeo ? 'ceo' : 'player',
        teamRole: isCeo ? 'CEO' : 'Player',
        birthDate: isCeo ? '2007-05-24' : undefined,
        country: isCeo ? 'Venezuela' : undefined,
        teamId: URS_GAMARA_TEAM.id,
        teamName: URS_GAMARA_TEAM.name,
        position: isCeo ? 'CEO / Propietario' : 'Flex',
        stats: defaultStats,
        createdAt: new Date().toISOString(),
      };
      users[emailLower] = newUser;
      this.saveUsers(users);
      this.setStoredSession(newUser);
      return newUser;
    }

    if (isCeo) {
      user.role = 'ceo';
      user.teamRole = 'CEO';
    }

    this.setStoredSession(user);
    return user;
  }

  async register(data: RegisterFormData): Promise<User> {
    await new Promise((res) => setTimeout(res, 600));

    // Validate Invitation Code
    const invitation = await teamService.getInvitationByCode(data.code);
    if (!invitation) {
      throw new Error('El código de invitación es inválido.');
    }
    if (invitation.used) {
      throw new Error('Este código de invitación ya fue utilizado.');
    }
    const isExpired = new Date() > new Date(invitation.expiresAt);
    if (isExpired) {
      throw new Error('El código de invitación ha expirado (duración máxima 30 minutos). Solicita uno nuevo al CEO.');
    }

    const users = this.getStoredUsers();

    if (users[data.email.toLowerCase()]) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const isCeo = data.email.toLowerCase() === 'gianm2405@gmail.com' || invitation.teamRole === 'CEO';

    const mappedRole: UserRole = isCeo
      ? 'ceo'
      : invitation.teamRole === 'Player'
      ? 'player'
      : invitation.teamRole === 'Coach'
      ? 'coach'
      : invitation.teamRole === 'Manager'
      ? 'manager'
      : 'staff';

    const userId = `usr-${Date.now()}`;
    const newUser: User = {
      id: userId,
      email: data.email,
      displayName: invitation.nick,
      role: mappedRole,
      teamRole: isCeo ? 'CEO' : invitation.teamRole,
      birthDate: data.birthDate,
      country: data.country,
      rosterAssignments: [],
      teamId: URS_GAMARA_TEAM.id,
      teamName: URS_GAMARA_TEAM.name,
      position: `${isCeo ? 'CEO' : invitation.teamRole} del equipo`,
      stats: defaultStats,
      createdAt: new Date().toISOString(),
    };

    users[data.email.toLowerCase()] = newUser;
    this.saveUsers(users);

    // Consume invitation
    await teamService.consumeInvitation(data.code);

    // Add to members database list
    const newMember: TeamMember = {
      id: userId,
      email: data.email,
      displayName: invitation.nick,
      teamRole: isCeo ? 'CEO' : invitation.teamRole,
      rosterAssignments: [],
      birthDate: data.birthDate,
      country: data.country,
      createdAt: new Date().toISOString(),
    };

    const MEMBERS_KEY = 'urs_gamara_members_v2';
    try {
      const storedMembersData = localStorage.getItem(MEMBERS_KEY);
      const membersList: TeamMember[] = storedMembersData ? JSON.parse(storedMembersData) : [];
      membersList.push(newMember);
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(membersList));
    } catch {
      // ignore
    }

    this.setStoredSession(newUser);
    return newUser;
  }

  async logout(): Promise<void> {
    await new Promise((res) => setTimeout(res, 200));
    this.setStoredSession(null);
  }

  async getCurrentUser(): Promise<User | null> {
    return this.getStoredSession();
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.getStoredSession());

    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }
}
