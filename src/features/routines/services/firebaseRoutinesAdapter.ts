import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { IRoutinesPort } from './routinesPort';
import type { Routine, UserRoutineMonthCheckIn, UserAssignedRoutine } from '../types';

const LOCAL_ROUTINES_KEY = 'urs_routines_v1';
const LOCAL_CHECKINS_KEY = 'urs_routine_checkins_v1';
const LOCAL_ASSIGNMENTS_KEY = 'urs_user_assigned_routines_v1';

// IDs of initial mockup test routines to clean up if lingering in cache
const MOCK_ROUTINE_IDS = new Set(['routine-val-precision', 'routine-aimlab-speed']);

export class FirebaseRoutinesAdapter implements IRoutinesPort {
  private getLocalRoutines(): Routine[] {
    try {
      const data = localStorage.getItem(LOCAL_ROUTINES_KEY);
      if (!data) {
        return [];
      }
      const parsed: Routine[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((r) => r && !MOCK_ROUTINE_IDS.has(r.id));
        if (cleaned.length !== parsed.length) {
          this.saveLocalRoutines(cleaned);
        }
        return cleaned;
      }
      return [];
    } catch {
      return [];
    }
  }

  private saveLocalRoutines(routines: Routine[]): void {
    try {
      localStorage.setItem(LOCAL_ROUTINES_KEY, JSON.stringify(routines));
    } catch (e) {
      console.warn('Failed to save local routines:', e);
    }
  }

