import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import axios from 'axios';
import { backendApi } from '../../../utils/config';
import type { ITeamPort } from './teamPort';
import type {
  TeamMember,
  Roster,
  Invitation,
  CreateRosterInput,
  CreateInvitationInput,
  TeamRole,
  ManagerSubrole,
  StaffSubrole,
  RosterMemberAssignment,
} from '../types';

const MEMBERS_KEY = 'urs_gamara_members_v2';
const ROSTERS_KEY = 'urs_gamara_rosters_v2';
const INVITATIONS_KEY = 'urs_gamara_invitations_v2';

const DEFAULT_ROSTERS: Roster[] = [];
const DEFAULT_MEMBERS: TeamMember[] = [];

export class FirebaseTeamAdapter implements ITeamPort {
  // Local storage helpers
  private getLocalMembers(): TeamMember[] {
    try {
      const data = localStorage.getItem(MEMBERS_KEY);
      if (!data) {
        localStorage.setItem(MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS));
        return DEFAULT_MEMBERS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_MEMBERS;
    }
  }

  private saveLocalMembers(members: TeamMember[]): void {
    try {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
    } catch (e) {
      console.error('Failed to save local members:', e);
    }
  }

  private getLocalRosters(): Roster[] {
    try {
      const data = localStorage.getItem(ROSTERS_KEY);
      if (!data) {
        localStorage.setItem(ROSTERS_KEY, JSON.stringify(DEFAULT_ROSTERS));
        return DEFAULT_ROSTERS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_ROSTERS;
    }
  }

  private saveLocalRosters(rosters: Roster[]): void {
    try {
      localStorage.setItem(ROSTERS_KEY, JSON.stringify(rosters));
    } catch (e) {
      console.error('Failed to save local rosters:', e);
    }
  }

  private getLocalInvitations(): Invitation[] {
    try {
      const data = localStorage.getItem(INVITATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalInvitations(invitations: Invitation[]): void {
    try {
      localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
    } catch (e) {
      console.error('Failed to save local invitations:', e);
    }
  }

  // --- Members Implementation ---

  async getMembers(_teamId: string): Promise<TeamMember[]> {
    let members: TeamMember[] = [];

    if (db) {
      try {
        const q = collection(db, 'users');
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const emailMap = new Map<string, TeamMember>();
          const otherMembers: TeamMember[] = [];

          for (const d of snapshot.docs) {
            const data = d.data();
            const emailClean = (data.email || '').trim().toLowerCase();
            const teamRole: TeamRole =
              data.teamRole ||
              (data.role === 'ceo'
                ? 'CEO'
                : data.role === 'coach'
                ? 'Coach'
                : data.role === 'manager'
                ? 'Manager'
                : data.role === 'staff'
                ? 'Staff'
                : data.role === 'player'
                ? 'Player'
                : emailClean === 'gianm2405@gmail.com'
                ? 'CEO'
                : 'Player');

            const isCeo = teamRole === 'CEO';
            const cleanGameTag = data.gameTag?.trim() ? data.gameTag.trim() : undefined;

            const memberItem: TeamMember = {
              id: d.id,
              email: data.email || '',
              displayName: data.displayName || data.nick || (isCeo ? 'Zeyn' : 'Integrante'),
              gameTag: cleanGameTag,
              teamRole,
              rosterAssignments: data.rosterAssignments || [],
              globalSubrole: data.globalSubrole || (isCeo ? 'CEO / Propietario' : undefined),
              birthDate: data.birthDate || (isCeo ? '2007-05-24' : undefined),
              country: data.country || (isCeo ? 'Venezuela' : undefined),
              avatarUrl: data.avatarUrl,
              createdAt: data.createdAt || new Date().toISOString(),
            };

            if (emailClean) {
              const existing = emailMap.get(emailClean);
              if (existing) {
                // If there's an obsolete manual ID doc (e.g. KagNW6f4yfL1kbWujZpL), remove it
                const staleDocId = d.id === 'KagNW6f4yfL1kbWujZpL' ? d.id : existing.id === 'KagNW6f4yfL1kbWujZpL' ? existing.id : null;
                if (staleDocId) {
                  try {
                    deleteDoc(doc(db, 'users', staleDocId));
                  } catch {
                    // ignore
                  }
                }
                // Keep the one with real Auth UID or fuller data
                if (d.id !== 'KagNW6f4yfL1kbWujZpL') {
                  emailMap.set(emailClean, memberItem);
                }
              } else {
                emailMap.set(emailClean, memberItem);
              }
            } else {
              otherMembers.push(memberItem);
            }
          }

          members = [...Array.from(emailMap.values()), ...otherMembers];
        }
      } catch (err) {
        console.warn('Firestore fetch users error, using local fallback:', err);
      }
    }

    if (members.length === 0) {
      members = this.getLocalMembers();
    }

    // Ensure the founder/CEO (gianm2405@gmail.com) is present if empty
    const ceoIndex = members.findIndex((m) => m.email.toLowerCase() === 'gianm2405@gmail.com');
    if (ceoIndex !== -1) {
      if (!members[ceoIndex].displayName) members[ceoIndex].displayName = 'Zeyn';
      if (!members[ceoIndex].country) members[ceoIndex].country = 'Venezuela';
      if (!members[ceoIndex].birthDate) members[ceoIndex].birthDate = '2007-05-24';
    } else if (members.length === 0) {
      members.unshift({
        id: 'KagNW6f4yfL1kbWujZpL',
        email: 'gianm2405@gmail.com',
        displayName: 'Zeyn',
        teamRole: 'CEO',
        rosterAssignments: [],
        globalSubrole: 'CEO / Propietario',
        birthDate: '2007-05-24',
        country: 'Venezuela',
        createdAt: new Date().toISOString(),
      });
    }

    return members;
  }

  async updateMemberRole(memberId: string, newRole: TeamRole): Promise<void> {
    const roleString = newRole === 'CEO' ? 'ceo' : newRole.toLowerCase();
    const isCeo = newRole === 'CEO';
    const position = `${newRole} del equipo`;
    const globalSubrole = isCeo ? 'CEO / Propietario' : null;

    const updates: Record<string, any> = {
      teamRole: newRole,
      role: roleString,
      position,
      globalSubrole,
    };

    if (newRole === 'Creador de contenido' || newRole === 'Manager' || newRole === 'Staff') {
      updates.rosterAssignments = [];
    }

    if (db) {
      try {
        const docRef = doc(db, 'users', memberId);
        await updateDoc(docRef, updates);
      } catch (err) {
        console.warn('Firestore update role error, fallback to setDoc merge:', err);
        try {
          const docRef = doc(db, 'users', memberId);
          await setDoc(docRef, updates, { merge: true });
        } catch (e) {
          console.warn('Firestore setDoc merge error:', e);
        }
      }
    }

    const members = this.getLocalMembers();
    const idx = members.findIndex((m) => m.id === memberId);
    if (idx !== -1) {
      members[idx].teamRole = newRole;
      members[idx].globalSubrole = isCeo ? 'CEO / Propietario' : undefined;
      if (newRole === 'Creador de contenido' || newRole === 'Manager' || newRole === 'Staff') {
        members[idx].rosterAssignments = [];
      }
      this.saveLocalMembers(members);
    }

    // Sync mock storage and session
    try {
      const MOCK_SESSION_KEY = 'urs_gamara_mock_session';
      const MOCK_STORAGE_KEY = 'urs_gamara_mock_users';
      const sessionStr = localStorage.getItem(MOCK_SESSION_KEY);
      if (sessionStr) {
        const sessionUser = JSON.parse(sessionStr);
        if (sessionUser.id === memberId || (idx !== -1 && members[idx]?.email?.toLowerCase() === sessionUser.email?.toLowerCase())) {
          sessionUser.teamRole = newRole;
          sessionUser.role = roleString;
          sessionUser.position = position;
          sessionUser.globalSubrole = isCeo ? 'CEO / Propietario' : undefined;
          if (newRole === 'Creador de contenido' || newRole === 'Manager' || newRole === 'Staff') {
            sessionUser.rosterAssignments = [];
          }
          localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(sessionUser));
        }
      }
      const mockUsersStr = localStorage.getItem(MOCK_STORAGE_KEY);
      if (mockUsersStr) {
        const mockUsers = JSON.parse(mockUsersStr);
        for (const k of Object.keys(mockUsers)) {
          if (mockUsers[k].id === memberId || (idx !== -1 && mockUsers[k].email?.toLowerCase() === members[idx]?.email?.toLowerCase())) {
            mockUsers[k].teamRole = newRole;
            mockUsers[k].role = roleString;
            mockUsers[k].position = position;
            mockUsers[k].globalSubrole = isCeo ? 'CEO / Propietario' : undefined;
            if (newRole === 'Creador de contenido' || newRole === 'Manager' || newRole === 'Staff') {
              mockUsers[k].rosterAssignments = [];
            }
          }
        }
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUsers));
      }
    } catch {
      // ignore
    }
  }

