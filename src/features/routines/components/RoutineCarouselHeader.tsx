import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Clock,
  ExternalLink,
  Dumbbell,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { Routine } from '../types';
import { RoutineVideoPlayer } from './RoutineVideoPlayer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface RoutineCarouselHeaderProps {
  routines: Routine[];
  currentIndex: number;
  onSelectIndex: (idx: number) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  canManage: boolean;
}

export const RoutineCarouselHeader: React.FC<RoutineCarouselHeaderProps> = ({
  routines,
  currentIndex,
  onSelectIndex,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteRoutine,
  canManage,
}) => {
  const currentRoutine = routines[currentIndex] || routines[0];

  const handlePrev = () => {
    if (routines.length === 0) return;
    onSelectIndex((currentIndex - 1 + routines.length) % routines.length);
  };

  const handleNext = () => {
    if (routines.length === 0) return;
    onSelectIndex((currentIndex + 1) % routines.length);
  };

  if (!currentRoutine) {
    return (
      <div className="bg-[#140b21] border border-[#522B80]/50 rounded-3xl p-8 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-[#522B80]/30 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E] mx-auto shadow-md">
          <Dumbbell className="w-6 h-6 text-[#E2B86E]" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-white">No hay rutinas creadas</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Aún no se ha registrado ninguna rutina de entrenamiento para el equipo.
          </p>
        </div>
        {canManage && (
          <Button
            variant="gold"
            size="sm"
            onClick={onOpenCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-lg shadow-[#E2B86E]/20"
          >
            Crear Primera Rutina
          </Button>
        )}
      </div>
    );
  }

  // Count unique categories
  const categories = Array.from(new Set(currentRoutine.exercises.map((e) => e.category)));

  return (
    <div className="relative bg-gradient-to-br from-[#180d29] via-[#1b0c30] to-[#140b21] border border-[#522B80]/60 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#26143E]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E] shadow-lg">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <Badge variant="gold" className="text-[9px] px-1.5 py-0 font-bold">
                {currentRoutine.game || 'Valorant'}
              </Badge>
              <span className="text-[10px] text-gray-400 font-mono">
                Rutina {currentIndex + 1} de {routines.length}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
              {currentRoutine.title}
            </h2>
          </div>
        </div>

        {/* Carousel Navigation Arrows & Management Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Carousel Arrows */}
          <div className="flex items-center space-x-1 bg-[#0D0914] border border-[#522B80]/60 rounded-xl p-0.5">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-[#26143E] text-gray-300 hover:text-white transition-colors"
              title="Rutina anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-[#E2B86E] px-2 select-none">
              {currentIndex + 1} / {routines.length}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-[#26143E] text-gray-300 hover:text-white transition-colors"
              title="Siguiente rutina"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Coach / CEO Actions */}
          {canManage && (
            <div className="flex items-center space-x-1.5 pl-2 border-l border-[#26143E]">
              <button
                onClick={() => onOpenEditModal(currentRoutine)}
                className="p-2 rounded-xl bg-[#140b21] hover:bg-[#26143E] border border-[#522B80]/60 text-gray-300 hover:text-[#E2B86E] transition-colors"
                title="Editar rutina"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar la rutina "${currentRoutine.title}"?`)) {
                    onDeleteRoutine(currentRoutine.id);
                  }
                }}
                className="p-2 rounded-xl bg-[#140b21] hover:bg-red-950/40 border border-[#522B80]/60 text-gray-300 hover:text-red-400 transition-colors"
                title="Eliminar rutina"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenCreateModal}
                className="py-1.5 px-3 rounded-xl bg-[#522B80] hover:bg-[#8B44F7] border border-[#E2B86E]/50 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-[#8B44F7]/20 transition-all"
                title="Crear nueva rutina"
              >
                <Plus className="w-3.5 h-3.5 text-[#E2B86E]" />
                <span className="hidden sm:inline">Nueva Rutina</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Video Player (Left) + Detailed Routine Description (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Video Player */}
        <div className="lg:col-span-6 xl:col-span-5 h-[230px] sm:h-[260px]">
          <RoutineVideoPlayer
            videoUrl={currentRoutine.videoUrl}
            title={currentRoutine.title}
          />
        </div>

        {/* Right: Detailed Description & Resources */}
        <div className="lg:col-span-6 xl:col-span-7 bg-[#0D0914] border border-[#26143E] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {currentRoutine.duration && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/40 text-[#E2B86E] border border-amber-500/40">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Duración: {currentRoutine.duration}</span>
                </span>
              )}

              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#522B80]/40 text-purple-200 border border-[#8B44F7]/40">
                <Layers className="w-3 h-3 text-[#8B44F7]" />
                <span>{currentRoutine.exercises.length} Ejercicios</span>
              </span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
              {currentRoutine.description || 'Sin descripción adicional para esta rutina.'}
            </p>

            {/* Categories Badge Preview */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Módulos de la Rutina:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#140b21] border border-[#522B80] text-[#E2B86E]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* External Links Button */}
          {currentRoutine.externalLink && (
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <a
                href={currentRoutine.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#522B80] to-[#26143E] hover:from-[#8B44F7] hover:to-[#522B80] text-white text-xs font-bold border border-[#E2B86E]/40 transition-all shadow-md group"
              >
                <span>{currentRoutine.externalLinkLabel || 'Abrir Playlist en Aimlab'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#E2B86E] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <span className="text-[10px] text-gray-500 font-mono">Enlace verificado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
