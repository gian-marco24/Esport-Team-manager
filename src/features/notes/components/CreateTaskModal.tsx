import React, { useState } from 'react';
import { X, CheckSquare, Calendar, Clock, Link as LinkIcon, FileText, Sparkles, User, UserCheck, Users } from 'lucide-react';
import type { TacticalTask } from '../types';
import { Button } from '../../../components/ui/Button';
import { buildDeadlineString, formatDeadlineDisplay } from '../utils/dateHelpers';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<TacticalTask>, publishToChat: boolean) => Promise<any>;
  defaultTitle?: string;
  defaultMaterials?: string;
  peerUser?: { id: string; displayName: string; role?: string; avatarUrl?: string };
  currentUser?: { id: string; displayName: string } | null;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultTitle = '',
  defaultMaterials = '',
  peerUser,
  currentUser,
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [materials, setMaterials] = useState(defaultMaterials);
  const [assignedScope, setAssignedScope] = useState<'self' | 'peer' | 'both'>(peerUser ? 'peer' : 'self');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [includeTime, setIncludeTime] = useState(false);
  const [deadlineTime, setDeadlineTime] = useState('18:00');
  const [priority, setPriority] = useState<TacticalTask['priority']>('medium');
  const [publishToChat, setPublishToChat] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resolvedDeadline = buildDeadlineString(deadlineDate, deadlineTime, includeTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      let assignedToId: string | undefined;
      let assignedToName: string | undefined;
      let assigneeIds: string[] = [];

      if (assignedScope === 'self') {
        assignedToId = currentUser?.id;
        assignedToName = currentUser?.displayName || 'Mí mismo';
        if (currentUser?.id) assigneeIds.push(currentUser.id);
      } else if (assignedScope === 'peer') {
        assignedToId = peerUser?.id;
        assignedToName = peerUser?.displayName || 'El otro integrante';
        if (peerUser?.id) assigneeIds.push(peerUser.id);
      } else {
        assignedToName = 'Ambos integrantes';
        if (currentUser?.id) assigneeIds.push(currentUser.id);
        if (peerUser?.id && peerUser.id !== currentUser?.id) assigneeIds.push(peerUser.id);
      }

      await onSubmit(
        {
          title: title.trim(),
          materials: materials.trim(),
          deadline: resolvedDeadline,
          priority,
          status: 'pending',
          assignedScope,
          assigneeIds,
          assignedToId,
          assignedToName,
          peerId: peerUser?.id,
          peerName: peerUser?.displayName,
          annotations: '',
        },
        publishToChat
      );
      setTitle('');
      setMaterials('');
      setDeadlineDate('');
      setDeadlineTime('18:00');
      setIncludeTime(false);
      onClose();
    } catch (err) {
      console.error('Error al crear tarea:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-[#140b21] border border-[#522B80] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#180d29] via-[#26143E] to-[#180d29] border-b border-[#522B80]/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E]">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Asignar Nueva Tarea</h3>
              <p className="text-[11px] text-gray-400">
                Fijar análisis, VOD reviews o requerimientos para este chat.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#26143E] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Requisito / Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-[#8B44F7]" />
              <span>Requisito u Objetivo de la Tarea *</span>
            </label>
            <textarea
              required
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: ANALIZAR 3ER MAPA (ASCENT) Ronda por ronda detalladamente, análisis individual."
              className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E2B86E]"
            />
          </div>

          {/* Asignación de la Tarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-[#E2B86E]" />
              <span>Asignada para redactar / análisis: *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Peer User */}
              <button
                type="button"
                onClick={() => setAssignedScope('peer')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  assignedScope === 'peer'
                    ? 'bg-[#522B80] border-[#E2B86E] text-white shadow-md shadow-[#8B44F7]/25 ring-1 ring-[#E2B86E]'
                    : 'bg-[#0D0914] border-[#26143E] text-gray-400 hover:text-gray-200 hover:border-[#522B80]'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <UserCheck className={`w-3.5 h-3.5 ${assignedScope === 'peer' ? 'text-[#E2B86E]' : 'text-gray-500'}`} />
                  <span className="text-xs font-bold truncate">
                    {peerUser?.displayName || 'Al otro usuario'}
                  </span>
                </div>
                <span className="text-[10px] text-gray-300/80 mt-1">Él redacta las notas</span>
              </button>

              {/* Option 2: Self */}
              <button
                type="button"
                onClick={() => setAssignedScope('self')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  assignedScope === 'self'
                    ? 'bg-[#522B80] border-[#E2B86E] text-white shadow-md shadow-[#8B44F7]/25 ring-1 ring-[#E2B86E]'
                    : 'bg-[#0D0914] border-[#26143E] text-gray-400 hover:text-gray-200 hover:border-[#522B80]'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <User className={`w-3.5 h-3.5 ${assignedScope === 'self' ? 'text-[#E2B86E]' : 'text-gray-500'}`} />
                  <span className="text-xs font-bold truncate">A mí mismo</span>
                </div>
                <span className="text-[10px] text-gray-300/80 mt-1">Yo redacto las notas</span>
              </button>

              {/* Option 3: Both */}
              <button
                type="button"
                onClick={() => setAssignedScope('both')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  assignedScope === 'both'
                    ? 'bg-[#522B80] border-[#E2B86E] text-white shadow-md shadow-[#8B44F7]/25 ring-1 ring-[#E2B86E]'
                    : 'bg-[#0D0914] border-[#26143E] text-gray-400 hover:text-gray-200 hover:border-[#522B80]'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Users className={`w-3.5 h-3.5 ${assignedScope === 'both' ? 'text-[#E2B86E]' : 'text-gray-500'}`} />
                  <span className="text-xs font-bold truncate">A ambos</span>
                </div>
                <span className="text-[10px] text-gray-300/80 mt-1">Ambos pueden redactar</span>
              </button>
            </div>
            <p className="text-[10px] text-gray-400">
              * Quien tenga la tarea asignada podrá redactar las anotaciones. Ambos integrantes podrán verla, seguir las actualizaciones y editar requisitos o plazos.
            </p>
          </div>

          {/* Materiales / Recursos / Links */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[#E2B86E]" />
              <span>Materiales o Recursos (VOD, Twitch, Links)</span>
            </label>
            <input
              type="text"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="Ej: https://www.twitch.tv/videos/2884062119"
              className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E2B86E]"
            />
          </div>

          {/* Fecha Límite & Prioridad */}
          <div className="space-y-3 p-3 bg-[#0D0914] border border-[#26143E] rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Fecha Límite (Selector de Fecha) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fecha Límite</span>
                </label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full bg-[#140b21] border border-[#522B80]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B86E] cursor-pointer"
                />
              </div>

              {/* Prioridad */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">Prioridad</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-[#140b21] border border-[#522B80]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2B86E] cursor-pointer"
                >
                  <option value="high" className="bg-[#140b21] text-rose-400">Alta</option>
                  <option value="medium" className="bg-[#140b21] text-amber-400">Media</option>
                  <option value="low" className="bg-[#140b21] text-cyan-400">Baja</option>
                </select>
              </div>
            </div>

            {/* Hora exacta toggle */}
            {deadlineDate && (
              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs text-gray-300 select-none">
                    <input
                      type="checkbox"
                      checked={includeTime}
                      onChange={(e) => setIncludeTime(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-700 text-[#8B44F7] focus:ring-0 bg-[#140b21]"
                    />
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#E2B86E]" />
                      <span>Especificar hora exacta de entrega</span>
                    </span>
                  </label>

                  {includeTime && (
                    <input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      className="bg-[#140b21] border border-[#522B80]/60 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#E2B86E] cursor-pointer"
                    />
                  )}
                </div>

                {resolvedDeadline && (
                  <div className="text-[11px] text-[#E2B86E] font-medium flex items-center gap-1 pt-0.5">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>Plazo registrado: <strong>{formatDeadlineDisplay(resolvedDeadline)}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checkbox: Publicar en el chat */}
          <label className="flex items-center space-x-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={publishToChat}
              onChange={(e) => setPublishToChat(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 text-[#8B44F7] focus:ring-0 bg-[#0D0914]"
            />
            <span className="text-xs text-gray-300 select-none">
              Publicar también como mensaje fijado en este canal
            </span>
          </label>

          {/* Actions */}
          <div className="pt-3 border-t border-[#26143E] flex items-center justify-end space-x-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
              disabled={!title.trim()}
              className="flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Asignar Tarea</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
