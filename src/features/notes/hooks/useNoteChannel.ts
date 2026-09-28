import { useState, useEffect, useCallback } from 'react';
import type { TacticalMessage } from '../types';
import { notesService } from '../services/notesService';
import { useAuthContext } from '../../../app/providers/AuthProvider';

export const useNoteChannel = (channelId: string | null) => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<TacticalMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Subscribe to Firestore onSnapshot with lazy cleanup
    const unsubscribe = notesService.subscribeToChannelMessages(
      channelId,
      (newMessages) => {
        setMessages(newMessages);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [channelId]);

  const sendMessage = useCallback(
    async (content: string, images: string[] = [], tags: string[] = []) => {
      if (!channelId || !user) return;
      if (!content.trim() && images.length === 0) return;

      setIsSending(true);
      setError(null);
      try {
        await notesService.sendMessage(channelId, content, user, images, tags);
      } catch (err: any) {
        console.error('Failed to send message:', err);
        setError(err.message || 'Error al enviar mensaje');
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [channelId, user]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!channelId) return;
      try {
        await notesService.deleteMessage(channelId, messageId);
      } catch (err: any) {
        console.error('Failed to delete message:', err);
      }
    },
    [channelId]
  );

  const togglePin = useCallback(
    async (messageId: string, currentPinStatus: boolean) => {
      if (!channelId) return;
      try {
        await notesService.togglePinMessage(channelId, messageId, !currentPinStatus);
      } catch (err: any) {
        console.error('Failed to toggle pin:', err);
      }
    },
    [channelId]
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!channelId || !user) return;
      try {
        await notesService.toggleReaction(channelId, messageId, emoji, user.id);
      } catch (err: any) {
        console.error('Failed to toggle reaction:', err);
      }
    },
    [channelId, user]
  );

  return {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    deleteMessage,
    togglePin,
    toggleReaction,
  };
};
