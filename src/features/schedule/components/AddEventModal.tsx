import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Users, UserX, AlertTriangle, Shield } from 'lucide-react';
import type { CalendarEvent, EventType, EventScope } from '../types';
import { EVENT_TYPES_CONFIG, SAMPLE_ROSTER_MEMBERS } from '../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuthContext } from '../../../app/providers/AuthProvider';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSave: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => Promise<void>;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  onSave,
}) => {
  const { user } = useAuthContext();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('tournament');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [scope, setScope] = useState<EventScope>('all');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');

  // Campos específicos para Falta Prevista / Ausencia
  const [absentPlayer, setAbsentPlayer] = useState(SAMPLE_ROSTER_MEMBERS[1]);
  const [absenceReason, setAbsenceReason] = useState('Cita Médica / Salud');
  const [substitutePlayer, setSubstitutePlayer] = useState('Nyx (Suplente)');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    }
  }, [defaultDate]);

  useEffect(() => {
    if (type === 'absence' && !title) {
      setTitle(`Falta Prevista - ${absentPlayer}`);
    }
  }, [type, absentPlayer, title]);

  if (!isOpen) return null;

  const toggleMemberSelection = (member: string) => {
    setSelectedMembers((prev) =>
      prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Por favor ingresa un título para el evento.');
      return;
    }

    if (!date) {
      setFormError('Por favor selecciona una fecha válida.');
      return;
    }

    try {
      setIsSubmitting(true);

      const targetMembersList =
        type === 'absence'
          ? [absentPlayer]
          : scope === 'specific'
          ? selectedMembers
          : [];

      await onSave({
        title: title.trim(),
        type,
        date,
        startTime,
        endTime,
        scope: type === 'absence' ? 'specific' : scope,
        targetMembers: targetMembersList,
        location: location.trim(),
        link: link.trim(),
        description: description.trim(),
        absenceReason: type === 'absence' ? absenceReason : undefined,
        substitutePlayer: type === 'absence' ? substitutePlayer : undefined,
        createdBy: user?.displayName || 'Usuario',
        createdById: user?.id || '',
        status: 'scheduled',
      });

      setTitle('');
      setDescription('');
      setLocation('');
      setLink('');
      setSelectedMembers([]);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Error al guardar el evento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#140b21] border border-[#26143E] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header Modal */}
        <div className="p-5 border-b border-[#26143E] flex items-center justify-between bg-gradient-to-r from-[#26143E] to-[#140b21]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#522B80] border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Programar Nuevo Evento</h3>
              <p className="text-xs text-gray-400">Añade partidos, scrims o faltas al calendario</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#26143E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-200 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Tipo de Evento */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Tipo de Evento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(EVENT_TYPES_CONFIG) as EventType[]).map((tKey) => {
                const cfg = EVENT_TYPES_CONFIG[tKey];
                const isSelected = type === tKey;
                return (
                  <button
                    type="button"
                    key={tKey}
                    onClick={() => {
                      setType(tKey);
                      if (tKey === 'absence' && !title) {
                        setTitle(`Falta Prevista - ${absentPlayer}`);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center space-x-2 ${
                      isSelected
                        ? `${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} ring-2 ring-[#E2B86E]/50 shadow-md`
                        : 'bg-[#0D0914]/60 border-[#26143E] text-gray-400 hover:text-white hover:bg-[#26143E]/50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dotColor }} />
                    <span className="truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Título del Evento */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
              Título del Evento *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej. Scrim vs Leviatán / VCT Qualifiers / Falta de Kronos"
              required
            />
          </div>

          {/* Sección para FALTA PREVISTA */}
          {type === 'absence' ? (
            <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-red-300">
                <UserX className="w-4 h-4 text-red-400" />
                <span>Configuración de Ausencia Programada</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Integrante con Ausencia
                  </label>
                  <select
                    value={absentPlayer}
                    onChange={(e) => setAbsentPlayer(e.target.value)}
                    className="w-full bg-[#0D0914] border border-[#26143E] rounded-lg px-3 py-2 text-xs text-white focus:border-[#8B44F7] outline-none"
                  >
                    {SAMPLE_ROSTER_MEMBERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Motivo de la Falta
                  </label>
                  <select
                    value={absenceReason}
                    onChange={(e) => setAbsenceReason(e.target.value)}
                    className="w-full bg-[#0D0914] border border-[#26143E] rounded-lg px-3 py-2 text-xs text-white focus:border-[#8B44F7] outline-none"
                  >
                    <option value="Cita Médica / Salud">Cita Médica / Salud</option>
                    <option value="Estudios / Exámenes">Estudios / Exámenes</option>
                    <option value="Asunto Personal / Familiar">Asunto Personal / Familiar</option>
                    <option value="Trabajo / Compromiso">Trabajo / Compromiso</option>
                    <option value="Viaje">Viaje</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Suplente / Reemplazo Asignado (Opcional)
                </label>
                <select
                  value={substitutePlayer}
                  onChange={(e) => setSubstitutePlayer(e.target.value)}
                  className="w-full bg-[#0D0914] border border-[#26143E] rounded-lg px-3 py-2 text-xs text-white focus:border-[#8B44F7] outline-none"
                >
                  <option value="">Sin reemplazo asignado</option>
                  {SAMPLE_ROSTER_MEMBERS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                Alcance del Evento
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                    scope === 'all'
                      ? 'bg-[#522B80] border-[#E2B86E] text-white shadow-md'
                      : 'bg-[#0D0914]/60 border-[#26143E] text-gray-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 text-[#E2B86E]" />
                  <span>Equipo / Roster Completo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScope('specific')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                    scope === 'specific'
                      ? 'bg-[#522B80] border-[#E2B86E] text-white shadow-md'
                      : 'bg-[#0D0914]/60 border-[#26143E] text-gray-400 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4 text-[#8B44F7]" />
                  <span>Integrantes Específicos</span>
                </button>
              </div>

              {scope === 'specific' && (
                <div className="p-3 bg-[#0D0914] border border-[#26143E] rounded-xl space-y-2">
                  <p className="text-[11px] text-gray-300 font-semibold">Selecciona los integrantes destinatarios:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SAMPLE_ROSTER_MEMBERS.map((m) => {
                      const isChecked = selectedMembers.includes(m);
                      return (
                        <button
                          type="button"
                          key={m}
                          onClick={() => toggleMemberSelection(m)}
                          className={`p-2 rounded-lg border text-left text-[11px] font-medium transition-all ${
                            isChecked
                              ? 'bg-[#8B44F7]/30 border-[#8B44F7] text-white'
                              : 'bg-[#140b21] border-[#26143E] text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fecha y Horarios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Fecha *
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Hora Inicio
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Hora Fin
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Ubicación y Enlace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Lugar / Servidor / Canal
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ej. Discord Canal #1 / Servidor BR-1"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Enlace Directo (URL)
              </label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="ej. https://twitch.tv/ stream o meet link"
              />
            </div>
          </div>

          {/* Descripción / Notas */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
              Descripción & Notas Adicionales
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Agrega notas de alineación, recordatorios o enlaces adicionales..."
              className="w-full bg-[#0D0914] border border-[#26143E] rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:border-[#8B44F7] focus:ring-1 focus:ring-[#8B44F7] outline-none"
            />
          </div>

          {/* Footer Acciones */}
          <div className="pt-4 border-t border-[#26143E] flex items-center justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Guardar Evento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
