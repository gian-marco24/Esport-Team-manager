import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  Calendar,
  Link as LinkIcon,
  FileText,
  Save,
  Check,
  Sparkles,
  Copy,
  CheckCheck,
  Eye,
  Edit3,
  UserCheck,
  Users,
} from 'lucide-react';
import type { TacticalTask } from '../types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { MarkdownContent } from '../utils/markdownRenderer';
import { buildDeadlineString, formatDeadlineDisplay } from '../utils/dateHelpers';

interface TaskDetailModalProps {
  task: TacticalTask | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<TacticalTask>) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  peerUser?: { id: string; displayName: string; role?: string; avatarUrl?: string };
  currentUser?: { id: string; displayName: string } | null;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  onDeleteTask,
  peerUser: _peerUser,
  currentUser,
}) => {
  const [annotations, setAnnotations] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);

  // Requirements / Metadata editing mode
  const [isEditingRequirements, setIsEditingRequirements] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqMaterials, setReqMaterials] = useState('');
  const [reqDeadlineDate, setReqDeadlineDate] = useState('');
  const [reqDeadlineTime, setReqDeadlineTime] = useState('18:00');
  const [reqIncludeTime, setReqIncludeTime] = useState(false);
  const [reqPriority, setReqPriority] = useState<TacticalTask['priority']>('medium');
  const [isSavingRequirements, setIsSavingRequirements] = useState(false);

  // Determine if current user can edit the annotations / resolution
  const canEditAnnotations = useMemo(() => {
    if (!task) return false;
    if (!currentUser) return true;

    // Assigned to both
    if (
      task.assignedScope === 'both' ||
      task.assignedToName === 'Ambos integrantes' ||
      task.assignedToName?.toLowerCase().includes('ambos')
    ) {
      return true;
    }

    // Explicit assigneeIds list
    if (task.assigneeIds && task.assigneeIds.length > 0) {
      return task.assigneeIds.includes(currentUser.id);
    }

    // Assigned to self (only author)
    if (task.assignedScope === 'self') {
      return task.authorId === currentUser.id;
    }

    // Assigned to peer
    if (task.assignedScope === 'peer') {
      if (task.assignedToId) {
        return task.assignedToId === currentUser.id;
      }
      return task.authorId !== currentUser.id;
    }

    // Direct ID match
    if (task.assignedToId) {
      return task.assignedToId === currentUser.id;
    }

    // Legacy default
    return true;
  }, [task, currentUser]);

  useEffect(() => {
    if (task) {
      setAnnotations(task.annotations || '');
      setReqTitle(task.title || '');
      setReqMaterials(task.materials || '');
      setReqPriority(task.priority || 'medium');
      setIsEditingRequirements(false);

      if (!canEditAnnotations) {
        setActiveTab('preview');
      } else {
        setActiveTab('edit');
      }
    }
  }, [task, canEditAnnotations]);

  if (!isOpen || !task) return null;

  const handleSaveAnnotations = async () => {
    if (!canEditAnnotations) return;
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

  const handleSaveRequirements = async () => {
    if (!reqTitle.trim()) return;
    setIsSavingRequirements(true);
    try {
      const resolvedDeadline = reqDeadlineDate
        ? buildDeadlineString(reqDeadlineDate, reqDeadlineTime, reqIncludeTime)
        : task.deadline;

      await onUpdateTask(task.id, {
        title: reqTitle.trim(),
        materials: reqMaterials.trim(),
        deadline: resolvedDeadline,
        priority: reqPriority,
      });
      setIsEditingRequirements(false);
    } catch (err) {
      console.error('Error al actualizar requisitos:', err);
    } finally {
      setIsSavingRequirements(false);
    }
  };

  const handleInsertHelper = (textToInsert: string) => {
    if (!canEditAnnotations) return;
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

  const assigneeDisplay =
    task.assignedToName ||
    (task.assignedScope === 'both'
      ? 'Ambos integrantes'
      : task.assignedScope === 'self'
      ? task.authorName
      : 'Asignado');

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
                Tarea / Análisis
              </span>

              {/* Assignment Pill */}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#26143E] text-white border border-[#8B44F7]/40 flex items-center gap-1">
                {task.assignedScope === 'both' ? (
                  <Users className="w-3 h-3 text-[#E2B86E]" />
                ) : (
                  <UserCheck className="w-3 h-3 text-[#E2B86E]" />
                )}
                <span>Asignado a: <strong className="text-[#E2B86E]">{assigneeDisplay}</strong></span>
              </span>

              {/* Status Switcher Buttons (Available for both users) */}
              <div className="inline-flex rounded-xl p-0.5 bg-[#0D0914] border border-[#522B80]">
                <button
                  type="button"
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
                  type="button"
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
                  type="button"
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

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditingRequirements(!isEditingRequirements)}
              className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isEditingRequirements
                  ? 'bg-[#E2B86E] text-black border-[#E2B86E]'
                  : 'bg-[#180d29] text-gray-300 border-[#522B80]/60 hover:bg-[#26143E] hover:text-white'
              }`}
              title="Modificar requisitos, VOD link o fecha límite"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEditingRequirements ? 'Cancelar Edición' : 'Editar Requisitos / Plazo'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#26143E] border border-transparent hover:border-[#522B80] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col p-4 sm:p-5 gap-3.5 overflow-y-auto min-h-0">
          {/* Requirements Editor (Toggled Mode) */}
          {isEditingRequirements ? (
            <div className="p-4 bg-[#0D0914] border border-[#E2B86E]/50 rounded-2xl space-y-3 shrink-0 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#26143E] pb-2">
                <span className="text-xs font-black text-[#E2B86E] flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar Requisitos, Enlaces y Plazo de la Tarea
                </span>
                <span className="text-[10px] text-gray-400">Editable por ambos integrantes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-7 space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300">Requisito u Objetivo *</label>
                  <textarea
                    rows={2}
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    className="w-full bg-[#140b21] border border-[#522B80]/60 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#E2B86E]"
                  />
                </div>
                <div className="md:col-span-5 space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-300">Materiales / Enlaces VOD</label>
                    <input
                      type="text"
                      value={reqMaterials}
                      onChange={(e) => setReqMaterials(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#140b21] border border-[#522B80]/60 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#E2B86E]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={reqDeadlineDate}
                        onChange={(e) => setReqDeadlineDate(e.target.value)}
                        className="flex-1 bg-[#140b21] border border-[#522B80]/60 rounded-xl px-2 py-1 text-xs text-white focus:outline-none focus:border-[#E2B86E]"
                      />
                      <select
                        value={reqPriority}
                        onChange={(e) => setReqPriority(e.target.value as any)}
                        className="bg-[#140b21] border border-[#522B80]/60 rounded-xl px-2 py-1 text-xs text-white focus:outline-none focus:border-[#E2B86E]"
                      >
                        <option value="high">Alta</option>
                        <option value="medium">Media</option>
                        <option value="low">Baja</option>
                      </select>
                    </div>

                    {reqDeadlineDate && (
                      <div className="flex items-center space-x-2 pt-1 text-[11px] text-gray-300">
                        <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={reqIncludeTime}
                            onChange={(e) => setReqIncludeTime(e.target.checked)}
                            className="rounded border-[#522B80] text-[#E2B86E] focus:ring-0 focus:ring-offset-0 bg-[#140b21]"
                          />
                          <span>Hora límite</span>
                        </label>
                        {reqIncludeTime && (
                          <input
                            type="time"
                            value={reqDeadlineTime}
                            onChange={(e) => setReqDeadlineTime(e.target.value)}
                            className="bg-[#140b21] border border-[#522B80]/60 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#E2B86E]"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#26143E]">
                <Button variant="outline" size="sm" onClick={() => setIsEditingRequirements(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isSavingRequirements}
                  onClick={handleSaveRequirements}
                >
                  Guardar Requisitos
                </Button>
              </div>
            </div>
          ) : (
            /* Top Info Grid (Compact) */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
              {/* Left: Requisitos / Detalles */}
              <div className="md:col-span-7 bg-[#0D0914] border border-[#26143E] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-300">
                    <FileText className="w-3.5 h-3.5 text-[#8B44F7]" />
                    <span>Requisito & Objetivos de la Tarea</span>
                  </div>
                  <Badge variant="purple" className="text-[9px] px-1.5 py-0 font-bold">
                    Prioridad: {task.priority || 'Media'}
                  </Badge>
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
          )}

          {/* Bottom Section: Anotaciones Block that fills remaining space and scrolls internally */}
          <div className="flex-1 flex flex-col min-h-[280px] bg-[#0D0914] border border-[#522B80]/80 rounded-2xl p-3 sm:p-4 gap-2 shadow-inner overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-[#26143E] shrink-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center space-x-2">
                  <span>Anotaciones & Análisis de la Tarea / VOD</span>
                  <Badge variant="gold" className="text-[8.5px] px-1.5 py-0 font-bold">
                    Libreta Amplia
                  </Badge>
                </h3>
              </div>

              {/* View Mode Toggle & Format Helpers (If allowed to edit) */}
              {canEditAnnotations ? (
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

                  {/* Helpers (only in edit mode) */}
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
              ) : (
                /* Read-Only Notice Badge for Non-Assignee */
                <div className="flex items-center space-x-2 px-3 py-1 bg-[#140b21] border border-[#522B80]/50 rounded-xl text-xs text-gray-300">
                  <Eye className="w-3.5 h-3.5 text-[#E2B86E]" />
                  <span>Vista Previa en vivo • Asignado a: <strong className="text-white">{assigneeDisplay}</strong></span>
                </div>
              )}
            </div>

            {/* Main Editor (if canEditAnnotations and edit tab) OR Live Markdown Preview */}
            {canEditAnnotations && activeTab === 'edit' ? (
              <textarea
                value={annotations}
                onChange={(e) => setAnnotations(e.target.value)}
                placeholder="Escribe aquí el análisis completo de la VOD o tarea... (Soporta múltiples líneas, saltos, listas y formato markdown)."
                className="flex-1 w-full p-3.5 bg-[#140b21] border border-[#522B80]/70 rounded-xl text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#E2B86E] focus:ring-1 focus:ring-[#E2B86E]/40 font-sans leading-relaxed resize-none overflow-y-auto"
              />
            ) : (
              <div className="flex-1 w-full p-3.5 bg-[#140b21] border border-[#522B80]/70 rounded-xl overflow-y-auto select-text">
                {annotations.trim().length > 0 ? (
                  <MarkdownContent content={annotations} />
                ) : (
                  <div className="text-center py-12 space-y-1.5">
                    <p className="text-xs sm:text-sm text-gray-400 italic">
                      {canEditAnnotations
                        ? 'No has escrito anotaciones todavía. Cambia a la pestaña "Editar" para redactar tu análisis.'
                        : `El usuario asignado (${assigneeDisplay}) aún no ha redactado las anotaciones.`}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Cualquier apunte que se guarde se actualizará aquí automáticamente en tiempo real.
                    </p>
                  </div>
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
                  if (confirm('¿Estás seguro de eliminar esta tarea de este chat?')) {
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
            {canEditAnnotations && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