  async updateMemberRosterAssignments(
    memberId: string,
    assignments: RosterMemberAssignment[]
  ): Promise<void> {
    if (db) {
      try {
        const docRef = doc(db, 'users', memberId);
        await updateDoc(docRef, { rosterAssignments: assignments });
      } catch (err) {
        console.warn('Firestore update roster assignments error:', err);
      }
    }

    const members = this.getLocalMembers();
    const idx = members.findIndex((m) => m.id === memberId);
    if (idx !== -1) {
      members[idx].rosterAssignments = assignments;
      this.saveLocalMembers(members);
    }
  }

  async updateMemberGlobalSubrole(
    memberId: string,
    subrole?: ManagerSubrole | StaffSubrole | string
  ): Promise<void> {
    if (db) {
      try {
        const docRef = doc(db, 'users', memberId);
        await updateDoc(docRef, { globalSubrole: subrole || null });
      } catch (err) {
        console.warn('Firestore update global subrole error:', err);
      }
    }

    const members = this.getLocalMembers();
    const idx = members.findIndex((m) => m.id === memberId);
    if (idx !== -1) {
      members[idx].globalSubrole = subrole;
      this.saveLocalMembers(members);
    }
  }

  async updateMemberNick(
    memberId: string,
    newNick: string,
    newGameTag?: string
  ): Promise<void> {
    const trimmedNick = newNick.trim();
    const trimmedTag = newGameTag !== undefined ? (newGameTag.trim() || null) : undefined;

    if (db) {
      try {
        const docRef = doc(db, 'users', memberId);
        const updates: Record<string, any> = { displayName: trimmedNick };
        if (trimmedTag !== undefined) {
          updates.gameTag = trimmedTag;
        }
        await updateDoc(docRef, updates);
      } catch (err) {
        console.warn('Firestore update nick error, fallback to setDoc merge:', err);
        try {
          const docRef = doc(db, 'users', memberId);
          const updates: Record<string, any> = { displayName: trimmedNick };
          if (trimmedTag !== undefined) {
            updates.gameTag = trimmedTag;
          }
          await setDoc(docRef, updates, { merge: true });
        } catch (e) {
          console.warn('Firestore setDoc merge error:', e);
        }
      }
    }

    const members = this.getLocalMembers();
    const idx = members.findIndex((m) => m.id === memberId);
    if (idx !== -1) {
      members[idx].displayName = trimmedNick;
      if (trimmedTag !== undefined) {
        members[idx].gameTag = trimmedTag || undefined;
      }
      this.saveLocalMembers(members);
    }
  }

