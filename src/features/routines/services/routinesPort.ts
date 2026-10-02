import type { Routine, UserRoutineMonthCheckIn } from '../types';

export interface IRoutinesPort {
  // Routines CRUD
  getRoutines(teamId?: string): Promise<Routine[]>;
  saveRoutine(teamId: string, routineData: Partial<Routine>): Promise<Routine>;
  createRoutine(routineData: Partial<Routine>, teamId?: string): Promise<Routine>;
  updateRoutine(routineId: string, routineData: Partial<Routine>, teamId?: string): Promise<Routine>;
  deleteRoutine(routineId: string, teamId?: string): Promise<void>;

  // User Routine Assignment
  getUserAssignedRoutine(userId: string, yearMonth?: string, userEmail?: string): Promise<string | null>;
  setUserAssignedRoutine(userId: string, routineId: string, assignedBy?: string, userEmail?: string): Promise<void>;
  assignRoutineToUser(userId: string, routineId: string, yearMonth?: string, userEmail?: string): Promise<void>;

  // Check-ins
  getUserMonthCheckIn(
    userId: string,
    yearMonth: string,
    currentAssignedRoutineId?: string,
    userEmail?: string
  ): Promise<UserRoutineMonthCheckIn>;
  toggleCheckIn(
    userId: string,
    yearMonth: string,
    routineId: string,
    exerciseId: string,
    day: number,
    value?: boolean,
    userEmail?: string
  ): Promise<UserRoutineMonthCheckIn>;
}
