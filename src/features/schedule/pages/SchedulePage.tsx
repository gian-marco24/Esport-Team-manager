import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trophy,
  Users,
  UserX,
  TrendingUp,
} from 'lucide-react';
import { useScheduleEvents } from '../hooks/useScheduleEvents';
import { CalendarGrid } from '../components/CalendarGrid';
import { DayEventsPanel } from '../components/DayEventsPanel';
import { AddEventModal } from '../components/AddEventModal';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';

export const SchedulePage: React.FC = () => {
  const {
    events,
    eventsByDate,
    selectedDayEvents,
    selectedDate,
    setSelectedDate,
    selectedTypeFilter,
    setSelectedTypeFilter,
    addEvent,
    removeEvent,
  } = useScheduleEvents();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);

  const handleOpenModal = (date?: string) => {
    setModalDefaultDate(date || selectedDate);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const tournamentCount = events.filter((e) => e.type === 'tournament').length;
  const meetingCount = events.filter((e) => e.type === 'meeting').length;
  const absenceCount = events.filter((e) => e.type === 'absence').length;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#26143E] via-[#522B80]/80 to-[#26143E] border border-[#8B44F7]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none">
          <CalendarIcon className="w-64 h-64 text-[#E2B86E]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="gold" className="text-[10px]">
                Calendario & Agenda
              </Badge>
              <span className="text-xs text-[#E2B86E] font-bold">• {URS_GAMARA_TEAM.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              Calendario de Eventos & Ausencias
            </h1>
            <p className="text-xs text-gray-300 max-w-xl">
              Organiza partidos de torneo, fechas límite, días de medios y registra faltas o ausencias previstas del equipo.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Button
              onClick={() => handleOpenModal(selectedDate)}
              variant="primary"
              size="lg"
              className="font-bold shadow-lg shadow-[#8B44F7]/30"
              leftIcon={<Plus className="w-5 h-5" />}
            >
              Programar Evento
            </Button>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glow="purple" className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#8B44F7]">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total de Eventos</p>
            <p className="text-xl font-black text-white">{events.length}</p>
            <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> Base de datos real
            </p>
          </div>
        </Card>

        <Card glow="gold" className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#A88144]/30 border border-[#E2B86E]/40 flex items-center justify-center text-[#E2B86E]">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Partidos de Torneo</p>
            <p className="text-xl font-black text-white">{tournamentCount}</p>
            <p className="text-[10px] text-[#E2B86E] font-semibold mt-0.5">Oficiales agendados</p>
          </div>
        </Card>

        <Card glow="purple" className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#8B44F7]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Reuniones de Equipo</p>
            <p className="text-xl font-black text-white">{meetingCount}</p>
            <p className="text-[10px] text-purple-300 font-semibold mt-0.5">Charlas & Alineaciones</p>
          </div>
        </Card>

        <Card glow="gold" className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Faltas Previstas</p>
            <p className="text-xl font-black text-white">{absenceCount}</p>
            <p className="text-[10px] text-red-300 font-semibold mt-0.5">Ausencias notificadas</p>
          </div>
        </Card>
      </div>

      {/* MAIN SPLIT LAYOUT (65% CALENDAR / 35% DAY DETAILS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LADO IZQUIERDO: CALENDARIO INTERACTIVO (~65% width) */}
        <div className="lg:col-span-8 h-full">
          <CalendarGrid
            eventsByDate={eventsByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onOpenAddModal={handleOpenModal}
            selectedTypeFilter={selectedTypeFilter}
            onFilterChange={setSelectedTypeFilter}
          />
        </div>

        {/* LADO DERECHO: PANEL DE EVENTOS DEL DÍA SELECCIONADO (~35% width) */}
        <div className="lg:col-span-4 h-full">
          <DayEventsPanel
            selectedDate={selectedDate}
            events={selectedDayEvents}
            onOpenAddModal={handleOpenModal}
            onDeleteEvent={removeEvent}
          />
        </div>
      </div>

      {/* MODAL PARA AGREGAR NUEVO EVENTO */}
      <AddEventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        defaultDate={modalDefaultDate}
        onSave={async (evtData) => {
          await addEvent(evtData);
        }}
      />
    </div>
  );
};
