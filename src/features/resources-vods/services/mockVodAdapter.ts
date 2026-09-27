import type { IVodPort } from './vodPort';
import {
  type VodItem,
  type VodAnnotation,
  type VodMessage,
  type CreateVodFormData,
  formatVideoTimestamp,
} from '../types';
import type { User } from '../../auth/types';
import { matchService } from '../../scrims-tournaments/services/matchService';
import { extractVodsFromMatches } from '../utils/matchVodExtractor';

const MOCK_VODS_KEY = 'urs_gamara_mock_vods';
const MOCK_ANNOTATIONS_KEY = 'urs_gamara_mock_annotations';
const MOCK_MESSAGES_KEY = 'urs_gamara_mock_messages';

const defaultVods: VodItem[] = [
  {
    id: 'vod-1',
    title: 'Análisis Táctico Haven - URS Gamara vs KRÜ Esports',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Standard YouTube test URL
    provider: 'youtube',
    opponentName: 'KRÜ Esports',
    mapName: 'Haven',
    matchDate: '2026-09-25',
    durationSeconds: 1420, // ~23m 40s
    annotationsCount: 3,
    createdAt: new Date('2026-09-25T21:00:00Z').toISOString(),
  },
  {
    id: 'vod-2',
    title: 'Ejecuciones Sitio A Ascent & Retakes',
    videoUrl: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    provider: 'youtube',
    opponentName: 'Leviatán',
    mapName: 'Ascent',
    matchDate: '2026-09-24',
    durationSeconds: 980, // ~16m 20s
    annotationsCount: 1,
    createdAt: new Date('2026-09-24T20:00:00Z').toISOString(),
  },
];

const defaultAnnotations: Record<string, VodAnnotation[]> = {
  'vod-1': [
    {
      id: 'ann-1',
      vodId: 'vod-1',
      timestampSeconds: 145, // 02:25
      timestampFormatted: '02:25',
      title: 'Falta de flash en entrada C Larga antes del smoke',
      authorId: 'user-coach-1',
      authorName: 'Kaiser (Coach)',
      authorRole: 'coach',
      createdAt: new Date('2026-09-25T21:15:00Z').toISOString(),
      repliesCount: 2,
    },
    {
      id: 'ann-2',
      vodId: 'vod-1',
      timestampSeconds: 380, // 06:20
      timestampFormatted: '06:20',
      title: 'Rotación tardía del centinela en B',
      authorId: 'user-analyst-1',
      authorName: 'AnalystUG',
      authorRole: 'analyst',
      createdAt: new Date('2026-09-25T21:30:00Z').toISOString(),
      repliesCount: 1,
    },
    {
      id: 'ann-3',
      vodId: 'vod-1',
      timestampSeconds: 740, // 12:20
      timestampFormatted: '12:20',
      title: 'Excelente retake en sitio A con recon de Sova',
      authorId: 'user-demo-1',
      authorName: 'GamaraPro',
      authorRole: 'player',
      createdAt: new Date('2026-09-25T21:45:00Z').toISOString(),
      repliesCount: 0,
    },
  ],
};

const defaultMessages: Record<string, VodMessage[]> = {
  'ann-1': [
    {
      id: 'msg-1',
      annotationId: 'ann-1',
      authorId: 'user-coach-1',
      authorName: 'Kaiser (Coach)',
      authorRole: 'coach',
      text: 'Ojo acá equipo. El smoke cayó sin soporte de flash y nos atraparon saliendo.',
      createdAt: new Date('2026-09-25T21:16:00Z').toISOString(),
    },
    {
      id: 'msg-2',
      annotationId: 'ann-1',
      authorId: 'user-demo-1',
      authorName: 'GamaraPro',
      authorRole: 'player',
      text: 'Anotado Coach. Para la próxima espero el call de la flash de Omen antes de pushear.',
      createdAt: new Date('2026-09-25T21:18:00Z').toISOString(),
    },
  ],
  'ann-2': [
    {
      id: 'msg-3',
      annotationId: 'ann-2',
      authorId: 'user-analyst-1',
      authorName: 'AnalystUG',
      authorRole: 'analyst',
      text: 'En el minimapa se ve cómo tardamos 4 segundos en reaccionar al sonido en B.',
      createdAt: new Date('2026-09-25T21:32:00Z').toISOString(),
    },
  ],
};

export class MockVodAdapter implements IVodPort {
  private getStoredVods(): VodItem[] {
    try {
      const data = localStorage.getItem(MOCK_VODS_KEY);
      return data ? JSON.parse(data) : defaultVods;
    } catch {
      return defaultVods;
    }
  }

  private saveVods(vods: VodItem[]) {
    try {
      localStorage.setItem(MOCK_VODS_KEY, JSON.stringify(vods));
    } catch (e) {
      console.error('Failed to save mock vods:', e);
    }
  }

  private getStoredAnnotations(): Record<string, VodAnnotation[]> {
    try {
      const data = localStorage.getItem(MOCK_ANNOTATIONS_KEY);
      return data ? JSON.parse(data) : defaultAnnotations;
    } catch {
      return defaultAnnotations;
    }
  }

  private saveAnnotations(annotations: Record<string, VodAnnotation[]>) {
    try {
      localStorage.setItem(MOCK_ANNOTATIONS_KEY, JSON.stringify(annotations));
    } catch (e) {
      console.error('Failed to save mock annotations:', e);
    }
  }

