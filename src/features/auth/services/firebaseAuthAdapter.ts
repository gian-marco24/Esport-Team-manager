import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../../../lib/firebase';
import type { IAuthPort } from './authPort';
import type { User, LoginFormData, RegisterFormData, UserRole } from '../types';
import type { TeamRole } from '../../teams/types';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import { MockAuthAdapter } from './mockAuthAdapter';
import { teamService } from '../../teams/services/teamService';

const processUserProfile = (uid: string, email: string, rawData?: any): User => {
  const isCeoUser =
    email.toLowerCase() === 'gianm2405@gmail.com' ||
    rawData?.role?.toLowerCase() === 'ceo' ||
    rawData?.teamRole === 'CEO';

  const role: UserRole = isCeoUser
    ? 'ceo'
    : (rawData?.role || (rawData?.teamRole ? rawData.teamRole.toLowerCase() : 'player')) as UserRole;

  const teamRole: TeamRole = isCeoUser
    ? 'CEO'
    : rawData?.teamRole || (role === 'ceo' ? 'CEO' : role === 'player' ? 'Player' : role === 'coach' ? 'Coach' : role === 'manager' ? 'Manager' : 'Staff');

  return {
    id: uid,
    email: rawData?.email || email,
    displayName: rawData?.displayName || (isCeoUser ? 'Zeyn' : email.split('@')[0]),
    gameTag: rawData?.gameTag || (isCeoUser ? '#CEO' : undefined),
    role,
    teamRole,
    birthDate: rawData?.birthDate || (isCeoUser ? '2007-05-24' : undefined),
    country: rawData?.country || (isCeoUser ? 'Venezuela' : undefined),
    rosterAssignments: rawData?.rosterAssignments || [],
    globalSubrole: rawData?.globalSubrole || (isCeoUser ? 'CEO / Propietario' : undefined),
    avatarUrl: rawData?.avatarUrl,
    teamId: URS_GAMARA_TEAM.id,
    teamName: URS_GAMARA_TEAM.name,
    position: rawData?.position || `${teamRole} del equipo`,
    stats: rawData?.stats || {
      kda: '0.00',
      winrate: 0,
      matchesPlayed: 0,
      hsPercentage: 0,
      mvpCount: 0,
      mainAgentOrHero: 'Por definir',
    },
    createdAt: rawData?.createdAt || new Date().toISOString(),
  };
};

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
            return processUserProfile(firebaseUser.uid, credentials.email, userDoc.data());
          }
        } catch (e) {
          console.warn('Firestore fetch failed, returning synthesized auth profile:', e);
        }
      }

      return processUserProfile(firebaseUser.uid, credentials.email, {
        displayName: firebaseUser.displayName,
      });
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

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, { displayName: invitation.nick });

      const mappedRole: UserRole =
        invitation.teamRole === 'CEO'
          ? 'ceo'
          : invitation.teamRole === 'Player'
          ? 'player'
          : invitation.teamRole === 'Coach'
          ? 'coach'
          : invitation.teamRole === 'Manager'
          ? 'manager'
          : 'staff';

      const newUser: User = processUserProfile(firebaseUser.uid, data.email, {
        displayName: invitation.nick,
        gameTag: data.gameTag,
        role: mappedRole,
        teamRole: invitation.teamRole,
        birthDate: data.birthDate,
        country: data.country,
        createdAt: new Date().toISOString(),
      });

      if (db) {
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        } catch (e) {
          console.warn('Firestore doc save failed:', e);
        }
      }

      await teamService.consumeInvitation(data.code);

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
          : (error as Error).message || 'Error al registrar usuario';
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
          return processUserProfile(current.uid, current.email || '', userDoc.data());
        }
      } catch (e) {
        console.warn('Firestore fetch user error:', e);
      }
    }

    return processUserProfile(current.uid, current.email || '', {
      displayName: current.displayName,
    });
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
            callback(processUserProfile(firebaseUser.uid, firebaseUser.email || '', userDoc.data()));
            return;
          }
        } catch {
          // fallback to auth profile below
        }
      }

      callback(processUserProfile(firebaseUser.uid, firebaseUser.email || '', {
        displayName: firebaseUser.displayName,
      }));
    });
  }

  async updateProfile(userId: string, data: { displayName?: string; gameTag?: string }): Promise<User> {
    if (!isFirebaseConfigured || !auth) {
      return this.fallbackAdapter.updateProfile(userId, data);
    }

    try {
      if (auth.currentUser && data.displayName !== undefined && data.displayName.trim() !== '') {
        await updateProfile(auth.currentUser, { displayName: data.displayName.trim() });
      }

      const updates: Record<string, any> = {};
      if (data.displayName !== undefined && data.displayName.trim() !== '') {
        updates.displayName = data.displayName.trim();
      }
      if (data.gameTag !== undefined) {
        updates.gameTag = data.gameTag.trim() || null;
      }

      if (db && Object.keys(updates).length > 0) {
        try {
          const userDocRef = doc(db, 'users', userId);
          await updateDoc(userDocRef, updates);
        } catch (err) {
          console.warn('Firestore updateDoc failed, falling back to setDoc merge:', err);
          try {
            const userDocRef = doc(db, 'users', userId);
            await setDoc(userDocRef, updates, { merge: true });
          } catch (e) {
            console.warn('Firestore setDoc failed:', e);
          }
        }
      }

      // Also update local mock & members cache for seamless immediate sync
      try {
        await this.fallbackAdapter.updateProfile(userId, data);
      } catch {
        // ignore fallback errors
      }

      const updatedUser = await this.getCurrentUser();
      if (updatedUser) return updatedUser;

      return processUserProfile(userId, auth.currentUser?.email || '', {
        displayName: data.displayName || auth.currentUser?.displayName,
        gameTag: data.gameTag,
      });
    } catch (error: unknown) {
      console.error('Error updating user profile in FirebaseAuthAdapter:', error);
      throw new Error((error as Error).message || 'Error al actualizar el perfil', { cause: error });
    }
  }
}
