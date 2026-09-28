import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Pin,
  Trash2,
  Edit3,
  Search,
  Clock,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import type { PersonalNote } from '../types';
import { usePersonalNotes } from '../hooks/usePersonalNotes';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { Button } from '../../../components/ui/Button';

const COLOR_CLASSES: Record<PersonalNote['color'], { bg: string; border: string; accent: string }> = {
  purple: {
    bg: 'bg-[#180d29]',
    border: 'border-[#522B80]',
    accent: 'text-[#8B44F7]',
  },
  gold: {
    bg: 'bg-amber-950/20',
    border: 'border-amber-500/40',
    accent: 'text-[#E2B86E]',
  },
  emerald: {
    bg: 'bg-emerald-950/20',
    border: 'border-emerald-500/40',
    accent: 'text-emerald-400',
  },
  rose: {
    bg: 'bg-rose-950/20',
    border: 'border-rose-500/40',
    accent: 'text-rose-400',
  },
  blue: {
    bg: 'bg-cyan-950/20',
    border: 'border-cyan-500/40',
    accent: 'text-cyan-400',
  },
};

const SUGGESTED_TAGS = ['General', 'Mecánicas', 'Mentalidad', 'Rutina', 'Estrategia', 'Aim & Warmup'];

export const PersonalNotesBlock: React.FC = () => {
  const { user } = useAuthContext();
  const {
    notes,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedTag,
    setSelectedTag,
    saveNote,
    deleteNote,
  } = usePersonalNotes(user?.id);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formColor, setFormColor] = useState<PersonalNote['color']>('purple');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openCreateModal = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormColor('purple');
    setFormTags(['General']);
    setFormIsPinned(false);
    setIsModalOpen(true);
  };

  const openEditModal = (note: PersonalNote) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormColor(note.color);
    setFormTags(note.tags);
    setFormIsPinned(note.isPinned);
    setIsModalOpen(true);
  };

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !formTags.includes(trimmed)) {
      setFormTags([...formTags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags(formTags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setIsSaving(true);
    try {
      await saveNote({
        id: editingNote?.id,
        title: formTitle.trim(),
        content: formContent.trim(),
        color: formColor,
        tags: formTags,
        isPinned: formIsPinned,
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-5 shadow-xl space-y-4 min-h-[580px] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#26143E] shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-wide">
              Mis Anotaciones Personales
            </h3>
            <p className="text-xs text-gray-400">
              Bloc privado de notas, rutinas, recordatorios y apuntes confidenciales.
            </p>
          </div>
        </div>

        <Button
          onClick={openCreateModal}
          variant="secondary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nueva Nota
        </Button>
      </div>

      {/* Controls Bar: Search & Tags */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar en mis notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#180d29] border border-[#522B80]/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#8B44F7]"
          />
        </div>

        {selectedTag && (
          <button
            onClick={() => setSelectedTag(null)}
            className="px-2.5 py-1 bg-[#522B80] text-[#E2B86E] border border-[#E2B86E]/40 rounded-lg text-xs font-semibold flex items-center space-x-1"
          >
            <span>Tag: {selectedTag}</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Notes Grid Scrollable */}
      {isLoading ? (
        <div className="flex-1 min-h-[360px] flex items-center justify-center text-xs text-gray-400">
          Cargando tus notas...
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center text-center text-gray-500 space-y-2 border border-dashed border-[#26143E] rounded-xl p-6">
          <Sparkles className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-xs text-gray-400 font-medium">No tienes notas personales todavía.</p>
          <p className="text-[11px] max-w-xs text-gray-500">
            Crea tu primera anotación privada para registrar análisis tácticos, rutinas de calentamiento o ideas.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-[360px] max-h-[500px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pr-1 content-start">
          {sortedNotes.map((note) => {
            const colors = COLOR_CLASSES[note.color] || COLOR_CLASSES.purple;

            return (
              <div
                key={note.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-lg h-56 ${colors.bg} ${colors.border} ${
                  note.isPinned ? 'ring-1 ring-amber-500/50' : ''
                }`}
              >
                <div className="space-y-2 overflow-hidden flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-white leading-snug break-words flex items-center space-x-1.5 truncate">
                      {note.isPinned && <Pin className="w-3 h-3 text-amber-400 fill-current shrink-0" />}
                      <span className="truncate">{note.title}</span>
                    </h4>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => openEditModal(note)}
                        className="p-1 text-gray-400 hover:text-white rounded hover:bg-black/30 transition-colors"
                        title="Editar nota"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Deseas eliminar esta nota?')) deleteNote(note.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-400 rounded hover:bg-red-950/40 transition-colors"
                        title="Eliminar nota"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-28 pr-1">
                    {note.content}
                  </p>
                </div>

                {/* Footer with tags and date */}
                <div className="pt-2 mt-2 border-t border-white/5 space-y-1.5 shrink-0">
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedTag(t)}
                          className="px-1.5 py-0.5 bg-black/40 rounded text-[9px] font-semibold text-gray-300 hover:text-white hover:bg-black/60 transition-colors"
                        >
                          #{t}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{new Date(note.createdAt).toLocaleDateString('es-ES')}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#140b21] border border-[#522B80] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#1d0f30] border-b border-[#26143E] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {editingNote ? 'Editar Nota Personal' : 'Nueva Nota Personal'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Título de la Nota</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Rutina de calentamiento en The Range..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#180d29] border border-[#522B80]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B44F7]"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Contenido / Apunte</label>
                <textarea
                  rows={5}
                  placeholder="Escribe tus apuntes, rutinas, enlaces o tácticas personales..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-[#180d29] border border-[#522B80]/60 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#8B44F7] resize-none"
                />
              </div>

              {/* Color Palette Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Color de Tarjeta</label>
                <div className="flex items-center space-x-2">
                  {(['purple', 'gold', 'emerald', 'rose', 'blue'] as PersonalNote['color'][]).map(
                    (colorKey) => (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => setFormColor(colorKey)}
                        className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                          colorKey === 'purple'
                            ? 'bg-[#8B44F7]'
                            : colorKey === 'gold'
                            ? 'bg-[#E2B86E]'
                            : colorKey === 'emerald'
                            ? 'bg-emerald-500'
                            : colorKey === 'rose'
                            ? 'bg-rose-500'
                            : 'bg-cyan-500'
                        } ${formColor === colorKey ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        {formColor === colorKey && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Tags Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Etiquetas</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SUGGESTED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                        formTags.includes(tag)
                          ? 'bg-[#8B44F7] text-white border-[#E2B86E]'
                          : 'bg-[#180d29] text-gray-400 border-[#26143E] hover:text-white'
                      }`}
                    >
                      +{tag}
                    </button>
                  ))}
                </div>

                {/* Selected Tags Display with Remove */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#180d29] rounded-xl border border-[#522B80]/40">
                  {formTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#522B80] rounded text-[10px] text-[#E2B86E] font-bold"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-white hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <input
                    type="text"
                    placeholder="Escribe y presiona Enter..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(newTagInput);
                      }
                    }}
                    className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 focus:outline-none min-w-[120px]"
                  />
                </div>
              </div>

              {/* Pin Note Checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheckbox"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="rounded border-[#522B80] text-[#8B44F7] focus:ring-0 bg-[#180d29]"
                />
                <label
                  htmlFor="pinCheckbox"
                  className="text-xs text-gray-300 font-semibold cursor-pointer flex items-center space-x-1"
                >
                  <Pin className="w-3 h-3 text-amber-400" />
                  <span>Fijar esta nota arriba</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex justify-end space-x-2 border-t border-[#26143E]">
                <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="secondary" type="submit" isLoading={isSaving}>
                  Guardar Nota
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
