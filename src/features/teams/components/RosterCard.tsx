import React from 'react';
import { Gamepad2, ChevronRight } from 'lucide-react';
import type { Roster, TeamMember } from '../types';
import { Badge } from '../../../components/ui/Badge';
import { PersonIconsIndicator } from './PersonIconsIndicator';

interface RosterCardProps {
  roster: Roster;
  members: TeamMember[];
  onClick: () => void;
}

export const RosterCard: React.FC<RosterCardProps> = ({ roster, members, onClick }) => {
  const mainPlayersCount = members.filter((m) =>
    m.rosterAssignments?.some((a) => a.rosterId === roster.id && a.subrole === 'Player titular')
  ).length;

  const coachCount = members.filter((m) =>
    m.rosterAssignments?.some((a) => a.rosterId === roster.id && !a.subrole.startsWith('Player'))
  ).length;

  const isComplete = mainPlayersCount >= roster.maxMainPlayers;

  return (
    <div
      onClick={onClick}
      className="group relative bg-[#180d29] hover:bg-[#201238] border border-[#522B80]/60 hover:border-[#8B44F7] rounded-2xl p-5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-[#8B44F7]/15 flex flex-col justify-between w-80 shrink-0 select-none"
    >
      {/* Top Banner & Status Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="relative">
          <img
            src={roster.logoUrl || '/logo.png'}
            alt={roster.name}
            className="w-12 h-12 rounded-xl object-contain bg-[#140b21] p-1 border border-[#8B44F7]/40 shadow-md group-hover:scale-105 transition-transform"
          />
        </div>

        <Badge variant={isComplete ? 'gold' : 'purple'} className="text-[10px] px-2.5 py-0.5 font-bold">
          {isComplete ? 'Roster Completo' : 'Incompleto'}
        </Badge>
      </div>

      {/* Roster Title & Game */}
      <div className="space-y-1 mb-4">
        <h4 className="font-black text-white text-base group-hover:text-[#E2B86E] transition-colors line-clamp-1">
          {roster.name}
        </h4>
        <span className="text-xs text-[#8B44F7] font-semibold flex items-center space-x-1">
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>{roster.game}</span>
        </span>
      </div>

      {/* Person Icon Indicators */}
      <div className="pt-3 border-t border-[#26143E] flex items-center justify-between bg-[#140b21]/70 p-3 rounded-xl border border-[#8B44F7]/10">
        {/* Main Players Section */}
        <div className="flex flex-col space-y-1.5">
          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">
            Players ({mainPlayersCount}/{roster.maxMainPlayers})
          </span>
          <PersonIconsIndicator
            total={roster.maxMainPlayers}
            count={mainPlayersCount}
            activeColorClass="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]"
            inactiveColorClass="text-gray-600/40"
            iconSizeClass="w-4 h-4"
            gapClass="space-x-1"
          />
        </div>

        {/* Coaches Section (Separated with greater space to the right) */}
        <div className="flex flex-col space-y-1.5 pl-4 border-l border-[#26143E]">
          <span className="text-[9px] text-[#E2B86E] uppercase font-bold tracking-wider">
            Coaches ({coachCount}/{roster.maxCoaches})
          </span>
          <PersonIconsIndicator
            total={roster.maxCoaches}
            count={coachCount}
            activeColorClass="text-[#E2B86E] drop-shadow-[0_0_8px_rgba(226,184,110,0.6)]"
            inactiveColorClass="text-[#E2B86E]/20"
            iconSizeClass="w-4 h-4"
            gapClass="space-x-1"
          />
        </div>
      </div>

      {/* Action Prompt */}
      <div className="mt-4 pt-2 flex items-center justify-between text-xs text-gray-400 group-hover:text-[#E2B86E] transition-colors">
        <span className="font-semibold text-[11px]">Ver alineación detallada</span>
        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};