  private getLocalCheckIns(): Record<string, UserRoutineMonthCheckIn> {
    try {
      const data = localStorage.getItem(LOCAL_CHECKINS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveLocalCheckIns(map: Record<string, UserRoutineMonthCheckIn>): void {
    try {
      localStorage.setItem(LOCAL_CHECKINS_KEY, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save local check-ins:', e);
    }
  }

  private getLocalAssignments(): Record<string, string> {
    try {
      const data = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveLocalAssignments(map: Record<string, string>): void {
    try {
      localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save local assignments:', e);
    }
  }

  // --- Routines CRUD ---

  async getRoutines(_teamId: string = 'urs-gamara'): Promise<Routine[]> {
    if (db) {
      try {
        const q = collection(db, 'routines');
        const snapshot = await getDocs(q);
        const list = snapshot.docs
          .map((d) => d.data() as Routine)
          .filter((r) => r && !MOCK_ROUTINE_IDS.has(r.id));
        this.saveLocalRoutines(list);
        return list;
      } catch (err) {
        console.warn('Firestore getRoutines error, fallback to local:', err);
      }
    }
    return this.getLocalRoutines();
  }

  async saveRoutine(teamId: string, routineData: Partial<Routine>): Promise<Routine> {
    const routineId = routineData.id || `routine-${Date.now()}`;
    const now = new Date().toISOString();

    const routine: Routine = {
      id: routineId,
      teamId: routineData.teamId || teamId || 'urs-gamara',
      title: routineData.title || 'Nueva Rutina',
      description: routineData.description || '',
      videoUrl: routineData.videoUrl || '',
      imageUrls: routineData.imageUrls || [],
      externalLink: routineData.externalLink || '',
      externalLinkLabel: routineData.externalLinkLabel || 'Abrir enlace de rutina',
      duration: routineData.duration || '30 min',
      game: routineData.game || 'Valorant',
      exercises: routineData.exercises || [],
      createdAt: routineData.createdAt || now,
      updatedAt: now,
      createdBy: routineData.createdBy,
    };

    if (db) {
      try {
        await setDoc(doc(db, 'routines', routineId), routine);
      } catch (err) {
        console.warn('Firestore saveRoutine error:', err);
      }
    }

    const all = this.getLocalRoutines();
    const idx = all.findIndex((r) => r.id === routineId);
    if (idx !== -1) {
      all[idx] = routine;
    } else {
      all.push(routine);
    }
    this.saveLocalRoutines(all);

    return routine;
  }

  async createRoutine(routineData: Partial<Routine>, teamId: string = 'urs-gamara'): Promise<Routine> {
    return this.saveRoutine(teamId, routineData);
  }

  async updateRoutine(routineId: string, routineData: Partial<Routine>, teamId: string = 'urs-gamara'): Promise<Routine> {
    return this.saveRoutine(teamId, { ...routineData, id: routineId });
  }

  async deleteRoutine(routineIdOrTeamId: string, maybeRoutineId?: string): Promise<void> {
    const routineId = maybeRoutineId || routineIdOrTeamId;
    if (db) {
      try {
        await deleteDoc(doc(db, 'routines', routineId));
      } catch (err) {
        console.warn('Firestore deleteRoutine error:', err);
      }
    }

    const all = this.getLocalRoutines();
    const filtered = all.filter((r) => r.id !== routineId);
    this.saveLocalRoutines(filtered);
  }

  // --- Assignments ---

  async getUserAssignedRoutine(userId: string, _yearMonth?: string, userEmail?: string): Promise<string | null> {
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'user_assigned_routines', userId));
        if (snap.exists()) {
          const data = snap.data() as UserAssignedRoutine;
          if (data.routineId) return data.routineId;
        }

        if (userEmail) {
          const q = query(
            collection(db, 'user_assigned_routines'),
            where('userEmail', '==', userEmail.toLowerCase())
          );
          const emailSnap = await getDocs(q);
          if (!emailSnap.empty) {
            const data = emailSnap.docs[0].data() as UserAssignedRoutine;
            return data.routineId;
          }
        }
      } catch (err) {
        console.warn('Firestore getUserAssignedRoutine error:', err);
      }
    }
    const map = this.getLocalAssignments();
    return map[userId] || (userEmail ? map[userEmail.toLowerCase()] : null) || null;
  }

  async setUserAssignedRoutine(
    userId: string,
    routineId: string,
    assignedBy?: string,
    userEmail?: string
  ): Promise<void> {
    const payload: UserAssignedRoutine & { userEmail?: string } = {
      userId,
      userEmail: userEmail ? userEmail.toLowerCase() : undefined,
      routineId,
      assignedBy,
      assignedAt: new Date().toISOString(),
    };

    if (db) {
      try {
        await setDoc(doc(db, 'user_assigned_routines', userId), payload);
      } catch (err) {
        console.warn('Firestore setUserAssignedRoutine error:', err);
      }
    }

    const map = this.getLocalAssignments();
    map[userId] = routineId;
    if (userEmail) {
      map[userEmail.toLowerCase()] = routineId;
    }
    this.saveLocalAssignments(map);
  }

  async assignRoutineToUser(
    userId: string,
    routineId: string,
    _yearMonth?: string,
    userEmail?: string
  ): Promise<void> {
    return this.setUserAssignedRoutine(userId, routineId, undefined, userEmail);
  }

  // --- Month Check-Ins ---

  async getUserMonthCheckIn(
    userId: string,
    yearMonth: string,
    currentAssignedRoutineId?: string,
    userEmail?: string
  ): Promise<UserRoutineMonthCheckIn> {
    const docId = `${userId}_${yearMonth}`;

    if (db) {
      try {
        // 1. Try direct doc ID match (Auth UID or direct ID)
        const snap = await getDoc(doc(db, 'routine_checkins', docId));
        if (snap.exists()) {
          const item = snap.data() as UserRoutineMonthCheckIn;
          const hasChecks = Object.keys(item.checkIns || {}).length > 0;
          if (hasChecks) {
            const map = this.getLocalCheckIns();
            map[docId] = item;
            this.saveLocalCheckIns(map);
            return item;
          }
        }

        // 2. Fallback: Search by userEmail in routine_checkins
        if (userEmail) {
          const q = query(
            collection(db, 'routine_checkins'),
            where('yearMonth', '==', yearMonth),
            where('userEmail', '==', userEmail.toLowerCase())
          );
          const emailSnap = await getDocs(q);
          if (!emailSnap.empty) {
            const item = emailSnap.docs[0].data() as UserRoutineMonthCheckIn;
            const map = this.getLocalCheckIns();
            map[docId] = item;
            this.saveLocalCheckIns(map);
            // Also sync to docId so next fetch is immediate
            try {
              await setDoc(doc(db, 'routine_checkins', docId), item, { merge: true });
            } catch {
              // ignore
            }
            return item;
          }
        }

        // 3. Fallback: Check if document was saved with user.id matching field
        const qUserId = query(
          collection(db, 'routine_checkins'),
          where('yearMonth', '==', yearMonth),
          where('userId', '==', userId)
        );
        const userSnap = await getDocs(qUserId);
        if (!userSnap.empty) {
          const item = userSnap.docs[0].data() as UserRoutineMonthCheckIn;
          const map = this.getLocalCheckIns();
          map[docId] = item;
          this.saveLocalCheckIns(map);
          return item;
        }
      } catch (err) {
        console.warn('Firestore getUserMonthCheckIn error:', err);
      }
    }

    const map = this.getLocalCheckIns();
    if (map[docId]) {
      return map[docId];
    }
    if (userEmail && map[`${userEmail.toLowerCase()}_${yearMonth}`]) {
      return map[`${userEmail.toLowerCase()}_${yearMonth}`];
    }

    // Default empty record for the month
    const defaultRecord: UserRoutineMonthCheckIn = {
      id: docId,
      userId,
      yearMonth,
      routineId: currentAssignedRoutineId || '',
      checkIns: {},
      updatedAt: new Date().toISOString(),
    };

    return defaultRecord;
  }

  async toggleCheckIn(
    userId: string,
    yearMonth: string,
    routineId: string,
    exerciseId: string,
    day: number,
    value?: boolean,
    userEmail?: string
  ): Promise<UserRoutineMonthCheckIn> {
    const docId = `${userId}_${yearMonth}`;
    const map = this.getLocalCheckIns();
    const existing =
      map[docId] || {
        id: docId,
        userId,
        yearMonth,
        routineId,
        checkIns: {},
        updatedAt: new Date().toISOString(),
      };

    const exMap = existing.checkIns[exerciseId] || {};
    const nextVal = value !== undefined ? value : !exMap[day];

    const updatedCheckIns = {
      ...existing.checkIns,
      [exerciseId]: {
        ...exMap,
        [day]: nextVal,
      },
    };

    const updatedRecord: UserRoutineMonthCheckIn & { userEmail?: string } = {
      ...existing,
      userId,
      userEmail: userEmail ? userEmail.toLowerCase() : (existing as any).userEmail,
      routineId: existing.routineId || routineId,
      checkIns: updatedCheckIns,
      updatedAt: new Date().toISOString(),
    };

    map[docId] = updatedRecord;
    if (userEmail) {
      map[`${userEmail.toLowerCase()}_${yearMonth}`] = updatedRecord;
    }
    this.saveLocalCheckIns(map);

    if (db) {
      try {
        await setDoc(doc(db, 'routine_checkins', docId), updatedRecord);
        // Also if userEmail is different from userId, sync with email if needed
        if (userEmail && userEmail.toLowerCase() !== userId.toLowerCase()) {
          const emailDocId = `${userEmail.toLowerCase()}_${yearMonth}`;
          await setDoc(doc(db, 'routine_checkins', emailDocId), { ...updatedRecord, id: emailDocId }, { merge: true });
        }
      } catch (err) {
        console.warn('Firestore toggleCheckIn error:', err);
      }
    }

    return updatedRecord;
  }
}
