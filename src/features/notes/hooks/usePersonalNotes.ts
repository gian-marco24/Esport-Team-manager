import { useState, useEffect, useCallback } from 'react';
import type { PersonalNote } from '../types';
import { notesService } from '../services/notesService';

export const usePersonalNotes = (userId: string | undefined) => {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!userId) {
      setNotes([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await notesService.getPersonalNotes(userId);
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch personal notes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const saveNote = async (noteData: Partial<PersonalNote>) => {
    if (!userId) return;
    const saved = await notesService.savePersonalNote(userId, noteData);
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === saved.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const deleteNote = async (noteId: string) => {
    if (!userId) return;
    await notesService.deletePersonalNote(userId, noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTag = !selectedTag || n.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return {
    notes: filteredNotes,
    allNotes: notes,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedTag,
    setSelectedTag,
    saveNote,
    deleteNote,
    reloadNotes: fetchNotes,
  };
};
