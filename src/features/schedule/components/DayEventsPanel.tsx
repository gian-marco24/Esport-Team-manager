import React from 'react';
import {
  Plus,
  Clock,
  MapPin,
  ExternalLink,
  Users,
  UserCheck,
  Trash2,
  Calendar as CalendarIcon,
  UserX,
} from 'lucide-react';
import type { CalendarEvent } from '../types';
import { EVENT_TYPES_CONFIG } from '../types';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

interface DayEventsPanelProps {
  selectedDate: string;
  events: CalendarEvent[];
  onOpenAddModal: (date?: string) => void;
  onDeleteEvent: (id: string) => void;
}

export const DayEventsPanel: React.FC<DayEventsPanelProps> = ({
  selectedDate,
  events,
  onOpenAddModal,
  onDeleteEvent,
}) => {
  const formatDateTitle = (dateStr: string) => {
    if (!dateStr) return 'Fecha seleccionada';
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formatted = formatter.format(dateObj);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formattedDate = formatDateTitle(selectedDate);

  return (
    <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col h-full space-y-4">
      {/* PANEL HEADER */}
      <div className="flex items-center justify-between border-b border-[#26143E] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2B86E] animate-pulse" />
            <p className="text-xs text-[#E2B86E] font-bold uppercase tracking-widest">Eventos del Día</p>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white mt-1">{formattedDate}</h3>
        </div>

        <Button
          onClick={() => onOpenAddModal(selectedDate)}
          variant="primary"
          size="sm"
          className="text-xs sm:text-sm font-bold"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nuevo Evento
        </Button>
      </div>

      {/* EVENT LIST */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-[#522B80]">
        {events.length > 0 ? (
          events.map((evt) => {
            const cfg = EVENT_TYPES_CONFIG[evt.type] || EVENT_TYPES_CONFIG.other;

            return (
              <Card
                key={evt.id}
                glow={evt.type === 'tournament' ? 'gold' : 'purple'}
                className="p-4 sm:p-5 space-y-3 bg-[#0D0914]/80 border-[#26143E] hover:border-[#8B44F7]/40 transition-all"
              >
                {/* Header de la tarjeta de evento */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dotColor }} />
                      <span>{cfg.label}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteEvent(evt.id)}
                    title="Eliminar evento"
                    className="text-gray-500 hover:text-red-400 p-1.5 rounded hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Título & Horario */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white leading-snug">{evt.title}</h4>
                  {(evt.startTime || evt.endTime) && (
                    <div className="flex items-center space-x-1.5 text-xs sm:text-sm text-[#E2B86E] mt-1 font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>
                        {evt.startTime || '00:00'} - {evt.endTime || 'Por definir'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Descripción */}
                {evt.description && (
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed bg-[#140b21]/60 p-3 rounded-xl border border-[#26143E]/60">
                    {evt.description}
                  </p>
                )}

                {/* Alcance */}
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#26143E]">
                  <div className="flex items-center space-x-1.5 text-gray-400">
                    {evt.scope === 'all' ? (
                      <span className="flex items-center space-x-1 text-purple-300 font-medium">
                        <Users className="w-3.5 h-3.5 text-[#8B44F7]" />
                        <span>Todo el Roster</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-amber-300 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-[#E2B86E]" />
                        <span>
                          Target: {evt.targetMembers?.join(', ') || 'Miembros asignados'}
                        </span>
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-500">Por {evt.createdBy}</span>
                </div>

                {/* Detalles Específicos para Falta Prevista / Ausencia */}
                {evt.type === 'absence' && (
                  <div className="bg-red-950/40 border border-red-500/30 rounded-lg p-2.5 space-y-1 text-xs text-red-200">
                    <div className="flex items-center space-x-1 font-bold text-red-300">
                      <UserX className="w-3.5 h-3.5" />
                      <span>Detalles de Ausencia Programada</span>
                    </div>
                    {evt.absenceReason && (
                      <p className="text-[11px]">
                        <strong className="text-white">Motivo:</strong> {evt.absenceReason}
                      </p>
                    )}
                    {evt.substitutePlayer && (
                      <p className="text-[11px]">
                        <strong className="text-white">Suplente / Reemplazo:</strong> {evt.substitutePlayer}
                      </p>
                    )}
                  </div>
                )}

                {/* Ubicación o Enlace */}
                {(evt.location || evt.link) && (
                  <div className="flex items-center justify-between gap-2 text-xs pt-1">
                    {evt.location && (
                      <span className="flex items-center space-x-1 text-gray-400 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#8B44F7] shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </span>
                    )}
                    {evt.link && (
                      <a
                        href={evt.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-[#E2B86E] hover:underline font-semibold text-[11px] shrink-0"
                      >
                        <span>Abrir Enlace</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3 bg-[#0D0914]/40 border border-dashed border-[#522B80]/40 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-[#522B80]/40 flex items-center justify-center text-gray-400">
              <CalendarIcon className="w-6 h-6 text-[#E2B86E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Sin eventos agendados</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                No hay actividades para esta fecha. Agrega partidos, scrims o faltas anticipadas.
              </p>
            </div>
            <Button
              onClick={() => onOpenAddModal(selectedDate)}
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Crear Evento para Hoy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
