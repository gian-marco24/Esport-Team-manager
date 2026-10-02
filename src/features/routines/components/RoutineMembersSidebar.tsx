import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  ChevronRight,
  Crown,
  Shield,
  UserCheck,
  UserCog,
  Video,
} from 'lucide-react';
import type { TeamMember } from '../../teams/types';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { Badge } from '../../../components/ui/Badge';

interface RoutineMembersSidebarProps {
  members: TeamMember[];
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
}

interface RankedMember {
  member: TeamMember;
  rank: number;
  categoryLabel: string;
  roleBadgeText: string;
  roleVariant: 'gold' | 'purple' | 'emerald' | 'blue' | 'dark';
}

export const RoutineMembersSidebar: React.FC<RoutineMembersSidebarProps> = ({
  members,
  selectedUserId,
  onSelectUser,
}) => {
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Rank members by role hierarchy
  const rankedMembers = useMemo(() => {
    if (!members) return [];

    const isSelf = (m: TeamMember) => {
      if (!user) return false;
      if (user.id && (m.id === user.id || (m as any).userId === user.id)) return true;
      if (user.email && m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase()) return true;
      if (
        user.displayName &&
        m.displayName &&
        m.displayName.trim().toLowerCase() === user.displayName.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    };

    const otherMembers = members.filter((m) => !isSelf(m));

    // Deduplicate any repeated members by email or name
    const uniqueOtherMembers: TeamMember[] = [];
    const seenEmails = new Set<string>();
    const seenNames = new Set<string>();

    for (const m of otherMembers) {
      const emailClean = m.email ? m.email.trim().toLowerCase() : '';
      const nameClean = m.displayName ? m.displayName.trim().toLowerCase() : '';

      if (emailClean && seenEmails.has(emailClean)) continue;
      if (nameClean && seenNames.has(nameClean)) continue;

      if (emailClean) seenEmails.add(emailClean);
      if (nameClean) seenNames.add(nameClean);

      uniqueOtherMembers.push(m);
    }

    const mapped: RankedMember[] = uniqueOtherMembers.map((m) => {
      const isCeo = m.teamRole === 'CEO';
      const isCoach = m.teamRole === 'Coach';
      const isManager = m.teamRole === 'Manager';
      const isCreator = m.teamRole === 'Creador de contenido';
      const isStaff = m.teamRole === 'Staff';
      const isPlayer = m.teamRole === 'Player';

      const subrole = m.rosterAssignments?.[0]?.subrole || '';
      const isTitular = subrole.toLowerCase().includes('titular') || (!subrole && isPlayer);
      const isSuplente = subrole.toLowerCase().includes('suplente');

      let rank = 7;
      let categoryLabel = 'Otros Integrantes';
      let roleBadgeText: string = m.teamRole || 'Miembro';
      let roleVariant: RankedMember['roleVariant'] = 'dark';

      if (isCeo) {
        rank = 1;
        categoryLabel = 'Dirección / CEO';
        roleBadgeText = 'CEO';
        roleVariant = 'gold';
      } else if (isPlayer && isTitular && !isSuplente) {
        rank = 2;
        categoryLabel = 'Jugadores Titulares';
        roleBadgeText = 'Titular';
        roleVariant = 'gold';
      } else if (isPlayer && isSuplente) {
        rank = 3;
        categoryLabel = 'Jugadores Suplentes';
        roleBadgeText = 'Suplente';
        roleVariant = 'purple';
      } else if (isManager) {
        rank = 4;
        categoryLabel = 'Managers';
        roleBadgeText = 'Manager';
        roleVariant = 'blue';
      } else if (isCoach || isStaff) {
        rank = 5;
        categoryLabel = 'Cuerpo Técnico & Staff';
        roleBadgeText = isCoach ? 'Coach' : 'Staff';
        roleVariant = 'purple';
      } else if (isCreator) {
        rank = 6;
        categoryLabel = 'Creadores de Contenido';
        roleBadgeText = 'Creador';
        roleVariant = 'emerald';
      }

      return {
        member: m,
        rank,
        categoryLabel,
        roleBadgeText,
        roleVariant,
      };
    });

    mapped.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.member.displayName.localeCompare(b.member.displayName);
    });

    return mapped;
  }, [members, user]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return rankedMembers;
    const q = searchQuery.toLowerCase();
    return rankedMembers.filter(
      (r) =>
        r.member.displayName.toLowerCase().includes(q) ||
        r.roleBadgeText.toLowerCase().includes(q) ||
        r.categoryLabel.toLowerCase().includes(q)
    );
  }, [rankedMembers, searchQuery]);

  const isSelfSelected = selectedUserId === 'self' || selectedUserId === user?.id;

  return (
    <div className="bg-[#0D0914] border border-[#26143E] rounded-3xl p-4 flex flex-col space-y-3 h-full shadow-inner">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar integrante..."
          className="w-full bg-[#140b21] border border-[#26143E] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B44F7]"
        />
      </div>

      {/* Members Scroll List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 select-none">
        {/* Pinned "Yo" Card */}
        <button
          onClick={() => onSelectUser('self')}
          className={`w-full p-3.5 rounded-2xl text-left flex items-center justify-between border transition-all cursor-pointer ${
            isSelfSelected
              ? 'bg-gradient-to-r from-[#522B80] to-[#26143E] border-[#E2B86E] text-white shadow-lg shadow-[#8B44F7]/25 ring-1 ring-[#E2B86E]/50'
              : 'bg-[#180d29] border-[#522B80]/40 text-gray-200 hover:bg-[#26143E]'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow ${
                isSelfSelected
                  ? 'bg-[#E2B86E] text-black'
                  : 'bg-gradient-to-br from-[#8B44F7] to-[#E2B86E] text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black truncate text-white">Yo</span>
                <span className="text-xs text-[#E2B86E] font-bold">(Tú)</span>
              </div>
              <span className="text-xs text-gray-400 block truncate">
                Mi check-in y entrenamiento propio
              </span>
            </div>
          </div>

          {isSelfSelected ? (
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2B86E] animate-pulse shrink-0" />
          ) : (
            <Badge variant="gold" className="text-xs px-2 py-0.5 font-bold shrink-0">
              Personal
            </Badge>
          )}
        </button>

        {/* Separator / Category Header */}
        <div className="pt-2 pb-1 px-1 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider border-t border-white/[0.08]">
          <span>Directorio de Rutinas</span>
          <span>{filteredMembers.length}</span>
        </div>

        {/* Ranked Member items */}
        {filteredMembers.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No se encontraron integrantes.
          </div>
        ) : (
          filteredMembers.map((item, idx) => {
            const isActive = !isSelfSelected && item.member.id === selectedUserId;
            const prevItem = filteredMembers[idx - 1];
            const showGroupHeader = !prevItem || prevItem.rank !== item.rank;

            return (
              <React.Fragment key={item.member.id}>
                {showGroupHeader && !searchQuery && (
                  <div className="pt-2.5 pb-1 px-1 text-xs font-bold text-[#E2B86E] uppercase tracking-wider flex items-center space-x-1.5">
                    {item.rank === 1 && <Crown className="w-3.5 h-3.5 text-[#E2B86E]" />}
                    {item.rank === 2 && <Shield className="w-3.5 h-3.5 text-[#E2B86E]" />}
                    {item.rank === 4 && <UserCog className="w-3.5 h-3.5 text-blue-400" />}
                    {item.rank === 5 && <UserCheck className="w-3.5 h-3.5 text-[#8B44F7]" />}
                    {item.rank === 6 && <Video className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{item.categoryLabel}</span>
                  </div>
                )}

                <button
                  onClick={() => onSelectUser(item.member.id)}
                  className={`w-full p-3 rounded-2xl text-left flex items-center justify-between border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#522B80] to-[#26143E] border-[#E2B86E] text-white shadow-md shadow-[#8B44F7]/25 ring-1 ring-[#E2B86E]/40'
                      : 'bg-[#140b21]/70 border-[#26143E] text-gray-300 hover:bg-[#180d29] hover:border-[#522B80]'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isActive
                          ? 'bg-[#E2B86E] text-black'
                          : item.rank === 1
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-gradient-to-br from-[#8B44F7] to-[#522B80] text-white'
                      }`}
                    >
                      {item.member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold block truncate">
                        {item.member.displayName}
                      </span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <Badge
                          variant={item.roleVariant}
                          className="text-xs px-2 py-0.5 font-bold"
                        >
                          {item.roleBadgeText}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {isActive ? (
                    <ChevronRight className="w-4 h-4 text-[#E2B86E] shrink-0" />
                  ) : null}
                </button>
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};