  async removeMemberFromTeam(memberId: string, email?: string): Promise<void> {
    const members = this.getLocalMembers();
    const localMember = members.find(
      (m) => m.id === memberId || (email && m.email.toLowerCase() === email.toLowerCase())
    );
    let targetEmail = (email || localMember?.email || '').trim().toLowerCase();

    // If targetEmail wasn't in local, try to fetch from Firestore before deletion
    if (!targetEmail && db) {
      try {
        const snap = await getDoc(doc(db, 'users', memberId));
        if (snap.exists()) {
          targetEmail = (snap.data().email || '').trim().toLowerCase();
        }
      } catch {
        // ignore
      }
    }

    // Safety: Prevent deleting CEO
    if (targetEmail === 'gianm2405@gmail.com' || localMember?.teamRole === 'CEO') {
      throw new Error('No es posible eliminar la cuenta del CEO / Propietario.');
    }

    // 0. Request backend to delete the user from Firebase Authentication via Admin SDK
    try {
      const backendUrl = backendApi || import.meta.env.VITE_BACKEND_API || 'http://localhost:3000';
      const cleanUrl = backendUrl.replace(/\/+$/, '');
      await axios.post(`${cleanUrl}/api/auth/delete-user`, {
        uid: memberId,
        email: targetEmail,
      });
      console.log(`Backend confirmed deletion request for user ${memberId} (${targetEmail}) in Firebase Auth`);
    } catch (backendErr) {
      console.warn('Backend call to delete user from Firebase Auth skipped or failed (will be enforced via client/revocation):', backendErr);
    }

    // 1. Mark as revoked in Firestore 'revoked_users' collection and localStorage
    const revokedRecord = {
      uid: memberId,
      email: targetEmail,
      displayName: localMember?.displayName || 'Ex-integrante',
      revokedAt: new Date().toISOString(),
      reason: 'Deleted by CEO',
    };

    try {
      const revokedKey = 'urs_gamara_revoked_users';
      const storedRevoked = localStorage.getItem(revokedKey);
      const revokedList: string[] = storedRevoked ? JSON.parse(storedRevoked) : [];
      if (memberId && !revokedList.includes(memberId)) revokedList.push(memberId);
      if (targetEmail && !revokedList.includes(targetEmail)) revokedList.push(targetEmail);
      localStorage.setItem(revokedKey, JSON.stringify(revokedList));
    } catch {
      // ignore
    }

    if (db) {
      try {
        if (memberId) {
          await setDoc(doc(db, 'revoked_users', memberId), revokedRecord);
        }
        if (targetEmail) {
          await setDoc(doc(db, 'revoked_users', targetEmail), revokedRecord);
        }
      } catch (err) {
        console.warn('Firestore set revoked_users error:', err);
      }

      // 2. Collect all document IDs for this user in 'users'
      const userDocIdsToDelete = new Set<string>();
      if (memberId) userDocIdsToDelete.add(memberId);

      if (targetEmail) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', targetEmail));
          const snap = await getDocs(q);
          snap.forEach((d) => userDocIdsToDelete.add(d.id));
        } catch (e) {
          console.warn('Firestore query users by email error:', e);
        }
      }

