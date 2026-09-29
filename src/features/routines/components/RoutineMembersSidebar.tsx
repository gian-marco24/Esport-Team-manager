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
  User,
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
      if (user.email && m.email && m.email.toLowerCase() === user.email.toLowerCase()) return true;
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

    const mapped: RankedMember[] = otherMembers.map((m) => {
      const isCeo =
        m.teamRole === 'CEO' ||
        m.role === 'ceo' ||
        m.globalSubrole?.toLowerCase().includes('ceo');

      const isCoach =
        m.teamRole === 'Coach' ||
        m.role === 'coach' ||
        m.globalSubrole?.toLowerCase().includes('coach');

      const isManager =
        m.teamRole === 'Manager' ||
        m.role === 'manager' ||
        m.globalSubrole?.toLowerCase().includes('manager');

      const isCreator =
        m.teamRole === 'Creador de contenido' ||
        m.globalSubrole?.toLowerCase().includes('creador');

      const isStaff =
        m.teamRole === 'Staff' ||
        m.role === 'staff' ||
        m.globalSubrole?.toLowerCase().includes('staff');

      const subrole = m.rosterAssignments?.[0]?.subrole || m.globalSubrole || '';
      const isTitular =
        subrole.toLowerCase().includes('titular') || (!subrole && m.teamRole === 'Player');
      const isSuplente = subrole.toLowerCase().includes('suplente');
      const isPlayer = m.teamRole === 'Player' || isTitular || isSuplente;

      let rank = 7;
      let categoryLabel = 'Otros Integrantes';
      let roleBadgeText = m.teamRole || 'Miembro';
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
    <div className="bg-[#0D0914] border border-[#26143E] rounded-3xl p-3 flex flex-col space-y-2 h-full shadow-inner">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar integrante..."
          className="w-full bg-[#140b21] border border-[#26143E] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8B44F7]"
        />
      </div>

      {/* Members Scroll List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 select-none">
        {/* Pinned "Yo" Card */}
        <button
          onClick={() => onSelectUser('self')}
          className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between border transition-all ${
            isSelfSelected
              ? 'bg-gradient-to-r from-[#522B80] to-[#26143E] border-[#E2B86E] text-white shadow-lg shadow-[#8B44F7]/20 ring-1 ring-[#E2B86E]/50'
              : 'bg-[#180d29] border-[#522B80]/40 text-gray-200 hover:bg-[#26143E]'
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow ${
                isSelfSelected
                  ? 'bg-[#E2B86E] text-black'
                  : 'bg-gradient-to-br from-[#8B44F7] to-[#E2B86E] text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black truncate text-white">Yo</span>
                <span className="text-[9px] text-[#E2B86E] font-bold">(Tú)</span>
              </div>
              <span className="text-[10px] text-gray-400 block truncate">
                Mi check-in y entrenamiento propio
              </span>
            </div>
          </div>

          {isSelfSelected ? (
            <span className="w-2 h-2 rounded-full bg-[#E2B86E] animate-pulse shrink-0" />
          ) : (
            <Badge variant="gold" className="text-[7.5px] px-1 py-0 font-bold shrink-0">
              Personal
            </Badge>
          )}
        </button>

        {/* Separator / Category Header */}
        <div className="pt-2 pb-1 px-1 flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-wider border-t border-white/[0.06]">
          <span>Directorio de Rutinas</span>
          <span>{filteredMembers.length}</span>
        </div>

        {/* Ranked Member items */}
        {filteredMembers.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">
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
                  <div className="pt-2 pb-0.5 px-1 text-[8.5px] font-bold text-[#E2B86E]/80 uppercase tracking-wider flex items-center space-x-1">
                    {item.rank === 1 && <Crown className="w-2.5 h-2.5 text-[#E2B86E]" />}
                    {item.rank === 2 && <Shield className="w-2.5 h-2.5 text-[#E2B86E]" />}
                    {item.rank === 4 && <UserCog className="w-2.5 h-2.5 text-blue-400" />}
                    {item.rank === 5 && <UserCheck className="w-2.5 h-2.5 text-[#8B44F7]" />}
                    {item.rank === 6 && <Video className="w-2.5 h-2.5 text-emerald-400" />}
                    <span>{item.categoryLabel}</span>
                  </div>
                )}

                <button
                  onClick={() => onSelectUser(item.member.id)}
                  className={`w-full p-2 rounded-xl text-left flex items-center justify-between border transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#522B80] to-[#26143E] border-[#E2B86E] text-white shadow-md shadow-[#8B44F7]/20 ring-1 ring-[#E2B86E]/40'
                      : 'bg-[#140b21]/70 border-[#26143E] text-gray-300 hover:bg-[#180d29] hover:border-[#522B80]'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
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
                      <span className="text-xs font-bold block truncate">
                        {item.member.displayName}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Badge
                          variant={item.roleVariant}
                          className="text-[7.5px] px-1 py-0 font-bold"
                        >
                          {item.roleBadgeText}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {isActive ? (
                    <ChevronRight className="w-3.5 h-3.5 text-[#E2B86E] shrink-0" />
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
