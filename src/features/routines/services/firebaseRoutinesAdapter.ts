import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { IRoutinesPort } from './routinesPort';
import type { Routine, UserRoutineMonthCheckIn, UserAssignedRoutine } from '../types';
import { DEFAULT_VALORANT_ROUTINE, DEFAULT_AIMLAB_ROUTINE } from '../types';

const LOCAL_ROUTINES_KEY = 'urs_routines_v1';
const LOCAL_CHECKINS_KEY = 'urs_routine_checkins_v1';
const LOCAL_ASSIGNMENTS_KEY = 'urs_user_assigned_routines_v1';

export class FirebaseRoutinesAdapter implements IRoutinesPort {
  private getLocalRoutines(): Routine[] {
    try {
      const data = localStorage.getItem(LOCAL_ROUTINES_KEY);
      if (!data) {
        const defaults = [DEFAULT_VALORANT_ROUTINE, DEFAULT_AIMLAB_ROUTINE];
        localStorage.setItem(LOCAL_ROUTINES_KEY, JSON.stringify(defaults));
        return defaults;
      }
      return JSON.parse(data);
    } catch {
      return [DEFAULT_VALORANT_ROUTINE, DEFAULT_AIMLAB_ROUTINE];
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
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as Routine);
          this.saveLocalRoutines(list);
          return list;
        }
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

  async getUserAssignedRoutine(userId: string, _yearMonth?: string): Promise<string | null> {
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'user_assigned_routines', userId));
        if (snap.exists()) {
          const data = snap.data() as UserAssignedRoutine;
          return data.routineId;
        }
      } catch (err) {
        console.warn('Firestore getUserAssignedRoutine error:', err);
      }
    }
    const map = this.getLocalAssignments();
    return map[userId] || null;
  }

  async setUserAssignedRoutine(userId: string, routineId: string, assignedBy?: string): Promise<void> {
    const payload: UserAssignedRoutine = {
      userId,
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
    this.saveLocalAssignments(map);
  }

  async assignRoutineToUser(userId: string, routineId: string, _yearMonth?: string): Promise<void> {
    return this.setUserAssignedRoutine(userId, routineId);
  }

  // --- Month Check-Ins ---

  async getUserMonthCheckIn(
    userId: string,
    yearMonth: string,
    currentAssignedRoutineId?: string
  ): Promise<UserRoutineMonthCheckIn> {
    const docId = `${userId}_${yearMonth}`;

    if (db) {
      try {
        const snap = await getDoc(doc(db, 'routine_checkins', docId));
        if (snap.exists()) {
          const item = snap.data() as UserRoutineMonthCheckIn;
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

    // Default empty record for the month
    const defaultRecord: UserRoutineMonthCheckIn = {
      id: docId,
      userId,
      yearMonth,
      routineId: currentAssignedRoutineId || DEFAULT_VALORANT_ROUTINE.id,
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
    value?: boolean
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

    const updatedRecord: UserRoutineMonthCheckIn = {
      ...existing,
      routineId: existing.routineId || routineId,
      checkIns: updatedCheckIns,
      updatedAt: new Date().toISOString(),
    };

    map[docId] = updatedRecord;
    this.saveLocalCheckIns(map);

    if (db) {
      try {
        await setDoc(doc(db, 'routine_checkins', docId), updatedRecord);
      } catch (err) {
        console.warn('Firestore toggleCheckIn error:', err);
      }
    }

    return updatedRecord;
  }
}
