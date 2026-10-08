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

const LOCAL_STORAGE_KEY = 'urs_gamara_calendar_events_v1';

export class FirebaseScheduleAdapter implements SchedulePort {
  private getLocalEvents(): CalendarEvent[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalEvents(events: CalendarEvent[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save local calendar events:', e);
    }
  }

  async getEvents(): Promise<CalendarEvent[]> {
    let events: CalendarEvent[] = [];

    if (db) {
      try {
        const eventsRef = collection(db, COLLECTION_NAME);
        const q = query(eventsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
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
        }
      } catch (error) {
        console.warn('⚠️ Error al obtener eventos de Firestore, usando respaldo local:', error);
      }
    }

    if (events.length === 0) {
      events = this.getLocalEvents();
    }

    return events;
  }

  async createEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<CalendarEvent> {
    const createdAt = new Date().toISOString();
    
    // Sanitizar payload eliminando campos con undefined para evitar errores en Firestore
    const rawPayload: Record<string, any> = {
      ...eventData,
      createdAt,
    };

    const cleanPayload: Record<string, any> = {};
    Object.entries(rawPayload).forEach(([k, v]) => {
      if (v !== undefined) {
        cleanPayload[k] = v;
      }
    });

    let newEvent: CalendarEvent;

    if (db) {
      try {
        const eventsRef = collection(db, COLLECTION_NAME);
        const docRef = await addDoc(eventsRef, cleanPayload);
        newEvent = {
          id: docRef.id,
          ...cleanPayload,
        } as CalendarEvent;
      } catch (err) {
        console.warn('⚠️ Error guardando en Firestore, guardando en local:', err);
        newEvent = {
          id: `local-evt-${Date.now()}`,
          ...cleanPayload,
        } as CalendarEvent;
      }
    } else {
      newEvent = {
        id: `local-evt-${Date.now()}`,
        ...cleanPayload,
      } as CalendarEvent;
    }

    // Sincronizar en localStorage
    const locals = this.getLocalEvents();
    locals.unshift(newEvent);
    this.saveLocalEvents(locals);

    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([k, v]) => {
      if (v !== undefined) {
        cleanUpdates[k] = v;
      }
    });

    if (db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, cleanUpdates);
      } catch (err) {
        console.warn('⚠️ Error actualizando evento en Firestore:', err);
      }
    }

    const locals = this.getLocalEvents();
    const idx = locals.findIndex((e) => e.id === id);
    if (idx !== -1) {
      locals[idx] = { ...locals[idx], ...cleanUpdates };
      this.saveLocalEvents(locals);
    }

    return {
      id,
      ...cleanUpdates,
    } as CalendarEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    if (db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('⚠️ Error eliminando evento de Firestore:', err);
      }
    }

    const locals = this.getLocalEvents();
    const filtered = locals.filter((e) => e.id !== id);
    this.saveLocalEvents(filtered);
  }
}
