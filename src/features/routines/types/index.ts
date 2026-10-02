export interface RoutineExercise {
  id: string;
  category: string; // e.g. "GALERÍA DE TIRO", "DEATHMATCH", "AIMLAB / KOVAAKS"
  name: string; // e.g. "200 Bots (One Taps)", "Vandal"
  target?: string; // e.g. "200 bots", "3 partidas"
}

export interface Routine {
  id: string;
  teamId: string;
  title: string;
  description: string;
  videoUrl?: string; // Video tutorial (YouTube, Twitch, Vimeo, MP4)
  imageUrls?: string[]; // Optional configuration/reference images (settings, crosshair, posture, etc.)
  externalLink?: string; // Aimlab playlist, Kovaaks, external docs
  externalLinkLabel?: string;
  duration?: string; // e.g. "35 - 45 min"
  game?: string; // Valorant, CS2, etc.
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface UserRoutineMonthCheckIn {
  id: string; // `${userId}_${yearMonth}` e.g. "usr123_2026-09"
  userId: string;
  yearMonth: string; // "YYYY-MM"
  routineId: string;
  // Map of exerciseId -> { [dayNumber: number]: boolean }
  checkIns: Record<string, Record<number, boolean>>;
  notes?: string;
  updatedAt: string;
}

export interface UserAssignedRoutine {
  userId: string;
  routineId: string;
  assignedBy?: string;
  assignedAt?: string;
}


