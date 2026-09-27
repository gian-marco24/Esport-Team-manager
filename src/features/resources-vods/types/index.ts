import { z } from 'zod';

export type VodProvider = 'youtube' | 'twitch' | 'drive' | 'custom';

export interface VodItem {
  id: string;
  title: string;
  videoUrl: string;
  provider: VodProvider;
  opponentName?: string;
  mapName?: string;
  matchDate?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  annotationsCount: number;
  createdAt: string;
  matchType?: 'scrim' | 'tournament';
  tournamentName?: string;
  outcome?: 'win' | 'loss' | 'draw';
  overallScore?: string;
  mapScore?: string;
  sourceMatchId?: string;
}

export interface VodAnnotation {
  id: string;
  vodId: string;
  timestampSeconds: number; // e.g., 255 = 4m 15s
  timestampFormatted: string; // e.g., "04:15"
  title: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  createdAt: string;
  repliesCount: number;
  type?: 'annotation' | 'marker'; // 'annotation' = discussion thread, 'marker' = quick point
  color?: string;
}

const USER_COLORS = [
  '#E2B86E', // Gold
  '#8B44F7', // Vibrant Purple
  '#10B981', // Emerald Green
  '#3B82F6', // Royal Blue
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#A855F7', // Light Purple
  '#F97316', // Bright Orange
  '#14B8A6', // Teal
];

export function getUserColor(authorId?: string, authorName?: string): string {
  const key = authorId || authorName || 'default';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

export interface VodMessage {
  id: string;
  annotationId: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

export const createVodSchema = z.object({
  title: z.string().min(3, 'Ingresa un título descriptivo para la VOD'),
  videoUrl: z.string().url('Ingresa una URL de video válida (YouTube, Twitch, Drive, MP4)'),
  opponentName: z.string().optional(),
  mapName: z.string().optional(),
});

export type CreateVodFormData = z.infer<typeof createVodSchema>;

/**
 * Utility to format seconds into mm:ss or hh:mm:ss
 */
export const formatVideoTimestamp = (seconds: number): string => {
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (num: number) => String(num).padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
};
