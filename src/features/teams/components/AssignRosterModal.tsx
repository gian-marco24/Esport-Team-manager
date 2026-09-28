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
      if (role === 'Player' || role === 'Coach') {
        // Validation Checks
        for (const assignment of assignments) {
          const targetRoster = rosters.find((r) => r.id === assignment.rosterId);
          if (!targetRoster) continue;

          // Check Head Coach Uniqueness per roster
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

          // Check Total Coaches Limit per roster (max 3)
          if (!assignment.subrole.startsWith('Player')) {
            const currentCoachesCount = allMembers.filter(
              (m) =>
                m.id !== member.id &&
                m.rosterAssignments?.some(
                  (a) => a.rosterId === assignment.rosterId && !a.subrole.startsWith('Player')
                )
            ).length;

            if (currentCoachesCount >= targetRoster.maxCoaches) {
              throw new Error(
                `El roster "${targetRoster.name}" ya alcanzó el límite máximo de ${targetRoster.maxCoaches} coaches/analistas.`
              );
            }
          }

          // Check Substitutes limit (max 3)
          if (assignment.subrole === 'Player suplente') {
            const currentSubsCount = allMembers.filter(
              (m) =>
                m.id !== member.id &&
                m.rosterAssignments?.some(
                  (a) => a.rosterId === assignment.rosterId && a.subrole === 'Player suplente'
                )
            ).length;

            if (currentSubsCount >= targetRoster.maxSubstitutes) {
              throw new Error(
                `El roster "${targetRoster.name}" ya alcanzó el máximo de 3 suplentes.`
              );
            }
          }
        }

        await teamService.updateMemberRosterAssignments(member.id, assignments);
      } else if (role === 'Manager' || role === 'Staff') {
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

          {/* Player or Coach Roster Assignment Form */}
          {(role === 'Player' || role === 'Coach') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Asignación de Roster & Subrol
                </span>

                {(role === 'Coach' || assignments.length === 0) && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddAssignment}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Asignar a Roster
                  </Button>
                )}
              </div>

              {assignments.length === 0 ? (
                <div className="p-4 bg-[#180d29]/60 border border-dashed border-[#522B80] rounded-xl text-center text-xs text-gray-400">
                  Sin escuadra asignada. Haz clic en "Asignar a Roster" arriba.
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
                          label="Subrol en Roster"
                          value={asg.subrole}
                          onChange={(e) =>
                            handleUpdateAssignmentSubrole(
                              index,
                              e.target.value as PlayerSubrole | CoachSubrole
                            )
                          }
                        >
                          {role === 'Player'
                            ? PLAYER_SUBROLES.map((sr) => (
                                <option key={sr} value={sr} className="bg-[#140b21] text-white">
                                  {sr}
                                </option>
                              ))
                            : COACH_SUBROLES.map((sr) => (
                                <option key={sr} value={sr} className="bg-[#140b21] text-white">
                                  {sr} {sr === 'Head coach' ? '(Único por Roster)' : ''}
                                </option>
                              ))}
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
              label="Subrol Interno (Manager)"
              value={globalSubrole}
              onChange={(e) => setGlobalSubrole(e.target.value)}
            >
              <option value="">Sin subrol específico</option>
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
              label="Subrol Interno (Staff)"
              value={globalSubrole}
              onChange={(e) => setGlobalSubrole(e.target.value)}
            >
              <option value="">Sin subrol específico</option>
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
              Los Creadores de contenido forman parte de la plantilla general del equipo sin pertenecer a un roster competitivo específico ni requerir un subrol interno.
            </p>
          )}

          {/* CEO info */}
          {role === 'CEO' && (
            <p className="text-xs text-[#E2B86E] bg-amber-950/40 p-3 rounded-xl border border-amber-500/30 flex items-center space-x-2">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <span>El CEO posee control total del equipo y administra las plantillas y los accesos.</span>
            </p>
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
