import type { IMatchPort } from './matchPort';
import { type Match, type CreateMatchFormData, calculateMatchSummary } from '../types';

const MOCK_MATCHES_KEY = 'urs_gamara_mock_matches';

const defaultMatches: Match[] = [];

export class MockMatchAdapter implements IMatchPort {
  private getStoredMatches(): Match[] {
    try {
      const data = localStorage.getItem(MOCK_MATCHES_KEY);
      return data ? JSON.parse(data) : defaultMatches;
    } catch {
      return defaultMatches;
    }
  }

  private saveMatches(matches: Match[]) {
    try {
      localStorage.setItem(MOCK_MATCHES_KEY, JSON.stringify(matches));
    } catch (e) {
      console.error('Failed to save mock matches:', e);
    }
  }

  async getMatches(): Promise<Match[]> {
    await new Promise((res) => setTimeout(res, 150));
    return this.getStoredMatches();
  }

  async getMatchById(id: string): Promise<Match | null> {
    const matches = this.getStoredMatches();
    return matches.find((m) => m.id === id) || null;
  }

  async createMatch(data: CreateMatchFormData): Promise<Match> {
    await new Promise((res) => setTimeout(res, 300));
    const matches = this.getStoredMatches();

    const { outcome, overallScore } = calculateMatchSummary(data.type, data.maps);

    const newMatch: Match = {
      id: `match-${Date.now()}`,
      type: data.type,
      tournamentName: data.type === 'tournament' ? data.tournamentName : undefined,
      opponentName: data.opponentName,
      date: data.date,
      outcome,
      overallScore,
      maps: data.maps,
      vods: data.vods || [],
      screenshotUrls: data.screenshotUrls || [],
      createdAt: new Date().toISOString(),
    };

    const updated = [newMatch, ...matches];
    this.saveMatches(updated);
    return newMatch;
  }

  async updateMatch(id: string, data: CreateMatchFormData): Promise<Match> {
    await new Promise((res) => setTimeout(res, 300));
    const matches = this.getStoredMatches();
    const existingIndex = matches.findIndex((m) => m.id === id);

    if (existingIndex === -1) {
      throw new Error('Partido no encontrado para actualizar.');
    }

    const { outcome, overallScore } = calculateMatchSummary(data.type, data.maps);

    const updatedMatch: Match = {
      ...matches[existingIndex],
      type: data.type,
      tournamentName: data.type === 'tournament' ? data.tournamentName : undefined,
      opponentName: data.opponentName,
      date: data.date,
      outcome,
      overallScore,
      maps: data.maps,
      vods: data.vods || [],
      screenshotUrls: data.screenshotUrls || [],
    };

    matches[existingIndex] = updatedMatch;
    this.saveMatches(matches);
    return updatedMatch;
  }

  async deleteMatch(id: string): Promise<void> {
    const matches = this.getStoredMatches();
    const updated = matches.filter((m) => m.id !== id);
    this.saveMatches(updated);
  }
}
