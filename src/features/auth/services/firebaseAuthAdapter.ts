import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../../../lib/firebase';
import type { IAuthPort } from './authPort';
import type { User, LoginFormData, RegisterFormData, UserRole } from '../types';
import type { TeamRole } from '../../teams/types';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import { MockAuthAdapter } from './mockAuthAdapter';
import { teamService } from '../../teams/services/teamService';

async function fetchUserDocData(uid: string, email: string): Promise<any | null> {
  if (!db) return null;
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
  } catch (e) {
    console.warn('Firestore fetch userDoc by UID error:', e);
  }

  // Fallback: If user doc was created manually with a custom document ID
  if (email) {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        for (const foundDoc of snap.docs) {
          const data = foundDoc.data();
          if (foundDoc.id !== uid) {
            try {
              await setDoc(doc(db, 'users', uid), { ...data, id: uid }, { merge: true });
              await deleteDoc(doc(db, 'users', foundDoc.id));
            } catch (err) {
              console.warn('Syncing/cleaning duplicate manual doc error:', err);
            }
          }
          return data;
        }
      }
    } catch (e) {
      console.warn('Firestore fallback user query by email error:', e);
    }
  }

  return null;
}

async function isUserRevoked(uid?: string, email?: string): Promise<boolean> {
  const cleanEmail = (email || '').trim().toLowerCase();

  try {
    const localRevoked = localStorage.getItem('urs_gamara_revoked_users');
    if (localRevoked) {
      const list: string[] = JSON.parse(localRevoked);
      if (uid && list.includes(uid)) return true;
      if (cleanEmail && list.includes(cleanEmail)) return true;
    }
  } catch {
    // ignore
  }

  if (!db) return false;

  try {
    if (uid) {
      const snap = await getDoc(doc(db, 'revoked_users', uid));
      if (snap.exists()) return true;
    }
    if (cleanEmail) {
      const snap = await getDoc(doc(db, 'revoked_users', cleanEmail));
      if (snap.exists()) return true;

      const q = query(collection(db, 'revoked_users'), where('email', '==', cleanEmail));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) return true;
    }
  } catch (e) {
    console.warn('isUserRevoked check error:', e);
  }

  return false;
}

async function safeSignOut(): Promise<void> {
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
  }
}

