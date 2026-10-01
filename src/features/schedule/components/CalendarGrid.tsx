import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Filter,
} from 'lucide-react';
import type { CalendarEvent, EventType } from '../types';
import { EVENT_TYPES_CONFIG } from '../types';
import { Button } from '../../../components/ui/Button';

interface CalendarGridProps {
  eventsByDate: Record<string, CalendarEvent[]>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenAddModal: (date?: string) => void;
  selectedTypeFilter: EventType | 'all';
  onFilterChange: (type: EventType | 'all') => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const formatLocalDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  eventsByDate,
  selectedDate,
  onSelectDate,
  onOpenAddModal,
  selectedTypeFilter,
  onFilterChange,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onSelectDate(formatLocalDateString(today));
  };

  // Generar la matriz de días para el mes actual
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Ajustar día de la semana (0 = Lunes, 6 = Domingo)
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Días del mes anterior para rellenar
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = formatLocalDateString(prevDate);
    prevMonthDays.push({ dateStr, dayNum, isCurrentMonth: false });
  }

  // Días del mes actual
  const currentMonthDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const dateObj = new Date(year, month, i);
    const dateStr = formatLocalDateString(dateObj);
    currentMonthDays.push({ dateStr, dayNum: i, isCurrentMonth: true });
  }

  // Días del siguiente mes para completar la cuadrícula de 35 o 42 días
  const totalCellsSoFar = prevMonthDays.length + currentMonthDays.length;
  const remainingCells = totalCellsSoFar > 35 ? 42 - totalCellsSoFar : 35 - totalCellsSoFar;
  const nextMonthDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    const dateStr = formatLocalDateString(nextDate);
    nextMonthDays.push({ dateStr, dayNum: i, isCurrentMonth: false });
  }

  const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  const todayStr = formatLocalDateString(new Date());

  return (
    <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col space-y-4 h-full">
      {/* HEADER CALENDARIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26143E] pb-4">
        {/* Título de Mes & Navegación */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E] shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              {MONTH_NAMES[month]} <span className="text-[#E2B86E]">{year}</span>
            </h2>
            <p className="text-xs text-gray-400 font-medium">Calendario Oficial de Entrenamientos & Competencias</p>
          </div>
        </div>

        {/* Botones Controles */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="p-2.5 border border-[#8B44F7]/20">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleToday}
            className="text-xs sm:text-sm font-semibold px-4 py-1.5 bg-[#26143E] hover:bg-[#522B80]"
          >
            Hoy
          </Button>
          <Button variant="ghost" size="sm" onClick={handleNextMonth} className="p-2.5 border border-[#8B44F7]/20">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
          </Button>
        </div>
      </div>

      {/* FILTROS DE CATEGORÍA */}
      <div className="flex items-center space-x-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#522B80]">
        <div className="flex items-center space-x-1.5 pr-2.5 border-r border-[#26143E] text-xs sm:text-sm text-gray-400 font-medium shrink-0">
          <Filter className="w-4 h-4 text-[#E2B86E]" />
          <span>Filtro:</span>
        </div>

        <button
          onClick={() => onFilterChange('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 border ${
            selectedTypeFilter === 'all'
              ? 'bg-[#8B44F7] text-white border-[#E2B86E] shadow-md shadow-[#8B44F7]/30'
              : 'bg-[#26143E]/60 text-gray-400 border-transparent hover:text-white hover:bg-[#26143E]'
          }`}
        >
          Todos
        </button>

        {(Object.keys(EVENT_TYPES_CONFIG) as EventType[]).map((typeKey) => {
          const cfg = EVENT_TYPES_CONFIG[typeKey];
          const isSelected = selectedTypeFilter === typeKey;

          return (
            <button
              key={typeKey}
              onClick={() => onFilterChange(typeKey)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center space-x-1.5 border ${
                isSelected
                  ? `${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} shadow-sm font-bold scale-105`
                  : 'bg-[#0D0914]/50 text-gray-400 border-[#26143E] hover:text-gray-200'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.dotColor }} />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* CUADRÍCULA DEL CALENDARIO */}
      <div className="flex-1 min-h-[520px] flex flex-col">
        {/* Cabecera Días de la Semana */}
        <div className="grid grid-cols-7 text-center border-b border-[#26143E] pb-2.5 mb-2.5">
          {WEEKDAY_NAMES.map((name) => (
            <div key={name} className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">
              {name}
            </div>
          ))}
        </div>

        {/* Matriz de Días */}
        <div className="grid grid-cols-7 grid-rows-5 gap-2 flex-1">
          {allCalendarDays.map((cell) => {
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDate;
            const dayEvents = eventsByDate[cell.dateStr] || [];

            return (
              <div
                key={cell.dateStr}
                onClick={() => onSelectDate(cell.dateStr)}
                className={`group relative p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer min-h-[95px] sm:min-h-[110px] 2xl:min-h-[125px] ${
                  !cell.isCurrentMonth
                    ? 'bg-[#0D0914]/40 border-[#26143E]/40 text-gray-600 hover:border-[#8B44F7]/30'
                    : isSelected
                    ? 'bg-[#26143E]/90 border-[#E2B86E] shadow-lg shadow-[#8B44F7]/20 ring-1 ring-[#E2B86E]/50'
                    : isToday
                    ? 'bg-[#522B80]/30 border-[#8B44F7] text-white'
                    : 'bg-[#0D0914]/80 border-[#26143E] hover:bg-[#26143E]/50 hover:border-[#8B44F7]/40 text-gray-300'
                }`}
              >
                {/* Header del Día */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-bold px-2 py-0.5 rounded-md ${
                      isToday
                        ? 'bg-[#8B44F7] text-white shadow-sm'
                        : isSelected
                        ? 'text-[#E2B86E] font-black'
                        : cell.isCurrentMonth
                        ? 'text-gray-300'
                        : 'text-gray-600'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {/* Botón flotante para agregar evento directo en este día */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddModal(cell.dateStr);
                    }}
                    title="Agregar evento este día"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg bg-[#522B80] hover:bg-[#8B44F7] text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lista de Eventos en este Día */}
                <div className="space-y-1 my-1 overflow-hidden flex-1 flex flex-col justify-start">
                  {dayEvents.slice(0, 2).map((evt) => {
                    const cfg = EVENT_TYPES_CONFIG[evt.type] || EVENT_TYPES_CONFIG.other;
                    return (
                      <div
                        key={evt.id}
                        className={`px-2 py-0.5 rounded text-[11px] truncate font-medium border flex items-center space-x-1.5 ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dotColor }} />
                        <span className="truncate">{evt.title}</span>
                      </div>
                    );
                  })}

                  {dayEvents.length > 2 && (
                    <div className="text-[10px] sm:text-xs text-[#E2B86E] font-bold px-1">
                      +{dayEvents.length - 2} más
                    </div>
                  )}
                </div>

                {/* Puntos o indicador de tipo */}
                {dayEvents.length > 0 && (
                  <div className="flex items-center space-x-1 pt-0.5">
                    {dayEvents.map((evt) => (
                      <span
                        key={evt.id}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: EVENT_TYPES_CONFIG[evt.type]?.dotColor || '#8B44F7' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
