import React, { useState, useEffect } from 'react';
import { Bookmark, MessageSquare, X, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface AddAnnotationModalProps {
  isOpen: boolean;
  timestampSeconds: number;
  initialType?: 'annotation' | 'marker';
  onClose: () => void;
  onSubmit: (title: string, type: 'annotation' | 'marker', timestampSeconds?: number) => Promise<void> | void;
}

export const AddAnnotationModal: React.FC<AddAnnotationModalProps> = ({
  isOpen,
  timestampSeconds,
  initialType = 'marker',
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<'annotation' | 'marker'>(initialType);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState<number>(0);
  const [secs, setSecs] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setType(initialType);
    const m = Math.floor(timestampSeconds / 60);
    const s = Math.floor(timestampSeconds % 60);
    setMinutes(m);
    setSecs(s);
  }, [initialType, isOpen, timestampSeconds]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    const finalTimestamp = minutes * 60 + secs;
    setIsSubmitting(true);
    try {
      await onSubmit(title.trim(), type, finalTimestamp);
      setTitle('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#140b21] border border-[#8B44F7]/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#26143E] pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#522B80] border border-[#E2B86E]/40 flex items-center justify-center text-[#E2B86E]">
              {type === 'marker' ? <Bookmark className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {type === 'marker' ? 'Nuevo Marcador Rápido' : 'Nueva Anotación Táctica'}
              </h3>
              <p className="text-[11px] text-gray-400">
                Ajusta el minuto exacto o déjalo según el reproductor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-[#26143E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#0D0914] rounded-xl border border-[#26143E]">
          <button
            type="button"
            onClick={() => setType('marker')}
            className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              type === 'marker'
                ? 'bg-[#522B80] text-white shadow border border-[#8B44F7]/60'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-[#E2B86E]" />
            <span>Marcador (Punto)</span>
          </button>

          <button
            type="button"
            onClick={() => setType('annotation')}
            className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              type === 'annotation'
                ? 'bg-[#522B80] text-white shadow border border-[#8B44F7]/60'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#8B44F7]" />
            <span>Anotación (Hilo)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Timestamp Fine-Tuner Inputs */}
          <div className="p-3 bg-[#0D0914] border border-[#26143E] rounded-xl flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase text-gray-300">Minuto / Segundo:</span>
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-14 bg-[#180d29] border border-[#522B80]/60 rounded-lg py-1 px-2 text-center text-xs font-mono font-bold text-[#E2B86E] focus:outline-none focus:border-[#8B44F7]"
                />
                <span className="text-xs text-gray-400">m</span>
              </div>
              <span className="text-xs font-bold text-gray-500">:</span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={secs}
                  onChange={(e) => setSecs(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-14 bg-[#180d29] border border-[#522B80]/60 rounded-lg py-1 px-2 text-center text-xs font-mono font-bold text-[#E2B86E] focus:outline-none focus:border-[#8B44F7]"
                />
                <span className="text-xs text-gray-400">s</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
              {type === 'marker' ? 'Referencia / Nota del Marcador' : 'Título de la Anotación / Análisis'}
            </label>
            <textarea
              rows={3}
              required
              autoFocus
              placeholder={
                type === 'marker'
                  ? 'ej. Posicionamiento del viper, uso de utilería...'
                  : 'ej. ¿Por qué rotamos tarde a B? Análisis de la ronda 5'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-xl p-3 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#8B44F7] focus:ring-1 focus:ring-[#8B44F7]"
            />
            <p className="text-[10px] text-gray-400 italic">
              {type === 'marker'
                ? 'El marcador aparecerá como un punto en la línea de tiempo y su nota se verá al pasar el cursor.'
                : 'La anotación creará un hilo de discusión en la lista de la derecha.'}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {type === 'marker' ? 'Guardar Marcador' : 'Guardar Anotación'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
