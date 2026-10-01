import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { UserPlus, Shield, RefreshCw } from 'lucide-react';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { URS_GAMARA_TEAM } from '../config/currentTeam.config';
import { teamService } from '../services/teamService';
import type { TeamMember, Roster, TeamRole } from '../types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { RosterCarousel } from '../components/RosterCarousel';
import { MembersTable } from '../components/MembersTable';
import { GenerateInviteModal } from '../components/GenerateInviteModal';
import { CreateRosterModal } from '../components/CreateRosterModal';
import { RosterDetailModal } from '../components/RosterDetailModal';
import { AssignRosterModal } from '../components/AssignRosterModal';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';

export const TeamPage: React.FC = () => {
  const { user } = useAuthContext();

  const isCeoOrStaff = Boolean(
    user &&
    (user.role === 'ceo' ||
     user.role === 'staff' ||
     user.teamRole === 'CEO' ||
     user.teamRole === 'Staff')
  );

  const isCeo = Boolean(user && (user.role === 'ceo' || user.teamRole === 'CEO'));

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateRosterModalOpen, setIsCreateRosterModalOpen] = useState(false);
  const [selectedRosterForDetail, setSelectedRosterForDetail] = useState<Roster | null>(null);
  const [selectedMemberForAssign, setSelectedMemberForAssign] = useState<TeamMember | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersData, rostersData] = await Promise.all([
        teamService.getMembers(URS_GAMARA_TEAM.id),
        teamService.getRosters(URS_GAMARA_TEAM.id),
      ]);
      setMembers(membersData);
      setRosters(rostersData);
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateRole = async (memberId: string, newRole: TeamRole) => {
    try {
      await teamService.updateMemberRole(memberId, newRole);
      await fetchData();
    } catch (err) {
      alert((err as Error).message || 'Error al actualizar el rol.');
    }
  };

  const handleRemoveMember = async (memberId: string, nick: string) => {
    if (confirm(`¿Estás seguro de eliminar a ${nick} de la plantilla del equipo?`)) {
      try {
        await teamService.removeMemberFromTeam(memberId);
        await fetchData();
      } catch (err) {
        alert((err as Error).message || 'Error al eliminar integrante.');
      }
    }
  };

  const handleDeleteRoster = async (rosterId: string) => {
    try {
      await teamService.deleteRoster(rosterId);
      await fetchData();
    } catch (err) {
      alert((err as Error).message || 'Error al eliminar roster.');
    }
  };

  if (!isCeoOrStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-8 animate-fade-in w-full pb-10">
      {/* Top Header & Invitation Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 sm:p-8 bg-gradient-to-r from-[#1c0c32] via-[#26143E] to-[#1c0c32] border border-[#522B80]/60 rounded-2xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <Badge variant="gold" className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5">
              {URS_GAMARA_TEAM.name}
            </Badge>
            <span className="text-xs sm:text-sm text-[#E2B86E] font-semibold flex items-center space-x-1.5">
              <Shield className="w-4 h-4" />
              <span>Gestión de Plantilla</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wide">Plantilla y Roles</h1>
          <p className="text-xs sm:text-sm text-gray-300">
            Administra los integrantes del equipo, crea rosters competitivos y gestiona sus alineaciones.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="md"
            onClick={fetchData}
            leftIcon={<RefreshCw className="w-4 h-4 text-gray-400" />}
            title="Recargar datos"
          />

          {isCeo && (
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              variant="secondary"
              size="lg"
              className="py-3 px-6 font-bold shadow-lg shadow-[#8B44F7]/25 shrink-0 text-[#1c0c32]"
              leftIcon={<UserPlus className="w-5 h-5 text-[#1c0c32]" />}
            >
              Invitar Integrante
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <LoadingSpinner />
          <p className="text-xs text-gray-400">Cargando plantilla y rosters del equipo...</p>
        </div>
      ) : (
        <>
          {/* Top Section: Rosters Carousel */}
          <RosterCarousel
            rosters={rosters}
            members={members}
            onSelectRoster={(roster) => setSelectedRosterForDetail(roster)}
            onCreateRosterClick={() => setIsCreateRosterModalOpen(true)}
            isCeo={isCeo}
          />

          {/* Bottom Section: Members Table */}
          <MembersTable
            members={members}
            rosters={rosters}
            isCeo={isCeo}
            onUpdateRole={handleUpdateRole}
            onOpenAssignModal={(member) => setSelectedMemberForAssign(member)}
            onRemoveMember={handleRemoveMember}
          />
        </>
      )}

      {/* Modals */}
      <GenerateInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteGenerated={fetchData}
      />

      <CreateRosterModal
        isOpen={isCreateRosterModalOpen}
        onClose={() => setIsCreateRosterModalOpen(false)}
        onRosterCreated={fetchData}
      />

      <RosterDetailModal
        roster={selectedRosterForDetail}
        isOpen={Boolean(selectedRosterForDetail)}
        onClose={() => setSelectedRosterForDetail(null)}
        members={members}
        isCeo={isCeo}
        onDeleteRoster={handleDeleteRoster}
      />

      <AssignRosterModal
        member={selectedMemberForAssign}
        rosters={rosters}
        allMembers={members}
        isOpen={Boolean(selectedMemberForAssign)}
        onClose={() => setSelectedMemberForAssign(null)}
        onUpdated={fetchData}
      />
    </div>
  );
};
