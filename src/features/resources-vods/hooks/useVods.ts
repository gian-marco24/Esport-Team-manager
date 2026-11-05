import { useState, useEffect } from 'react';
import type { VodItem, CreateVodFormData } from '../types';
import { vodService } from '../services/vodService';
import { useAuthContext } from '../../../app/providers/AuthProvider';

export const useVods = (pageSize: number = 9) => {
  const [vods, setVods] = useState<VodItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [limitCount, setLimitCount] = useState<number>(pageSize);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const fetchVods = async (count: number, isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    try {
      const res = await vodService.getVods(count);
      setVods(res.vods);
      setHasMore(res.hasMore);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las VODs.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchVods(limitCount, true);
  }, []);

  const loadMore = () => {
    const next = limitCount + pageSize;
    setLimitCount(next);
    fetchVods(next, false);
  };

  const addVod = async (data: CreateVodFormData) => {
    try {
      const created = await vodService.createVod(data, user || undefined);
      setVods((prev) => {
        const next = [created, ...prev];
        return next.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.matchDate || 0).getTime();
          const timeB = new Date(b.createdAt || b.matchDate || 0).getTime();
          return timeB - timeA;
        });
      });
      return created;
    } catch (err: any) {
      throw new Error(err.message || 'Error al guardar la VOD.');
    }
  };

  const removeVod = async (id: string) => {
    try {
      await vodService.deleteVod(id);
      setVods((prev) => prev.filter((v) => v.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la VOD.');
    }
  };

  return {
    vods,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error,
    refetch: () => fetchVods(limitCount, true),
    addVod,
    removeVod,
  };
};
