import { useState, useEffect, useRef } from 'react';
import type { VodItem, VodAnnotation, VodSubItem } from '../types';
import { vodService } from '../services/vodService';
import { useAuthContext } from '../../../app/providers/AuthProvider';

export const useVodPlayer = (vodId?: string) => {
  const { user } = useAuthContext();
  const playerRef = useRef<any>(null);

  const [vod, setVod] = useState<VodItem | null>(null);
  const [activeSubVod, setActiveSubVod] = useState<VodSubItem | null>(null);
  const [activeSubVodId, setActiveSubVodId] = useState<string | null>(null);
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

        let initialSub: VodSubItem;
        if (vodData.vods && vodData.vods.length > 0) {
          // If the URL id was pointing to a specific sub-vod, pick that one; otherwise pick the first
          const foundSub = vodData.vods.find((s) => s.id === vodId);
          initialSub = foundSub || vodData.vods[0];
        } else {
          initialSub = {
            id: vodData.id,
            url: vodData.videoUrl,
            title: vodData.title,
            mapName: vodData.mapName,
            provider: vodData.provider,
            isFullMatch: true,
          };
        }

        setActiveSubVod(initialSub);
        setActiveSubVodId(initialSub.id);

        const anns = await vodService.getAnnotations(initialSub.id);
        setAnnotations(anns);
      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos del reproductor VOD.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [vodId]);

  const switchSubVod = async (newSubId: string) => {
    if (!vod) return;
    const targetSub = vod.vods?.find((s) => s.id === newSubId);
    if (!targetSub || targetSub.id === activeSubVodId) return;

    // Reset playback immediately
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(0);
    }

    setActiveSubVod(targetSub);
    setActiveSubVodId(targetSub.id);

    try {
      const anns = await vodService.getAnnotations(targetSub.id);
      setAnnotations(anns);
    } catch (err: any) {
      console.warn('Error fetching annotations on sub-vod switch:', err);
      setAnnotations([]);
    }
  };

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
    const targetId = activeSubVodId || vodId;
    if (!targetId || !user) return;
    try {
      const created = await vodService.createAnnotation(targetId, timestampSeconds, title, user, type);
      setAnnotations((prev) =>
        [...prev, created].sort((a, b) => a.timestampSeconds - b.timestampSeconds)
      );
      return created;
    } catch (err: any) {
      alert(err.message || 'Error al guardar.');
    }
  };

  const incrementAnnotationReplies = (annotationId: string) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === annotationId ? { ...a, repliesCount: (a.repliesCount || 0) + 1 } : a
      )
    );
  };

  return {
    vod,
    activeSubVod,
    activeSubVodId,
    switchSubVod,
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
    incrementAnnotationReplies,
  };
};
