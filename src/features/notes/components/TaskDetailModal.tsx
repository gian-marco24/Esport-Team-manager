import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Calendar,
  Link as LinkIcon,
  FileText,
  Save,
  Check,
  ExternalLink,
  Tag,
  Sparkles,
  AlertCircle,
  Copy,
  CheckCheck,
  Eye,
  Edit3,
} from 'lucide-react';
import type { TacticalTask } from '../types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { MarkdownContent } from '../utils/markdownRenderer';
import { formatDeadlineDisplay } from '../utils/dateHelpers';

interface TaskDetailModalProps {
  task: TacticalTask | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<TacticalTask>) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [annotations, setAnnotations] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);

  useEffect(() => {
    if (task) {
      setAnnotations(task.annotations || '');
      setActiveTab('edit');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSaveAnnotations = async () => {
    setIsSaving(true);
    try {
      await onUpdateTask(task.id, { annotations });
      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 2500);
    } catch (err) {
      console.error('Error al guardar anotaciones:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: TacticalTask['status']) => {
    try {
      await onUpdateTask(task.id, { status: newStatus });
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  const handleInsertHelper = (textToInsert: string) => {
    setActiveTab('edit');
    setAnnotations((prev) => prev + (prev ? '\n' : '') + textToInsert);
  };

  const copyMaterials = () => {
    if (task.materials) {
      navigator.clipboard.writeText(task.materials);
      setHasCopiedUrl(true);
      setTimeout(() => setHasCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-[#140b21] border border-[#522B80] rounded-3xl w-full max-w-4xl h-[86vh] max-h-[880px] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Fixed) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#180d29] via-[#26143E] to-[#180d29] border-b border-[#522B80]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#522B80] text-[#E2B86E] border border-[#E2B86E]/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Tarea / Análisis Asignado
              </span>

              {/* Status Switcher Buttons */}
              <div className="inline-flex rounded-xl p-0.5 bg-[#0D0914] border border-[#522B80]">
                <button
                  onClick={() => handleStatusChange('pending')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    task.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Pendiente
                </button>
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    task.status === 'in_progress'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  En Progreso
                </button>
                <button
                  onClick={() => handleStatusChange('completed')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    task.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  ✓ Completada
                </button>
              </div>

              {task.deadline && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/40 text-[#E2B86E] border border-amber-500/40 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  Entrega: {formatDeadlineDisplay(task.deadline)}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-black text-white tracking-wide truncate">
              {task.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#26143E] border border-transparent hover:border-[#522B80] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Top Info Grid + Full Remaining Height Anotaciones */}
        <div className="flex-1 flex flex-col p-4 sm:p-5 gap-3.5 overflow-y-auto min-h-0">
          {/* Top Info Grid (Compact) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
            {/* Left: Requisitos / Detalles */}
            <div className="md:col-span-7 bg-[#0D0914] border border-[#26143E] rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-300">
                <FileText className="w-3.5 h-3.5 text-[#8B44F7]" />
                <span>Requisito & Objetivos de la Tarea</span>
              </div>
              <div className="text-xs text-gray-200 font-sans leading-relaxed bg-[#140b21]/70 p-2.5 rounded-xl border border-[#522B80]/40 max-h-24 overflow-y-auto">
                <MarkdownContent content={task.title + (task.description ? `\n\n${task.description}` : '')} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>Asignado por: <strong className="text-gray-200">{task.authorName}</strong></span>
                <span>Creado: {new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Right: Materiales & Recursos */}
            <div className="md:col-span-5 bg-[#0D0914] border border-[#26143E] rounded-2xl p-3.5 flex flex-col justify-between space-y-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-300">
                    <LinkIcon className="w-3.5 h-3.5 text-[#E2B86E]" />
                    <span>Materiales & Recursos (VOD)</span>
                  </div>
                  {task.materials && (
                    <button
                      onClick={copyMaterials}
                      className="text-[10px] text-gray-400 hover:text-[#E2B86E] flex items-center gap-1 transition-colors"
                      title="Copiar enlace"
                    >
                      {hasCopiedUrl ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{hasCopiedUrl ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  )}
                </div>

                {task.materials ? (
                  <div className="bg-[#140b21]/70 p-2.5 rounded-xl border border-[#522B80]/40 space-y-1 text-xs max-h-20 overflow-y-auto">
                    <MarkdownContent content={task.materials} />
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic p-2.5 bg-[#140b21]/40 rounded-xl border border-[#26143E]">
                    No se adjuntaron enlaces o materiales específicos.
                  </p>
                )}
              </div>

              {task.deadline && (
                <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center space-x-2 text-xs text-amber-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Plazo de entrega: <strong className="text-white">{formatDeadlineDisplay(task.deadline)}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section: Anotaciones Block that fills remaining space and scrolls internally */}
          <div className="flex-1 flex flex-col min-h-[280px] bg-[#0D0914] border border-[#522B80]/80 rounded-2xl p-3 sm:p-4 gap-2 shadow-inner overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-[#26143E] shrink-0">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center space-x-2">
                  <span>Anotaciones & Análisis de la Tarea / VOD</span>
                  <Badge variant="gold" className="text-[8.5px] px-1.5 py-0 font-bold">
                    Libreta Amplia
                  </Badge>
                </h3>
              </div>

              {/* View Mode Toggle & Format Helpers */}
              <div className="flex items-center flex-wrap gap-1.5">
                {/* Switcher [Editar] / [Vista Previa] */}
                <div className="inline-flex rounded-lg p-0.5 bg-[#140b21] border border-[#522B80]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                      activeTab === 'edit'
                        ? 'bg-[#522B80] text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                      activeTab === 'preview'
                        ? 'bg-[#8B44F7] text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Eye className="w-2.5 h-2.5 text-[#E2B86E]" />
                    <span>Vista Previa</span>
                  </button>
                </div>

                {/* Helpers (only active in edit mode) */}
                {activeTab === 'edit' && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleInsertHelper('**Ronda 1:** ')}
                      className="px-2 py-0.5 bg-[#180d29] hover:bg-[#26143E] border border-[#522B80] rounded text-[9.5px] text-gray-300 hover:text-white transition-all font-mono"
                    >
                      + Ronda
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertHelper('> Conclusión táctica: ')}
                      className="px-2 py-0.5 bg-[#180d29] hover:bg-[#26143E] border border-[#522B80] rounded text-[9.5px] text-[#E2B86E] hover:text-white transition-all font-mono"
                    >
                      + Conclusión
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertHelper('[00:00] Timemark: ')}
                      className="px-2 py-0.5 bg-[#180d29] hover:bg-[#26143E] border border-[#522B80] rounded text-[9.5px] text-purple-300 hover:text-white transition-all font-mono"
                    >
                      + Minuto VOD
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Editor or Markdown Preview replacing the area */}
            {activeTab === 'edit' ? (
              <textarea
                value={annotations}
                onChange={(e) => setAnnotations(e.target.value)}
                placeholder="Escribe aquí el análisis completo de la VOD o tarea... (Soporta múltiples líneas, saltos, listas y formato)."
                className="flex-1 w-full p-3.5 bg-[#140b21] border border-[#522B80]/70 rounded-xl text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#E2B86E] focus:ring-1 focus:ring-[#E2B86E]/40 font-sans leading-relaxed resize-none overflow-y-auto"
              />
            ) : (
              <div className="flex-1 w-full p-3.5 bg-[#140b21] border border-[#522B80]/70 rounded-xl overflow-y-auto select-text">
                {annotations.trim().length > 0 ? (
                  <MarkdownContent content={annotations} />
                ) : (
                  <p className="text-xs text-gray-500 italic p-4 text-center">
                    No has escrito anotaciones todavía. Cambia a la pestaña "Editar" para redactar tu análisis.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions (Fixed) */}
        <div className="p-3.5 sm:p-4 bg-[#0D0914] border-t border-[#26143E] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            {onDeleteTask && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Estás seguro de eliminar esta tarea?')) {
                    onDeleteTask(task.id);
                    onClose();
                  }
                }}
                className="text-xs text-red-400 hover:text-red-300 hover:underline px-2 py-1"
              >
                Eliminar Tarea
              </button>
            )}
            {showSavedFeedback && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" />
                ¡Anotaciones guardadas correctamente!
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              isLoading={isSaving}
              onClick={handleSaveAnnotations}
              className="flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Anotaciones</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
