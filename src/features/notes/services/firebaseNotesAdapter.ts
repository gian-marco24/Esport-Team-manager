import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { User } from '../../auth/types';
import type { TacticalMessage, PersonalNote, WeeklyObjective } from '../types';
import type { INotesPort } from './notesPort';

const LOCAL_NOTES_PREFIX = 'urs_notes_messages_';
const LOCAL_PERSONAL_NOTES = 'urs_personal_notes_';
const LOCAL_OBJECTIVES = 'urs_weekly_objectives_';

export class FirebaseNotesAdapter implements INotesPort {
  // Local storage helpers
  private getLocalChannelMessages(channelId: string): TacticalMessage[] {
    try {
      const data = localStorage.getItem(`${LOCAL_NOTES_PREFIX}${channelId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalChannelMessages(channelId: string, messages: TacticalMessage[]): void {
    try {
      localStorage.setItem(`${LOCAL_NOTES_PREFIX}${channelId}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save local channel messages:', e);
    }
  }

  private getLocalPersonalNotes(userId: string): PersonalNote[] {
    try {
      const data = localStorage.getItem(`${LOCAL_PERSONAL_NOTES}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalPersonalNotes(userId: string, notes: PersonalNote[]): void {
    try {
      localStorage.setItem(`${LOCAL_PERSONAL_NOTES}${userId}`, JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed to save local personal notes:', e);
    }
  }

  private getLocalObjectives(userId: string): WeeklyObjective[] {
    try {
      const data = localStorage.getItem(`${LOCAL_OBJECTIVES}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalObjectives(userId: string, objectives: WeeklyObjective[]): void {
    try {
      localStorage.setItem(`${LOCAL_OBJECTIVES}${userId}`, JSON.stringify(objectives));
    } catch (e) {
      console.warn('Failed to save local objectives:', e);
    }
  }

  // --- Real-Time Channel Messages ---

  subscribeToChannelMessages(
    channelId: string,
    callback: (messages: TacticalMessage[]) => void,
    limitCount = 70
  ): () => void {
    const localMsgs = this.getLocalChannelMessages(channelId);
    if (localMsgs.length > 0) {
      callback(localMsgs);
    }

    if (!db) {
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'note_channels', channelId, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(limitCount)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const msgs = snapshot.docs.map((d) => d.data() as TacticalMessage);
          this.saveLocalChannelMessages(channelId, msgs);
          callback(msgs);
        },
        (err) => {
          console.warn(`Firestore onSnapshot channel ${channelId} error:`, err);
          callback(this.getLocalChannelMessages(channelId));
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn('subscribeToChannelMessages error:', err);
      return () => {};
    }
  }

  async sendMessage(
    channelId: string,
    content: string,
    author: User,
    images: string[] = [],
    tags: string[] = []
  ): Promise<TacticalMessage> {
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Resolve role badge display
    const userRoleDisplay =
      author.teamRole ||
      (author.role === 'ceo'
        ? 'CEO'
        : author.role === 'coach'
        ? 'Coach'
        : author.role === 'player'
        ? 'Player'
        : author.role === 'manager'
        ? 'Manager'
        : 'Staff');

    const newMsg: TacticalMessage = {
      id: msgId,
      channelId,
      authorId: author.id,
      authorName: author.displayName || 'Integrante',
      authorRole: userRoleDisplay,
      authorAvatar: author.avatarUrl,
      content: content.trim(),
      images,
      tags,
      isPinned: false,
      reactions: {},
      createdAt: new Date().toISOString(),
    };

    if (db) {
      try {
        await setDoc(doc(db, 'note_channels', channelId, 'messages', msgId), newMsg);
      } catch (err) {
        console.warn('Firestore sendMessage error:', err);
      }
    }

    const msgs = this.getLocalChannelMessages(channelId);
    msgs.push(newMsg);
    this.saveLocalChannelMessages(channelId, msgs);

    return newMsg;
  }

  async deleteMessage(channelId: string, messageId: string): Promise<void> {
    if (db) {
      try {
        await deleteDoc(doc(db, 'note_channels', channelId, 'messages', messageId));
      } catch (err) {
        console.warn('Firestore deleteMessage error:', err);
      }
    }

    const msgs = this.getLocalChannelMessages(channelId);
    const filtered = msgs.filter((m) => m.id !== messageId);
    this.saveLocalChannelMessages(channelId, filtered);
  }

  async togglePinMessage(channelId: string, messageId: string, isPinned: boolean): Promise<void> {
    if (db) {
      try {
        await updateDoc(doc(db, 'note_channels', channelId, 'messages', messageId), {
          isPinned,
        });
      } catch (err) {
        console.warn('Firestore togglePinMessage error:', err);
      }
    }

    const msgs = this.getLocalChannelMessages(channelId);
    const idx = msgs.findIndex((m) => m.id === messageId);
    if (idx !== -1) {
      msgs[idx].isPinned = isPinned;
      this.saveLocalChannelMessages(channelId, msgs);
    }
  }

  async toggleReaction(
    channelId: string,
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<void> {
    const msgs = this.getLocalChannelMessages(channelId);
    const idx = msgs.findIndex((m) => m.id === messageId);
    let updatedReactions: Record<string, string[]> = {};

    if (idx !== -1) {
      const current = msgs[idx].reactions || {};
      const currentUsers = current[emoji] || [];
      const hasReacted = currentUsers.includes(userId);

      if (hasReacted) {
        current[emoji] = currentUsers.filter((u) => u !== userId);
        if (current[emoji].length === 0) delete current[emoji];
      } else {
        current[emoji] = [...currentUsers, userId];
      }
      msgs[idx].reactions = current;
      updatedReactions = current;
      this.saveLocalChannelMessages(channelId, msgs);
    }

    if (db) {
      try {
        await updateDoc(doc(db, 'note_channels', channelId, 'messages', messageId), {
          reactions: updatedReactions,
        });
      } catch (err) {
        console.warn('Firestore toggleReaction error:', err);
      }
    }
  }

  // --- Personal Notes Implementation ---

  async getPersonalNotes(userId: string): Promise<PersonalNote[]> {
    if (db) {
      try {
        const q = query(
          collection(db, 'users', userId, 'personal_notes'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const notes = snapshot.docs.map((d) => d.data() as PersonalNote);
          this.saveLocalPersonalNotes(userId, notes);
          return notes;
        }
      } catch (err) {
        console.warn('Firestore getPersonalNotes error, using fallback:', err);
      }
    }
    return this.getLocalPersonalNotes(userId);
  }

  async savePersonalNote(userId: string, noteData: Partial<PersonalNote>): Promise<PersonalNote> {
    const noteId = noteData.id || `pnote-${Date.now()}`;
    const now = new Date().toISOString();

    const note: PersonalNote = {
      id: noteId,
      userId,
      title: noteData.title || 'Nota sin título',
      content: noteData.content || '',
      tags: noteData.tags || [],
      color: noteData.color || 'purple',
      isPinned: Boolean(noteData.isPinned),
      createdAt: noteData.createdAt || now,
      updatedAt: now,
    };

    if (db) {
      try {
        await setDoc(doc(db, 'users', userId, 'personal_notes', noteId), note);
      } catch (err) {
        console.warn('Firestore savePersonalNote error:', err);
      }
    }

    const notes = this.getLocalPersonalNotes(userId);
    const existingIdx = notes.findIndex((n) => n.id === noteId);
    if (existingIdx !== -1) {
      notes[existingIdx] = note;
    } else {
      notes.unshift(note);
    }
    this.saveLocalPersonalNotes(userId, notes);

    return note;
  }

  async deletePersonalNote(userId: string, noteId: string): Promise<void> {
    if (db) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'personal_notes', noteId));
      } catch (err) {
        console.warn('Firestore deletePersonalNote error:', err);
      }
    }

    const notes = this.getLocalPersonalNotes(userId);
    const filtered = notes.filter((n) => n.id !== noteId);
    this.saveLocalPersonalNotes(userId, filtered);
  }

  // --- Weekly Objectives Implementation ---

  async getWeeklyObjectives(userId: string, weekIdentifier: string): Promise<WeeklyObjective[]> {
    if (db) {
      try {
        const q = query(
          collection(db, 'users', userId, 'weekly_objectives'),
          where('weekIdentifier', '==', weekIdentifier),
          orderBy('createdAt', 'asc')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as WeeklyObjective);
          return items;
        }
      } catch (err) {
        console.warn('Firestore getWeeklyObjectives error, using fallback:', err);
      }
    }

    const all = this.getLocalObjectives(userId);
    return all.filter((o) => o.weekIdentifier === weekIdentifier);
  }

  async saveWeeklyObjective(
    userId: string,
    objData: Partial<WeeklyObjective>
  ): Promise<WeeklyObjective> {
    const objId = objData.id || `obj-${Date.now()}`;
    const now = new Date().toISOString();

    const obj: WeeklyObjective = {
      id: objId,
      userId,
      weekIdentifier: objData.weekIdentifier || 'current',
      title: objData.title || '',
      description: objData.description,
      completed: Boolean(objData.completed),
      priority: objData.priority || 'medium',
      createdAt: objData.createdAt || now,
    };

    if (db) {
      try {
        await setDoc(doc(db, 'users', userId, 'weekly_objectives', objId), obj);
      } catch (err) {
        console.warn('Firestore saveWeeklyObjective error:', err);
      }
    }

    const all = this.getLocalObjectives(userId);
    const existingIdx = all.findIndex((o) => o.id === objId);
    if (existingIdx !== -1) {
      all[existingIdx] = obj;
    } else {
      all.push(obj);
    }
    this.saveLocalObjectives(userId, all);

    return obj;
  }

  async toggleWeeklyObjective(
    userId: string,
    objectiveId: string,
    completed: boolean
  ): Promise<void> {
    if (db) {
      try {
        await updateDoc(doc(db, 'users', userId, 'weekly_objectives', objectiveId), {
          completed,
        });
      } catch (err) {
        console.warn('Firestore toggleWeeklyObjective error:', err);
      }
    }

    const all = this.getLocalObjectives(userId);
    const idx = all.findIndex((o) => o.id === objectiveId);
    if (idx !== -1) {
      all[idx].completed = completed;
      this.saveLocalObjectives(userId, all);
    }
  }

  async deleteWeeklyObjective(userId: string, objectiveId: string): Promise<void> {
    if (db) {
      try {
        await deleteDoc(doc(db, 'users', userId, 'weekly_objectives', objectiveId));
      } catch (err) {
        console.warn('Firestore deleteWeeklyObjective error:', err);
      }
    }

    const all = this.getLocalObjectives(userId);
    const filtered = all.filter((o) => o.id !== objectiveId);
    this.saveLocalObjectives(userId, filtered);
  }
}
