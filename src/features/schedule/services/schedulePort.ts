import type { CalendarEvent } from '../types';

export interface SchedulePort {
  getEvents(): Promise<CalendarEvent[]>;
  createEvent(event: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<CalendarEvent>;
  updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteEvent(id: string): Promise<void>;
}
