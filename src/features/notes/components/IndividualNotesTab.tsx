import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  User,
  Crown,
  Shield,
  Video,
  UserCog,
  Search,
  ChevronRight,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import type { TeamMember, Roster } from '../../teams/types';
import { TacticalChatView } from './TacticalChatView';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { Badge } from '../../../components/ui/Badge';

interface IndividualNotesTabProps {
  roster: Roster | null;
  rosterId: string;
  members: TeamMember[];
}

interface RankedMember {
  member: TeamMember;
  rank: number;
  categoryLabel: string;
  roleBadgeText: string;
  roleVariant: 'gold' | 'purple' | 'emerald' | 'blue' | 'dark';
}

export const IndividualNotesTab: React.FC<IndividualNotesTabProps> = ({
  roster: _roster,
  rosterId,
  members,
}) => {
  const { user } = useAuthContext();
  const [selectedTargetId, setSelectedTargetId] = useState<string>('self');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Determine hierarchy rank for each member
  // 1: CEO, 2: Player Titular, 3: Player Suplente, 4: Manager, 5: Staff / Coach, 6: Creador de Contenido, 7: Other
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
        (m as any).role === 'ceo' ||
        m.globalSubrole?.toLowerCase().includes('ceo') ||
        m.globalSubrole?.toLowerCase().includes('directiv');

      const isCoach =
        m.teamRole === 'Coach' ||
        (m as any).role === 'coach' ||
        m.globalSubrole?.toLowerCase().includes('coach') ||
        m.globalSubrole?.toLowerCase().includes('entrenador');

      const isManager =
        m.teamRole === 'Manager' ||
        (m as any).role === 'manager' ||
        m.globalSubrole?.toLowerCase().includes('manager') ||
        m.globalSubrole?.toLowerCase().includes('geren');

      const isCreator =
        m.teamRole === 'Creador de contenido' ||
        m.globalSubrole?.toLowerCase().includes('creador') ||
        m.globalSubrole?.toLowerCase().includes('streamer');

      const isStaff =
        m.teamRole === 'Staff' ||
        (m as any).role === 'staff' ||
        m.globalSubrole?.toLowerCase().includes('staff');

      const rosterAsg = m.rosterAssignments?.find((a) => a.rosterId === rosterId);
      const subrole = rosterAsg?.subrole || m.globalSubrole || '';
      const isTitular =
        subrole.toLowerCase().includes('titular') ||
        (!subrole && m.teamRole === 'Player');
      const isSuplente = subrole.toLowerCase().includes('suplente');
      const isPlayer = m.teamRole === 'Player' || isTitular || isSuplente;

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

    // Sort by rank ascending, then by name ascending
    mapped.sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return a.member.displayName.localeCompare(b.member.displayName);
    });

    return mapped;
  }, [members, user, rosterId]);

  // Filter list by search term
  const filteredRankedMembers = useMemo(() => {
    if (!searchQuery.trim()) return rankedMembers;
    const q = searchQuery.toLowerCase();
    return rankedMembers.filter(
      (r) =>
        r.member.displayName.toLowerCase().includes(q) ||
        r.roleBadgeText.toLowerCase().includes(q) ||
        r.categoryLabel.toLowerCase().includes(q)
    );
  }, [rankedMembers, searchQuery]);

  // Selected target member
  const selectedMemberData = useMemo(() => {
    if (selectedTargetId === 'self') return null;
    return rankedMembers.find((r) => r.member.id === selectedTargetId) || null;
  }, [selectedTargetId, rankedMembers]);

  // Resolve deterministic channel ID
  const activeChannelId = useMemo(() => {
    if (!user) return 'notes-anonymous';
    if (selectedTargetId === 'self') {
      return `notes-user-${user.id}-self`;
    }
    // Deterministic 1-on-1 direct channel between 2 users
    const sortedIds = [user.id, selectedTargetId].sort();
    return `dm-1on1-${sortedIds[0]}-${sortedIds[1]}`;
  }, [user, selectedTargetId]);

  return (
    <div className="bg-[#140b21] border border-[#26143E] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#26143E]">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E] shadow-lg shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center space-x-2.5">
              <span>Anotaciones Individuales & Canales 1 a 1</span>
              <Badge variant="purple" className="text-xs px-2 py-0.5 font-bold">
                Individuales
              </Badge>
            </h3>
            <p className="text-xs sm:text-sm text-gray-400">
              Espacio privado de notas contigo mismo ("Yo") y canales confidenciales ordenados por rol con todo el equipo.
            </p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-gray-400">
          Contactos disponibles: <strong className="text-white">{rankedMembers.length + 1}</strong>
        </div>
      </div>

      {/* Main Box: Left sidebar (list of users) + Right Full Chat (Enlarged & Tall) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[680px] lg:h-[750px]">
        {/* Left Side: Users list */}
        <div className="md:col-span-4 lg:col-span-3 bg-[#0D0914] border border-[#26143E] rounded-2xl p-3 flex flex-col space-y-2.5 overflow-hidden shadow-inner">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar integrante..."
              className="w-full bg-[#140b21] border border-[#26143E] rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B44F7]"
            />
          </div>

          {/* List Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 select-none">
            {/* 1. ALWAYS FIRST: "Yo" (User's own chat) */}
            <button
              onClick={() => setSelectedTargetId('self')}
              className={`w-full p-3 rounded-xl text-left flex items-center justify-between border transition-all ${
                selectedTargetId === 'self'
                  ? 'bg-gradient-to-r from-[#522B80] to-[#26143E] border-[#E2B86E] text-white shadow-lg shadow-[#8B44F7]/20 ring-1 ring-[#E2B86E]/50'
                  : 'bg-[#180d29] border-[#522B80]/40 text-gray-200 hover:bg-[#26143E]'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow ${
                    selectedTargetId === 'self'
                      ? 'bg-[#E2B86E] text-black'
                      : 'bg-gradient-to-br from-[#8B44F7] to-[#E2B86E] text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm font-black truncate text-white">Yo</span>
                    <span className="text-[10px] text-[#E2B86E] font-bold">(Tú)</span>
                  </div>
                  <span className="text-[11px] text-gray-400 block truncate">
                    Mi libreta & apuntes personales
                  </span>
                </div>
              </div>

              {selectedTargetId === 'self' ? (
                <span className="w-2.5 h-2.5 rounded-full bg-[#E2B86E] animate-pulse shrink-0" />
              ) : (
                <Badge variant="gold" className="text-[9px] px-1.5 py-0 font-bold shrink-0">
                  Personal
                </Badge>
              )}
            </button>

            {/* Separator / Category Header */}
            <div className="pt-2.5 pb-1 px-1 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider border-t border-white/[0.06]">
              <span>Directorio del Club</span>
              <span>{filteredRankedMembers.length}</span>
            </div>

            {/* Rendered Member Cards Ordered strictly by Role */}
            {filteredRankedMembers.length === 0 ? (
              <div className="p-4 text-center text-xs sm:text-sm text-gray-500">
                No se encontraron integrantes.
              </div>
            ) : (
              filteredRankedMembers.map((item, idx) => {
                const isActive = item.member.id === selectedTargetId;
                const prevItem = filteredRankedMembers[idx - 1];
                const showGroupHeader = !prevItem || prevItem.rank !== item.rank;

                return (
                  <React.Fragment key={item.member.id}>
                    {showGroupHeader && !searchQuery && (
                      <div className="pt-2.5 pb-1 px-1 text-[10px] font-bold text-[#E2B86E]/80 uppercase tracking-wider flex items-center space-x-1.5">
                        {item.rank === 1 && <Crown className="w-3 h-3 text-[#E2B86E]" />}
                        {item.rank === 2 && <Shield className="w-3 h-3 text-[#E2B86E]" />}
                        {item.rank === 4 && <UserCog className="w-3 h-3 text-blue-400" />}
                        {item.rank === 5 && <UserCheck className="w-3 h-3 text-[#8B44F7]" />}
                        {item.rank === 6 && <Video className="w-3 h-3 text-emerald-400" />}
                        <span>{item.categoryLabel}</span>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedTargetId(item.member.id)}
                      className={`w-full p-2.5 sm:p-3 rounded-xl text-left flex items-center justify-between border transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#522B80] to-[#26143E] border-[#E2B86E] text-white shadow-md shadow-[#8B44F7]/20 ring-1 ring-[#E2B86E]/40'
                          : 'bg-[#140b21]/70 border-[#26143E] text-gray-300 hover:bg-[#180d29] hover:border-[#522B80]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
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
                          <span className="text-xs sm:text-sm font-bold block truncate">
                            {item.member.displayName}
                          </span>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <Badge
                              variant={item.roleVariant}
                              className="text-[9px] px-1.5 py-0 font-bold"
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

        {/* Right Side: Tactical Chat View for Selected Contact */}
        <div className="md:col-span-8 lg:col-span-9 h-full">
          {selectedTargetId === 'self' ? (
            <TacticalChatView
              key="notes-self"
              channelId={activeChannelId}
              title="Anotaciones Personales (Yo)"
              subtitle="Tu espacio privado para borradores, recordatorios, análisis y notas tácticas."
              badgeLabel="Mi Libreta"
              icon={<Sparkles className="w-4 h-4 text-[#E2B86E]" />}
              emptyPlaceholderMessage="Tu canal personal está listo. Escribe notas tácticas, adjunta imágenes o crea tareas."
              allowTasks={true}
            />
          ) : selectedMemberData ? (
            <TacticalChatView
              key={activeChannelId}
              channelId={activeChannelId}
              title={`Anotaciones con ${selectedMemberData.member.displayName}`}
              subtitle={`Canal confidencial 1 a 1 entre ${user?.displayName || 'Tú'} y ${
                selectedMemberData.member.displayName
              } (${selectedMemberData.roleBadgeText}).`}
              badgeLabel={selectedMemberData.roleBadgeText}
              icon={
                selectedMemberData.rank === 1 ? (
                  <Crown className="w-4 h-4 text-[#E2B86E]" />
                ) : (
                  <User className="w-4 h-4 text-[#E2B86E]" />
                )
              }
              emptyPlaceholderMessage={`No hay notas ni mensajes registrados con ${selectedMemberData.member.displayName}. Escribe un apunte o asigna una tarea de análisis.`}
              allowTasks={true}
              peerUser={{
                id: selectedMemberData.member.id,
                displayName: selectedMemberData.member.displayName,
                role: selectedMemberData.roleBadgeText,
                avatarUrl: selectedMemberData.member.avatarUrl,
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-xs sm:text-sm text-gray-500">
              Selecciona un integrante a la izquierda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
