import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  increment,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
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

export class FirebaseVodAdapter implements IVodPort {
  async getVods(): Promise<VodItem[]> {
    let standaloneVods: VodItem[] = [];
    if (db) {
      try {
        const q = query(collection(db, 'vods'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          standaloneVods = snapshot.docs.map((d) => d.data() as VodItem);
        }
      } catch (error) {
        console.warn('Firestore getVods error:', error);
      }
    }

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
    const vodId = `vod-${Date.now()}`;
    let provider: VodItem['provider'] = 'custom';
    if (data.videoUrl.includes('youtube.com') || data.videoUrl.includes('youtu.be')) {
      provider = 'youtube';
    } else if (data.videoUrl.includes('twitch.tv')) {
      provider = 'twitch';
    } else if (data.videoUrl.includes('drive.google.com')) {
      provider = 'drive';
    }

    const newVod: VodItem = {
      id: vodId,
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

    if (db) {
      await setDoc(doc(db, 'vods', vodId), newVod);
    }
    return newVod;
  }

  async deleteVod(id: string): Promise<void> {
    if (db) {
      await deleteDoc(doc(db, 'vods', id));
    }
  }

  async getAnnotations(vodId: string): Promise<VodAnnotation[]> {
    if (!db) return [];

    try {
      const q = query(
        collection(db, 'vods', vodId, 'annotations'),
        orderBy('timestampSeconds', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as VodAnnotation);
    } catch (e) {
      console.warn('Firestore getAnnotations error:', e);
      return [];
    }
  }

  async createAnnotation(
    vodId: string,
    timestampSeconds: number,
    title: string,
    author: User,
    type: 'annotation' | 'marker' = 'annotation'
  ): Promise<VodAnnotation> {
    const annId = `ann-${Date.now()}`;
    const newAnn: VodAnnotation = {
      id: annId,
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

    if (db) {
      await setDoc(doc(db, 'vods', vodId, 'annotations', annId), newAnn);
      try {
        await updateDoc(doc(db, 'vods', vodId), {
          annotationsCount: increment(1),
        });
      } catch {}
    }

    return newAnn;
  }

  async getMessages(annotationId: string): Promise<VodMessage[]> {
    if (!db) return [];

    try {
      const q = query(
        collection(db, 'annotation_messages', annotationId, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as VodMessage);
    } catch {
      return [];
    }
  }

  async sendMessage(annotationId: string, text: string, author: User): Promise<VodMessage> {
    const msgId = `msg-${Date.now()}`;
    const newMsg: VodMessage = {
      id: msgId,
      annotationId,
      authorId: author.id,
      authorName: author.displayName,
      ...(author.role ? { authorRole: author.role } : {}),
      ...(author.avatarUrl ? { authorAvatar: author.avatarUrl } : {}),
      text,
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await setDoc(doc(db, 'annotation_messages', annotationId, 'messages', msgId), newMsg);
    }
    return newMsg;
  }

  /**
   * Real-time Firebase Firestore Listener using onSnapshot for live chat updates
   */
  subscribeToMessages(
    annotationId: string,
    callback: (messages: VodMessage[]) => void
  ): () => void {
    if (!db) {
      callback([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'annotation_messages', annotationId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const msgs = snapshot.docs.map((d) => d.data() as VodMessage);
          callback(msgs);
        },
        (err) => {
          console.warn('Firestore onSnapshot listener error:', err);
        }
      );

      return unsubscribe;
    } catch {
      return () => {};
    }
  }
}
