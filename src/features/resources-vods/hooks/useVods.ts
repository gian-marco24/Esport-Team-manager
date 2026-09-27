import { useState, useEffect } from 'react';
import type { VodItem, CreateVodFormData } from '../types';
import { vodService } from '../services/vodService';
import { useAuthContext } from '../../../app/providers/AuthProvider';

export const useVods = () => {
  const [vods, setVods] = useState<VodItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const fetchVods = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vodService.getVods();
      setVods(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las VODs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVods();
  }, []);

  const addVod = async (data: CreateVodFormData) => {
    try {
      const created = await vodService.createVod(data, user || undefined);
      setVods((prev) => [created, ...prev]);
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
    error,
    refetch: fetchVods,
    addVod,
    removeVod,
  };
};
