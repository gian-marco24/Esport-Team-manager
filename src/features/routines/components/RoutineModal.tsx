import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Image as ImageIcon,
  Upload,
  Loader2,
  Eye,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { Routine, RoutineExercise } from '../types';
import { Button } from '../../../components/ui/Button';
import { uploadImageToBackend } from '../../scrims-tournaments/services/uploadService';

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
  const [imageUrls, setImageUrls] = useState<string[]>(initialRoutine?.imageUrls || []);
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageTab, setImageTab] = useState<'file' | 'url'>('file');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height with min and max bounds
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextH = Math.min(Math.max(el.scrollHeight, 90), 220);
    el.style.height = `${nextH}px`;
  }, []);

  useEffect(() => {
    if (initialRoutine) {
      setTitle(initialRoutine.title || '');
      setDescription(initialRoutine.description || '');
      setVideoUrl(initialRoutine.videoUrl || '');
      setImageUrls(initialRoutine.imageUrls || []);
      setExternalLink(initialRoutine.externalLink || '');
      setExternalLinkLabel(initialRoutine.externalLinkLabel || 'Abrir Playlist / Enlace de Rutina');
      setDuration(initialRoutine.duration || '35 - 45 min');
      setGame(initialRoutine.game || 'Valorant');
      setExercises(
        initialRoutine.exercises && initialRoutine.exercises.length > 0
          ? initialRoutine.exercises
          : [
              { id: 'ex-1', category: 'GALERÍA DE TIRO', name: '200 Bots (One Taps)' },
              { id: 'ex-2', category: 'DEATHMATCH', name: 'Vandal' },
            ]
      );
    } else {
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setImageUrls([]);
      setExternalLink('');
      setExternalLinkLabel('Abrir Playlist / Enlace de Rutina');
      setDuration('35 - 45 min');
      setGame('Valorant');
      setExercises([
        { id: 'ex-1', category: 'GALERÍA DE TIRO', name: '200 Bots (One Taps)' },
        { id: 'ex-2', category: 'DEATHMATCH', name: 'Vandal' },
      ]);
    }
    setImageError(null);
    setImageUrlInput('');
    setPreviewImage(null);
  }, [initialRoutine, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        adjustTextareaHeight();
      }, 0);
    }
  }, [isOpen, description, adjustTextareaHeight]);

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

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length >= 6) {
      setImageError('Límite de 6 imágenes de configuración alcanzado.');
      return;
    }

    setIsUploadingImage(true);
    setImageError(null);

    const remainingSlots = 6 - imageUrls.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToProcess) {
        try {
          const url = await uploadImageToBackend(file);
          uploadedUrls.push(url);
        } catch {
          // Fallback to Data URL for preview if backend is offline
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                uploadedUrls.push(reader.result);
              }
              resolve();
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(file);
          });
        }
      }

      if (uploadedUrls.length > 0) {
        setImageUrls((prev) => [...prev, ...uploadedUrls]);
      }
    } catch (err: any) {
      setImageError(err?.message || 'Error al subir las imágenes.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddDirectImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;

    if (imageUrls.length >= 6) {
      setImageError('Límite de 6 imágenes de configuración alcanzado.');
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setImageError('Ingresa un enlace de imagen válido (http:// o https://).');
      return;
    }

    setImageUrls((prev) => [...prev, trimmed]);
    setImageUrlInput('');
    setImageError(null);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
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
        imageUrls: imageUrls.filter((url) => Boolean(url && url.trim())),
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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div
          className="bg-[#140b21] border border-[#522B80] rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
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
                  Configura el video, imágenes de ajustes extras, enlaces y ejercicios para el check-in.
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

              {/* Description (Auto-expanding textarea with clear limits and internal scroll) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300">Descripción Detallada</label>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {description ? `${description.split('\n').length} ${description.split('\n').length === 1 ? 'línea' : 'líneas'}` : 'Opcional'}
                  </span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    adjustTextareaHeight();
                  }}
                  placeholder="Explica el objetivo de la rutina, consejos de postura o intensidad, detalles de series o ejercicios..."
                  className="w-full min-h-[90px] max-h-[220px] bg-[#0D0914] border border-[#522B80]/60 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E2B86E] leading-relaxed resize-y overflow-y-auto font-sans whitespace-pre-wrap transition-all"
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

              {/* Configuration / Extra Settings Images Section */}
              <div className="space-y-2.5 p-3.5 bg-[#0D0914]/80 border border-[#522B80]/60 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-[#522B80]/50 text-[#E2B86E]">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Imágenes de Configuración / Ajustes Extra</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          (Opcional, {imageUrls.length}/6)
                        </span>
                      </label>
                      <p className="text-[10px] text-gray-400 leading-tight">
                        Adjunta capturas de mira, sensibilidades, configs de Aimlab o ajustes que no se ven en el video referencial.
                      </p>
                    </div>
                  </div>

                  {/* Tabs: Subir Archivo vs URL Externa */}
                  <div className="flex items-center space-x-1 bg-[#140b21] p-0.5 rounded-lg border border-[#26143E] self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setImageTab('file');
                        setImageError(null);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                        imageTab === 'file'
                          ? 'bg-[#522B80] text-white shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Subir Imagen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageTab('url');
                        setImageError(null);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                        imageTab === 'url'
                          ? 'bg-[#522B80] text-white shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Enlace URL
                    </button>
                  </div>
                </div>

                {/* Upload Error Banner */}
                {imageError && (
                  <div className="p-2.5 bg-red-950/50 border border-red-500/40 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                    <span>{imageError}</span>
                  </div>
                )}

                {/* Upload / URL Input Controls */}
                {imageUrls.length < 6 && (
                  <div>
                    {isUploadingImage ? (
                      <div className="flex items-center justify-center p-4 border border-dashed border-[#8B44F7] rounded-xl bg-[#140b21]/70 space-x-2">
                        <Loader2 className="w-4 h-4 text-[#E2B86E] animate-spin" />
                        <span className="text-xs font-semibold text-white">Subiendo y optimizando imagen...</span>
                      </div>
                    ) : imageTab === 'file' ? (
                      <label className="border border-dashed border-[#522B80]/80 hover:border-[#E2B86E] bg-[#140b21]/60 hover:bg-[#180d29] rounded-xl p-3.5 flex items-center justify-center gap-2.5 cursor-pointer transition-all group">
                        <div className="w-7 h-7 rounded-lg bg-[#522B80]/40 flex items-center justify-center text-[#E2B86E] group-hover:scale-105 transition-transform">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-gray-200 group-hover:text-white block">
                            Haz clic para seleccionar capturas de configuración
                          </span>
                          <span className="text-[10px] text-gray-400">
                            PNG, JPG, WEBP. Puedes seleccionar varios archivos a la vez.
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageFileUpload}
                          disabled={isUploadingImage}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            placeholder="https://i.imgur.com/... o https://res.cloudinary.com/..."
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddDirectImageUrl();
                              }
                            }}
                            className="w-full bg-[#140b21] border border-[#522B80]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E2B86E]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddDirectImageUrl}
                          className="px-3.5 py-2 bg-[#522B80] hover:bg-[#8B44F7] text-white text-xs font-bold rounded-xl shrink-0 transition-all flex items-center gap-1 shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#E2B86E]" />
                          <span>Agregar</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Thumbnails Gallery Preview */}
                {imageUrls.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Imágenes Adjuntas ({imageUrls.length}):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {imageUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-xl overflow-hidden border border-[#522B80] bg-[#140b21] h-24 group shadow-md flex items-center justify-center"
                        >
                          <img
                            src={url}
                            alt={`Ajuste ${idx + 1}`}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                          />

                          {/* Hover Overlay with Preview and Delete */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                            <button
                              type="button"
                              onClick={() => setPreviewImage(url)}
                              className="p-1.5 rounded-lg bg-[#522B80]/80 text-white hover:bg-[#8B44F7] transition-colors"
                              title="Ver en grande"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1.5 rounded-lg bg-red-950/80 text-red-300 hover:bg-red-900 border border-red-500/50 transition-colors"
                              title="Eliminar imagen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/80 rounded text-[9px] font-mono text-[#E2B86E] font-bold">
                            Ajuste #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

                <div className="space-y-2 max-h-56 overflow-y-auto p-1">
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
                isLoading={isSaving || isUploadingImage}
                className="flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Rutina</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal image preview zoom */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#140b21] border border-[#522B80] rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-2 border-b border-[#26143E]">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <Sparkles className="w-4 h-4 text-[#E2B86E]" />
                <span>Vista Previa de Configuración</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#26143E] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[80vh]">
              <img
                src={previewImage}
                alt="Vista Previa"
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
