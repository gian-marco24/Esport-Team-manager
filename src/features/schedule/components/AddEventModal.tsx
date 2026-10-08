import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar as CalendarIcon, Users, UserX, AlertTriangle, Shield, Check } from 'lucide-react';
import type { CalendarEvent, EventType, EventScope } from '../types';
import { EVENT_TYPES_CONFIG } from '../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { teamService } from '../../teams/services/teamService';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import type { TeamMember, Roster } from '../../teams/types';

export interface FormattedMemberOption {
  id: string;
  displayName: string;
  gameTag?: string;
  formattedLabel: string;
  category: string;
  rank: number;
  roleBadgeText: string;
}

export interface AbsenceRosterGroup {
  rosterId: string;
  rosterName: string;
  game: string;
  members: Array<{
    id: string;
    displayName: string;
    gameTag?: string;
    formattedLabel: string;
    subrole: string;
  }>;
}

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  members?: TeamMember[];
  rosters?: Roster[];
  onSave: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => Promise<void>;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  members: propMembers,
  rosters: propRosters,
  onSave,
}) => {
  const { user } = useAuthContext();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(propMembers || []);
  const [teamRosters, setTeamRosters] = useState<Roster[]>(propRosters || []);
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
  const [absentPlayer, setAbsentPlayer] = useState('');
  const [absenceReason, setAbsenceReason] = useState('Cita Médica / Salud');
  const [substitutePlayer, setSubstitutePlayer] = useState(''); // Opcional, por defecto sin selección

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cargar miembros y rosters si no se recibieron por props
  useEffect(() => {
    if (propMembers && propMembers.length > 0) {
      setTeamMembers(propMembers);
    }
    if (propRosters && propRosters.length > 0) {
      setTeamRosters(propRosters);
    }

    if (isOpen && (!propMembers || propMembers.length === 0 || !propRosters || propRosters.length === 0)) {
      const fetchData = async () => {
        try {
          const [mList, rList] = await Promise.all([
            teamService.getMembers(URS_GAMARA_TEAM.id),
            teamService.getRosters(URS_GAMARA_TEAM.id),
          ]);
          setTeamMembers(mList);
          setTeamRosters(rList);
        } catch (err) {
          console.error('Error cargando datos para el calendario:', err);
        }
      };
      fetchData();
    }
  }, [isOpen, propMembers, propRosters]);

  // =========================================================================
  // 1. AGRUPACIÓN PARA EVENTOS NORMALES (INTEGRANTES ESPECÍFICOS)
  // Agrupación estricta por ROL PRINCIPAL (sin separar por subrol)
  // Si el CEO tiene un segundo rol (Coach, Player, Staff, etc.), se clasifica en ese rol.
  // =========================================================================
  const roleFormattedMembers = useMemo<FormattedMemberOption[]>(() => {
    if (!teamMembers || teamMembers.length === 0) return [];

    const seen = new Set<string>();
    const uniqueMembers: TeamMember[] = [];

    for (const m of teamMembers) {
      const key = m.id || m.email || m.displayName;
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueMembers.push(m);
      }
    }

    const mapped: FormattedMemberOption[] = uniqueMembers.map((m) => {
      let category = 'Otros Integrantes';
      let roleBadgeText: string = m.teamRole || 'Miembro';
      let rank = 7;

      const isCeo = m.teamRole === 'CEO';
      const isCoach = m.teamRole === 'Coach';
      const isPlayer = m.teamRole === 'Player';
      const isManager = m.teamRole === 'Manager';
      const isCreator = m.teamRole === 'Creador de contenido';
      const isStaff = m.teamRole === 'Staff';

      if (isCeo) {
        // Verificar si el CEO tiene un segundo rol en rosters o subroles
        const coachAsg = m.rosterAssignments?.find((a) =>
          a.subrole?.toLowerCase().includes('coach') || a.subrole?.toLowerCase().includes('analista')
        );
        const playerAsg = m.rosterAssignments?.find((a) =>
          a.subrole?.toLowerCase().includes('player') ||
          a.subrole?.toLowerCase().includes('titular') ||
          a.subrole?.toLowerCase().includes('suplente')
        );
        const managerAsg = m.rosterAssignments?.find((a) =>
          a.subrole?.toLowerCase().includes('manager')
        );

        const sub = (m.globalSubrole || '').toLowerCase();
        const isCoachSub = sub.includes('coach') || sub.includes('entrenador') || sub.includes('analista');
        const isPlayerSub = sub.includes('player') || sub.includes('jugador');
        const isManagerSub = sub.includes('manager');
        const isStaffSub = sub.includes('staff') || sub.includes('moderador') || sub.includes('logística');

        if (playerAsg || isPlayerSub) {
          category = 'Jugadores';
          roleBadgeText = playerAsg?.subrole ? `${playerAsg.subrole} / CEO` : 'Player / CEO';
          rank = 1;
        } else if (coachAsg || isCoachSub) {
          category = 'Cuerpo Técnico & Coaches';
          roleBadgeText = coachAsg?.subrole ? `${coachAsg.subrole} / CEO` : 'Coach / CEO';
          rank = 2;
        } else if (managerAsg || isManagerSub) {
          category = 'Managers & Directiva';
          roleBadgeText = m.globalSubrole ? `${m.globalSubrole} / CEO` : 'Manager / CEO';
          rank = 3;
        } else if (isStaffSub) {
          category = 'Staff Administrativo';
          roleBadgeText = m.globalSubrole ? `${m.globalSubrole} / CEO` : 'Staff / CEO';
          rank = 4;
        } else {
          category = 'Dirección / CEO';
          roleBadgeText = m.globalSubrole || 'CEO';
          rank = 5;
        }
      } else if (isPlayer) {
        category = 'Jugadores';
        roleBadgeText = m.rosterAssignments?.[0]?.subrole || 'Player';
        rank = 1;
      } else if (isCoach) {
        category = 'Cuerpo Técnico & Coaches';
        roleBadgeText = m.rosterAssignments?.[0]?.subrole || m.globalSubrole || 'Coach';
        rank = 2;
      } else if (isManager) {
        category = 'Managers & Directiva';
        roleBadgeText = m.globalSubrole || 'Manager';
        rank = 3;
      } else if (isStaff) {
        category = 'Staff Administrativo';
        roleBadgeText = m.globalSubrole || 'Staff';
        rank = 4;
      } else if (isCreator) {
        category = 'Creadores de Contenido';
        roleBadgeText = 'Creador de contenido';
        rank = 6;
      }

      const tagStr = m.gameTag ? ` ${m.gameTag}` : '';
      const formattedLabel = `${m.displayName}${tagStr} (${roleBadgeText})`;

      return {
        id: m.id,
        displayName: m.displayName,
        gameTag: m.gameTag,
        formattedLabel,
        category,
        rank,
        roleBadgeText,
      };
    });

    // Ordenar primero por jerarquía (rank) y luego por nombre alfabéticamente
    mapped.sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return a.displayName.localeCompare(b.displayName);
    });

    return mapped;
  }, [teamMembers]);

  // Agrupar por categoría de rol para eventos generales
  const roleGroupedMembers = useMemo(() => {
    const groups: Record<string, FormattedMemberOption[]> = {};
    for (const item of roleFormattedMembers) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }, [roleFormattedMembers]);

  const roleCategories = useMemo(() => Object.keys(roleGroupedMembers), [roleGroupedMembers]);

  // =========================================================================
  // 2. AGRUPACIÓN PARA FALTAS PREVISTAS (AUSENCIAS)
  // Agrupación por ROSTER con filtro exclusivo para Players, Coaches o CEOs
  // que pertenezcan a dicho roster.
  // =========================================================================
  const absenceRosterGroups = useMemo<AbsenceRosterGroup[]>(() => {
    if (!teamMembers || teamMembers.length === 0 || !teamRosters || teamRosters.length === 0) {
      return [];
    }

    // Filtrar integrantes que sean Player, Coach o CEO y tengan asignaciones de roster
    const eligibleMembers = teamMembers.filter((m) => {
      const isRoleEligible = m.teamRole === 'Player' || m.teamRole === 'Coach' || m.teamRole === 'CEO';
      const hasRosterAssignment = m.rosterAssignments && m.rosterAssignments.length > 0;
      return isRoleEligible && hasRosterAssignment;
    });

    const groups: AbsenceRosterGroup[] = [];

    for (const roster of teamRosters) {
      const rosterMembers: AbsenceRosterGroup['members'] = [];

      for (const m of eligibleMembers) {
        const asg = m.rosterAssignments.find((a) => a.rosterId === roster.id);
        if (asg) {
          const subrole = asg.subrole || m.teamRole;
          const tagStr = m.gameTag ? ` ${m.gameTag}` : '';
          const formattedLabel = `${m.displayName}${tagStr} (${subrole})`;

          rosterMembers.push({
            id: m.id,
            displayName: m.displayName,
            gameTag: m.gameTag,
            formattedLabel,
            subrole,
          });
        }
      }

      if (rosterMembers.length > 0) {
        // Ordenar alfabéticamente dentro del roster
        rosterMembers.sort((a, b) => a.displayName.localeCompare(b.displayName));

        groups.push({
          rosterId: roster.id,
          rosterName: roster.name,
          game: roster.game,
          members: rosterMembers,
        });
      }
    }

    return groups;
  }, [teamMembers, teamRosters]);

  // Lista plana de integrantes de ausencia para validar / auto-seleccionar
  const allAbsenceMembersList = useMemo(() => {
    const list: string[] = [];
    for (const g of absenceRosterGroups) {
      for (const m of g.members) {
        if (!list.includes(m.formattedLabel)) {
          list.push(m.formattedLabel);
        }
      }
    }
    return list;
  }, [absenceRosterGroups]);

  // Inicializar absentPlayer con el primer miembro elegible de los rosters
  useEffect(() => {
    if (absenceRosterGroups.length > 0) {
      const firstMemberLabel = absenceRosterGroups[0]?.members[0]?.formattedLabel;
      if (firstMemberLabel && (!absentPlayer || !allAbsenceMembersList.includes(absentPlayer))) {
        setAbsentPlayer(firstMemberLabel);
      }
    }
  }, [absenceRosterGroups, absentPlayer, allAbsenceMembersList]);

  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    }
  }, [defaultDate]);

  useEffect(() => {
    if (type === 'absence' && absentPlayer) {
      setTitle(`Falta Prevista - ${absentPlayer}`);
    }
  }, [type, absentPlayer]);

  // Torneo y Showmatch no llevan Hora Fin. Falta Prevista no lleva Horarios.
  const hideEndTime = type === 'tournament' || type === 'showmatch';
  const isAbsence = type === 'absence';

  const toggleMemberSelection = (memberLabel: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberLabel) ? prev.filter((m) => m !== memberLabel) : [...prev, memberLabel]
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
          ? (absentPlayer ? [absentPlayer] : [])
          : scope === 'specific'
          ? selectedMembers
          : [];

      await onSave({
        title: title.trim(),
        type,
        date,
        startTime: isAbsence ? undefined : (startTime.trim() || undefined),
        endTime: isAbsence || hideEndTime ? undefined : (endTime.trim() || undefined),
        scope: type === 'absence' ? 'specific' : scope,
        targetMembers: targetMembersList,
        location: location.trim(),
        link: link.trim(),
        description: description.trim(),
        absenceReason: type === 'absence' ? absenceReason : undefined,
        substitutePlayer: type === 'absence' && substitutePlayer ? substitutePlayer : undefined,
        createdBy: user?.displayName || 'Usuario',
        createdById: user?.id || '',
        status: 'scheduled',
      });

      setTitle('');
      setDescription('');
      setLocation('');
      setLink('');
      setSelectedMembers([]);
      setSubstitutePlayer('');
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Error al guardar el evento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-[#140b21] border border-[#26143E] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header Modal */}
        <div className="p-5 border-b border-[#26143E] flex items-center justify-between bg-gradient-to-r from-[#26143E] to-[#140b21]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#522B80] border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Programar Nuevo Evento</h3>
              <p className="text-xs text-gray-400">Añade partidos, showmatches, reuniones o faltas al calendario</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#26143E] transition-colors"
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
                      if (tKey === 'absence' && absentPlayer) {
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
              placeholder="ej. Torneo Oficial / Showmatch vs Rival / Falta Prevista"
              required
            />
          </div>

          {/* Sección para FALTA PREVISTA (Agrupación por Roster exclusiva de Players, Coaches y CEOs) */}
          {type === 'absence' ? (
            <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-red-300">
                <UserX className="w-4 h-4 text-red-400" />
                <span>Configuración de Ausencia Programada (Por Roster)</span>
              </div>

              {absenceRosterGroups.length === 0 ? (
                <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-lg text-xs text-red-200">
                  No hay jugadores o cuerpo técnico asignados a ningún roster competitivo actualmente.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">
                      Integrante con Ausencia *
                    </label>
                    <select
                      value={absentPlayer}
                      onChange={(e) => {
                        const newAbsent = e.target.value;
                        setAbsentPlayer(newAbsent);
                        if (substitutePlayer === newAbsent) {
                          setSubstitutePlayer('');
                        }
                        setTitle(`Falta Prevista - ${newAbsent}`);
                      }}
                      className="w-full bg-[#0D0914] border border-[#26143E] rounded-lg px-3 py-2 text-xs text-white focus:border-[#8B44F7] outline-none"
                      required
                    >
                      {absenceRosterGroups.map((group) => (
                        <optgroup
                          key={group.rosterId}
                          label={`${group.rosterName} (${group.game})`}
                          className="bg-[#140b21] text-[#E2B86E] font-bold"
                        >
                          {group.members.map((m) => (
                            <option
                              key={`${group.rosterId}-${m.id}`}
                              value={m.formattedLabel}
                              className="bg-[#140b21] text-white font-normal"
                            >
                              {m.formattedLabel}
                            </option>
                          ))}
                        </optgroup>
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
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Suplente / Reemplazo Asignado (Opcional)
                </label>
                <select
                  value={substitutePlayer}
                  onChange={(e) => setSubstitutePlayer(e.target.value)}
                  className="w-full bg-[#0D0914] border border-[#26143E] rounded-lg px-3 py-2 text-xs text-white focus:border-[#8B44F7] outline-none"
                >
                  <option value="">Sin reemplazo asignado (Opcional)</option>
                  {absenceRosterGroups.map((group) => {
                    const availableSubstituteMembers = group.members.filter(
                      (m) => m.formattedLabel !== absentPlayer
                    );
                    if (availableSubstituteMembers.length === 0) return null;

                    return (
                      <optgroup
                        key={`sub-${group.rosterId}`}
                        label={`${group.rosterName} (${group.game})`}
                        className="bg-[#140b21] text-[#E2B86E] font-bold"
                      >
                        {availableSubstituteMembers.map((m) => (
                          <option
                            key={`sub-${group.rosterId}-${m.id}`}
                            value={m.formattedLabel}
                            className="bg-[#140b21] text-white font-normal"
                          >
                            {m.formattedLabel}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
            </div>
          ) : (
            /* Sección para EVENTOS NORMALES (Alcance y Selección por Roles sin Subroles) */
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
                <div className="p-3.5 bg-[#0D0914] border border-[#26143E] rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[#26143E] pb-2">
                    <p className="text-[11px] text-gray-300 font-semibold">
                      Selecciona los destinatarios ({selectedMembers.length} seleccionados):
                    </p>
                    <div className="flex items-center space-x-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setSelectedMembers(roleFormattedMembers.map((m) => m.formattedLabel))}
                        className="text-[#E2B86E] hover:underline font-bold"
                      >
                        Todos
                      </button>
                      <span className="text-gray-600">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedMembers([])}
                        className="text-gray-400 hover:text-white font-bold"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {roleCategories.length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-2 text-center">No hay integrantes registrados en el equipo.</p>
                    ) : (
                      roleCategories.map((cat) => (
                        <div key={cat} className="space-y-1.5">
                          <span className="text-[10px] font-bold text-[#E2B86E]/90 uppercase tracking-wider block">
                            {cat} ({roleGroupedMembers[cat].length})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {roleGroupedMembers[cat].map((m) => {
                              const isChecked = selectedMembers.includes(m.formattedLabel);
                              return (
                                <button
                                  type="button"
                                  key={m.id}
                                  onClick={() => toggleMemberSelection(m.formattedLabel)}
                                  className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                                    isChecked
                                      ? 'bg-[#8B44F7]/30 border-[#8B44F7] text-white shadow-sm ring-1 ring-[#8B44F7]/50'
                                      : 'bg-[#140b21] border-[#26143E] text-gray-300 hover:text-white hover:border-[#522B80]'
                                  }`}
                                >
                                  <div className="truncate pr-1.5">
                                    <span className="font-bold block truncate text-white">
                                      {m.displayName}{m.gameTag ? ` ${m.gameTag}` : ''}
                                    </span>
                                    <span className="text-[10px] text-[#E2B86E] font-medium block truncate">
                                      {m.roleBadgeText}
                                    </span>
                                  </div>
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                      isChecked
                                        ? 'bg-[#8B44F7] border-[#8B44F7] text-white'
                                        : 'border-gray-600 bg-[#0D0914]'
                                    }`}
                                  >
                                    {isChecked && <Check className="w-3 h-3" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fecha y Horarios (Sin Horarios para Falta Prevista, Sin Hora Fin para Torneo y Showmatch) */}
          {isAbsence ? (
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                Fecha de la Falta / Ausencia *
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${hideEndTime ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
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
                  {hideEndTime ? 'Hora del Evento' : 'Hora Inicio'}
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              {!hideEndTime && (
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
              )}
            </div>
          )}

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
