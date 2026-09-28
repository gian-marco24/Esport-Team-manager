import React, { useState, useEffect } from 'react';
import { X, Crown, AlertCircle, Plus, Trash2, Check } from 'lucide-react';
import type {
  TeamMember,
  Roster,
  PlayerSubrole,
  CoachSubrole,
  ManagerSubrole,
  StaffSubrole,
  RosterMemberAssignment,
} from '../types';
import { teamService } from '../services/teamService';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';

interface AssignRosterModalProps {
  member: TeamMember | null;
  rosters: Roster[];
  allMembers: TeamMember[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const PLAYER_SUBROLES: PlayerSubrole[] = ['Player titular', 'Player suplente'];
const COACH_SUBROLES: CoachSubrole[] = ['Head coach', 'Assistant coach', 'Performance Coach', 'Analista'];
const MANAGER_SUBROLES: ManagerSubrole[] = ['Manager general', 'Manager deportivo', 'Community manager', 'Otro'];
const STAFF_SUBROLES: StaffSubrole[] = ['Moderador', 'Co-ceo', 'Finanzas', 'Logística', 'Otro'];

export const AssignRosterModal: React.FC<AssignRosterModalProps> = ({
  member,
  rosters,
  allMembers,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [assignments, setAssignments] = useState<RosterMemberAssignment[]>([]);
  const [globalSubrole, setGlobalSubrole] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      setAssignments(member.rosterAssignments || []);
      setGlobalSubrole(member.globalSubrole || '');
      setError(null);
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const role = member.teamRole;

  // Add new roster assignment for Coach or Player
  const handleAddAssignment = () => {
    if (rosters.length === 0) {
      setError('No existen rosters creados aún. Crea un roster primero.');
      return;
    }
    const defaultRosterId = rosters[0].id;
    const defaultSubrole = role === 'Player' ? 'Player titular' : 'Assistant coach';

    setAssignments((prev) => [...prev, { rosterId: defaultRosterId, subrole: defaultSubrole }]);
  };

  const handleRemoveAssignment = (index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAssignmentRoster = (index: number, newRosterId: string) => {
    setAssignments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], rosterId: newRosterId };
      return copy;
    });
  };

