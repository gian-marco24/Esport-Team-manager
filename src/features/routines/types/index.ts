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

export const DEFAULT_VALORANT_ROUTINE: Routine = {
  id: 'routine-val-precision',
  teamId: 'urs-gamara',
  title: 'Rutina de Calentamiento & Precisión (Valorant)',
  description:
    'Rutina oficial del equipo para calibrar micro-ajustes, ráfagas controladas y calentamiento de muñeca antes de entrenamientos y scrims.',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  externalLink: 'https://aimlab.pro',
  externalLinkLabel: 'Abrir Playlist en Aimlab',
  duration: '35 - 45 min',
  game: 'Valorant',
  exercises: [
    { id: 'ex-1', category: 'GALERÍA DE TIRO', name: '200 Bots (One Taps)', target: '200 bots' },
    { id: 'ex-2', category: 'GALERÍA DE TIRO', name: '400 Bots (Modo Duelo)', target: '400 bots' },
    { id: 'ex-3', category: 'GALERÍA DE TIRO', name: '100 Bots (Ráfaga de 3)', target: '100 bots' },
    { id: 'ex-4', category: 'GALERÍA DE TIRO', name: '200 Bots (Ráfaga de 4)', target: '200 bots' },
    { id: 'ex-5', category: 'GALERÍA DE TIRO', name: '300 Bots (Ráfaga + Spray Control)', target: '300 bots' },
    { id: 'ex-6', category: 'DEATHMATCH', name: 'Vandal', target: '2 partidas' },
    { id: 'ex-7', category: 'DEATHMATCH', name: 'Guardian', target: '2 partidas' },
    { id: 'ex-8', category: 'DEATHMATCH', name: 'Classic/Ghost', target: '1 partida' },
  ],
  createdAt: new Date().toISOString(),
};

export const DEFAULT_AIMLAB_ROUTINE: Routine = {
  id: 'routine-aimlab-speed',
  teamId: 'urs-gamara',
  title: 'Rutina Aimlab / Kovaaks & Flicking Intensivo',
  description:
    'Enfocada en tracking suave, velocidad de reacción rápida y micro-flicks para jugadores duelistas e iniciadores.',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  externalLink: 'https://aimlab.pro',
  externalLinkLabel: 'Aimlab Benchmark Playlist',
  duration: '30 min',
  game: 'General / Aim Trainer',
  exercises: [
    { id: 'ex-aim-1', category: 'AIMLAB / BENCHMARKS', name: 'Gridshot 5 Rondas (90k+ avg)' },
    { id: 'ex-aim-2', category: 'AIMLAB / BENCHMARKS', name: 'Sixshot Precisión (3 rondas)' },
    { id: 'ex-aim-3', category: 'AIMLAB / BENCHMARKS', name: 'Microflex Speed (4 rondas)' },
    { id: 'ex-aim-4', category: 'IN-GAME WARMUP', name: 'Galería: 50 Hard Bots' },
    { id: 'ex-aim-5', category: 'IN-GAME WARMUP', name: '1 Deathmatch Solo Sheriff' },
  ],
  createdAt: new Date().toISOString(),
};
