import React, { useState } from 'react';
import { Video, X, Plus } from 'lucide-react';
import { VALORANT_MAP_ROTATION } from '../../scrims-tournaments/types';
import type { CreateVodFormData } from '../types';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';

interface AddVodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVodFormData) => Promise<void>;
}

export const AddVodModal: React.FC<AddVodModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [mapName, setMapName] = useState<string>(VALORANT_MAP_ROTATION[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      setError('Ingresa el título y la URL del video.');
      return;
    }

    try {
      new URL(videoUrl.trim());
    } catch {
      setError('La URL ingresada no es válida.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        opponentName: opponentName.trim() || undefined,
        mapName,
      });
      setTitle('');
      setVideoUrl('');
      setOpponentName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la VOD.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#140b21] border border-[#8B44F7]/40 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#26143E] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-lg bg-[#522B80] border border-[#E2B86E]/40 flex items-center justify-center text-[#E2B86E]">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Agregar VOD de Estudio</h3>
              <p className="text-xs text-gray-400">YouTube, Twitch, Google Drive o enlaces MP4</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <Input
          label="Título de la VOD / Partido"
          placeholder="ej. Análisis Táctico Haven - URS Gamara vs KRÜ"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Input
          label="URL del Video"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Equipo Rival (Opcional)"
            placeholder="ej. KRÜ Esports"
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
          />

          <Select
            label="Mapa (Opcional)"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
          >
            {VALORANT_MAP_ROTATION.map((m: string) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-[#26143E]">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="secondary" size="sm" isLoading={isSubmitting} leftIcon={<Plus className="w-4 h-4" />}>
            Guardar VOD
          </Button>
        </div>
      </form>
    </div>
  );
};
