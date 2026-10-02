import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Clock,
  ExternalLink,
  Dumbbell,
  Layers,
  Image as ImageIcon,
  Maximize2,
  X,
  Sparkles,
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
  const [selectedLightboxIndex, setSelectedLightboxIndex] = useState<number | null>(null);
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
  const images = currentRoutine.imageUrls || [];

  const handleLightboxPrev = () => {
    if (selectedLightboxIndex === null || images.length <= 1) return;
    setSelectedLightboxIndex((selectedLightboxIndex - 1 + images.length) % images.length);
  };

  const handleLightboxNext = () => {
    if (selectedLightboxIndex === null || images.length <= 1) return;
    setSelectedLightboxIndex((selectedLightboxIndex + 1) % images.length);
  };

  return (
    <>
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

        {/* Grid: Video Player (Left) + Detailed Routine Description & Adjustments (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          {/* Left: Video Player */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col h-full min-h-[280px]">
            <RoutineVideoPlayer
              videoUrl={currentRoutine.videoUrl}
              title={currentRoutine.title}
            />
          </div>

          {/* Right: Detailed Description, Extra Config Images & Resources */}
          <div className="lg:col-span-7 xl:col-span-7 bg-[#0D0914] border border-[#26143E] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 h-full">
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

                {images.length > 0 && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8B44F7]/20 text-[#E2B86E] border border-[#8B44F7]/50">
                    <ImageIcon className="w-3 h-3" />
                    <span>{images.length} {images.length === 1 ? 'Ajuste Extra' : 'Ajustes Extras'}</span>
                  </span>
                )}
              </div>

              {/* Description (Preserves multiline breaks and scrolls smoothly if extensive) */}
              {currentRoutine.description ? (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Instrucciones & Detalle:
                  </span>
                  <div className="max-h-40 sm:max-h-48 overflow-y-auto pr-2 rounded-xl bg-[#140b21]/70 border border-[#26143E] p-3 text-xs sm:text-sm text-gray-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {currentRoutine.description}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic font-sans">
                  Sin descripción adicional para esta rutina.
                </p>
              )}

              {/* Extra Configuration / Adjustments Images Preview Strip */}
              {images.length > 0 && (
                <div className="space-y-1.5 pt-1.5 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#E2B86E] uppercase tracking-wider flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>Ajustes / Configuración Extra ({images.length}):</span>
                    </span>
                    <span className="text-[10px] text-gray-400">Clic para ampliar imagen</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedLightboxIndex(idx)}
                        className="group relative h-16 sm:h-18 rounded-xl overflow-hidden border border-[#522B80]/80 hover:border-[#E2B86E] cursor-pointer bg-[#140b21] transition-all shadow-md hover:scale-[1.03]"
                        title="Ver ajuste en tamaño completo"
                      >
                        <img
                          src={imgUrl}
                          alt={`Ajuste ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:brightness-110 transition-all"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                          <Maximize2 className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                        </div>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.2 bg-black/80 rounded text-[9px] font-mono text-[#E2B86E] font-bold">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

      {/* Lightbox Modal for Config Images */}
      {selectedLightboxIndex !== null && images[selectedLightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedLightboxIndex(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[92vh] bg-[#140b21] border border-[#522B80] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="p-4 bg-[#180d29] border-b border-[#26143E] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {currentRoutine.title} - Ajuste #{selectedLightboxIndex + 1}
                  </h4>
                  <p className="text-[10px] text-gray-400">
                    Imagen de configuración / ajuste extra ({selectedLightboxIndex + 1} de {images.length})
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={images[selectedLightboxIndex]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-[#0D0914] text-gray-300 hover:text-white border border-[#522B80]/60 transition-colors flex items-center gap-1 text-xs"
                  title="Abrir imagen en pestaña nueva"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedLightboxIndex(null)}
                  className="p-2 rounded-xl bg-[#0D0914] text-gray-300 hover:text-white border border-[#522B80]/60 transition-colors"
                  title="Cerrar visor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Stage with Next/Prev navigation */}
            <div className="relative flex-1 bg-[#090510] flex items-center justify-center p-4 overflow-hidden min-h-[300px]">
              {images.length > 1 && (
                <button
                  onClick={handleLightboxPrev}
                  className="absolute left-4 z-10 p-2.5 rounded-full bg-black/70 hover:bg-[#522B80] text-white border border-white/20 transition-all shadow-xl backdrop-blur-sm"
                  title="Imagen anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <img
                src={images[selectedLightboxIndex]}
                alt={`Ajuste ${selectedLightboxIndex + 1}`}
                className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl select-none"
              />

              {images.length > 1 && (
                <button
                  onClick={handleLightboxNext}
                  className="absolute right-4 z-10 p-2.5 rounded-full bg-black/70 hover:bg-[#522B80] text-white border border-white/20 transition-all shadow-xl backdrop-blur-sm"
                  title="Imagen siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Lightbox Footer */}
            <div className="p-3 bg-[#0D0914] border-t border-[#26143E] flex items-center justify-between text-xs text-gray-400 shrink-0">
              <span className="text-[11px] font-mono text-[#E2B86E]">
                Configuración / Ajuste complementario al video tutorial
              </span>
              <span className="font-mono text-gray-400">
                {selectedLightboxIndex + 1} / {images.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
