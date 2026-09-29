import type { Routine, UserRoutineMonthCheckIn, UserAssignedRoutine } from '../types';

export interface IRoutinesPort {
  // Routines CRUD
  getRoutines(teamId: string): Promise<Routine[]>;
  saveRoutine(teamId: string, routineData: Partial<Routine>): Promise<Routine>;
  deleteRoutine(teamId: string, routineId: string): Promise<void>;

  // User Routine Assignment
  getUserAssignedRoutine(userId: string): Promise<string | null>;
  setUserAssignedRoutine(userId: string, routineId: string, assignedBy?: string): Promise<void>;

  // Check-ins
  getUserMonthCheckIn(userId: string, yearMonth: string, currentAssignedRoutineId?: string): Promise<UserRoutineMonthCheckIn>;
  toggleCheckIn(
    userId: string,
    yearMonth: string,
    routineId: string,
    exerciseId: string,
    day: number,
    value?: boolean
  ): Promise<UserRoutineMonthCheckIn>;
}
