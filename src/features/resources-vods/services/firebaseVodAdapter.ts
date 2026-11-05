import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  increment,
  updateDoc,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { IVodPort, GetVodsResult } from './vodPort';
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
  async getVods(limitCount: number = 9): Promise<GetVodsResult> {
    let standaloneVods: VodItem[] = [];
    let standaloneHasMore = false;

    if (db) {
      try {
        const q = query(
          collection(db, 'vods'),
          orderBy('createdAt', 'desc'),
          limit(limitCount + 1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as VodItem);
          if (list.length > limitCount) {
            standaloneHasMore = true;
            standaloneVods = list.slice(0, limitCount);
          } else {
            standaloneVods = list;
          }
        }
      } catch (error) {
        console.warn('Firestore getVods error:', error);
      }
    }

    const sortVodsByDate = (list: VodItem[]) => {
      return list.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.matchDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.matchDate || 0).getTime();
        return timeB - timeA;
      });
    };

    let matchVods: VodItem[] = [];
    let matchHasMore = false;
    try {
      const matches = await matchService.getMatches(limitCount + 1);
      if (matches.length > limitCount) {
        matchHasMore = true;
      }
      const rawMatchVods = extractVodsFromMatches(matches);
      const existingUrls = new Set(standaloneVods.map((v) => v.videoUrl));
      matchVods = rawMatchVods.filter((v) => !existingUrls.has(v.videoUrl));
    } catch (err) {
      console.warn('getMatches for vods error:', err);
    }

    const combinedAll = sortVodsByDate([...standaloneVods, ...matchVods]);
    const hasMore = standaloneHasMore || matchHasMore || combinedAll.length > limitCount;
    const paginated = combinedAll.slice(0, limitCount);

    // Only count annotations for the VODs currently displayed, using fast getCountFromServer
    const countsByVod: Record<string, number> = {};
    if (db) {
      const database = db;
      await Promise.all(
        paginated.map(async (v) => {
          try {
            const countSnap = await getCountFromServer(
              collection(database, 'vods', v.id, 'annotations')
            );
            countsByVod[v.id] = countSnap.data().count;
          } catch {}
        })
      );
    }

    const finalVods = paginated.map((v) => ({
      ...v,
      annotationsCount: countsByVod[v.id] ?? v.annotationsCount ?? 0,
    }));

    return {
      vods: finalVods,
      hasMore,
    };
  }

  async getVodById(id: string): Promise<VodItem | null> {
    if (!db) {
      const res = await this.getVods(50);
      return res.vods.find((v) => v.id === id) || null;
    }

    const database = db;
    try {
      // 1. Direct standalone lookup
      if (!id.startsWith('match-vod-')) {
        const docRef = doc(database, 'vods', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const v = snapshot.data() as VodItem;
          try {
            const countSnap = await getCountFromServer(
              collection(database, 'vods', v.id, 'annotations')
            );
            return { ...v, annotationsCount: countSnap.data().count };
          } catch {
            return v;
          }
        }
      }

      // 2. Match VOD lookup
      const matches = await matchService.getMatches();
      const matchVods = extractVodsFromMatches(matches);
      const target = matchVods.find((v) => v.id === id);
      if (target) {
        try {
          const countSnap = await getCountFromServer(
            collection(database, 'vods', target.id, 'annotations')
          );
          return { ...target, annotationsCount: countSnap.data().count };
        } catch {
          return target;
        }
      }

      // 3. Fallback standalone lookup
      const docRef = doc(database, 'vods', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as VodItem;
      }

      return null;
    } catch (err) {
      console.warn('getVodById error:', err);
      return null;
    }
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
      matchType: data.matchType || 'analysis',
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
    const database = db;

    try {
      const q = query(
        collection(database, 'vods', vodId, 'annotations'),
        orderBy('timestampSeconds', 'asc')
      );
      const snapshot = await getDocs(q);
      const rawAnns = snapshot.docs.map((d) => d.data() as VodAnnotation);

      // Dynamically fetch accurate reply counts for each annotation
      const enrichedAnns = await Promise.all(
        rawAnns.map(async (ann) => {
          try {
            const countSnap = await getCountFromServer(
              collection(database, 'annotation_messages', ann.id, 'messages')
            );
            return {
              ...ann,
              repliesCount: countSnap.data().count,
            };
          } catch {
            return ann;
          }
        })
      );

      return enrichedAnns;
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
        await setDoc(
          doc(db, 'vods', vodId),
          { annotationsCount: increment(1) },
          { merge: true }
        );
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

  async sendMessage(
    annotationId: string,
    text: string,
    author: User,
    vodId?: string
  ): Promise<VodMessage> {
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
      if (vodId) {
        try {
          await updateDoc(doc(db, 'vods', vodId, 'annotations', annotationId), {
            repliesCount: increment(1),
          });
        } catch {}
      }
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
