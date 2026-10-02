import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../../features/auth/types';
import { authService } from '../../features/auth/services/authService';
import { teamService } from '../../features/teams/services/teamService';
import { migrateLocalStorageToFirestore } from '../../services/migrationService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  updateUser: (data: { displayName?: string; gameTag?: string }) => Promise<User>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    migrateLocalStorageToFirestore();
    const unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.warn('Failed to refresh user auth state:', err);
    }
  };

  const updateUser = async (data: { displayName?: string; gameTag?: string }): Promise<User> => {
    if (!user) throw new Error('No hay usuario autenticado');
    const updatedUser = await authService.updateProfile(user.id, data);
    if (data.displayName) {
      try {
        await teamService.updateMemberNick(user.id, data.displayName, data.gameTag);
      } catch (err) {
        console.warn('teamService updateMemberNick error:', err);
      }
    }
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        setUser,
        updateUser,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
