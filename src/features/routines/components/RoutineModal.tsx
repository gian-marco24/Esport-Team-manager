import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Dumbbell,
  Link as LinkIcon,
  Video,
  Clock,
  Layers,
} from 'lucide-react';
import type { Routine, RoutineExercise } from '../types';
import { Button } from '../../../components/ui/Button';

interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (routineData: Partial<Routine>) => Promise<void>;
  initialRoutine?: Routine | null;
}

export const RoutineModal: React.FC<RoutineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRoutine,
}) => {
  const [title, setTitle] = useState(initialRoutine?.title || '');
  const [description, setDescription] = useState(initialRoutine?.description || '');
  const [videoUrl, setVideoUrl] = useState(initialRoutine?.videoUrl || '');
  const [externalLink, setExternalLink] = useState(initialRoutine?.externalLink || '');
  const [externalLinkLabel, setExternalLinkLabel] = useState(
    initialRoutine?.externalLinkLabel || 'Abrir Playlist / Enlace de Rutina'
  );
  const [duration, setDuration] = useState(initialRoutine?.duration || '35 - 45 min');
  const [game, setGame] = useState(initialRoutine?.game || 'Valorant');
  const [exercises, setExercises] = useState<RoutineExercise[]>(
    initialRoutine?.exercises || [
      { id: 'ex-1', category: 'GALERÍA DE TIRO', name: '200 Bots (One Taps)' },
      { id: 'ex-2', category: 'DEATHMATCH', name: 'Vandal' },
    ]
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddExercise = () => {
    const newEx: RoutineExercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category: exercises[exercises.length - 1]?.category || 'GALERÍA DE TIRO',
      name: '',
    };
    setExercises((prev) => [...prev, newEx]);
  };

  const handleUpdateExercise = (idx: number, field: keyof RoutineExercise, value: string) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleRemoveExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        id: initialRoutine?.id,
        title: title.trim(),
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        externalLink: externalLink.trim(),
        externalLinkLabel: externalLinkLabel.trim(),
        duration: duration.trim(),
        game: game.trim(),
        exercises: exercises.filter((ex) => ex.name.trim().length > 0),
      });
      onClose();
    } catch (err) {
      console.error('Error al guardar rutina:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-[#140b21] border border-[#522B80] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#180d29] via-[#26143E] to-[#180d29] border-b border-[#522B80]/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E]">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {initialRoutine ? 'Editar Rutina de Entrenamiento' : 'Crear Nueva Rutina'}
              </h3>
              <p className="text-[11px] text-gray-400">
                Configura el video explicativo, enlaces y los ejercicios para el check-in diario.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#26143E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Title & Game */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-300">Nombre de la Rutina *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Rutina de Calentamiento & Precisión (Valorant)"
                  className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E2B86E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">Juego / Categoría</label>
                <input
                  type="text"
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  placeholder="Ej: Valorant / Aimlab"
                  className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E2B86E]"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Descripción Detallada</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica el objetivo de la rutina, consejos de postura o intensidad..."
                className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E2B86E]"
              />
            </div>

            {/* Video URL & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
                  <Video className="w-3.5 h-3.5 text-[#8B44F7]" />
                  <span>Enlace del Video Demostrativo (YouTube, Twitch, MP4)</span>
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E2B86E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Duración Estimada</span>
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ej: 35 - 45 min"
                  className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E2B86E]"
                />
              </div>
            </div>

            {/* External Link (Aimlab / Playlist) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#E2B86E]" />
                  <span>Enlace Externo (Aimlab / Kovaaks / Guía)</span>
                </label>
                <input
                  type="text"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="https://aimlab.gg/..."
                  className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E2B86E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">Texto del Botón Enlace</label>
                <input
                  type="text"
                  value={externalLinkLabel}
                  onChange={(e) => setExternalLinkLabel(e.target.value)}
                  placeholder="Abrir Playlist en Aimlab"
                  className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E2B86E]"
                />
              </div>
            </div>

            {/* Exercises List Builder (For the Excel Sheet) */}
            <div className="space-y-2.5 pt-2 border-t border-[#26143E]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-[#8B44F7]" />
                  <span className="text-xs font-bold text-white">
                    Ejercicios de la Rutina (Aparecerán en el Check-in diario)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddExercise}
                  className="px-2.5 py-1 bg-[#522B80]/60 hover:bg-[#522B80] text-[#E2B86E] hover:text-white border border-[#E2B86E]/40 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Ejercicio</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                {exercises.map((ex, idx) => (
                  <div
                    key={ex.id || idx}
                    className="flex items-center gap-2 bg-[#0D0914] p-2.5 rounded-xl border border-[#26143E]"
                  >
                    <input
                      type="text"
                      value={ex.category}
                      onChange={(e) => handleUpdateExercise(idx, 'category', e.target.value.toUpperCase())}
                      placeholder="CATEGORÍA (Ej: GALERÍA DE TIRO)"
                      className="w-44 bg-[#140b21] border border-[#522B80]/60 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[#E2B86E] uppercase focus:outline-none focus:border-[#E2B86E]"
                    />

                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => handleUpdateExercise(idx, 'name', e.target.value)}
                      placeholder="Nombre del Ejercicio (Ej: 200 Bots One Taps)"
                      className="flex-1 bg-[#140b21] border border-[#522B80]/60 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#E2B86E]"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Eliminar ejercicio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-[#0D0914] border-t border-[#26143E] flex items-center justify-end space-x-2 shrink-0">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="submit"
              isLoading={isSaving}
              className="flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Rutina</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
