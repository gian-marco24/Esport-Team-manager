import type { User } from '../../auth/types';
import type { TacticalMessage, PersonalNote, WeeklyObjective } from '../types';

export interface INotesPort {
  // Tactical Channel Real-time Messages
  subscribeToChannelMessages(
    channelId: string,
    callback: (messages: TacticalMessage[]) => void,
    limitCount?: number
  ): () => void;

  sendMessage(
    channelId: string,
    content: string,
    author: User,
    images?: string[],
    tags?: string[]
  ): Promise<TacticalMessage>;

  deleteMessage(channelId: string, messageId: string): Promise<void>;

  togglePinMessage(channelId: string, messageId: string, isPinned: boolean): Promise<void>;

  toggleReaction(channelId: string, messageId: string, emoji: string, userId: string): Promise<void>;

  // Personal Notes
  getPersonalNotes(userId: string): Promise<PersonalNote[]>;
  savePersonalNote(userId: string, note: Partial<PersonalNote>): Promise<PersonalNote>;
  deletePersonalNote(userId: string, noteId: string): Promise<void>;

  // Weekly Objectives
  getWeeklyObjectives(userId: string, weekIdentifier: string): Promise<WeeklyObjective[]>;
  saveWeeklyObjective(userId: string, objective: Partial<WeeklyObjective>): Promise<WeeklyObjective>;
  toggleWeeklyObjective(userId: string, objectiveId: string, completed: boolean): Promise<void>;
  deleteWeeklyObjective(userId: string, objectiveId: string): Promise<void>;
}
