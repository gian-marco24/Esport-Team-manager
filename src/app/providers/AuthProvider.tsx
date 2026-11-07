import React, { createContext, useContext, useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
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

  // Real-time detection: revoke access and logout immediately if account was deleted by admin
  useEffect(() => {
    if (!user) return;

    const isCeo =
      user.role === 'ceo' ||
      user.teamRole === 'CEO' ||
      user.email?.toLowerCase() === 'gianm2405@gmail.com';

    if (isCeo) return;

    let unsubscribeFirestore: (() => void) | null = null;
    if (db && user.id) {
      try {
        unsubscribeFirestore = onSnapshot(
          doc(db, 'users', user.id),
          async (snapshot) => {
            if (!snapshot.exists()) {
              console.warn('User document was deleted. Revoking access in real-time.');
              alert(
                'Tu cuenta ha sido eliminada del equipo por la administración. Tu acceso a la plataforma ha sido revocado.'
              );
              try {
                await authService.logout();
              } catch (e) {
                console.warn('Forced logout error:', e);
              }
              setUser(null);
            }
          },
          (err) => {
            console.warn('Real-time user snapshot error:', err);
          }
        );
      } catch (err) {
        console.warn('Failed to attach real-time user listener:', err);
      }
    }

    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'urs_gamara_revoked_users' || e.key === 'urs_gamara_mock_session') {
        const revokedStr = localStorage.getItem('urs_gamara_revoked_users');
        if (revokedStr) {
          const list: string[] = JSON.parse(revokedStr);
          if (
            (user.id && list.includes(user.id)) ||
            (user.email && list.includes(user.email.toLowerCase()))
          ) {
            alert(
              'Tu cuenta ha sido eliminada del equipo por la administración. Tu acceso a la plataforma ha sido revocado.'
            );
            try {
              await authService.logout();
            } catch (err) {
              console.warn('Forced logout error:', err);
            }
            setUser(null);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

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
