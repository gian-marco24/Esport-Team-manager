import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { SchedulePort } from './schedulePort';
import type { CalendarEvent } from '../types';

const COLLECTION_NAME = 'calendar_events';

export class FirebaseScheduleAdapter implements SchedulePort {
  async getEvents(): Promise<CalendarEvent[]> {
    try {
      if (!db) {
        console.warn('⚠️ Firestore no disponible, retornando lista vacía para calendario.');
        return [];
      }

      const eventsRef = collection(db, COLLECTION_NAME);
      const q = query(eventsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return [];
      }

      const events: CalendarEvent[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        events.push({
          id: docSnap.id,
          title: data.title || 'Sin título',
          description: data.description || '',
          date: data.date || new Date().toISOString().split('T')[0],
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          type: data.type || 'other',
          scope: data.scope || 'all',
          targetMembers: data.targetMembers || [],
          location: data.location || '',
          link: data.link || '',
          createdBy: data.createdBy || 'Usuario',
          createdById: data.createdById || '',
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || 'scheduled',
          absenceReason: data.absenceReason || '',
          substitutePlayer: data.substitutePlayer || '',
        });
      });

      return events;
    } catch (error) {
      console.error('❌ Error al obtener eventos de Firestore:', error);
      return [];
    }
  }

  async createEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<CalendarEvent> {
    const createdAt = new Date().toISOString();
    const payload = {
      ...eventData,
      createdAt,
    };

    if (db) {
      const eventsRef = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(eventsRef, payload);
      return {
        id: docRef.id,
        ...payload,
      };
    } else {
      return {
        id: `local-evt-${Date.now()}`,
        ...payload,
      };
    }
  }

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    if (db) {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, updates as any);
    }
    return {
      id,
      ...updates,
    } as CalendarEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    if (db) {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    }
  }
}
