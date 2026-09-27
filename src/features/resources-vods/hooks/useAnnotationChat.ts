import { useState, useEffect } from 'react';
import type { VodAnnotation, VodMessage } from '../types';
import { vodService } from '../services/vodService';
import { useAuthContext } from '../../../app/providers/AuthProvider';

export const useAnnotationChat = (activeAnnotation: VodAnnotation | null) => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<VodMessage[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);

  useEffect(() => {
    if (!activeAnnotation) {
      setMessages([]);
      return;
    }

    // Subscribe to real-time messages via Firebase onSnapshot / Adapter listener
    const unsubscribe = vodService.subscribeToMessages(activeAnnotation.id, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeAnnotation?.id]);

  const sendMessage = async (text: string) => {
    if (!activeAnnotation || !text.trim() || !user) return;

    setIsSending(true);
    try {
      await vodService.sendMessage(activeAnnotation.id, text.trim(), user);
    } catch (err: any) {
      alert(err.message || 'Error al enviar el comentario.');
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    isSending,
    sendMessage,
  };
};
