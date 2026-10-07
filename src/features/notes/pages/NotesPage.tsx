import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  Video,
  Crown,
  ChevronRight,
  Gamepad2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { teamService } from '../../teams/services/teamService';
import type { Roster, TeamMember } from '../../teams/types';
import { TacticalChatView } from '../components/TacticalChatView';
import { MapPlaybookBlock } from '../components/MapPlaybookBlock';
import { IndividualNotesTab } from '../components/IndividualNotesTab';
import { PersonalNotesBlock } from '../components/PersonalNotesBlock';
import { WeeklyObjectivesBlock } from '../components/WeeklyObjectivesBlock';
import { Badge } from '../../../components/ui/Badge';

export const NotesPage: React.FC = () => {
  const { user } = useAuthContext();
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedRosterId, setSelectedRosterId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active module tab
  const [activeTab, setActiveTab] = useState<
    'individuales' | 'competitive' | 'creators' | 'management' | 'personal'
  >('individuales');

  // For Creator / Staff 1-on-1 selection in creators section
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('');

  useEffect(() => {
    const loadTeamData = async () => {
      setIsLoading(true);
      try {
        const [fetchedRosters, fetchedMembers] = await Promise.all([
          teamService.getRosters(user?.teamId || 'urs-gamara'),
          teamService.getMembers(user?.teamId || 'urs-gamara'),
        ]);

        setRosters(fetchedRosters);
        setMembers(fetchedMembers);

        // Auto-select user's assigned roster or first available
        const userAssignedRosterId = user?.rosterAssignments?.[0]?.rosterId;
        if (userAssignedRosterId && fetchedRosters.some((r) => r.id === userAssignedRosterId)) {
          setSelectedRosterId(userAssignedRosterId);
        } else if (fetchedRosters.length > 0) {
          setSelectedRosterId(fetchedRosters[0].id);
        }
      } catch (err) {
        console.error('Failed to load team data for notes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamData();
  }, [user]);

  // Determine effective role
  const isCeo = user?.teamRole === 'CEO' || user?.role === 'ceo';
  const isCoach = !isCeo && (user?.teamRole === 'Coach' || user?.role === 'coach');
  const isPlayer = !isCeo && (user?.teamRole === 'Player' || user?.role === 'player');
  const isManager = !isCeo && (user?.teamRole === 'Manager' || user?.role === 'manager');
  const isCreator = !isCeo && (user?.teamRole === 'Creador de contenido');
  const isStaff = !isCeo && (user?.teamRole === 'Staff' || user?.role === 'staff');

  // Determine which tabs are visible based on role
  // "Individuales" is visible for EVERYONE
  const canSeeCompetitive = isCeo || isCoach || isPlayer || isManager;
  const canSeeCreators = isCeo || isCreator || isStaff;
  const canSeeManagement = isCeo || isStaff || isManager;

  // Selected Roster info
  const activeRoster = useMemo(() => {
    return rosters.find((r) => r.id === selectedRosterId) || rosters[0] || null;
  }, [rosters, selectedRosterId]);

  // Content Creators list
  const contentCreators = useMemo(() => {
    return members.filter(
      (m) =>
        m.teamRole === 'Creador de contenido' ||
        m.globalSubrole?.toLowerCase().includes('creador')
    );
  }, [members]);

  // Set default creator selection if CEO or Staff
  useEffect(() => {
    if (contentCreators.length > 0 && !selectedCreatorId) {
      setSelectedCreatorId(contentCreators[0].id);
    }
  }, [contentCreators, selectedCreatorId]);

  const activeRosterId = activeRoster?.id || 'default-roster';

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#8B44F7] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-400">Cargando módulo táctico y notas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Top Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#180d29] via-[#26143E] to-[#140b21] border border-[#522B80]/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <Badge variant="gold" className="text-xs font-bold px-2.5 py-0.5">
                Módulo Táctico & Notas
              </Badge>
              <Badge
                variant={isCeo ? 'gold' : isCoach ? 'purple' : 'dark'}
                className="text-xs font-bold px-2.5 py-0.5"
              >
                Vista de {user?.teamRole || (isCeo ? 'CEO' : user?.role)}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wide flex items-center space-x-2">
              <span>Estrategias, Playbooks & Anotaciones</span>
            </h1>
            <p className="text-sm text-gray-300 max-w-3xl">
              Canales tácticos en tiempo real, anotaciones individuales 1 a 1, libretas de jugadas por mapa y tareas de análisis.
            </p>
          </div>

          {/* Roster Selector (for multi-roster, coaches, players with rosters, or CEO) */}
          {rosters.length > 0 && canSeeCompetitive && (
            <div className="bg-[#140b21]/90 border border-[#522B80] rounded-2xl p-3 flex items-center space-x-2.5 shadow-xl">
              <Gamepad2 className="w-5 h-5 text-[#E2B86E] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Escuadra Activa
                </span>
                <select
                  value={selectedRosterId}
                  onChange={(e) => setSelectedRosterId(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer pr-4"
                >
                  {rosters.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#140b21] text-white">
                      {r.name} ({r.game})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Top Navigation Tabs (Unified across roles with permission checks) */}
      <div className="flex items-center space-x-2 p-2 bg-[#140b21] border border-[#26143E] rounded-2xl overflow-x-auto no-scrollbar">
        {/* Tab 1: Individuales (EVERYONE HAS ACCESS) */}
        <button
          onClick={() => setActiveTab('individuales')}
          className={`flex-1 min-w-[150px] py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'individuales'
              ? 'bg-[#522B80] text-white shadow-lg shadow-[#8B44F7]/25 border border-[#E2B86E]/40'
              : 'text-gray-400 hover:text-white hover:bg-[#180d29]'
          }`}
        >
          <MessageSquare className="w-4.5 h-4.5 text-[#E2B86E]" />
          <span>Individuales</span>
        </button>

        {/* Tab 2: Escuadras & Competitivo */}
        {canSeeCompetitive && (
          <button
            onClick={() => setActiveTab('competitive')}
            className={`flex-1 min-w-[180px] py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'competitive'
                ? 'bg-[#522B80] text-white shadow-lg shadow-[#8B44F7]/25 border border-[#E2B86E]/40'
                : 'text-gray-400 hover:text-white hover:bg-[#180d29]'
            }`}
          >
            <Shield className="w-4.5 h-4.5 text-[#E2B86E]" />
            <span>Escuadras & Competitivo</span>
          </button>
        )}

        {/* Tab 3: Creadores & Contenido */}
        {canSeeCreators && (
          <button
            onClick={() => setActiveTab('creators')}
            className={`flex-1 min-w-[180px] py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'creators'
                ? 'bg-[#522B80] text-white shadow-lg shadow-[#8B44F7]/25 border border-[#E2B86E]/40'
                : 'text-gray-400 hover:text-white hover:bg-[#180d29]'
            }`}
          >
            <Video className="w-4.5 h-4.5 text-[#E2B86E]" />
            <span>Creadores & Contenido</span>
          </button>
        )}

        {/* Tab 4: Directiva & Staff */}
        {canSeeManagement && (
          <button
            onClick={() => setActiveTab('management')}
            className={`flex-1 min-w-[150px] py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'management'
                ? 'bg-[#522B80] text-white shadow-lg shadow-[#8B44F7]/25 border border-[#E2B86E]/40'
                : 'text-gray-400 hover:text-white hover:bg-[#180d29]'
            }`}
          >
            <Crown className="w-4.5 h-4.5 text-[#E2B86E]" />
            <span>Directiva & Staff</span>
          </button>
        )}

        {/* Tab 5: Personal & Metas */}
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 min-w-[160px] py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'personal'
              ? 'bg-[#522B80] text-white shadow-lg shadow-[#8B44F7]/25 border border-[#E2B86E]/40'
              : 'text-gray-400 hover:text-white hover:bg-[#180d29]'
          }`}
        >
          <Sparkles className="w-4.5 h-4.5 text-[#E2B86E]" />
          <span>Mi Libreta & Metas</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB CONTENT 1: INDIVIDUALES (ACCESSIBLE TO ALL ROLES)                     */}
      {/* ========================================================================= */}
      {activeTab === 'individuales' && (
        <div className="animate-fade-in space-y-6">
          <IndividualNotesTab
            roster={activeRoster}
            rosterId={activeRosterId}
            members={members}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 2: ESCUADRAS & COMPETITIVO                                    */}
      {/* ========================================================================= */}
      {activeTab === 'competitive' && canSeeCompetitive && (
        <div className="space-y-6 animate-fade-in">
          {/* Roster General & Coaches-Managers Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roster General Chat */}
            <div className="h-[680px] sm:h-[740px] lg:h-[780px]">
              <TacticalChatView
                channelId={`roster-${activeRosterId}-general`}
                title={`Anotaciones de Escuadra: ${activeRoster?.name || 'Roster General'}`}
                subtitle="Canal general de la escuadra seleccionada."
                badgeLabel="Roster Completo"
                icon={<Users className="w-4 h-4 text-[#8B44F7]" />}
                emptyPlaceholderMessage="Canal general de la escuadra listo para directrices grupales."
              />
            </div>

            {/* Coaches <-> Managers */}
            <div className="h-[680px] sm:h-[740px] lg:h-[780px]">
              <TacticalChatView
                channelId={`roster-${activeRosterId}-coaches-managers`}
                title={`Coaches & Gerencia: ${activeRoster?.name || 'Escuadra'}`}
                subtitle="Supervisión y coordinación entre cuerpo técnico y managers."
                badgeLabel="Coaches & Managers"
                icon={<Shield className="w-4 h-4 text-[#E2B86E]" />}
                emptyPlaceholderMessage="No hay mensajes entre el cuerpo técnico y los managers aún."
              />
            </div>
          </div>

          {/* Playbooks por Mapa */}
          <MapPlaybookBlock roster={activeRoster} rosterId={activeRosterId} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 3: CREADORES & CONTENIDO                                      */}
      {/* ========================================================================= */}
      {activeTab === 'creators' && canSeeCreators && (
        <div className="space-y-6 animate-fade-in">
          {/* Group Chat: Staff <-> Creators */}
          <div className="h-[440px]">
            <TacticalChatView
              channelId="staff-creators"
              title="Canal General: Staff & Creadores de Contenido"
              subtitle="Canal grupal para planificación de transmisiones, eventos de creadores y difusión."
              badgeLabel="Staff & Creadores"
              icon={<Video className="w-4 h-4 text-[#8B44F7]" />}
            />
          </div>

          {/* 1-on-1 DMs with Content Creators (For CEO / Staff) or Direct with CEO (For Creators) */}
          {isCreator ? (
            <div className="h-[460px]">
              <TacticalChatView
                channelId={`creator-${user?.id}-ceo`}
                title="Canal Directo con el CEO / Dirección"
                subtitle="Espacio confidencial para propuestas, acuerdos y patrocinios."
                badgeLabel="Creador & CEO"
                icon={<Crown className="w-4 h-4 text-[#E2B86E]" />}
                emptyPlaceholderMessage="Espacio privado con la dirección de URS Gamara."
              />
            </div>
          ) : (
            <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#26143E]">
                <div>
                  <h3 className="text-base font-black text-white flex items-center space-x-2">
                    <span>Canales Directos con Creadores de Contenido</span>
                    <Badge variant="gold" className="text-[10px] px-1.5 py-0 font-bold">
                      DMs Creadores
                    </Badge>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Conversaciones privadas 1 a 1 con cada creador de contenido de URS Gamara.
                  </p>
                </div>
              </div>

              {contentCreators.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-4 text-center">
                  No hay creadores de contenido registrados en el club actualmente.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[480px]">
                  <div className="md:col-span-4 lg:col-span-3 bg-[#0D0914] border border-[#26143E] rounded-xl p-2.5 flex flex-col space-y-1.5 overflow-y-auto">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                      Creadores ({contentCreators.length})
                    </span>
                    {contentCreators.map((creator) => {
                      const isActive = creator.id === selectedCreatorId;
                      return (
                        <button
                          key={creator.id}
                          onClick={() => setSelectedCreatorId(creator.id)}
                          className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between border transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-[#522B80] to-[#26143E] border-[#E2B86E] text-white'
                              : 'bg-[#140b21]/70 border-[#26143E] text-gray-300 hover:bg-[#180d29]'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <div className="w-7 h-7 rounded-full bg-[#522B80] flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {creator.displayName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold truncate">
                              {creator.displayName}
                            </span>
                          </div>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#E2B86E]" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="md:col-span-8 lg:col-span-9 h-full">
                    {selectedCreatorId ? (
                      <TacticalChatView
                        key={`creator-${selectedCreatorId}-ceo`}
                        channelId={`creator-${selectedCreatorId}-ceo`}
                        title={`Canal Privado con ${
                          contentCreators.find((c) => c.id === selectedCreatorId)
                            ?.displayName || 'Creador'
                        }`}
                        subtitle="Canal 1 a 1 entre dirección/staff y el creador de contenido."
                        badgeLabel="Directo Creador"
                        icon={<Crown className="w-4 h-4 text-[#E2B86E]" />}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-gray-500">
                        Selecciona un creador a la izquierda.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 4: DIRECTIVA & STAFF                                          */}
      {/* ========================================================================= */}
      {activeTab === 'management' && canSeeManagement && (
        <div className="space-y-6 animate-fade-in">
          <div className="h-[520px]">
            <TacticalChatView
              channelId="management-directiva"
              title="Mesa Directiva & Operaciones del Club"
              subtitle="Canal de alta dirección con managers generales, directiva y staff operativo de URS Gamara."
              badgeLabel="Directiva"
              icon={<Crown className="w-4 h-4 text-[#E2B86E]" />}
              emptyPlaceholderMessage="Canal central de toma de decisiones directivas y estratégicas del club."
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT 5: MI LIBRETA & METAS (PERSONAL)                              */}
      {/* ========================================================================= */}
      {activeTab === 'personal' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bloque de Anotaciones Propias */}
            <PersonalNotesBlock />

            {/* Bloque de Objetivos Semanales */}
            <WeeklyObjectivesBlock />
          </div>
        </div>
      )}
    </div>
  );
};
