import { useState, useEffect, useRef } from 'react';
import type { VodItem, VodAnnotation } from '../types';
import { vodService } from '../services/vodService';
import { useAuthContext } from '../../../app/providers/AuthProvider';

export const useVodPlayer = (vodId?: string) => {
  const { user } = useAuthContext();
  const playerRef = useRef<any>(null);

  const [vod, setVod] = useState<VodItem | null>(null);
  const [annotations, setAnnotations] = useState<VodAnnotation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Playback State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!vodId) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const vodData = await vodService.getVodById(vodId);
        if (!vodData) {
          setError('VOD no encontrada.');
          return;
        }
        setVod(vodData);

        const anns = await vodService.getAnnotations(vodId);
        setAnnotations(anns);
      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos del reproductor VOD.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [vodId]);

  const seekToTimestamp = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, 'seconds');
      setCurrentTime(seconds);
      setIsPlaying(true);
    }
  };

  const createAnnotationMarker = async (
    timestampSeconds: number,
    title: string,
    type: 'annotation' | 'marker' = 'annotation'
  ) => {
    if (!vodId || !user) return;
    try {
      const created = await vodService.createAnnotation(vodId, timestampSeconds, title, user, type);
      setAnnotations((prev) =>
        [...prev, created].sort((a, b) => a.timestampSeconds - b.timestampSeconds)
      );
      return created;
    } catch (err: any) {
      alert(err.message || 'Error al guardar.');
    }
  };

  return {
    vod,
    annotations,
    isLoading,
    error,
    playerRef,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    seekToTimestamp,
    createAnnotationMarker,
  };
};
