import { useState, useEffect, useCallback } from 'react';
import type { WeeklyObjective } from '../types';
import { notesService } from '../services/notesService';

export const getISOWeekIdentifier = (date: Date = new Date()): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

export const getWeekDisplayLabel = (weekId: string): string => {
  const parts = weekId.split('-W');
  if (parts.length !== 2) return weekId;
  const year = parseInt(parts[0], 10);
  const week = parseInt(parts[1], 10);

  // Approximate start date of week
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const weekStart = simple;
  if (dow <= 4) weekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else weekStart.setDate(simple.getDate() + 8 - simple.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startFormatted = weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const endFormatted = weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return `Semana ${week} (${startFormatted} - ${endFormatted})`;
};

export const useWeeklyObjectives = (userId: string | undefined) => {
  const [currentWeek, setCurrentWeek] = useState<string>(getISOWeekIdentifier());
  const [objectives, setObjectives] = useState<WeeklyObjective[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchObjectives = useCallback(async () => {
    if (!userId) {
      setObjectives([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await notesService.getWeeklyObjectives(userId, currentWeek);
      setObjectives(data);
    } catch (err) {
      console.error('Failed to fetch weekly objectives:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentWeek]);

  useEffect(() => {
    fetchObjectives();
  }, [fetchObjectives]);

  const addObjective = async (title: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    if (!userId || !title.trim()) return;
    const newObj: Partial<WeeklyObjective> = {
      title: title.trim(),
      weekIdentifier: currentWeek,
      completed: false,
      priority,
    };
    const saved = await notesService.saveWeeklyObjective(userId, newObj);
    setObjectives((prev) => [...prev, saved]);
    return saved;
  };

  const toggleObjective = async (objectiveId: string, currentStatus: boolean) => {
    if (!userId) return;
    const nextStatus = !currentStatus;
    await notesService.toggleWeeklyObjective(userId, objectiveId, nextStatus);
    setObjectives((prev) =>
      prev.map((o) => (o.id === objectiveId ? { ...o, completed: nextStatus } : o))
    );
  };

  const deleteObjective = async (objectiveId: string) => {
    if (!userId) return;
    await notesService.deleteWeeklyObjective(userId, objectiveId);
    setObjectives((prev) => prev.filter((o) => o.id !== objectiveId));
  };

  const changeWeekOffset = (offset: number) => {
    const parts = currentWeek.split('-W');
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const week = parseInt(parts[1], 10) + offset;
      if (week >= 1 && week <= 53) {
        setCurrentWeek(`${year}-W${String(week).padStart(2, '0')}`);
      }
    }
  };

  const total = objectives.length;
  const completed = objectives.filter((o) => o.completed).length;
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    currentWeek,
    setCurrentWeek,
    weekLabel: getWeekDisplayLabel(currentWeek),
    objectives,
    isLoading,
    total,
    completed,
    progressPercent,
    addObjective,
    toggleObjective,
    deleteObjective,
    changeWeekOffset,
    resetToCurrentWeek: () => setCurrentWeek(getISOWeekIdentifier()),
  };
};
