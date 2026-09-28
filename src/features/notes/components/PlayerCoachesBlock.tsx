import React, { useState } from 'react';
import { UserCheck, User } from 'lucide-react';
import type { TeamMember, Roster } from '../../teams/types';
import { TacticalChatView } from './TacticalChatView';
import { Badge } from '../../../components/ui/Badge';

interface PlayerCoachesBlockProps {
  roster: Roster | null;
  rosterId: string;
  players: TeamMember[];
}

export const PlayerCoachesBlock: React.FC<PlayerCoachesBlockProps> = ({
  rosterId,
  players,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    players[0]?.id || ''
  );

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) || players[0];

  if (!players || players.length === 0) {
    return (
      <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-6 text-center space-y-3 shadow-xl">
        <UserCheck className="w-8 h-8 text-gray-600 mx-auto" />
        <h4 className="text-sm font-bold text-gray-300">Sin jugadores en este roster</h4>
        <p className="text-xs text-gray-500">
          No hay jugadores titulares ni suplentes asignados a la escuadra actual todavía.
        </p>
      </div>
    );
  }

  const channelId = `roster-${rosterId}-player-${selectedPlayer?.id}-coaches`;

  return (
    <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Block Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#26143E]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E]">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-wide flex items-center space-x-2">
              <span>Anotaciones Individuales con Jugadores</span>
              <Badge variant="purple" className="text-[10px] px-1.5 py-0 font-bold">
                Coaching 1-on-1
              </Badge>
            </h3>
            <p className="text-xs text-gray-400">
              Canales privados entre el cuerpo técnico y cada jugador del roster.
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-400">
          Jugadores disponibles: <strong className="text-white">{players.length}</strong>
        </div>
      </div>

      {/* 2-Column: Player Selection Tabs + Chat */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[540px]">
        {/* Left: Player list */}
        <div className="md:col-span-4 lg:col-span-3 bg-[#0D0914] border border-[#26143E] rounded-xl p-2.5 flex flex-col space-y-1.5 overflow-y-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
            Plantilla de Jugadores
          </span>

          <div className="space-y-1.5">
            {players.map((p) => {
              const isActive = p.id === selectedPlayer?.id;
              const asg = p.rosterAssignments?.find((a) => a.rosterId === rosterId);
              const subrole = asg?.subrole || 'Player';
              const isMain = subrole === 'Player titular';

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between border transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#522B80] to-[#26143E] border-[#E2B86E] text-white shadow-lg shadow-[#8B44F7]/20 ring-1 ring-[#E2B86E]/50'
                      : 'bg-[#140b21]/70 border-[#26143E] text-gray-300 hover:bg-[#180d29] hover:border-[#522B80]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isActive
                          ? 'bg-[#E2B86E] text-black'
                          : 'bg-gradient-to-br from-[#8B44F7] to-[#522B80] text-white'
                      }`}
                    >
                      {p.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">{p.displayName}</span>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <Badge
                          variant={isMain ? 'gold' : 'purple'}
                          className="text-[8px] px-1 py-0 font-bold"
                        >
                          {isMain ? 'Titular' : 'Suplente'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#E2B86E] animate-pulse shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Player Coaching Chat */}
        <div className="md:col-span-8 lg:col-span-9 h-full">
          {selectedPlayer ? (
            <TacticalChatView
              key={channelId}
              channelId={channelId}
              title={`Coaching Privado: ${selectedPlayer.displayName}`}
              subtitle={`Espacio confidencial para feedback, VOD reviews y notas con ${selectedPlayer.displayName}`}
              badgeLabel="Coaching 1-on-1"
              icon={<User className="w-5 h-5 text-[#E2B86E]" />}
              emptyPlaceholderMessage={`No hay notas ni observaciones registradas con ${selectedPlayer.displayName}. Escribe un apunte de desempeño o feedback táctico.`}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-gray-500">
              Selecciona un jugador a la izquierda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
