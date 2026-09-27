export type EventType =
  | 'tournament'    // Partido de Torneo (Gold)
  | 'showmatch'     // Showmatch / Exhibición (Cyan)
  | 'absence'       // Falta Prevista / Ausencia (Red)
  | 'meeting'       // Reunión de Equipo / Staff (Emerald)
  | 'media_content' // Día de Medios / Contenido (Pink)
  | 'deadline'      // Inscripción / Fecha Clave (Orange)
  | 'other';        // Otro (Gray)

export type EventScope = 'all' | 'specific';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // Formato YYYY-MM-DD
  startTime?: string; // Formato HH:mm
  endTime?: string; // Formato HH:mm
  type: EventType;
  scope: EventScope;
  targetMembers?: string[]; // Nombres o IDs de los integrantes si scope === 'specific'
  location?: string; // Discord, Servidor, Venue, etc.
  link?: string; // URL de la sala, stream o doc
  createdBy: string;
  createdById?: string;
  createdAt: string; // ISO timestamp
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  // Detalles específicos para Ausencia / Falta Prevista
  absenceReason?: string;
  substitutePlayer?: string;
}

export interface EventTypeConfig {
  type: EventType;
  label: string;
  iconName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
}

export const EVENT_TYPES_CONFIG: Record<EventType, EventTypeConfig> = {
  tournament: {
    type: 'tournament',
    label: 'Partido de Torneo',
    iconName: 'Trophy',
    badgeBg: 'bg-amber-950/70',
    badgeText: 'text-[#E2B86E]',
    badgeBorder: 'border-amber-500/40',
    dotColor: '#E2B86E',
    description: 'Enfrentamiento oficial de competición',
  },
  showmatch: {
    type: 'showmatch',
    label: 'Showmatch / Exhibición',
    iconName: 'Sparkles',
    badgeBg: 'bg-cyan-950/70',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/40',
    dotColor: '#06B6D4',
    description: 'Partido de exhibición o evento especial',
  },
  absence: {
    type: 'absence',
    label: 'Falta Prevista / Ausencia',
    iconName: 'UserX',
    badgeBg: 'bg-red-950/70',
    badgeText: 'text-red-300',
    badgeBorder: 'border-red-500/40',
    dotColor: '#EF4444',
    description: 'Ausencia programada de un integrante',
  },
  meeting: {
    type: 'meeting',
    label: 'Reunión de Equipo / Staff',
    iconName: 'Users',
    badgeBg: 'bg-emerald-950/70',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    dotColor: '#10B981',
    description: 'Charla directiva o de alineación táctica',
  },
  media_content: {
    type: 'media_content',
    label: 'Día de Medios / Contenido',
    iconName: 'Camera',
    badgeBg: 'bg-pink-950/70',
    badgeText: 'text-pink-300',
    badgeBorder: 'border-pink-500/40',
    dotColor: '#EC4899',
    description: 'Grabación, fotos o creación de contenido',
  },
  deadline: {
    type: 'deadline',
    label: 'Fecha Clave / Límite',
    iconName: 'AlertCircle',
    badgeBg: 'bg-orange-950/70',
    badgeText: 'text-orange-300',
    badgeBorder: 'border-orange-500/40',
    dotColor: '#F97316',
    description: 'Cierre de inscripciones o plazo límite',
  },
  other: {
    type: 'other',
    label: 'Otro Evento',
    iconName: 'Calendar',
    badgeBg: 'bg-gray-800/70',
    badgeText: 'text-gray-300',
    badgeBorder: 'border-gray-600/40',
    dotColor: '#9CA3AF',
    description: 'Evento general de equipo',
  },
};

export const SAMPLE_ROSTER_MEMBERS = [
  'Gianm (Coach / Staff)',
  'Shadow (Duelista / Captain)',
  'Viper (Iniciador)',
  'Kronos (Controlador)',
  'Aura (Centinela)',
  'Nyx (Suplente)',
  'Kael (Analista)',
];
