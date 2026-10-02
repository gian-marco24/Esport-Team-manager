import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
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
  ExternalLink,
  Trash2,
  ListPlus,
  Timer,
  Quote,
} from 'lucide-react';
import type { TacticalTask } from '../types';
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
    setAnnotations((prev) => (prev ? prev + (prev.endsWith('\n') ? '' : '\n') + textToInsert : textToInsert));
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

  const priorityColor =
    task.priority === 'high'
      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
      : task.priority === 'low'
      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
      : 'bg-amber-500/15 text-amber-300 border-amber-500/40';

  const priorityLabel =
    task.priority === 'high' ? 'Alta' : task.priority === 'low' ? 'Baja' : 'Media';

  // Helper to extract first link if any
  const firstUrlMatch = task.materials?.match(/(https?:\/\/[^\s]+)/)?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="bg-[#12091c] border border-[#3c1e5e] rounded-2xl sm:rounded-3xl w-full max-w-5xl 2xl:max-w-6xl h-[94vh] max-h-[960px] 2xl:max-h-[1120px] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-[#170c27] via-[#210f38] to-[#170c27] border-b border-[#3c1e5e]/80 flex flex-col gap-2.5 shrink-0">
          {/* Top Row: Category + Priority + Status pills + Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Left Badges */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider bg-[#522B80]/90 text-[#E2B86E] border border-[#E2B86E]/40 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3 text-[#E2B86E]" />
                Tarea / Análisis
              </span>

              <span className={`px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border ${priorityColor}`}>
                Prioridad {priorityLabel}
              </span>

              {/* Assignment Pill */}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-medium bg-[#1d0e33] text-gray-200 border border-[#522B80]/60 flex items-center gap-1.5 shadow-sm">
                {task.assignedScope === 'both' ? (
                  <Users className="w-3 h-3 text-[#E2B86E]" />
                ) : (
                  <UserCheck className="w-3 h-3 text-[#E2B86E]" />
                )}
                <span>Asignado a: <strong className="text-[#E2B86E] font-bold">{assigneeDisplay}</strong></span>
              </span>

              {task.deadline && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-medium bg-amber-950/35 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  Entrega: <strong className="text-white font-bold">{formatDeadlineDisplay(task.deadline)}</strong>
                </span>
              )}
            </div>

            {/* Right Controls: Status switch + Edit toggle + Close */}
            <div className="flex items-center gap-2">
              {/* Status Switcher (Compact Segmented) */}
              <div className="inline-flex rounded-lg p-0.5 bg-[#09040e] border border-[#3c1e5e] shadow-sm">
                <button
                  type="button"
                  onClick={() => handleStatusChange('pending')}
                  className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all ${
                    task.status === 'pending'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Pendiente
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('in_progress')}
                  className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all ${
                    task.status === 'in_progress'
                      ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  En Progreso
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('completed')}
                  className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all ${
                    task.status === 'completed'
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  ✓ Completada
                </button>
              </div>

              {/* Edit Requirements Button */}
              <button
                type="button"
                onClick={() => setIsEditingRequirements(!isEditingRequirements)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm ${
                  isEditingRequirements
                    ? 'bg-[#E2B86E] text-black border-[#E2B86E]'
                    : 'bg-[#180d29] text-gray-300 border-[#522B80] hover:bg-[#26143E] hover:text-white'
                }`}
                title="Modificar requisitos, VOD link o fecha límite"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isEditingRequirements ? 'Cerrar Edición' : 'Editar Info'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#26143E] border border-transparent hover:border-[#522B80] transition-colors"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Row 2: Task Title (Clean, Prominent) */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base sm:text-xl font-black text-white tracking-wide leading-snug line-clamp-1" title={task.title}>
              {task.title}
            </h2>
            <div className="text-[11px] text-gray-400 shrink-0 font-mono hidden md:block">
              Por: <span className="text-gray-200 font-medium">{task.authorName}</span> • {new Date(task.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col p-3 sm:p-5 gap-3 sm:gap-4 overflow-hidden min-h-0">
          {/* Requirements Editor (Toggled Mode) */}
          {isEditingRequirements ? (
            <div className="p-3.5 sm:p-4 bg-[#09040e] border border-[#E2B86E]/50 rounded-2xl space-y-3 shrink-0 shadow-lg animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#26143E] pb-2">
                <span className="text-xs sm:text-sm font-bold text-[#E2B86E] flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar Requisitos, Enlaces y Plazo de la Tarea
                </span>
                <span className="text-[11px] text-gray-400">Editable por ambos integrantes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-xs font-bold text-gray-200">Requisito u Objetivo *</label>
                  <textarea
                    rows={2}
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    className="w-full bg-[#140b21] border border-[#522B80]/70 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#E2B86E] leading-relaxed resize-none"
                  />
                </div>
                <div className="md:col-span-6 space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-200">Materiales / Enlaces VOD</label>
                    <input
                      type="text"
                      value={reqMaterials}
                      onChange={(e) => setReqMaterials(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#140b21] border border-[#522B80]/70 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#E2B86E]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-300">Fecha Límite</label>
                      <input
                        type="date"
                        value={reqDeadlineDate}
                        onChange={(e) => setReqDeadlineDate(e.target.value)}
                        className="w-full bg-[#140b21] border border-[#522B80]/70 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#E2B86E] cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-300">Prioridad</label>
                      <select
                        value={reqPriority}
                        onChange={(e) => setReqPriority(e.target.value as any)}
                        className="w-full bg-[#140b21] border border-[#522B80]/70 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#E2B86E] cursor-pointer font-bold"
                      >
                        <option value="high" className="bg-[#140b21] text-rose-400">Alta</option>
                        <option value="medium" className="bg-[#140b21] text-amber-400">Media</option>
                        <option value="low" className="bg-[#140b21] text-cyan-400">Baja</option>
                      </select>
                    </div>
                  </div>

                  {reqDeadlineDate && (
                    <div className="flex items-center space-x-2 pt-1 text-xs text-gray-300">
                      <label className="flex items-center space-x-1.5 cursor-pointer select-none text-[11px]">
                        <input
                          type="checkbox"
                          checked={reqIncludeTime}
                          onChange={(e) => setReqIncludeTime(e.target.checked)}
                          className="rounded border-[#522B80] text-[#E2B86E] focus:ring-0 bg-[#140b21] w-3.5 h-3.5"
                        />
                        <span>Hora</span>
                      </label>
                      {reqIncludeTime && (
                        <input
                          type="time"
                          value={reqDeadlineTime}
                          onChange={(e) => setReqDeadlineTime(e.target.value)}
                          className="bg-[#140b21] border border-[#522B80]/70 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#E2B86E]"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#26143E]">
                <Button variant="outline" size="sm" onClick={() => setIsEditingRequirements(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isSavingRequirements}
                  onClick={handleSaveRequirements}
                  className="font-bold shadow-md text-xs"
                >
                  Guardar Requisitos
                </Button>
              </div>
            </div>
          ) : (
            /* Streamlined & Compact Task Context Bar (Takes minimal height) */
            <div className="bg-[#09040e]/90 border border-[#2d1547] rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0 shadow-sm">
              {/* Left: Requisito / Descripción */}
              <div className="flex-1 min-w-0 flex items-start sm:items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#200f36] border border-[#522B80]/60 shrink-0 text-[#8B44F7]">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#E2B86E]">Objetivo / Requisito</span>
                    {task.description && (
                      <span className="text-[10px] text-gray-400 font-mono">Con detalles adicionales</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-200 line-clamp-1 truncate font-medium">
                    {task.description ? `${task.title} — ${task.description}` : task.title}
                  </p>
                </div>
              </div>

              {/* Right: VOD / Materiales Link Preview */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-[#2d1547] pt-2 md:pt-0 md:pl-4">
                {task.materials ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#140b21] border border-[#522B80]/60 text-xs text-purple-200 max-w-[220px] sm:max-w-[280px]">
                      <LinkIcon className="w-3.5 h-3.5 text-[#E2B86E] shrink-0" />
                      <span className="truncate font-mono text-[11px]" title={task.materials}>
                        {task.materials}
                      </span>
                    </div>

                    {firstUrlMatch && (
                      <a
                        href={firstUrlMatch}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-[#1f1035] hover:bg-[#321757] border border-[#522B80] rounded-lg text-gray-200 hover:text-white transition-colors"
                        title="Abrir enlace"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#E2B86E]" />
                      </a>
                    )}

                    <button
                      onClick={copyMaterials}
                      className="px-2 py-1 bg-[#1f1035] hover:bg-[#321757] border border-[#522B80] rounded-lg text-xs text-gray-300 hover:text-white flex items-center gap-1 transition-colors font-medium"
                      title="Copiar enlace"
                    >
                      {hasCopiedUrl ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span className="text-[11px]">{hasCopiedUrl ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 italic flex items-center gap-1">
                    <LinkIcon className="w-3 h-3 text-gray-600" />
                    Sin enlaces o VODs adjuntos
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Bottom Section: Anotaciones Block that fills all remaining space comfortably */}
          <div className="flex-1 flex flex-col bg-[#09040e] border border-[#3c1e5e] rounded-2xl overflow-hidden shadow-inner min-h-[350px]">
            {/* Toolbar: Sleek, compact and responsive */}
            <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#170c27] border-b border-[#2d1547] flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* Title & Badge */}
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-[#E2B86E]" />
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  Anotaciones & Libreta de Análisis
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2a1445] text-[#E2B86E] border border-[#E2B86E]/30 hidden sm:inline-block">
                  Espacio Amplio
                </span>
              </div>

              {/* View Mode Toggle & Compact Format Helpers */}
              {canEditAnnotations ? (
                <div className="flex items-center flex-wrap gap-2">
                  {/* Quick Format Helpers (Compact chips) */}
                  {activeTab === 'edit' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleInsertHelper('**Ronda 1:** ')}
                        className="px-2 py-1 bg-[#13091f] hover:bg-[#281340] border border-[#482370] rounded-md text-[11px] text-gray-200 hover:text-white transition-all font-mono font-semibold flex items-center gap-1 shadow-sm"
                        title="Insertar encabezado de ronda"
                      >
                        <ListPlus className="w-3 h-3 text-purple-300" />
                        <span>+ Ronda</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertHelper('> Conclusión táctica: ')}
                        className="px-2 py-1 bg-[#13091f] hover:bg-[#281340] border border-[#482370] rounded-md text-[11px] text-[#E2B86E] hover:text-amber-200 transition-all font-mono font-semibold flex items-center gap-1 shadow-sm"
                        title="Insertar bloque de conclusión"
                      >
                        <Quote className="w-3 h-3 text-[#E2B86E]" />
                        <span>+ Conclusión</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertHelper('[00:00] Timemark: ')}
                        className="px-2 py-1 bg-[#13091f] hover:bg-[#281340] border border-[#482370] rounded-md text-[11px] text-cyan-300 hover:text-cyan-100 transition-all font-mono font-semibold flex items-center gap-1 shadow-sm"
                        title="Insertar minuto del VOD"
                      >
                        <Timer className="w-3 h-3 text-cyan-400" />
                        <span>+ Minuto VOD</span>
                      </button>
                    </div>
                  )}

                  {/* Switcher [Editar] / [Vista Previa] */}
                  <div className="inline-flex rounded-lg p-0.5 bg-[#0e0618] border border-[#3c1e5e] shadow-sm">
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                        activeTab === 'edit'
                          ? 'bg-[#522B80] text-white shadow-sm ring-1 ring-[#E2B86E]/50'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                        activeTab === 'preview'
                          ? 'bg-[#7c3aed] text-white shadow-sm ring-1 ring-[#E2B86E]/50'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Eye className="w-3 h-3 text-[#E2B86E]" />
                      <span>Vista Previa</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Read-Only Notice Badge for Non-Assignee */
                <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#140b21] border border-[#522B80]/70 rounded-lg text-xs text-gray-200 shadow-sm">
                  <Eye className="w-3.5 h-3.5 text-[#E2B86E]" />
                  <span>Vista Previa • Asignado a: <strong className="text-white font-bold">{assigneeDisplay}</strong></span>
                </div>
              )}
            </div>

            {/* Main Full-Height Editor OR Live Markdown Preview */}
            <div className="flex-1 relative flex flex-col min-h-0 bg-[#12091c] p-3 sm:p-4">
              {canEditAnnotations && activeTab === 'edit' ? (
                <textarea
                  value={annotations}
                  onChange={(e) => setAnnotations(e.target.value)}
                  placeholder="Escribe aquí las notas y análisis de la tarea o VOD... (Soporta múltiples líneas, listas, formato markdown como **negrita**, > citas, y [00:00] marcas de tiempo)."
                  className="w-full h-full p-3.5 sm:p-4 bg-[#0d0614] border border-[#3c1e5e]/80 rounded-xl text-xs sm:text-sm md:text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#E2B86E] focus:ring-1 focus:ring-[#E2B86E]/40 font-sans leading-relaxed resize-none overflow-y-auto"
                />
              ) : (
                <div className="w-full h-full p-3.5 sm:p-4 bg-[#0d0614] border border-[#3c1e5e]/80 rounded-xl overflow-y-auto select-text">
                  {annotations.trim().length > 0 ? (
                    <div className="text-xs sm:text-sm md:text-base text-gray-100 leading-relaxed">
                      <MarkdownContent content={annotations} className="text-xs sm:text-sm md:text-base leading-relaxed" />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-2">
                      <FileText className="w-8 h-8 text-gray-600 mb-1" />
                      <p className="text-xs sm:text-sm text-gray-300 italic font-medium">
                        {canEditAnnotations
                          ? 'No has escrito anotaciones todavía. Haz clic en "Editar" arriba para empezar a escribir.'
                          : `El usuario asignado (${assigneeDisplay}) aún no ha redactado las anotaciones.`}
                      </p>
                      <p className="text-[11px] sm:text-xs text-gray-500">
                        Cualquier cambio guardado se sincronizará automáticamente para ambos integrantes.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-[#09040e] border-t border-[#26143E] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            {onDeleteTask && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Estás seguro de eliminar esta tarea de este chat?')) {
                    onDeleteTask(task.id);
                    onClose();
                  }
                }}
                className="text-xs font-bold text-red-400/80 hover:text-red-300 hover:underline flex items-center gap-1.5 px-2 py-1 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Tarea</span>
              </button>
            )}
            {showSavedFeedback && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-fade-in bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <Check className="w-3.5 h-3.5" />
                ¡Anotaciones guardadas!
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <Button variant="outline" size="sm" onClick={onClose} className="px-4 py-1.5 text-xs font-bold">
              Cerrar
            </Button>
            {canEditAnnotations && (
              <Button
                variant="secondary"
                size="sm"
                isLoading={isSaving}
                onClick={handleSaveAnnotations}
                className="flex items-center space-x-1.5 px-5 py-1.5 text-xs sm:text-sm font-black shadow-lg"
              >
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Guardar Anotaciones</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

