import React, { useState } from 'react';
import { Users, Search, Crown, Trash2, Edit3, Globe, Calendar, Filter } from 'lucide-react';
import type { TeamMember, Roster, TeamRole } from '../types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface MembersTableProps {
  members: TeamMember[];
  rosters: Roster[];
  isCeo: boolean;
  onUpdateRole: (memberId: string, newRole: TeamRole) => void;
  onOpenAssignModal: (member: TeamMember) => void;
  onRemoveMember: (memberId: string, nick: string) => void;
}

const TEAM_ROLES: TeamRole[] = ['CEO', 'Player', 'Coach', 'Manager', 'Creador de contenido', 'Staff'];

export const MembersTable: React.FC<MembersTableProps> = ({
  members,
  rosters,
  isCeo,
  onUpdateRole,
  onOpenAssignModal,
  onRemoveMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.country && m.country.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || m.teamRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRosterName = (rosterId: string) => {
    const r = rosters.find((item) => item.id === rosterId);
    return r ? r.name : 'Roster Desconocido';
  };

  const getRoleBadgeVariant = (role: TeamRole) => {
    switch (role) {
      case 'CEO':
        return 'gold';
      case 'Player':
        return 'purple';
      case 'Coach':
        return 'outline';
      case 'Manager':
        return 'success';
      case 'Staff':
        return 'dark';
      default:
        return 'purple';
    }
  };

  return (
    <div className="space-y-4 bg-[#140b21] border border-[#26143E] rounded-2xl p-5 shadow-xl">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#26143E]">
        <div className="space-y-0.5">
          <h3 className="text-base font-black text-white tracking-wide flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#8B44F7]" />
            <span>Integrantes & Plantilla del Equipo ({filteredMembers.length})</span>
          </h3>
          <p className="text-xs text-gray-400">Listado oficial de todos los miembros registrados en URS Gamara.</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar integrante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#180d29] border border-[#522B80]/60 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-100 placeholder-gray-400 focus:outline-none focus:border-[#8B44F7]"
            />
          </div>

          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#180d29] border border-[#522B80]/60 rounded-lg px-2.5 py-2 text-xs text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los roles</option>
              {TEAM_ROLES.map((r) => (
                <option key={r} value={r} className="bg-[#140b21]">
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-[#180d29] text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-[#26143E]">
            <tr>
              <th className="py-3 px-4">Integrante</th>
              <th className="py-3 px-4">Rol en el Equipo</th>
              <th className="py-3 px-4">Roster(s) Asignados</th>
              <th className="py-3 px-4">Residencia & Nacimiento</th>
              {isCeo && <th className="py-3 px-4 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#26143E]">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={isCeo ? 5 : 4} className="py-8 text-center text-gray-500 italic">
                  No se encontraron integrantes con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-[#180d29]/60 transition-colors">
                  {/* Member Name & Email */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8B44F7] to-[#522B80] flex items-center justify-center font-bold text-white shadow shrink-0">
                        {member.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs flex items-center space-x-1.5">
                          <span>{member.displayName}</span>
                          {member.gameTag && (
                            <span className="text-[10px] text-[#E2B86E] font-mono bg-[#26143E] px-1.5 py-0.5 rounded border border-[#8B44F7]/30">
                              {member.gameTag}
                            </span>
                          )}
                          {member.teamRole === 'CEO' && (
                            <span title="CEO del equipo">
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400">{member.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Team Role */}
                  <td className="py-3.5 px-4">
                    {isCeo ? (
                      <select
                        value={member.teamRole}
                        onChange={(e) => onUpdateRole(member.id, e.target.value as TeamRole)}
                        className="bg-[#180d29] border border-[#522B80]/80 hover:border-[#8B44F7] rounded-lg px-2.5 py-1 text-xs text-white font-semibold cursor-pointer focus:outline-none"
                      >
                        {TEAM_ROLES.map((role) => (
                          <option key={role} value={role} className="bg-[#140b21]">
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(member.teamRole)} className="text-xs font-bold px-2.5 py-0.5">
                        {member.teamRole}
                      </Badge>
                    )}
                  </td>

                  {/* Rosters / Subrole assignments */}
                  <td className="py-3.5 px-4">
                    {member.teamRole === 'Player' || member.teamRole === 'Coach' ? (
                      member.rosterAssignments && member.rosterAssignments.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {member.rosterAssignments.map((asg, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-[#26143E] border border-[#8B44F7]/30 rounded-md text-[11px] text-purple-200"
                            >
                              <strong className="text-white">{getRosterName(asg.rosterId)}</strong>
                              <span className="text-gray-400">•</span>
                              <span className="text-[#E2B86E] font-semibold">{asg.subrole}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-500 italic">Sin roster asignado</span>
                      )
                    ) : member.globalSubrole ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-[#26143E] border border-[#8B44F7]/30 rounded-md text-[11px] text-purple-200">
                        <span className="text-gray-300">Función:</span>
                        <strong className="text-[#E2B86E]">{member.globalSubrole}</strong>
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-500 italic">Plantilla general</span>
                    )}
                  </td>

                  {/* Residence & Birth Date */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5 text-[11px]">
                      {member.country && (
                        <div className="flex items-center space-x-1.5 text-gray-200 font-medium">
                          <Globe className="w-3 h-3 text-[#E2B86E]" />
                          <span>{member.country}</span>
                        </div>
                      )}
                      {member.birthDate && (
                        <div className="flex items-center space-x-1.5 text-gray-400">
                          <Calendar className="w-3 h-3 text-purple-400" />
                          <span>{member.birthDate}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* CEO Actions */}
                  {isCeo && (
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenAssignModal(member)}
                          leftIcon={<Edit3 className="w-3.5 h-3.5 text-[#E2B86E]" />}
                          title="Gestionar Roster"
                        >
                          <span className="hidden sm:inline">Roster</span>
                        </Button>

                        {member.teamRole !== 'CEO' && (
                          <button
                            onClick={() => onRemoveMember(member.id, member.displayName)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors"
                            title="Eliminar integrante"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
