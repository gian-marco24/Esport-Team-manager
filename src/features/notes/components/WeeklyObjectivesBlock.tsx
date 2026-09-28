import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Award,
} from 'lucide-react';
import { useWeeklyObjectives } from '../hooks/useWeeklyObjectives';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export const WeeklyObjectivesBlock: React.FC = () => {
  const { user } = useAuthContext();
  const {
    weekLabel,
    objectives,
    isLoading,
    total,
    completed,
    progressPercent,
    addObjective,
    toggleObjective,
    deleteObjective,
    changeWeekOffset,
    resetToCurrentWeek,
  } = useWeeklyObjectives(user?.id);

  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await addObjective(newTitle.trim(), priority);
      setNewTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (p: 'high' | 'medium' | 'low') => {
    switch (p) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 text-[10px] font-bold">
            Prioridad Alta
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
            Prioridad Media
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
            Prioridad Baja
          </span>
        );
    }
  };

  return (
    <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-5 shadow-xl space-y-4 min-h-[580px] flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#26143E] shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-wide flex items-center space-x-2">
              <span>Mis Objetivos Semanales</span>
              <Badge variant="gold" className="text-[10px] px-1.5 py-0 font-bold">
                Metas
              </Badge>
            </h3>
            <p className="text-xs text-gray-400">
              Seguimiento y metas de entrenamiento, rendimiento individual o tareas asignadas.
            </p>
          </div>
        </div>

        {/* Week Switcher Navigation */}
        <div className="flex items-center space-x-1.5 bg-[#0D0914] border border-[#26143E] rounded-xl p-1 shrink-0">
          <button
            onClick={() => changeWeekOffset(-1)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#26143E] transition-colors"
            title="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-gray-200 px-2 min-w-[170px] text-center">
            {weekLabel}
          </span>

          <button
            onClick={() => changeWeekOffset(1)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#26143E] transition-colors"
            title="Semana siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={resetToCurrentWeek}
            className="p-1.5 text-[#E2B86E] hover:text-white rounded-lg hover:bg-[#26143E] transition-colors"
            title="Ir a semana actual"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Stats */}
      <div className="p-3.5 bg-[#180d29] border border-[#522B80]/40 rounded-xl space-y-2 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-gray-300 flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-[#E2B86E]" />
            <span>Progreso de la semana</span>
          </span>
          <span className="font-mono font-bold text-white">
            {completed} de {total} completados ({progressPercent}%)
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-2.5 bg-[#0D0914] rounded-full overflow-hidden border border-[#26143E]">
          <div
            className="h-full bg-gradient-to-r from-[#8B44F7] to-[#E2B86E] transition-all duration-500 rounded-full shadow-lg shadow-[#8B44F7]/40"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Objectives List Scrollable */}
      <div className="flex-1 min-h-[300px] max-h-[440px] overflow-y-auto space-y-2 pr-1">
        {isLoading ? (
          <div className="flex-1 min-h-[260px] flex items-center justify-center text-xs text-gray-400">
            Cargando objetivos...
          </div>
        ) : objectives.length === 0 ? (
          <div className="min-h-[260px] flex flex-col items-center justify-center text-center text-gray-500 space-y-2 border border-dashed border-[#26143E] rounded-xl p-6">
            <Sparkles className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-xs text-gray-400 font-medium">No hay objetivos definidos para esta semana.</p>
            <p className="text-[11px] max-w-xs text-gray-500">
              Agrega tu primera meta semanal con el formulario inferior para hacer seguimiento de tu progreso.
            </p>
          </div>
        ) : (
          objectives.map((obj) => (
            <div
              key={obj.id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                obj.completed
                  ? 'bg-emerald-950/15 border-emerald-500/30 opacity-80'
                  : 'bg-[#180d29] border-[#522B80]/40 hover:border-[#8B44F7]'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0 pr-3">
                <button
                  onClick={() => toggleObjective(obj.id, obj.completed)}
                  className="shrink-0 transition-transform active:scale-90"
                >
                  {obj.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500 hover:text-[#8B44F7]" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <span
                    className={`text-xs font-semibold block break-words ${
                      obj.completed ? 'line-through text-gray-400' : 'text-gray-100'
                    }`}
                  >
                    {obj.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {getPriorityBadge(obj.priority)}
                <button
                  onClick={() => deleteObjective(obj.id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-950/40 transition-colors"
                  title="Eliminar objetivo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Objective Inline Form */}
      <form onSubmit={handleAdd} className="pt-3 border-t border-[#26143E]/60 flex flex-col sm:flex-row items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder="Escribe un nuevo objetivo semanal (ej: Entrenar crosshair placement 30m diarios)..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 bg-[#180d29] border border-[#522B80]/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8B44F7] w-full"
        />

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="bg-[#180d29] border border-[#522B80]/60 rounded-xl px-2.5 py-2 text-xs text-gray-200 focus:outline-none cursor-pointer"
          >
            <option value="high" className="bg-[#140b21]">Alta</option>
            <option value="medium" className="bg-[#140b21]">Media</option>
            <option value="low" className="bg-[#140b21]">Baja</option>
          </select>

          <Button
            type="submit"
            variant="secondary"
            size="sm"
            isLoading={isSubmitting}
            disabled={!newTitle.trim()}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="shrink-0"
          >
            Agregar
          </Button>
        </div>
      </form>
    </div>
  );
};
