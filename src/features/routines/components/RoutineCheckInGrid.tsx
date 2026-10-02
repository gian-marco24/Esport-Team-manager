import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Dumbbell,
  ChevronDown,
  Lock,
} from 'lucide-react';
import type { Routine, UserRoutineMonthCheckIn } from '../types';
import type { TeamMember } from '../../teams/types';
import { Badge } from '../../../components/ui/Badge';

interface RoutineCheckInGridProps {
  selectedUser: TeamMember | { id: string; displayName: string; teamRole?: string } | null;
  routines: Routine[];
  activeRoutine: Routine | null;
  yearMonth: string; // "YYYY-MM"
  onYearMonthChange: (nextYm: string) => void;
  monthCheckIn: UserRoutineMonthCheckIn;
  onToggleCheckIn: (exerciseId: string, day: number) => void;
  onAssignRoutineToUserMonth?: (routineId: string) => void;
  canAssignRoutine: boolean;
  isSelfView: boolean;
}

export const RoutineCheckInGrid: React.FC<RoutineCheckInGridProps> = ({
  selectedUser,
  routines,
  activeRoutine,
  yearMonth,
  onYearMonthChange,
  monthCheckIn,
  onToggleCheckIn,
  onAssignRoutineToUserMonth,
  canAssignRoutine,
  isSelfView,
}) => {
  // Parse year and month
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  // Days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Determine current day if looking at the current active month
  const now = new Date();
  const isCurrentRealMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const currentRealDay = now.getDate();

  // Spanish month names
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const currentMonthName = monthNames[month - 1] || 'Mes';

  const handlePrevMonth = () => {
    let nextY = year;
    let nextM = month - 1;
    if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    }
    onYearMonthChange(`${nextY}-${String(nextM).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let nextY = year;
    let nextM = month + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    onYearMonthChange(`${nextY}-${String(nextM).padStart(2, '0')}`);
  };

  // Group exercises by category
  const groupedExercises = useMemo(() => {
    if (!activeRoutine) return {};
    const groups: Record<string, typeof activeRoutine.exercises> = {};
    activeRoutine.exercises.forEach((ex) => {
      const cat = ex.category || 'GENERAL';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ex);
    });
    return groups;
  }, [activeRoutine]);

  // Total check-ins calculation
  const totalPossibleChecks = (activeRoutine?.exercises.length || 0) * daysInMonth;
  let totalChecked = 0;
  if (activeRoutine) {
    activeRoutine.exercises.forEach((ex) => {
      const dayMap = monthCheckIn.checkIns[ex.id] || {};
      Object.values(dayMap).forEach((val) => {
        if (val) totalChecked += 1;
      });
    });
  }

  const completionPercentage =
    totalPossibleChecks > 0 ? Math.round((totalChecked / totalPossibleChecks) * 100) : 0;

  return (
    <div className="bg-[#140b21] border border-[#26143E] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 flex flex-col">
      {/* Grid Top Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-[#26143E]">
        {/* Left: User & Routine Info */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-black text-white flex items-center gap-1.5">
              <span>Registro de Check-in:</span>
              <strong className="text-[#E2B86E]">
                {isSelfView ? 'Yo (Mis Registros)' : selectedUser?.displayName || 'Integrante'}
              </strong>
            </span>
            {selectedUser?.teamRole && (
              <Badge variant="purple" className="text-xs px-2 py-0.5 font-bold">
                {selectedUser.teamRole}
              </Badge>
            )}
            {!isSelfView && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-[#0D0914] px-2 py-0.5 rounded-md border border-[#522B80]/60">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Modo Lectura</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {isSelfView
              ? 'Marca los ejercicios completados en cada día del mes. Los datos se guardan en tiempo real.'
              : 'Visualizando el progreso del jugador en modo lectura. Solo el jugador puede marcar sus ejercicios.'}
          </p>
        </div>

        {/* Center/Right Controls: Routine Selector for this player + Month Navigator */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Routine Selector Dropdown (Entire container is interactive with seamless styling) */}
          {canAssignRoutine && routines.length > 0 ? (
            <div className="relative group flex items-center bg-[#0D0914] hover:bg-[#180d29] border border-[#522B80]/80 hover:border-[#E2B86E] rounded-xl px-3.5 py-2 transition-all shadow-md cursor-pointer">
              <Dumbbell className="w-4 h-4 text-[#E2B86E] mr-2.5 shrink-0 pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="flex flex-col pr-6 min-w-[170px] sm:min-w-[210px] pointer-events-none">
                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold leading-none mb-1">
                  Rutina del Mes (Coach / CEO)
                </span>
                <span className="text-xs sm:text-sm font-black text-white truncate line-clamp-1">
                  {activeRoutine?.title || routines[0]?.title || 'Seleccionar Rutina'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-[#E2B86E] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
              <select
                value={activeRoutine?.id || routines[0]?.id}
                onChange={(e) => onAssignRoutineToUserMonth?.(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-sm"
                title="Cambiar rutina asignada al jugador"
              >
                {routines.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#140b21] text-white py-2">
                    {r.title} ({r.exercises.length} ejercicios)
                  </option>
                ))}
              </select>
            </div>
          ) : activeRoutine ? (
            <div className="flex items-center space-x-2 bg-[#0D0914] border border-[#522B80]/60 rounded-xl px-3.5 py-2">
              <Dumbbell className="w-4 h-4 text-[#E2B86E] shrink-0" />
              <div className="flex flex-col min-w-[140px] max-w-[220px]">
                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold leading-none mb-1">
                  Rutina Asignada
                </span>
                <span className="text-xs sm:text-sm font-black text-white truncate" title={activeRoutine.title}>
                  {activeRoutine.title}
                </span>
              </div>
            </div>
          ) : null}

          {/* Month Selector */}
          <div className="flex items-center space-x-1.5 bg-[#0D0914] border border-[#522B80]/60 rounded-xl p-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-[#26143E] text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            <div className="px-3 text-center">
              <span className="text-sm font-black text-white block">
                {currentMonthName} {year}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-[#26143E] text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#522B80]/40 to-[#26143E]/40 border border-[#8B44F7]/40 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                Cumplimiento Mes
              </span>
              <span className="text-sm font-black text-white font-mono">
                {completionPercentage}%{' '}
                <span className="text-xs text-gray-400 font-normal">
                  ({totalChecked}/{totalPossibleChecks})
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Custom Excel Table Container */}
      <div className="relative rounded-2xl border border-[#26143E] bg-[#0D0914] overflow-hidden shadow-inner flex flex-col">
        <div className="overflow-x-auto select-none no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            {/* Table Header: Day columns */}
            <thead>
              <tr className="bg-[#180d29] border-b border-[#26143E] text-xs font-black text-gray-300 uppercase tracking-wider">
                <th className="sticky left-0 z-20 bg-[#180d29] p-3.5 min-w-[260px] sm:min-w-[300px] border-r border-[#26143E] text-white">
                  EJERCICIOS / DÍAS
                </th>
                {daysArray.map((d) => {
                  const isToday = isCurrentRealMonth && d === currentRealDay;
                  return (
                    <th
                      key={d}
                      className={`py-2 px-1 text-center min-w-[38px] sm:min-w-[42px] font-mono border-r border-[#26143E]/60 transition-colors ${
                        isToday
                          ? 'bg-[#522B80] text-[#E2B86E] font-black ring-1 ring-[#E2B86E]/50'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>{d}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body: Grouped Categories and Exercises */}
            <tbody>
              {!activeRoutine || Object.keys(groupedExercises).length === 0 ? (
                <tr>
                  <td
                    colSpan={daysInMonth + 1}
                    className="p-10 text-center text-sm text-gray-500 italic"
                  >
                    No hay ejercicios configurados en la rutina seleccionada.
                  </td>
                </tr>
              ) : (
                Object.entries(groupedExercises).map(([category, exList]) => (
                  <React.Fragment key={category}>
                    {/* Category Header Row (Sticky Left Title + Spanned Row Background) */}
                    <tr className="border-y border-[#8B44F7]/40">
                      {/* Sticky Left Column Category Title */}
                      <td className="sticky left-0 z-10 bg-gradient-to-r from-[#451e70] to-[#361759] py-2 px-4 border-r border-[#8B44F7]/40 text-xs font-black text-[#E2B86E] uppercase tracking-wider shadow-md">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#E2B86E] shadow-sm shadow-[#E2B86E]/50 shrink-0" />
                          <span className="truncate">{category}</span>
                        </div>
                      </td>

                      {/* Spanning background across all day columns */}
                      <td
                        colSpan={daysInMonth}
                        className="bg-gradient-to-r from-[#361759] to-[#1e0d33] border-b border-[#8B44F7]/20"
                      />
                    </tr>

                    {/* Exercises within this Category */}
                    {exList.map((ex, exIdx) => (
                      <tr
                        key={ex.id}
                        className={`border-b border-[#26143E]/40 hover:bg-[#180d29]/80 transition-colors ${
                          exIdx % 2 === 0 ? 'bg-[#0D0914]' : 'bg-[#140b21]/60'
                        }`}
                      >
                        {/* Exercise Name (Sticky Left Column) */}
                        <td className="sticky left-0 z-10 bg-[#12091c] p-3 px-4 border-r border-[#26143E] text-xs sm:text-sm font-semibold text-gray-200">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate">{ex.name}</span>
                            {ex.target && (
                              <span className="text-xs text-[#E2B86E] font-mono shrink-0 px-1.5 py-0.5 bg-[#180d29] rounded border border-[#522B80]/40">
                                {ex.target}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Day Checkbox Cells */}
                        {daysArray.map((day) => {
                          const isChecked = Boolean(monthCheckIn.checkIns[ex.id]?.[day]);
                          const isToday = isCurrentRealMonth && day === currentRealDay;

                          return (
                            <td
                              key={day}
                              onClick={() => {
                                if (isSelfView) {
                                  onToggleCheckIn(ex.id, day);
                                }
                              }}
                              className={`p-1 text-center border-r border-[#26143E]/40 transition-all ${
                                isSelfView
                                  ? 'cursor-pointer hover:bg-[#522B80]/50'
                                  : 'cursor-default'
                              } ${isToday ? 'bg-[#522B80]/20' : ''}`}
                              title={
                                isSelfView
                                  ? `Día ${day}: ${ex.name} (${isChecked ? 'Completado' : 'Pendiente'}) - Clic para marcar/desmarcar`
                                  : `Día ${day}: ${ex.name} (${isChecked ? 'Completado' : 'Pendiente'}) - Solo el jugador puede marcar sus ejercicios`
                              }
                            >
                              <div
                                className={`w-6 h-6 mx-auto rounded-lg flex items-center justify-center transition-all ${
                                  isChecked
                                    ? 'bg-gradient-to-br from-[#E2B86E] to-[#cf9e46] text-black shadow-md shadow-[#E2B86E]/20 font-black scale-105'
                                    : isSelfView
                                    ? 'bg-[#140b21] border border-[#522B80]/80 hover:border-[#E2B86E]'
                                    : 'bg-[#140b21]/50 border border-[#522B80]/40'
                                }`}
                              >
                                {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
