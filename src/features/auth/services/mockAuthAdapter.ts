import type { IAuthPort } from './authPort';
import type { User, LoginFormData, RegisterFormData } from '../types';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';

const MOCK_STORAGE_KEY = 'urs_gamara_mock_users';
const MOCK_SESSION_KEY = 'urs_gamara_mock_session';

const defaultStats = {
  kda: '2.45',
  winrate: 68.5,
  matchesPlayed: 42,
  hsPercentage: 48,
  mvpCount: 14,
  mainAgentOrHero: 'Jett / Duelista',
};

const defaultUsers: Record<string, User> = {
  'demo@ursgamara.gg': {
    id: 'user-demo-1',
    email: 'demo@ursgamara.gg',
    displayName: 'GamaraPro',
    role: 'player',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
    teamId: URS_GAMARA_TEAM.id,
    teamName: URS_GAMARA_TEAM.name,
    position: 'Entry Fragger',
    bio: 'Jugador titular de URS Gamara. Enfocado en duelistas y control de sitio.',
    stats: defaultStats,
    createdAt: new Date().toISOString(),
  },
};

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
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private setStoredSession(user: User | null) {
    try {
      if (user) {
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
    const users = this.getStoredUsers();
    const user = users[credentials.email.toLowerCase()];

    if (!user) {
      const newUser: User = {
        id: `mock-${Date.now()}`,
        email: credentials.email,
        displayName: credentials.email.split('@')[0],
        role: 'player',
        teamId: URS_GAMARA_TEAM.id,
        teamName: URS_GAMARA_TEAM.name,
        position: 'Flex',
        stats: defaultStats,
        createdAt: new Date().toISOString(),
      };
      users[credentials.email.toLowerCase()] = newUser;
      this.saveUsers(users);
      this.setStoredSession(newUser);
      return newUser;
    }

    this.setStoredSession(user);
    return user;
  }

  async register(data: RegisterFormData): Promise<User> {
    await new Promise((res) => setTimeout(res, 600));
    const users = this.getStoredUsers();

    if (users[data.email.toLowerCase()]) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: data.email,
      displayName: data.displayName,
      role: 'player',
      teamId: URS_GAMARA_TEAM.id,
      teamName: URS_GAMARA_TEAM.name,
      position: 'Pendiente de asignación',
      stats: {
        ...defaultStats,
        mainAgentOrHero: 'Por definir',
      },
      createdAt: new Date().toISOString(),
    };

    users[data.email.toLowerCase()] = newUser;
    this.saveUsers(users);
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