  private getStoredMessages(): Record<string, VodMessage[]> {
    try {
      const data = localStorage.getItem(MOCK_MESSAGES_KEY);
      return data ? JSON.parse(data) : defaultMessages;
    } catch {
      return defaultMessages;
    }
  }

  private saveMessages(messages: Record<string, VodMessage[]>) {
    try {
      localStorage.setItem(MOCK_MESSAGES_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save mock messages:', e);
    }
  }

  async getVods(): Promise<VodItem[]> {
    await new Promise((res) => setTimeout(res, 150));
    const standaloneVods = this.getStoredVods();
    try {
      const matches = await matchService.getMatches();
      const matchVods = extractVodsFromMatches(matches);
      const existingUrls = new Set(standaloneVods.map((v) => v.videoUrl));
      const filteredMatchVods = matchVods.filter((v) => !existingUrls.has(v.videoUrl));
      return [...standaloneVods, ...filteredMatchVods];
    } catch {
      return standaloneVods;
    }
  }

  async getVodById(id: string): Promise<VodItem | null> {
    const all = await this.getVods();
    return all.find((v) => v.id === id) || null;
  }

  async createVod(data: CreateVodFormData, _author?: User): Promise<VodItem> {
    await new Promise((res) => setTimeout(res, 300));
    const vods = this.getStoredVods();

    let provider: VodItem['provider'] = 'custom';
    if (data.videoUrl.includes('youtube.com') || data.videoUrl.includes('youtu.be')) {
      provider = 'youtube';
    } else if (data.videoUrl.includes('twitch.tv')) {
      provider = 'twitch';
    } else if (data.videoUrl.includes('drive.google.com')) {
      provider = 'drive';
    }

    const newVod: VodItem = {
      id: `vod-${Date.now()}`,
      title: data.title,
      videoUrl: data.videoUrl,
      provider,
      opponentName: data.opponentName,
      mapName: data.mapName,
      matchDate: new Date().toISOString().split('T')[0],
      durationSeconds: 1200,
      annotationsCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [newVod, ...vods];
    this.saveVods(updated);
    return newVod;
  }

  async deleteVod(id: string): Promise<void> {
    const vods = this.getStoredVods();
    const updated = vods.filter((v) => v.id !== id);
    this.saveVods(updated);
  }

  async getAnnotations(vodId: string): Promise<VodAnnotation[]> {
    const all = this.getStoredAnnotations();
    const vodAnns = all[vodId] || [];
    return [...vodAnns].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  }

  async createAnnotation(
    vodId: string,
    timestampSeconds: number,
    title: string,
    author: User,
    type: 'annotation' | 'marker' = 'annotation'
  ): Promise<VodAnnotation> {
    const all = this.getStoredAnnotations();
    const vodAnns = all[vodId] || [];

    const newAnn: VodAnnotation = {
      id: `ann-${Date.now()}`,
      vodId,
      timestampSeconds: Math.floor(timestampSeconds),
      timestampFormatted: formatVideoTimestamp(timestampSeconds),
      title,
      authorId: author.id,
      authorName: author.displayName,
      ...(author.role ? { authorRole: author.role } : {}),
      ...(author.avatarUrl ? { authorAvatar: author.avatarUrl } : {}),
      createdAt: new Date().toISOString(),
      repliesCount: 0,
      type,
    };

    all[vodId] = [...vodAnns, newAnn].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    this.saveAnnotations(all);

    // Increment annotationsCount in vod item
    const vods = this.getStoredVods();
    const targetVod = vods.find((v) => v.id === vodId);
    if (targetVod) {
      targetVod.annotationsCount = (targetVod.annotationsCount || 0) + 1;
      this.saveVods(vods);
    }

    return newAnn;
  }

  async getMessages(annotationId: string): Promise<VodMessage[]> {
    const all = this.getStoredMessages();
    return all[annotationId] || [];
  }

  async sendMessage(annotationId: string, text: string, author: User): Promise<VodMessage> {
    const all = this.getStoredMessages();
    const list = all[annotationId] || [];

    const newMsg: VodMessage = {
      id: `msg-${Date.now()}`,
      annotationId,
      authorId: author.id,
      authorName: author.displayName,
      ...(author.role ? { authorRole: author.role } : {}),
      ...(author.avatarUrl ? { authorAvatar: author.avatarUrl } : {}),
      text,
      createdAt: new Date().toISOString(),
    };

    all[annotationId] = [...list, newMsg];
    this.saveMessages(all);

    // Update repliesCount in annotation
    const allAnns = this.getStoredAnnotations();
    for (const vodId in allAnns) {
      const target = allAnns[vodId].find((a) => a.id === annotationId);
      if (target) {
        target.repliesCount = (target.repliesCount || 0) + 1;
        this.saveAnnotations(allAnns);
        break;
      }
    }

    return newMsg;
  }

  subscribeToMessages(
    annotationId: string,
    callback: (messages: VodMessage[]) => void
  ): () => void {
    // Initial emission
    callback(this.getStoredMessages()[annotationId] || []);

    // Polling interval to simulate real-time listener locally
    const interval = setInterval(() => {
      callback(this.getStoredMessages()[annotationId] || []);
    }, 1500);

    return () => clearInterval(interval);
  }
}
