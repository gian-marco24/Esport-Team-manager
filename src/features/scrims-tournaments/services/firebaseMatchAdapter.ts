import { collection, doc, setDoc, getDocs, getDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { IMatchPort } from './matchPort';
import { type Match, type CreateMatchFormData, calculateMatchSummary } from '../types';

export class FirebaseMatchAdapter implements IMatchPort {
  async getMatches(): Promise<Match[]> {
    if (!db) return [];

    try {
      const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map((d) => d.data() as Match);
    } catch (error) {
      console.error('Firestore getMatches error:', error);
      return [];
    }
  }

  async getMatchById(id: string): Promise<Match | null> {
    if (!db) return null;

    try {
      const docRef = doc(db, 'matches', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as Match;
      }
      return null;
    } catch (error) {
      console.error('Firestore getMatchById error:', error);
      return null;
    }
  }

  async createMatch(data: CreateMatchFormData): Promise<Match> {
    const matchId = `match-${Date.now()}`;
    const { outcome, overallScore } = calculateMatchSummary(data.type, data.maps);

    const newMatch: Match = {
      id: matchId,
      rosterId: data.rosterId,
      game: data.game,
      type: data.type,
      tournamentName: data.type === 'tournament' ? data.tournamentName : undefined,
      opponentName: data.opponentName,
      date: data.date,
      outcome,
      overallScore,
      maps: data.maps,
      playerStats: data.playerStats || (data.maps && data.maps[0]?.playerStats ? data.maps[0].playerStats : []),
      vods: data.vods || [],
      screenshotUrls: data.screenshotUrls || [],
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await setDoc(doc(db, 'matches', matchId), newMatch);
    }
    return newMatch;
  }

  async updateMatch(id: string, data: CreateMatchFormData): Promise<Match> {
    const { outcome, overallScore } = calculateMatchSummary(data.type, data.maps);

    const updatedMatch: Match = {
      id,
      rosterId: data.rosterId,
      game: data.game,
      type: data.type,
      tournamentName: data.type === 'tournament' ? data.tournamentName : undefined,
      opponentName: data.opponentName,
      date: data.date,
      outcome,
      overallScore,
      maps: data.maps,
      playerStats: data.playerStats || (data.maps && data.maps[0]?.playerStats ? data.maps[0].playerStats : []),
      vods: data.vods || [],
      screenshotUrls: data.screenshotUrls || [],
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await setDoc(doc(db, 'matches', id), updatedMatch, { merge: true });
    }
    return updatedMatch;
  }

  async deleteMatch(id: string): Promise<void> {
    if (db) {
      await deleteDoc(doc(db, 'matches', id));
    }
  }
}
