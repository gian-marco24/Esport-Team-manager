import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
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

  async removeMemberFromTeam(memberId: string): Promise<void> {
    if (db) {
      try {
        await deleteDoc(doc(db, 'users', memberId));
      } catch (err) {
        console.warn('Firestore delete user error:', err);
      }
    }

    const members = this.getLocalMembers();
    const filtered = members.filter((m) => m.id !== memberId);
    this.saveLocalMembers(filtered);
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
