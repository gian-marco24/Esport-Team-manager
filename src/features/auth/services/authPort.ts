import type { User, LoginFormData, RegisterFormData } from '../types';

export interface IAuthPort {
  login(credentials: LoginFormData): Promise<User>;
  register(data: RegisterFormData): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}