const processUserProfile = (uid: string, email: string, rawData?: any): User => {
  const teamRole: TeamRole =
    rawData?.teamRole ||
    (rawData?.role === 'ceo'
      ? 'CEO'
      : rawData?.role === 'coach'
      ? 'Coach'
      : rawData?.role === 'manager'
      ? 'Manager'
      : rawData?.role === 'staff'
      ? 'Staff'
      : rawData?.role === 'player'
      ? 'Player'
      : email.toLowerCase() === 'gianm2405@gmail.com'
      ? 'CEO'
      : 'Player');

  const role: UserRole =
    rawData?.role || (teamRole === 'CEO' ? 'ceo' : (teamRole.toLowerCase() as UserRole));

  // GameTag: only assign if explicitly provided; non-players don't get #CEO or #Coach defaults
  const gameTag = rawData?.gameTag?.trim() ? rawData.gameTag.trim() : undefined;

  return {
    id: uid,
    email: rawData?.email || email,
    displayName: rawData?.displayName || (email.split('@')[0]),
    gameTag,
    role,
    teamRole,
    birthDate: rawData?.birthDate,
    country: rawData?.country,
    rosterAssignments: rawData?.rosterAssignments || [],
    globalSubrole: rawData?.globalSubrole || (teamRole === 'CEO' ? 'CEO / Propietario' : undefined),
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

    const emailLower = credentials.email.trim().toLowerCase();
    const isCeo = emailLower === 'gianm2405@gmail.com';

    // 1. Check if user is revoked before login
    if (!isCeo && (await isUserRevoked(undefined, emailLower))) {
      throw new Error('Esta cuenta ha sido eliminada del equipo y ya no tiene acceso a la plataforma.');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;

      // 2. Check if revoked by UID or email
      if (!isCeo && (await isUserRevoked(firebaseUser.uid, emailLower))) {
        try {
          await deleteUser(firebaseUser);
        } catch {
          await safeSignOut();
        }
        throw new Error('Esta cuenta ha sido eliminada del equipo y ya no tiene acceso a la plataforma.');
      }

      // 3. Fetch user document from Firestore
      const docData = await fetchUserDocData(firebaseUser.uid, emailLower);
      if (docData) {
        if (!isCeo && (docData.deleted || docData.revoked)) {
          try {
            await deleteUser(firebaseUser);
          } catch {
            await safeSignOut();
          }
          throw new Error('Esta cuenta ha sido eliminada del equipo y ya no tiene acceso a la plataforma.');
        }
        return processUserProfile(firebaseUser.uid, credentials.email, docData);
      }

      // 4. Missing Firestore doc:
      // If NOT CEO, user was deleted from the team. Erase auth account, sign out and reject
      if (!isCeo) {
        try {
          await deleteUser(firebaseUser);
        } catch {
          await safeSignOut();
        }
        throw new Error('Esta cuenta ha sido eliminada del equipo o no pertenece a un integrante activo.');
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
        fbError.code === 'auth/user-not-found' ||
        fbError.code === 'auth/wrong-password' ||
        fbError.code === 'auth/invalid-credential'
          ? 'Correo electrónico o contraseña incorrectos.'
          : (error as Error).message || 'Error al iniciar sesión';
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

      // Clean revoked status if re-invited
      try {
        if (db) {
          await deleteDoc(doc(db, 'revoked_users', firebaseUser.uid));
          await deleteDoc(doc(db, 'revoked_users', data.email.toLowerCase()));
        }
        const revokedKey = 'urs_gamara_revoked_users';
        const stored = localStorage.getItem(revokedKey);
        if (stored) {
          const list = JSON.parse(stored).filter(
            (x: string) => x !== firebaseUser.uid && x !== data.email.toLowerCase()
          );
          localStorage.setItem(revokedKey, JSON.stringify(list));
        }
      } catch {
        // ignore
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

    const email = (current.email || '').toLowerCase();
    const isCeo = email === 'gianm2405@gmail.com';

    if (!isCeo && (await isUserRevoked(current.uid, email))) {
      try {
        await deleteUser(current);
      } catch {
        await safeSignOut();
      }
      return null;
    }

    const docData = await fetchUserDocData(current.uid, email);
    if (docData) {
      if (!isCeo && (docData.deleted || docData.revoked)) {
        try {
          await deleteUser(current);
        } catch {
          await safeSignOut();
        }
        return null;
      }
      return processUserProfile(current.uid, email, docData);
    }

    if (!isCeo) {
      try {
        await deleteUser(current);
      } catch {
        await safeSignOut();
      }
      return null;
    }

    return processUserProfile(current.uid, email, {
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

      const email = (firebaseUser.email || '').toLowerCase();
      const isCeo = email === 'gianm2405@gmail.com';

      // 1. Check if user is revoked
      if (!isCeo && (await isUserRevoked(firebaseUser.uid, email))) {
        try {
          await deleteUser(firebaseUser);
        } catch {
          await safeSignOut();
        }
        callback(null);
        return;
      }

      // 2. Fetch docData
      const docData = await fetchUserDocData(firebaseUser.uid, email);
      if (docData) {
        if (!isCeo && (docData.deleted || docData.revoked)) {
          try {
            await deleteUser(firebaseUser);
          } catch {
            await safeSignOut();
          }
          callback(null);
          return;
        }
        callback(processUserProfile(firebaseUser.uid, email, docData));
        return;
      }

      // 3. User document missing in Firestore:
      // If NOT CEO, user was deleted from the team. Revoke access, delete auth account and sign out!
      if (!isCeo) {
        try {
          await deleteUser(firebaseUser);
        } catch {
          await safeSignOut();
        }
        callback(null);
        return;
      }

      callback(processUserProfile(firebaseUser.uid, email, {
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