      // 3. For each user doc, remove subcollections (personal_notes, weekly_objectives) then the doc itself
      for (const uid of userDocIdsToDelete) {
        try {
          const notesSnap = await getDocs(collection(db, 'users', uid, 'personal_notes'));
          for (const nDoc of notesSnap.docs) {
            try {
              await deleteDoc(nDoc.ref);
            } catch (err) {
              console.warn('Delete note doc error:', err);
            }
          }
        } catch (err) {
          console.warn('Fetch user personal_notes error:', err);
        }

        try {
          const objSnap = await getDocs(collection(db, 'users', uid, 'weekly_objectives'));
          for (const oDoc of objSnap.docs) {
            try {
              await deleteDoc(oDoc.ref);
            } catch (err) {
              console.warn('Delete objective doc error:', err);
            }
          }
        } catch (err) {
          console.warn('Fetch user weekly_objectives error:', err);
        }

        try {
          await deleteDoc(doc(db, 'users', uid));
        } catch (err) {
          console.warn('Firestore delete user error:', err);
        }
      }

      // 4. Delete assigned routines
      const routineUserIds = [memberId, targetEmail].filter(Boolean);
      for (const rId of routineUserIds) {
        try {
          await deleteDoc(doc(db, 'user_assigned_routines', rId));
        } catch (err) {
          console.warn('Delete user_assigned_routines error:', err);
        }
      }
      try {
        const qRoutines = query(collection(db, 'user_assigned_routines'), where('userId', 'in', routineUserIds));
        const rSnap = await getDocs(qRoutines);
        for (const rDoc of rSnap.docs) {
          try {
            await deleteDoc(rDoc.ref);
          } catch (err) {
            console.warn('Delete routine doc error:', err);
          }
        }
      } catch (err) {
        console.warn('Query user_assigned_routines error:', err);
      }

