import React from 'react';
import { X, Crown, Users, Gamepad2, Trash2, UserCheck } from 'lucide-react';
import type { Roster, TeamMember } from '../types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { PersonIconsIndicator } from './PersonIconsIndicator';

interface RosterDetailModalProps {
  roster: Roster | null;
  isOpen: boolean;
  onClose: () => void;
  members: TeamMember[];
  isCeo: boolean;
  onDeleteRoster?: (rosterId: string) => void;
}

export const RosterDetailModal: React.FC<RosterDetailModalProps> = ({
  roster,
  isOpen,
  onClose,
  members,
  isCeo,
  onDeleteRoster,
}) => {
  if (!isOpen || !roster) return null;

  // Filter members assigned to this roster with their subroles for this roster
  const assigned = members.flatMap((m) => {
    const assignments = m.rosterAssignments?.filter((a) => a.rosterId === roster.id) || [];
    return assignments.map((a) => ({
      member: m,
      subrole: a.subrole,
    }));
  });

  const coaches = assigned.filter((item) => !item.subrole.startsWith('Player'));
  const headCoach = coaches.find((item) => item.subrole === 'Head coach');
  const otherCoaches = coaches.filter((item) => item.subrole !== 'Head coach');

  const mainPlayers = assigned.filter((item) => item.subrole === 'Player titular');
  const substitutePlayers = assigned.filter((item) => item.subrole === 'Player suplente');

  const isComplete = mainPlayers.length >= roster.maxMainPlayers;

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de eliminar la escuadra "${roster.name}"? Los miembros continuarán en el equipo pero perderán su asignación a esta escuadra.`)) {
      if (onDeleteRoster) {
        onDeleteRoster(roster.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#140b21] border border-[#522B80] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#26143E] flex items-center justify-between bg-gradient-to-r from-[#1d0f30] via-[#26143E]/50 to-[#1d0f30]">
          <div className="flex items-center space-x-4">
            <img
              src={roster.logoUrl || '/logo.png'}
              alt={roster.name}
              className="w-14 h-14 rounded-2xl object-contain bg-[#140b21] p-1 border border-[#8B44F7]/50 shadow-lg"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-black text-white">{roster.name}</h3>
                <Badge variant={isComplete ? 'gold' : 'purple'} className="text-xs font-bold">
                  {isComplete ? 'Completo' : 'Incompleto'}
                </Badge>
              </div>
              <p className="text-xs text-[#8B44F7] font-semibold flex items-center space-x-1.5 mt-0.5">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Escuadra oficial de {roster.game}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#26143E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Summary Person Icon Indicators Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#180d29] border border-[#522B80]/40 rounded-xl flex flex-col items-center justify-center space-y-1.5">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                Titulares ({mainPlayers.length}/{roster.maxMainPlayers})
              </span>
              <PersonIconsIndicator
                total={roster.maxMainPlayers}
                count={mainPlayers.length}
                activeColorClass="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                inactiveColorClass="text-gray-600/40"
                iconSizeClass="w-4 h-4"
                gapClass="space-x-1"
              />
            </div>

            <div className="p-3 bg-[#180d29] border border-[#522B80]/40 rounded-xl flex flex-col items-center justify-center space-y-1.5">
              <span className="text-[10px] text-purple-300 uppercase font-bold tracking-wider block">
                Suplentes ({substitutePlayers.length}/{roster.maxSubstitutes})
              </span>
              <PersonIconsIndicator
                total={roster.maxSubstitutes}
                count={substitutePlayers.length}
                activeColorClass="text-purple-300 drop-shadow-[0_0_6px_rgba(168,85,247,0.7)]"
                inactiveColorClass="text-purple-950/40"
                iconSizeClass="w-4 h-4"
                gapClass="space-x-1"
              />
            </div>

            <div className="p-3 bg-[#180d29] border border-[#522B80]/40 rounded-xl flex flex-col items-center justify-center space-y-1.5">
              <span className="text-[10px] text-[#E2B86E] uppercase font-bold tracking-wider block">
                Coaches ({coaches.length}/{roster.maxCoaches})
              </span>
              <PersonIconsIndicator
                total={roster.maxCoaches}
                count={coaches.length}
                activeColorClass="text-[#E2B86E] drop-shadow-[0_0_8px_rgba(226,184,110,0.7)]"
                inactiveColorClass="text-[#E2B86E]/20"
                iconSizeClass="w-4 h-4"
                gapClass="space-x-1"
              />
            </div>
          </div>

          {/* Cuerpo Técnico / Coaches Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#E2B86E] uppercase tracking-wider flex items-center space-x-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Cuerpo Técnico (Coaches & Analistas)</span>
            </h4>

            {coaches.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-3 bg-[#180d29]/40 rounded-xl border border-dashed border-[#26143E]">
                No hay coaches o analistas asignados a esta escuadra aún.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {headCoach && (
                  <div className="p-3.5 bg-gradient-to-r from-amber-950/40 to-[#180d29] border border-amber-500/50 rounded-xl flex items-center space-x-3 shadow-md">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center font-bold text-amber-300">
                      <Crown className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                        Head Coach (Único)
                      </span>
                      <h5 className="font-bold text-white text-sm">{headCoach.member.displayName}</h5>
                      <span className="text-[11px] text-gray-400">{headCoach.member.email}</span>
                    </div>
                  </div>
                )}

                {otherCoaches.map((item) => (
                  <div
                    key={`${item.member.id}-${item.subrole}`}
                    className="p-3 bg-[#180d29] border border-[#522B80]/40 rounded-xl flex items-center space-x-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#522B80] border border-[#8B44F7]/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                      {item.member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <Badge variant="purple" className="text-[9px] px-1.5 py-0">
                        {item.subrole}
                      </Badge>
                      <h5 className="font-bold text-white text-xs mt-0.5">{item.member.displayName}</h5>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Players Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#E2B86E] uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#8B44F7]" />
              <span>Jugadores Titulares ({mainPlayers.length}/{roster.maxMainPlayers})</span>
            </h4>

            {mainPlayers.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-3 bg-[#180d29]/40 rounded-xl border border-dashed border-[#26143E]">
                Sin jugadores titulares asignados.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mainPlayers.map((item) => (
                  <div
                    key={item.member.id}
                    className="p-3 bg-[#180d29] border border-[#522B80]/40 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8B44F7] to-[#522B80] flex items-center justify-center text-white font-bold text-xs shadow">
                        {item.member.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-xs">{item.member.displayName}</h5>
                        <p className="text-[10px] text-gray-400">{item.member.country || 'Sin país configurado'}</p>
                      </div>
                    </div>
                    <Badge variant="gold" className="text-[9px] px-1.5 py-0">
                      Titular
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Substitute Players Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-purple-400" />
              <span>Jugadores Suplentes ({substitutePlayers.length}/{roster.maxSubstitutes})</span>
            </h4>

            {substitutePlayers.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-3 bg-[#180d29]/40 rounded-xl border border-dashed border-[#26143E]">
                Sin suplentes asignados.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {substitutePlayers.map((item) => (
                  <div
                    key={item.member.id}
                    className="p-3 bg-[#180d29] border border-[#522B80]/40 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-[#26143E] border border-[#8B44F7]/30 flex items-center justify-center text-gray-300 font-bold text-xs">
                        {item.member.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-xs">{item.member.displayName}</h5>
                        <p className="text-[10px] text-gray-400">{item.member.country || 'Sin país configurado'}</p>
                      </div>
                    </div>
                    <Badge variant="purple" className="text-[9px] px-1.5 py-0">
                      Suplente
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#26143E] bg-[#140b21] flex justify-between items-center">
          {isCeo ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Eliminar Roster
            </Button>
          ) : (
            <div />
          )}

          <Button variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
