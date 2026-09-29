import { useState, useEffect, useCallback } from 'react';
import type { TacticalTask } from '../types';
import { notesService } from '../services/notesService';
import { useAuthContext } from '../../../app/providers/AuthProvider';

export const useNoteTasks = (channelId: string | null) => {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<TacticalTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!channelId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = notesService.subscribeToChannelTasks(channelId, (newTasks) => {
      setTasks(newTasks);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [channelId]);

  const createTask = useCallback(
    async (taskData: Partial<TacticalTask>, publishToChat: boolean = true) => {
      if (!channelId || !user) return null;
      setIsSaving(true);
      setError(null);
      try {
        const created = await notesService.createTask(channelId, taskData, user, publishToChat);
        return created;
      } catch (err: any) {
        console.error('Failed to create task:', err);
        setError(err.message || 'Error al crear la tarea');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [channelId, user]
  );

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<TacticalTask>) => {
      if (!channelId) return;
      setIsSaving(true);
      setError(null);
      try {
        await notesService.updateTask(channelId, taskId, updates);
      } catch (err: any) {
        console.error('Failed to update task:', err);
        setError(err.message || 'Error al actualizar la tarea');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [channelId]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!channelId) return;
      try {
        await notesService.deleteTask(channelId, taskId);
      } catch (err: any) {
        console.error('Failed to delete task:', err);
      }
    },
    [channelId]
  );

  return {
    tasks,
    isLoading,
    isSaving,
    error,
    createTask,
    updateTask,
    deleteTask,
  };
};
