export type NoteChannelType =
  | 'roster-general'
  | 'player-coaches'
  | 'map-strategy'
  | 'coaches-managers'
  | 'staff-creators'
  | 'creator-ceo'
  | 'ceo-direct';

export interface TacticalTag {
  id: string;
  label: string;
  color: string;
}

export const DEFAULT_TACTICAL_TAGS: TacticalTag[] = [
  { id: 'setup', label: 'Setup', color: 'purple' },
  { id: 'a-site', label: 'A-Site', color: 'blue' },
  { id: 'b-site', label: 'B-Site', color: 'emerald' },
  { id: 'mid', label: 'Mid Control', color: 'amber' },
  { id: 'eco', label: 'Eco Round', color: 'rose' },
  { id: 'buy', label: 'Full Buy', color: 'gold' },
  { id: 'anti-strat', label: 'Anti-Strat', color: 'red' },
  { id: 'post-plant', label: 'Post-Plant', color: 'teal' },
  { id: 'lineup', label: 'Lineup / Utilidad', color: 'indigo' },
  { id: 'default', label: 'Default', color: 'gray' },
];

export interface TacticalTask {
  id: string;
  channelId: string;
  messageId?: string;
  title: string; // Requisito / Objetivo
  description?: string;
  materials?: string; // Links de VODs, recursos
  deadline?: string; // Fecha límite, ej. "2/10 o antes"
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'high' | 'medium' | 'low';
  assignedToId?: string;
  assignedToName?: string;
  authorId: string;
  authorName: string;
  annotations?: string; // Análisis extenso / VOD review
  createdAt: string;
  updatedAt: string;
}

export interface TacticalMessage {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  content: string;
  images?: string[];
  tags?: string[];
  isPinned?: boolean;
  isTask?: boolean;
  taskId?: string;
  taskData?: Partial<TacticalTask>;
  reactions?: Record<string, string[]>; // emoji -> list of userIds
  createdAt: string;
}

export interface MapPresetInfo {
  id: string;
  name: string;
  game: string;
  imageUrl?: string;
  isCompetitiveRotation: boolean;
}

export const VALORANT_MAPS: MapPresetInfo[] = [
  { id: 'abyss', name: 'Abyss', game: 'Valorant', isCompetitiveRotation: true, imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80' },
  { id: 'ascent', name: 'Ascent', game: 'Valorant', isCompetitiveRotation: true, imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80' },
  { id: 'bind', name: 'Bind', game: 'Valorant', isCompetitiveRotation: false, imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&q=80' },
  { id: 'breeze', name: 'Breeze', game: 'Valorant', isCompetitiveRotation: false },
  { id: 'corrode', name: 'Corrode', game: 'Valorant', isCompetitiveRotation: false },
  { id: 'fracture', name: 'Fracture', game: 'Valorant', isCompetitiveRotation: false },
  { id: 'haven', name: 'Haven', game: 'Valorant', isCompetitiveRotation: true, imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80' },
  { id: 'icebox', name: 'Icebox', game: 'Valorant', isCompetitiveRotation: false },
  { id: 'lotus', name: 'Lotus', game: 'Valorant', isCompetitiveRotation: true, imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80' },
  { id: 'pearl', name: 'Pearl', game: 'Valorant', isCompetitiveRotation: false },
  { id: 'split', name: 'Split', game: 'Valorant', isCompetitiveRotation: true, imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80' },
  { id: 'summit', name: 'Summit', game: 'Valorant', isCompetitiveRotation: true, imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80' },
  { id: 'sunset', name: 'Sunset', game: 'Valorant', isCompetitiveRotation: true, imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&q=80' },
];

export const CS2_MAPS: MapPresetInfo[] = [
  { id: 'ancient', name: 'Ancient', game: 'Counter-Strike 2', isCompetitiveRotation: true },
  { id: 'anubis', name: 'Anubis', game: 'Counter-Strike 2', isCompetitiveRotation: true },
  { id: 'dust2', name: 'Dust II', game: 'Counter-Strike 2', isCompetitiveRotation: true },
  { id: 'inferno', name: 'Inferno', game: 'Counter-Strike 2', isCompetitiveRotation: true },
  { id: 'mirage', name: 'Mirage', game: 'Counter-Strike 2', isCompetitiveRotation: true },
  { id: 'nuke', name: 'Nuke', game: 'Counter-Strike 2', isCompetitiveRotation: true },
  { id: 'overpass', name: 'Overpass', game: 'Counter-Strike 2', isCompetitiveRotation: false },
  { id: 'vertigo', name: 'Vertigo', game: 'Counter-Strike 2', isCompetitiveRotation: true },
];

export const DEFAULT_GENERIC_MAPS: MapPresetInfo[] = [
  { id: 'map_main', name: 'Mapa Principal', game: 'General', isCompetitiveRotation: true },
  { id: 'map_secondary', name: 'Mapa Secundario', game: 'General', isCompetitiveRotation: true },
];

export interface PersonalNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  color: 'purple' | 'gold' | 'emerald' | 'rose' | 'blue';
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyObjective {
  id: string;
  userId: string;
  weekIdentifier: string; // e.g. "2026-W39"
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}