      // 5. Delete routine checkins
      try {
        const qCheckins = query(collection(db, 'routine_checkins'), where('userId', 'in', routineUserIds));
        const cSnap = await getDocs(qCheckins);
        for (const cDoc of cSnap.docs) {
          try {
            await deleteDoc(cDoc.ref);
          } catch (err) {
            console.warn('Delete routine_checkins doc error:', err);
          }
        }
      } catch (err) {
        console.warn('Query routine_checkins error:', err);
      }
    }

    // 6. Clean up local storage
    const filtered = members.filter(
      (m) => m.id !== memberId && (!targetEmail || m.email.toLowerCase() !== targetEmail)
    );
    this.saveLocalMembers(filtered);

    try {
      // Clean mock users
      const mockUsersStr = localStorage.getItem('urs_gamara_mock_users');
      if (mockUsersStr) {
        const mockUsers = JSON.parse(mockUsersStr);
        for (const k of Object.keys(mockUsers)) {
          if (
            mockUsers[k].id === memberId ||
            (targetEmail && mockUsers[k].email?.toLowerCase() === targetEmail) ||
            (targetEmail && k.toLowerCase() === targetEmail)
          ) {
            delete mockUsers[k];
          }
        }
        localStorage.setItem('urs_gamara_mock_users', JSON.stringify(mockUsers));
      }

      // Clean mock session if matching deleted user
      const sessionStr = localStorage.getItem('urs_gamara_mock_session');
      if (sessionStr) {
        const sessionUser = JSON.parse(sessionStr);
        if (
          sessionUser.id === memberId ||
          (targetEmail && sessionUser.email?.toLowerCase() === targetEmail)
        ) {
          localStorage.removeItem('urs_gamara_mock_session');
        }
      }

      // Clean local notes and objectives
      localStorage.removeItem(`urs_gamara_personal_notes_${memberId}`);
      localStorage.removeItem(`urs_gamara_weekly_objectives_${memberId}`);
      if (targetEmail) {
        localStorage.removeItem(`urs_gamara_personal_notes_${targetEmail}`);
        localStorage.removeItem(`urs_gamara_weekly_objectives_${targetEmail}`);
      }

      // Clean local assigned routines
      const assignedRoutinesStr = localStorage.getItem('urs_gamara_assigned_routines');
      if (assignedRoutinesStr) {
        const map = JSON.parse(assignedRoutinesStr);
        delete map[memberId];
        if (targetEmail) delete map[targetEmail];
        localStorage.setItem('urs_gamara_assigned_routines', JSON.stringify(map));
      }
    } catch {
      // ignore
    }
  }

  // --- Rosters Implementation ---

  async getRosters(_teamId: string): Promise<Roster[]> {
    if (db) {
      try {
        const snapshot = await getDocs(collection(db, 'rosters'));
        if (!snapshot.empty) {
          return snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Roster, 'id'>),
          }));
        }
      } catch (err) {
        console.warn('Firestore fetch rosters error, using local fallback:', err);
      }
    }
    return this.getLocalRosters();
  }

  async createRoster(_teamId: string, input: CreateRosterInput): Promise<Roster> {
    const rosterId = `roster-${Date.now()}`;
    const name = input.name?.trim() ? input.name.trim() : `URS Gamara - ${input.game}`;

    const newRoster: Roster = {
      id: rosterId,
      name,
      game: input.game,
      maxMainPlayers: input.maxMainPlayers,
      maxSubstitutes: 3,
      maxCoaches: 3,
      logoUrl: input.logoUrl,
      createdAt: new Date().toISOString(),
    };

    if (db) {
      try {
        await setDoc(doc(db, 'rosters', rosterId), newRoster);
      } catch (err) {
        console.warn('Firestore create roster error:', err);
      }
    }

    const rosters = this.getLocalRosters();
    rosters.unshift(newRoster);
    this.saveLocalRosters(rosters);

    return newRoster;
  }

  async deleteRoster(rosterId: string): Promise<void> {
    if (db) {
      try {
        await deleteDoc(doc(db, 'rosters', rosterId));
      } catch (err) {
        console.warn('Firestore delete roster error:', err);
      }
    }

    const rosters = this.getLocalRosters();
    const filtered = rosters.filter((r) => r.id !== rosterId);
    this.saveLocalRosters(filtered);

    // Also remove assignments to this roster from members
    const members = this.getLocalMembers();
    members.forEach((m) => {
      if (m.rosterAssignments) {
        m.rosterAssignments = m.rosterAssignments.filter((a) => a.rosterId !== rosterId);
      }
    });
    this.saveLocalMembers(members);
  }

  // --- Invitations Implementation ---

  private generateUniqueCode(): string {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `inv_${randomHex}`;
  }

  async createInvitation(teamId: string, input: CreateInvitationInput): Promise<Invitation> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString(); // 30 minutes
    const code = this.generateUniqueCode();

    const invitation: Invitation = {
      id: `inv-${Date.now()}`,
      code,
      teamId,
      nick: input.nick,
      teamRole: input.teamRole,
      createdAt: now.toISOString(),
      expiresAt,
      used: false,
    };

    if (db) {
      try {
        await setDoc(doc(db, 'invitations', invitation.id), invitation);
      } catch (err) {
        console.warn('Firestore save invitation error:', err);
      }
    }

    const invitations = this.getLocalInvitations();
    invitations.unshift(invitation);
    this.saveLocalInvitations(invitations);

    return invitation;
  }

  async getInvitationByCode(code: string): Promise<Invitation | null> {
    if (!code) return null;

    if (db) {
      try {
        const q = query(collection(db, 'invitations'), where('code', '==', code));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs[0].data() as Invitation;
        }
      } catch (err) {
        console.warn('Firestore fetch invitation error:', err);
      }
    }

    const invitations = this.getLocalInvitations();
    const found = invitations.find((i) => i.code === code);
    return found || null;
  }

  async consumeInvitation(code: string): Promise<void> {
    if (db) {
      try {
        const q = query(collection(db, 'invitations'), where('code', '==', code));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          await updateDoc(docRef, { used: true });
        }
      } catch (err) {
        console.warn('Firestore consume invitation error:', err);
      }
    }

    const invitations = this.getLocalInvitations();
    const idx = invitations.findIndex((i) => i.code === code);
    if (idx !== -1) {
      invitations[idx].used = true;
      this.saveLocalInvitations(invitations);
    }
  }
}
