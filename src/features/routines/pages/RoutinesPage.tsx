import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Dumbbell,
  ShieldAlert,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { routinesService } from '../services/routinesService';
import { teamService } from '../../teams/services/teamService';
import type { Routine, UserRoutineMonthCheckIn } from '../types';
import type { TeamMember } from '../../teams/types';
import { RoutineCarouselHeader } from '../components/RoutineCarouselHeader';
import { RoutineCheckInGrid } from '../components/RoutineCheckInGrid';
import { RoutineMembersSidebar } from '../components/RoutineMembersSidebar';
import { RoutineModal } from '../components/RoutineModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export const RoutinesPage: React.FC = () => {
  const { user } = useAuthContext();

  // Current yearMonth string default: "YYYY-MM"
  const now = new Date();
  const defaultYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Page state
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeRoutineIndex, setActiveRoutineIndex] = useState<number>(0);
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(defaultYm);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('self');
  const [monthCheckIn, setMonthCheckIn] = useState<UserRoutineMonthCheckIn>({
    id: `self_${defaultYm}`,
    userId: '',
    yearMonth: defaultYm,
    routineId: '',
    checkIns: {},
    updatedAt: new Date().toISOString(),
  });
  const [_isLoading, setIsLoading] = useState<boolean>(true);
  const [isGridLoading, setIsGridLoading] = useState<boolean>(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  // Role permissions
  const roleStr = (user?.role || '').toLowerCase();
  const teamRoleStr = (user?.teamRole || '').toLowerCase();

  const isCeo = roleStr === 'ceo' || teamRoleStr === 'ceo';
  const isCoach = roleStr === 'coach' || teamRoleStr === 'coach';
  const isManager = roleStr === 'manager' || teamRoleStr === 'manager' || roleStr === 'staff';
  const isPlayer = roleStr === 'player' || teamRoleStr === 'player' || teamRoleStr === 'titular' || teamRoleStr === 'suplente';

  // Allowed to view module: CEO, Coach, Manager/Staff, Player (or if authenticated)
  const isEligible = isCeo || isCoach || isManager || isPlayer || Boolean(user);
  const canManageRoutines = isCeo || isCoach;
  const isCoachOrManagerView = isCeo || isCoach || isManager;

  // Effective user ID for check-in tracking
  const effectiveUserId = useMemo(() => {
    if (selectedUserId === 'self' || !selectedUserId) {
      return user?.id || 'current-user';
    }
    return selectedUserId;
  }, [selectedUserId, user?.id]);

  // Selected member object for display
  const selectedMemberObj = useMemo(() => {
    if (selectedUserId === 'self' || selectedUserId === user?.id) {
      return {
        id: user?.id || 'self',
        displayName: `${user?.displayName || 'Mi Usuario'} (Tú)`,
        teamRole: user?.teamRole || (isCeo ? 'CEO' : isCoach ? 'Coach' : 'Player'),
      };
    }
    const found = members.find((m) => m.id === selectedUserId || (m as any).userId === selectedUserId);
    if (found) return found;
    return {
      id: selectedUserId,
      displayName: 'Jugador',
      teamRole: 'Player',
    };
  }, [selectedUserId, user, members, isCeo, isCoach]);

  // Load initial routines & members list
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [fetchedRoutines, fetchedMembers] = await Promise.all([
          routinesService.getRoutines(),
          teamService.getMembers(user?.teamId || 'urs-gamara'),
        ]);

        if (!isMounted) return;
        setRoutines(fetchedRoutines);
        setMembers(fetchedMembers || []);

        if (fetchedRoutines.length > 0) {
          setActiveRoutineIndex(0);
        }
      } catch (err) {
        console.error('Failed to load routines data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [user?.teamId]);

  // Load check-in sheet data for the selected user and month
  const loadCheckInData = useCallback(async () => {
    if (!effectiveUserId) return;
    setIsGridLoading(true);
    try {
      const [checkIn, assignedRoutineId] = await Promise.all([
        routinesService.getUserMonthCheckIn(effectiveUserId, currentYearMonth),
        routinesService.getUserAssignedRoutine(effectiveUserId, currentYearMonth),
      ]);

      const effectiveRoutineId = checkIn.routineId || assignedRoutineId || (routines[0]?.id ?? '');
      setMonthCheckIn({
        ...checkIn,
        routineId: effectiveRoutineId,
      });
    } catch (err) {
      console.error('Failed to load user check-in sheet:', err);
    } finally {
      setIsGridLoading(false);
    }
  }, [effectiveUserId, currentYearMonth, routines]);

  useEffect(() => {
    loadCheckInData();
  }, [loadCheckInData]);

  // Determine which routine is currently displayed in the grid
  const gridActiveRoutine = useMemo(() => {
    if (!routines.length) return null;
    if (monthCheckIn.routineId) {
      const found = routines.find((r) => r.id === monthCheckIn.routineId);
      if (found) return found;
    }
    return routines[0] || null;
  }, [routines, monthCheckIn.routineId]);

  // Carousel current routine
  const currentCarouselRoutine = routines[activeRoutineIndex] || routines[0] || null;

  // Check-in toggle handler
  const handleToggleCheckIn = async (exerciseId: string, day: number) => {
    const routineIdToUse = gridActiveRoutine?.id || currentCarouselRoutine?.id || '';
    if (!effectiveUserId || !routineIdToUse) return;

    // Optimistic local state update
    setMonthCheckIn((prev) => {
      const currentDaysMap = prev.checkIns[exerciseId] || {};
      const newDaysMap = {
        ...currentDaysMap,
        [day]: !currentDaysMap[day],
      };

      return {
        ...prev,
        routineId: routineIdToUse,
        checkIns: {
          ...prev.checkIns,
          [exerciseId]: newDaysMap,
        },
        updatedAt: new Date().toISOString(),
      };
    });

    try {
      await routinesService.toggleCheckIn(effectiveUserId, currentYearMonth, routineIdToUse, exerciseId, day);
    } catch (err) {
      console.error('Failed to save check-in state:', err);
      // Re-sync on failure
      loadCheckInData();
    }
  };

  // Routine assignment to user for active month
  const handleAssignRoutine = async (routineId: string) => {
    if (!effectiveUserId) return;
    try {
      await routinesService.assignRoutineToUser(effectiveUserId, routineId, currentYearMonth);
      setMonthCheckIn((prev) => ({
        ...prev,
        routineId,
      }));
    } catch (err) {
      console.error('Failed to assign routine to user:', err);
    }
  };

  // Routine CRUD
  const handleOpenCreateModal = () => {
    setEditingRoutine(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (routine: Routine) => {
    setEditingRoutine(routine);
    setIsModalOpen(true);
  };

  const handleSaveRoutine = async (routineData: Partial<Routine>) => {
    try {
      if (editingRoutine) {
        const updated = await routinesService.updateRoutine(editingRoutine.id, routineData);
        setRoutines((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const created = await routinesService.createRoutine({
          ...routineData,
          createdBy: user?.id,
        });
        setRoutines((prev) => [created, ...prev]);
        setActiveRoutineIndex(0);
      }
      setIsModalOpen(false);
      setEditingRoutine(null);
    } catch (err) {
      console.error('Failed to save routine:', err);
      alert('Hubo un error al guardar la rutina.');
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta rutina? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      await routinesService.deleteRoutine(routineId);
      setRoutines((prev) => prev.filter((r) => r.id !== routineId));
      setActiveRoutineIndex(0);
    } catch (err) {
      console.error('Failed to delete routine:', err);
      alert('Hubo un error al eliminar la rutina.');
    }
  };

  if (!isEligible) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-xl shadow-amber-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Módulo Restringido</h2>
        <p className="text-sm text-gray-400 max-w-md">
          El módulo de Check-in de Rutina está disponible exclusivamente para Jugadores, Coaches, CEOs y Managers de URS Gamara.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-12 animate-fade-in">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1E0F35] via-[#26143E] to-[#140b21] border border-[#522B80]/60 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#8B44F7]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <div className="p-2.5 rounded-xl bg-[#522B80]/60 border border-[#E2B86E]/40 text-[#E2B86E]">
                <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <Badge variant="gold" className="text-xs font-black uppercase tracking-wider">
                Entrenamiento Diario & Tracking
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Check-in de Rutina
            </h1>
            <p className="text-sm text-gray-300 max-w-3xl">
              Visualiza las rutinas oficiales de URS Gamara, reproduce los entrenamientos guiados y registra tu progreso diario en la plantilla estilo Excel.
            </p>
          </div>

          {canManageRoutines && (
            <div className="flex items-center space-x-3 shrink-0">
              <Button
                variant="gold"
                onClick={handleOpenCreateModal}
                leftIcon={<Plus className="w-4.5 h-4.5" />}
                className="text-sm font-bold shadow-lg shadow-[#E2B86E]/20"
              >
                Nueva Rutina
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Routine Carousel Top Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#E2B86E]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Rutinas Disponibles
            </h2>
            <Badge variant="purple" className="text-[10px]">
              {routines.length} en catálogo
            </Badge>
          </div>
          {routines.length > 0 && (
            <span className="text-xs text-gray-400">
              Rutina {activeRoutineIndex + 1} de {routines.length}
            </span>
          )}
        </div>

        <RoutineCarouselHeader
          routines={routines}
          currentIndex={activeRoutineIndex}
          onSelectIndex={setActiveRoutineIndex}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenEditModal={handleOpenEditModal}
          onDeleteRoutine={handleDeleteRoutine}
          canManage={canManageRoutines}
        />
      </div>

      {/* Main Bottom Section: Member Directory + Excel Sheet */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#8B44F7]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Planilla de Seguimiento Mensual
            </h2>
          </div>
          {isCoachOrManagerView && (
            <span className="text-xs text-[#E2B86E] flex items-center space-x-1 font-medium">
              <span>Panel de Coach / CEO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {isCoachOrManagerView ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Member Directory Sidebar */}
            <div className="lg:col-span-4 xl:col-span-3">
              <RoutineMembersSidebar
                members={members}
                selectedUserId={selectedUserId}
                onSelectUser={(uid) => setSelectedUserId(uid)}
              />
            </div>

            {/* Right Excel Sheet Check-in Grid */}
            <div className="lg:col-span-8 xl:col-span-9 min-w-0">
              {isGridLoading ? (
                <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#8B44F7] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-400">Cargando check-ins del jugador...</p>
                </div>
              ) : (
                <RoutineCheckInGrid
                  selectedUser={selectedMemberObj}
                  routines={routines}
                  activeRoutine={gridActiveRoutine}
                  yearMonth={currentYearMonth}
                  onYearMonthChange={setCurrentYearMonth}
                  monthCheckIn={monthCheckIn}
                  onToggleCheckIn={handleToggleCheckIn}
                  onAssignRoutineToUserMonth={canManageRoutines ? handleAssignRoutine : undefined}
                  canAssignRoutine={canManageRoutines}
                  isSelfView={selectedUserId === 'self' || selectedUserId === user?.id}
                />
              )}
            </div>
          </div>
        ) : (
          /* Player View: Full width check-in grid */
          <div className="w-full min-w-0">
            {isGridLoading ? (
              <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#8B44F7] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Cargando tu progreso mensual...</p>
              </div>
            ) : (
              <RoutineCheckInGrid
                selectedUser={{
                  id: user?.id || 'self',
                  displayName: `${user?.displayName || 'Mi Usuario'} (Tú)`,
                  teamRole: user?.teamRole || 'Player',
                }}
                routines={routines}
                activeRoutine={gridActiveRoutine}
                yearMonth={currentYearMonth}
                onYearMonthChange={setCurrentYearMonth}
                monthCheckIn={monthCheckIn}
                onToggleCheckIn={handleToggleCheckIn}
                canAssignRoutine={false}
                isSelfView={true}
              />
            )}
          </div>
        )}
      </div>

      {/* Routine Modal (Create / Edit) */}
      <RoutineModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRoutine(null);
        }}
        onSave={handleSaveRoutine}
        initialRoutine={editingRoutine}
      />
    </div>
  );
};
