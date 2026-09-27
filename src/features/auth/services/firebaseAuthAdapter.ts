import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../../../lib/firebase';
import type { IAuthPort } from './authPort';
import type { User, LoginFormData, RegisterFormData } from '../types';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import { MockAuthAdapter } from './mockAuthAdapter';

export class FirebaseAuthAdapter implements IAuthPort {
  private fallbackAdapter = new MockAuthAdapter();

  async login(credentials: LoginFormData): Promise<User> {
    if (!isFirebaseConfigured || !auth) {
      return this.fallbackAdapter.login(credentials);
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;

      if (db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            return userDoc.data() as User;
          }
        } catch (e) {
          console.warn('Firestore fetch failed, returning synthesized auth profile:', e);
        }
      }

      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || credentials.email,
        displayName: firebaseUser.displayName || credentials.email.split('@')[0],
        role: 'player',
        teamId: URS_GAMARA_TEAM.id,
        teamName: URS_GAMARA_TEAM.name,
        stats: {
          kda: '2.50',
          winrate: 65,
          matchesPlayed: 30,
          hsPercentage: 45,
          mvpCount: 8,
          mainAgentOrHero: 'Flex',
        },
        createdAt: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const fbError = error as { code?: string; message?: string };
      if (fbError.code === 'auth/invalid-api-key' || fbError.code === 'auth/api-key-not-valid') {
        return this.fallbackAdapter.login(credentials);
      }
      const message =
        fbError.code === 'auth/user-not-found' || fbError.code === 'auth/wrong-password' || fbError.code === 'auth/invalid-credential'
          ? 'Correo electrónico o contraseña incorrectos.'
          : fbError.message || 'Error al iniciar sesión';
      throw new Error(message, { cause: error });
    }
  }

  async register(data: RegisterFormData): Promise<User> {
    if (!isFirebaseConfigured || !auth) {
      return this.fallbackAdapter.register(data);
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, { displayName: data.displayName });

      const newUser: User = {
        id: firebaseUser.uid,
        email: data.email,
        displayName: data.displayName,
        role: 'player',
        teamId: URS_GAMARA_TEAM.id,
        teamName: URS_GAMARA_TEAM.name,
        position: 'Pendiente de asignación',
        stats: {
          kda: '0.00',
          winrate: 0,
          matchesPlayed: 0,
          hsPercentage: 0,
          mvpCount: 0,
          mainAgentOrHero: 'Por definir',
        },
        createdAt: new Date().toISOString(),
      };

      if (db) {
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        } catch (e) {
          console.warn('Firestore doc save failed:', e);
        }
      }

      return newUser;
    } catch (error: unknown) {
      const fbError = error as { code?: string; message?: string };
      if (fbError.code === 'auth/invalid-api-key' || fbError.code === 'auth/api-key-not-valid') {
        return this.fallbackAdapter.register(data);
      }
      const message =
        fbError.code === 'auth/email-already-in-use'
          ? 'El correo electrónico ya está en uso.'
          : fbError.code === 'auth/weak-password'
          ? 'La contraseña debe ser más fuerte.'
          : fbError.message || 'Error al registrar usuario';
      throw new Error(message, { cause: error });
    }
  }

  async logout(): Promise<void> {
    if (!isFirebaseConfigured || !auth) {
      return this.fallbackAdapter.logout();
    }
    await firebaseSignOut(auth);
  }

  async getCurrentUser(): Promise<User | null> {
    if (!isFirebaseConfigured || !auth) {
      return this.fallbackAdapter.getCurrentUser();
    }
    const current = auth.currentUser;
    if (!current) return null;

    if (db) {
      try {
        const userDoc = await getDoc(doc(db, 'users', current.uid));
        if (userDoc.exists()) {
          return userDoc.data() as User;
        }
      } catch (e) {
        console.warn('Firestore fetch user error:', e);
      }
    }

    return {
      id: current.uid,
      email: current.email || '',
      displayName: current.displayName || 'Usuario',
      role: 'player',
      teamId: URS_GAMARA_TEAM.id,
      teamName: URS_GAMARA_TEAM.name,
      stats: {
        kda: '2.50',
        winrate: 65,
        matchesPlayed: 30,
        hsPercentage: 45,
        mvpCount: 8,
        mainAgentOrHero: 'Flex',
      },
      createdAt: new Date().toISOString(),
    };
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!isFirebaseConfigured || !auth) {
      return this.fallbackAdapter.onAuthStateChanged(callback);
    }

    return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }

      if (db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            callback(userDoc.data() as User);
            return;
          }
        } catch {
          // fallback to auth profile below
        }
      }

      callback({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Usuario',
        role: 'player',
        teamId: URS_GAMARA_TEAM.id,
        teamName: URS_GAMARA_TEAM.name,
        stats: {
          kda: '2.50',
          winrate: 65,
          matchesPlayed: 30,
          hsPercentage: 45,
          mvpCount: 8,
          mainAgentOrHero: 'Flex',
        },
        createdAt: new Date().toISOString(),
      });
    });
  }
}
