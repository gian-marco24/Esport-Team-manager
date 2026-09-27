import type { Match, CreateMatchFormData } from '../types';

export interface IMatchPort {
  getMatches(): Promise<Match[]>;
  getMatchById(id: string): Promise<Match | null>;
  createMatch(data: CreateMatchFormData): Promise<Match>;
  updateMatch(id: string, data: CreateMatchFormData): Promise<Match>;
  deleteMatch(id: string): Promise<void>;
}