  const handleUpdateAssignmentSubrole = (index: number, newSubrole: PlayerSubrole | CoachSubrole) => {
    setAssignments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], subrole: newSubrole };
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (role === 'Player' || role === 'Coach' || role === 'CEO') {
        // Validation Checks
        for (const assignment of assignments) {
          const targetRoster = rosters.find((r) => r.id === assignment.rosterId);
          if (!targetRoster) continue;

          // Check Head Coach Uniqueness per roster (only if not already the head coach)
          if (assignment.subrole === 'Head coach') {
            const existingHeadCoach = allMembers.find(
              (m) =>
                m.id !== member.id &&
                m.rosterAssignments?.some(
                  (a) => a.rosterId === assignment.rosterId && a.subrole === 'Head coach'
                )
            );

            if (existingHeadCoach) {
              throw new Error(
                `El roster "${targetRoster.name}" ya tiene asignado como Head Coach a "${existingHeadCoach.displayName}". Solo puede haber 1 Head Coach por roster.`
              );
            }
          }
        }

        await teamService.updateMemberRosterAssignments(member.id, assignments);
      }
      
      if (role === 'Manager' || role === 'Staff' || role === 'CEO') {
        await teamService.updateMemberGlobalSubrole(member.id, globalSubrole);
      }

      onUpdated();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Error al actualizar la asignación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#140b21] border border-[#522B80] rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#26143E] flex items-center justify-between bg-[#1d0f30]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#522B80] border border-[#8B44F7]/40 flex items-center justify-center text-white font-bold">
              {member.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{member.displayName}</h3>
              <p className="text-xs text-[#E2B86E] font-semibold">Rol de equipo: {member.teamRole}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#26143E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start space-x-2 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Player, Coach or CEO Roster Assignment Form */}
          {(role === 'Player' || role === 'Coach' || role === 'CEO') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Asignación a Roster(s)
                  </span>
                  {role === 'CEO' && (
                    <span className="text-[11px] text-gray-400">
                      Como CEO puedes asignarte a una escuadra específica (como Coach, Player, etc.) manteniendo tu acceso total.
                    </span>
                  )}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddAssignment}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Asignar a Roster
                </Button>
              </div>

              {assignments.length === 0 ? (
                <div className="p-4 bg-[#180d29]/60 border border-dashed border-[#522B80] rounded-xl text-center text-xs text-gray-400">
                  Sin escuadra asignada. Haz clic en "Asignar a Roster" arriba para vincular a un roster competitivo.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((asg, index) => (
                    <div
                      key={index}
                      className="p-3.5 bg-[#180d29] border border-[#522B80]/60 rounded-xl space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select
                          label="Roster / Escuadra"
                          value={asg.rosterId}
                          onChange={(e) => handleUpdateAssignmentRoster(index, e.target.value)}
                        >
                          {rosters.map((r) => (
                            <option key={r.id} value={r.id} className="bg-[#140b21] text-white">
                              {r.name} ({r.game})
                            </option>
                          ))}
                        </Select>

                        <Select
                          label="Posición en Roster"
                          value={asg.subrole}
                          onChange={(e) =>
                            handleUpdateAssignmentSubrole(
                              index,
                              e.target.value as any
                            )
                          }
                        >
                          {role === 'Player' &&
                            PLAYER_SUBROLES.map((sr) => (
                              <option key={sr} value={sr} className="bg-[#140b21] text-white">
                                {sr}
                              </option>
                            ))}
                          {role === 'Coach' &&
                            COACH_SUBROLES.map((sr) => (
                              <option key={sr} value={sr} className="bg-[#140b21] text-white">
                                {sr} {sr === 'Head coach' ? '(Único por Roster)' : ''}
                              </option>
                            ))}
                          {role === 'CEO' && (
                            <>
                              <optgroup label="Cuerpo Técnico / Coaches">
                                {COACH_SUBROLES.map((sr) => (
                                  <option key={sr} value={sr} className="bg-[#140b21] text-white">
                                    {sr}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Jugadores">
                                {PLAYER_SUBROLES.map((sr) => (
                                  <option key={sr} value={sr} className="bg-[#140b21] text-white">
                                    {sr}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Staff & Gestión">
                                <option value="Head coach" className="bg-[#140b21] text-white">Coach / Entrenador</option>
                                <option value="Manager deportivo" className="bg-[#140b21] text-white">Manager deportivo</option>
                                <option value="Staff" className="bg-[#140b21] text-white">Staff de Roster</option>
                              </optgroup>
                            </>
                          )}
                        </Select>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignment(index)}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar de esta escuadra</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manager Global Subrole Form */}
          {role === 'Manager' && (
            <Select
              label="Función en Equipo (Manager)"
              value={globalSubrole}
              onChange={(e) => setGlobalSubrole(e.target.value)}
            >
              <option value="">Sin función específica</option>
              {MANAGER_SUBROLES.map((sr) => (
                <option key={sr} value={sr} className="bg-[#140b21] text-white">
                  {sr}
                </option>
              ))}
            </Select>
          )}

          {/* Staff Global Subrole Form */}
          {role === 'Staff' && (
            <Select
              label="Función en Equipo (Staff)"
              value={globalSubrole}
              onChange={(e) => setGlobalSubrole(e.target.value)}
            >
              <option value="">Sin función específica</option>
              {STAFF_SUBROLES.map((sr) => (
                <option key={sr} value={sr} className="bg-[#140b21] text-white">
                  {sr}
                </option>
              ))}
            </Select>
          )}

          {/* Creador de contenido info */}
          {role === 'Creador de contenido' && (
            <p className="text-xs text-gray-400 bg-[#180d29] p-3 rounded-xl border border-[#522B80]/40">
              Los Creadores de contenido forman parte de la plantilla general del equipo sin pertenecer a un roster competitivo específico.
            </p>
          )}

          {/* CEO info and title */}
          {role === 'CEO' && (
            <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-xs text-[#E2B86E] font-semibold">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Privilegios de CEO & Fundador</span>
              </div>
              <p className="text-[11px] text-gray-300">
                El CEO mantiene acceso administrativo total en todos los módulos aunque esté asignado a una escuadra.
              </p>
            </div>
          )}

          {/* Submit buttons */}
          <div className="pt-2 flex justify-end space-x-3">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="secondary" isLoading={isSubmitting} leftIcon={<Check className="w-4 h-4" />}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
