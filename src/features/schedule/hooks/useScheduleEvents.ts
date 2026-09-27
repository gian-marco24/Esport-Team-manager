import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CalendarEvent, EventType } from '../types';
import { scheduleService } from '../services/scheduleService';

export function useScheduleEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<EventType | 'all'>('all');

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await scheduleService.getEvents();
      setEvents(data);
    } catch (err: any) {
      console.error('Error fetching calendar events:', err);
      setError(err?.message || 'Error al cargar eventos del calendario');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    try {
      const newEvt = await scheduleService.createEvent(eventData);
      setEvents((prev) => [newEvt, ...prev]);
      return newEvt;
    } catch (err: any) {
      console.error('Error creating event:', err);
      throw err;
    }
  };

  const removeEvent = async (id: string) => {
    try {
      await scheduleService.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      console.error('Error deleting event:', err);
      throw err;
    }
  };

  const filteredEvents = useMemo(() => {
    if (selectedTypeFilter === 'all') return events;
    return events.filter((e) => e.type === selectedTypeFilter);
  }, [events, selectedTypeFilter]);

  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.date === selectedDate);
  }, [filteredEvents, selectedDate]);

  // Mapa de fechas a lista de eventos para renderizado eficiente en el calendario
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach((evt) => {
      if (!map[evt.date]) {
        map[evt.date] = [];
      }
      map[evt.date].push(evt);
    });
    return map;
  }, [filteredEvents]);

  return {
    events,
    filteredEvents,
    selectedDayEvents,
    eventsByDate,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    selectedTypeFilter,
    setSelectedTypeFilter,
    fetchEvents,
    addEvent,
    removeEvent,
  };
}
