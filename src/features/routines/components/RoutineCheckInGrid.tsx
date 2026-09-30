import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Dumbbell,
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
    <div className="bg-[#140b21] border border-[#26143E] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 flex flex-col">
      {/* Grid Top Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-[#26143E]">
        {/* Left: User & Routine Info */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Registro de Check-in:</span>
              <strong className="text-[#E2B86E]">
                {isSelfView ? 'Yo (Mis Registros)' : selectedUser?.displayName || 'Integrante'}
              </strong>
            </span>
            {selectedUser?.teamRole && (
              <Badge variant="purple" className="text-[9px] px-1.5 py-0 font-bold">
                {selectedUser.teamRole}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-gray-400">
            Marca los ejercicios completados en cada día del mes. Los datos se guardan en tiempo real.
          </p>
        </div>

        {/* Center/Right Controls: Routine Selector for this player + Month Navigator */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Routine Selector Dropdown (Can change player's assigned routine) */}
          {canAssignRoutine && routines.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-[#0D0914] border border-[#522B80]/60 rounded-xl px-2.5 py-1">
              <Dumbbell className="w-3.5 h-3.5 text-[#E2B86E] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">
                  Rutina del Mes
                </span>
                <select
                  value={activeRoutine?.id || routines[0]?.id}
                  onChange={(e) => onAssignRoutineToUserMonth?.(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
                >
                  {routines.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#140b21] text-white">
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Month Selector */}
          <div className="flex items-center space-x-1 bg-[#0D0914] border border-[#522B80]/60 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-[#26143E] text-gray-300 hover:text-white transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2.5 text-center">
              <span className="text-xs font-black text-white block">
                {currentMonthName} {year}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-[#26143E] text-gray-300 hover:text-white transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#522B80]/40 to-[#26143E]/40 border border-[#8B44F7]/40 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">
                Cumplimiento Mes
              </span>
              <span className="text-xs font-black text-white font-mono">
                {completionPercentage}%{' '}
                <span className="text-[10px] text-gray-400 font-normal">
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
          <table className="w-full text-left border-collapse min-w-[960px]">
            {/* Table Header: Day columns */}
            <thead>
              <tr className="bg-[#180d29] border-b border-[#26143E] text-[10px] font-black text-gray-300 uppercase tracking-wider">
                <th className="sticky left-0 z-20 bg-[#180d29] p-3 min-w-[240px] max-w-[280px] border-r border-[#26143E] text-white">
                  EJERCICIOS / DÍAS
                </th>
                {daysArray.map((d) => {
                  const isToday = isCurrentRealMonth && d === currentRealDay;
                  return (
                    <th
                      key={d}
                      className={`p-1.5 text-center min-w-[34px] max-w-[38px] font-mono border-r border-[#26143E]/60 transition-colors ${
                        isToday
                          ? 'bg-[#522B80] text-[#E2B86E] font-black ring-1 ring-[#E2B86E]/50'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>D{d}</span>
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
                    className="p-8 text-center text-xs text-gray-500 italic"
                  >
                    No hay ejercicios configurados en la rutina seleccionada.
                  </td>
                </tr>
              ) : (
                Object.entries(groupedExercises).map(([category, exList]) => (
                  <React.Fragment key={category}>
                    {/* Category Header Row (Styled like Excel group banner matching Image 1) */}
                    <tr className="bg-gradient-to-r from-[#522B80] via-[#3a1b60] to-[#26143E] text-white font-black text-[11px] uppercase tracking-wider border-y border-[#8B44F7]/40 shadow-sm">
                      <td
                        colSpan={daysInMonth + 1}
                        className="py-1.5 px-3.5 flex items-center space-x-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#E2B86E]" />
                        <span>{category}</span>
                      </td>
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
                        <td className="sticky left-0 z-10 bg-[#12091c] p-2.5 px-3.5 border-r border-[#26143E] text-xs font-semibold text-gray-200">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{ex.name}</span>
                            {ex.target && (
                              <span className="text-[9px] text-[#E2B86E] font-mono shrink-0 px-1 bg-[#180d29] rounded border border-[#522B80]/40">
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
                              onClick={() => onToggleCheckIn(ex.id, day)}
                              className={`p-1 text-center border-r border-[#26143E]/40 cursor-pointer transition-all ${
                                isToday ? 'bg-[#522B80]/20' : ''
                              } hover:bg-[#522B80]/50`}
                              title={`Día ${day}: ${ex.name} (${isChecked ? 'Completado' : 'Pendiente'})`}
                            >
                              <div
                                className={`w-5 h-5 mx-auto rounded-md flex items-center justify-center transition-all ${
                                  isChecked
                                    ? 'bg-gradient-to-br from-[#E2B86E] to-[#cf9e46] text-black shadow-md shadow-[#E2B86E]/20 font-black scale-105'
                                    : 'bg-[#140b21] border border-[#522B80]/80 hover:border-[#E2B86E]'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
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
