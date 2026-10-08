import React, { useState, useEffect } from 'react';
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
import { teamService } from '../../teams/services/teamService';
import type { TeamMember, Roster } from '../../teams/types';

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

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function loadData() {
      try {
        const [membersData, rostersData] = await Promise.all([
          teamService.getMembers(URS_GAMARA_TEAM.id),
          teamService.getRosters(URS_GAMARA_TEAM.id),
        ]);
        setMembers(membersData);
        setRosters(rostersData);
      } catch (err) {
        console.error('Error loading team data in schedule page:', err);
      }
    }
    loadData();
  }, []);

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
    <div className="space-y-6 w-full pb-10">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#26143E] via-[#522B80]/80 to-[#26143E] border border-[#8B44F7]/30 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none">
          <CalendarIcon className="w-64 h-64 text-[#E2B86E]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <Badge variant="gold" className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5">
                Calendario & Agenda
              </Badge>
              <span className="text-xs sm:text-sm text-[#E2B86E] font-bold">• {URS_GAMARA_TEAM.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wide">
              Calendario de Eventos & Ausencias
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <Card glow="purple" className="flex items-center space-x-4 p-5 sm:p-6">
          <div className="w-14 h-14 rounded-2xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#8B44F7] shrink-0">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-400 font-semibold">Total de Eventos</p>
            <p className="text-2xl sm:text-3xl font-black text-white">{events.length}</p>
            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Base de datos real
            </p>
          </div>
        </Card>

        <Card glow="gold" className="flex items-center space-x-4 p-5 sm:p-6">
          <div className="w-14 h-14 rounded-2xl bg-[#A88144]/30 border border-[#E2B86E]/40 flex items-center justify-center text-[#E2B86E] shrink-0">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-400 font-semibold">Partidos de Torneo</p>
            <p className="text-2xl sm:text-3xl font-black text-white">{tournamentCount}</p>
            <p className="text-xs text-[#E2B86E] font-semibold mt-0.5">Oficiales agendados</p>
          </div>
        </Card>

        <Card glow="purple" className="flex items-center space-x-4 p-5 sm:p-6">
          <div className="w-14 h-14 rounded-2xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#8B44F7] shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-400 font-semibold">Reuniones de Equipo</p>
            <p className="text-2xl sm:text-3xl font-black text-white">{meetingCount}</p>
            <p className="text-xs text-purple-300 font-semibold mt-0.5">Charlas & Alineaciones</p>
          </div>
        </Card>

        <Card glow="gold" className="flex items-center space-x-4 p-5 sm:p-6">
          <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <UserX className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-400 font-semibold">Faltas Previstas</p>
            <p className="text-2xl sm:text-3xl font-black text-white">{absenceCount}</p>
            <p className="text-xs text-red-300 font-semibold mt-0.5">Ausencias notificadas</p>
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
        members={members}
        rosters={rosters}
        onSave={async (evtData) => {
          await addEvent(evtData);
        }}
      />
    </div>
  );
};
