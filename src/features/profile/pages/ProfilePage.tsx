import React, { useState, useEffect, useMemo } from 'react';
import {
  User as UserIcon,
  Shield,
  Target,
  Flame,
  Award,
  Calendar,
  MapPin,
  Mail,
  Gamepad2,
  Swords,
  Sparkles,
  Crosshair,
  Activity,
  CheckCircle2,
  Layers,
  Edit3,
  CheckCircle,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import { teamService } from '../../teams/services/teamService';
import { matchService } from '../../scrims-tournaments/services/matchService';
import type { Roster, TeamMember, TeamRole } from '../../teams/types';
import type { Match } from '../../scrims-tournaments/types';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';
import { EditNicknameModal } from '../components/EditNicknameModal';
import { valorantApiService, type ValorantAgent, type ValorantMapData } from '../../../services/valorantApiService';

interface UserAgentStat {
  agentName: string;
  agentIcon?: string;
  timesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kdaRatio: number;
}

interface UserMapStat {
  mapName: string;
  splashUrl?: string;
  displayIcon?: string;
  timesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kdaRatio: number;
}

interface UserMatchParticipation {
  matchId: string;
  date: string;
  opponentName: string;
  type: string;
  overallScore: string;
  outcome: 'win' | 'loss' | 'draw';
  mapName: string;
  agent?: string;
  agentIcon?: string;
  kills: number;
  deaths: number;
  assists: number;
  firstKills: number;
  kdaRatio: number;
}

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [allRosters, setAllRosters] = useState<Roster[]>([]);
  const [memberData, setMemberData] = useState<TeamMember | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [agents, setAgents] = useState<ValorantAgent[]>([]);
  const [mapsData, setMapsData] = useState<ValorantMapData[]>([]);
  const [isEditNickModalOpen, setIsEditNickModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        const [rosters, members, matchesData, agentList, mapList] = await Promise.all([
          teamService.getRosters(URS_GAMARA_TEAM.id),
          teamService.getMembers(URS_GAMARA_TEAM.id),
          matchService.getMatches(),
          valorantApiService.getAgents(),
          valorantApiService.getMaps(),
        ]);

        setAllRosters(rosters);
        setMatches(matchesData);
        setAgents(agentList);
        setMapsData(mapList);

        if (user) {
          const found = members.find(
            (m) =>
              m.id === user.id ||
              m.email.toLowerCase() === user.email.toLowerCase()
          );
          if (found) {
            setMemberData(found);
          }
        }
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  // Derived role information
  const activeRole: TeamRole =
    memberData?.teamRole ||
    (user?.teamRole as TeamRole) ||
    (user?.role === 'ceo'
      ? 'CEO'
      : user?.role === 'player'
      ? 'Player'
      : user?.role === 'coach'
      ? 'Coach'
      : user?.role === 'manager'
      ? 'Manager'
      : 'Staff');

  const isPlayer = activeRole === 'Player';
  const effectiveGameTag = (memberData?.gameTag || user?.gameTag || '').trim();
  const isMissingGameTag = isPlayer && !effectiveGameTag;
  const displayTag = effectiveGameTag || (isPlayer ? `#${activeRole}` : undefined);

  // Roster assignments
  const userAssignments =
    memberData?.rosterAssignments || user?.rosterAssignments || [];

  const assignedRostersWithRoles = userAssignments.map((assignment) => {
    const foundRoster = allRosters.find((r) => r.id === assignment.rosterId);
    return {
      roster: foundRoster,
      rosterId: assignment.rosterId,
      subrole: assignment.subrole,
    };
  });

  // Calculate age helper
  const birthDateValue = memberData?.birthDate || user?.birthDate;
  const calculateAge = (dateStr?: string) => {
    if (!dateStr) return null;
    const birth = new Date(dateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const age = calculateAge(birthDateValue);

  // Format joined date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No registrada';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
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

  // Deep user statistics calculation across all matches
  const detailedUserStats = useMemo(() => {
    const userNick = (user?.displayName || memberData?.displayName || '').trim().toLowerCase();
    const userTag = (user?.gameTag || memberData?.gameTag || '').trim().toLowerCase();
    const userId = user?.id || memberData?.id;

    let totalMatches = 0;
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalFirstKills = 0;

    const agentMap: Record<string, { times: number; wins: number; losses: number; kills: number; deaths: number; assists: number }> = {};
    const mapPerformanceMap: Record<string, { times: number; wins: number; losses: number; kills: number; deaths: number; assists: number }> = {};
    const participationList: UserMatchParticipation[] = [];

    matches.forEach((m) => {
      const matchMaps = m.maps && m.maps.length > 0 ? m.maps : [];

      matchMaps.forEach((map) => {
        const isMapWon = map.teamScore > map.opponentScore;
        const isMapLost = map.teamScore < map.opponentScore;
        const pStats = map.playerStats || m.playerStats || [];

        const targetP = pStats.find((p) => {
          if (p.isGuest || p.playerNick.toLowerCase().startsWith('invitado')) return false;
          const pNick = p.playerNick.trim().toLowerCase();
          const pTag = (p.gameTag || '').trim().toLowerCase();
          const pId = p.playerId;

          return (
            (userId && pId === userId) ||
            pNick === userNick ||
            (userTag && pTag.includes(userTag))
          );
        });

        if (targetP) {
          totalMatches++;
          if (isMapWon) wins++;
          else if (isMapLost) losses++;
          else draws++;

          totalKills += targetP.kills || 0;
          totalDeaths += targetP.deaths || 0;
          totalAssists += targetP.assists || 0;
          totalFirstKills += targetP.firstKills || 0;

          const pKdaRatio =
            targetP.kdaRatio ??
            (targetP.deaths > 0
              ? Number(((targetP.kills + targetP.assists) / targetP.deaths).toFixed(2))
              : targetP.kills + targetP.assists);

          // Agent accumulation
          const agentKey = targetP.agent || 'Agente';
          if (!agentMap[agentKey]) {
            agentMap[agentKey] = { times: 0, wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0 };
          }
          agentMap[agentKey].times++;
          if (isMapWon) agentMap[agentKey].wins++;
          else if (isMapLost) agentMap[agentKey].losses++;
          agentMap[agentKey].kills += targetP.kills || 0;
          agentMap[agentKey].deaths += targetP.deaths || 0;
          agentMap[agentKey].assists += targetP.assists || 0;

          // Map accumulation
          const mapKey = map.mapName.trim() || 'Mapa';
          if (!mapPerformanceMap[mapKey]) {
            mapPerformanceMap[mapKey] = { times: 0, wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0 };
          }
          mapPerformanceMap[mapKey].times++;
          if (isMapWon) mapPerformanceMap[mapKey].wins++;
          else if (isMapLost) mapPerformanceMap[mapKey].losses++;
          mapPerformanceMap[mapKey].kills += targetP.kills || 0;
          mapPerformanceMap[mapKey].deaths += targetP.deaths || 0;
          mapPerformanceMap[mapKey].assists += targetP.assists || 0;

          // Icon matching
          let agentIcon = targetP.agentIcon;
          if (!agentIcon && targetP.agent) {
            const foundAgent = agents.find(
              (a) => a.displayName.toLowerCase() === targetP.agent!.toLowerCase()
            );
            agentIcon = foundAgent?.displayIcon;
          }

          participationList.push({
            matchId: m.id,
            date: m.date,
            opponentName: m.opponentName,
            type: m.type,
            overallScore: `${map.teamScore} - ${map.opponentScore}`,
            outcome: isMapWon ? 'win' : isMapLost ? 'loss' : 'draw',
            mapName: map.mapName,
            agent: targetP.agent,
            agentIcon,
            kills: targetP.kills,
            deaths: targetP.deaths,
            assists: targetP.assists,
            firstKills: targetP.firstKills || 0,
            kdaRatio: pKdaRatio,
          });
        }
      });
    });

    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
    const avgKills = totalMatches > 0 ? Math.round((totalKills / totalMatches) * 10) / 10 : 0;
    const avgDeaths = totalMatches > 0 ? Math.round((totalDeaths / totalMatches) * 10) / 10 : 0;
    const avgAssists = totalMatches > 0 ? Math.round((totalAssists / totalMatches) * 10) / 10 : 0;
    const avgFirstKills = totalMatches > 0 ? Math.round((totalFirstKills / totalMatches) * 10) / 10 : 0;
    const kdaRatio =
      totalDeaths > 0
        ? Math.round(((totalKills + totalAssists) / totalDeaths) * 100) / 100
        : totalKills + totalAssists;

    // Convert agent map to sorted array (Top 5 most played)
    const agentList: UserAgentStat[] = Object.entries(agentMap)
      .map(([agentName, data]) => {
        const foundAgent = agents.find((a) => a.displayName.toLowerCase() === agentName.toLowerCase());
        const aWinRate = data.times > 0 ? Math.round((data.wins / data.times) * 100) : 0;
        const aKda =
          data.deaths > 0
            ? Math.round(((data.kills + data.assists) / data.deaths) * 100) / 100
            : data.kills + data.assists;

        return {
          agentName,
          agentIcon: foundAgent?.displayIcon,
          timesPlayed: data.times,
          wins: data.wins,
          losses: data.losses,
          winRate: aWinRate,
          kills: data.kills,
          deaths: data.deaths,
          assists: data.assists,
          kdaRatio: aKda,
        };
      })
      .sort((a, b) => b.timesPlayed - a.timesPlayed || b.kdaRatio - a.kdaRatio || b.winRate - a.winRate)
      .slice(0, 5);

    // Convert map stats to sorted array (Top 5 sorted by highest KDA)
    const mapList: UserMapStat[] = Object.entries(mapPerformanceMap)
      .map(([mapName, data]) => {
        const mapMeta = mapsData.find((m) => m.displayName.toLowerCase() === mapName.toLowerCase());
        const mWinRate = data.times > 0 ? Math.round((data.wins / data.times) * 100) : 0;
        const mKda =
          data.deaths > 0
            ? Math.round(((data.kills + data.assists) / data.deaths) * 100) / 100
            : data.kills + data.assists;

        return {
          mapName,
          splashUrl: mapMeta?.splash,
          displayIcon: mapMeta?.displayIcon || mapMeta?.listViewIcon,
          timesPlayed: data.times,
          wins: data.wins,
          losses: data.losses,
          winRate: mWinRate,
          kills: data.kills,
          deaths: data.deaths,
          assists: data.assists,
          kdaRatio: mKda,
        };
      })
      .sort((a, b) => b.kdaRatio - a.kdaRatio || b.winRate - a.winRate || b.timesPlayed - a.timesPlayed)
      .slice(0, 5);

    return {
      totalMatches,
      wins,
      losses,
      draws,
      winRate,
      totalKills,
      totalDeaths,
      totalAssists,
      totalFirstKills,
      avgKills,
      avgDeaths,
      avgAssists,
      avgFirstKills,
      kdaRatio,
      formattedKda: `${avgKills} / ${avgDeaths} / ${avgAssists}`,
      agentList,
      mapList,
      participationList: participationList.reverse(),
    };
  }, [matches, user, memberData, agents, mapsData]);

  const handleSaveNickname = async (newNick: string, newGameTag?: string) => {
    await updateUser({ displayName: newNick, gameTag: newGameTag });
    setMemberData((prev) =>
      prev
        ? { ...prev, displayName: newNick, gameTag: newGameTag }
        : {
            id: user?.id || '',
            email: user?.email || '',
            displayName: newNick,
            gameTag: newGameTag,
            teamRole: activeRole,
            rosterAssignments: userAssignments,
            createdAt: user?.createdAt || new Date().toISOString(),
          }
    );
    setSuccessMessage('¡Nickname actualizado con éxito!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  if (loading) {
    return <LoadingSpinner label="Cargando perfil del usuario..." />;
  }

  return (
    <div className="space-y-6 w-full animate-fadeIn pb-12">
      {/* Missing Nickname / GameTag Warning Banner for Players */}
      {isMissingGameTag && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 border-2 border-amber-500/70 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-amber-950/50 animate-fadeIn">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
              <AlertTriangle className="w-5 h-5 text-amber-400 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-300 tracking-wide flex items-center gap-2">
                <span>Configuración de Nickname & Tag Requerida</span>
                <span className="text-[10px] bg-amber-400 text-black font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Acción Necesaria
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-amber-200/90 mt-1 max-w-2xl leading-relaxed">
                Tu rol activo es <span className="font-bold text-white underline">Player</span>. Para vincular correctamente tus estadísticas en Scrims, Torneos y emparejamiento OCR en partidas, debes configurar tu Nickname y Tag de juego oficial (ej: <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">Nick#TAG</code>). Mientras tanto, tu tag temporal es <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono font-bold">{user?.displayName || 'Player'}#Player</code>.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsEditNickModalOpen(true)}
            variant="secondary"
            size="sm"
            className="shrink-0 bg-amber-400 hover:bg-amber-300 text-black font-extrabold shadow-md shadow-amber-950/50 py-2.5 px-4"
            leftIcon={<Edit3 className="w-4 h-4 text-black stroke-[2.5]" />}
          >
            Configurar Nickname & Tag
          </Button>
        </div>
      )}

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center justify-between text-emerald-300 text-sm shadow-lg shadow-emerald-950/50 animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 1. HEADER HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1c0c32] via-[#26143E] to-[#140b21] border border-[#522B80]/60 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
          <Sparkles className="w-80 h-80 text-[#E2B86E]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* User Avatar */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#8B44F7] via-[#522B80] to-[#26143E] p-1 shadow-lg shadow-[#8B44F7]/30 flex items-center justify-center">
                <div className="w-full h-full rounded-xl bg-[#140b21]/80 flex items-center justify-center text-3xl sm:text-4xl font-black text-white border border-[#E2B86E]/40">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#140b21] flex items-center justify-center shadow" title="Activo">
                <CheckCircle2 className="w-4 h-4 text-black stroke-[3]" />
              </div>
            </div>

            {/* Basic Identity Details */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wide">
                  {user?.displayName || 'Integrante'}
                </h1>
                {displayTag && (
                  <span
                    className={`text-sm sm:text-base font-extrabold px-3 py-1 rounded-lg border font-mono ${
                      isMissingGameTag
                        ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                        : 'bg-[#26143E] text-[#E2B86E] border-[#8B44F7]/40'
                    }`}
                    title={isMissingGameTag ? 'Tag temporal generado automáticamente' : 'Tag oficial de juego'}
                  >
                    {displayTag}
                  </span>
                )}
                <Badge variant={getRoleBadgeVariant(activeRole)} className="text-xs font-bold uppercase tracking-wider px-2.5 py-1">
                  {activeRole}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditNickModalOpen(true)}
                  leftIcon={<Edit3 className="w-4 h-4 text-[#E2B86E]" />}
                  className="bg-[#26143E]/80 hover:bg-[#522B80]/80 border border-[#8B44F7]/40 text-xs sm:text-sm text-white px-3 py-1.5 ml-1"
                >
                  Cambiar Nick
                </Button>
              </div>

              <p className="text-sm text-gray-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#E2B86E]" />
                <span className="font-semibold text-white">{URS_GAMARA_TEAM.name}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-300">
                  {memberData?.globalSubrole || user?.globalSubrole || user?.position || (activeRole === 'CEO' ? 'CEO / Propietario' : `${activeRole} del equipo`)}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs sm:text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#8B44F7]" />
                  {user?.email}
                </span>
                {(memberData?.country || user?.country) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#E2B86E]" />
                    {memberData?.country || user?.country}
                  </span>
                )}
                {age !== null && (
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Calendar className="w-4 h-4 text-[#8B44F7]" />
                    {age} años
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Team Status Tag */}
          <div className="hidden lg:flex flex-col items-end justify-center bg-[#140b21]/70 border border-[#8B44F7]/30 rounded-xl px-5 py-3 text-right space-y-1">
            <span className="text-xs uppercase font-bold text-[#E2B86E] tracking-wider">Estado en el Club</span>
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Miembro Activo
            </span>
            <span className="text-xs text-gray-400">
              Registrado: {formatDate(memberData?.createdAt || user?.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN DETAILS GRID (DATOS & ROSTERS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DATOS CARGADOS */}
        <div className="lg:col-span-5 space-y-4">
          <Card glow="purple" className="p-5 sm:p-6 space-y-5 h-full flex flex-col justify-between">
            <CardHeader className="p-0 border-b border-[#26143E] pb-3.5 flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                <UserIcon className="w-5 h-5 text-[#8B44F7]" />
                <span>Datos del Perfil</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditNickModalOpen(true)}
                  className="text-xs sm:text-sm text-[#E2B86E] hover:text-[#f3cd8e] flex items-center gap-1.5 font-semibold transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar Nick</span>
                </button>
                <Badge variant="purple" className="text-[10px] sm:text-xs">ID Verificado</Badge>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm flex-1">
              <div className="p-3.5 sm:p-4 bg-[#180d29]/70 border border-[#522B80]/30 rounded-xl space-y-1 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase font-semibold block">Nickname & Tag</span>
                  <button
                    onClick={() => setIsEditNickModalOpen(true)}
                    className="text-gray-400 hover:text-[#E2B86E] transition-colors p-0.5"
                    title="Editar Nickname"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <p className="font-bold text-white text-base truncate">
                  {user?.displayName}{' '}
                  {(memberData?.gameTag || user?.gameTag) && (
                    <span className="text-[#E2B86E] text-sm font-mono">{memberData?.gameTag || user?.gameTag}</span>
                  )}
                </p>
              </div>

              <div className="p-3.5 sm:p-4 bg-[#180d29]/70 border border-[#522B80]/30 rounded-xl space-y-1">
                <span className="text-xs text-gray-400 uppercase font-semibold block">Rol Principal</span>
                <p className="font-bold text-[#E2B86E] text-base truncate">{activeRole}</p>
              </div>

              <div className="p-3.5 sm:p-4 bg-[#180d29]/70 border border-[#522B80]/30 rounded-xl space-y-1 sm:col-span-2">
                <span className="text-xs text-gray-400 uppercase font-semibold block">Correo Electrónico</span>
                <p className="font-medium text-gray-200 text-sm sm:text-base truncate">{user?.email}</p>
              </div>

              <div className="p-3.5 sm:p-4 bg-[#180d29]/70 border border-[#522B80]/30 rounded-xl space-y-1">
                <span className="text-xs text-gray-400 uppercase font-semibold block">País de Residencia</span>
                <p className="font-semibold text-gray-200 text-sm sm:text-base truncate">{memberData?.country || user?.country || 'No especificado'}</p>
              </div>

              <div className="p-3.5 sm:p-4 bg-[#180d29]/70 border border-[#522B80]/30 rounded-xl space-y-1">
                <span className="text-xs text-gray-400 uppercase font-semibold block">Nacimiento / Edad</span>
                <p className="font-semibold text-gray-200 text-sm sm:text-base truncate">
                  {birthDateValue ? (
                    <>
                      {birthDateValue} {age !== null && <span className="text-gray-400 font-normal">({age} años)</span>}
                    </>
                  ) : (
                    'No especificada'
                  )}
                </p>
              </div>

              <div className="p-3.5 sm:p-4 bg-[#180d29]/70 border border-[#522B80]/30 rounded-xl space-y-1 sm:col-span-2">
                <span className="text-xs text-gray-400 uppercase font-semibold block">Función / Posición en Equipo</span>
                <p className="font-semibold text-white text-sm sm:text-base truncate">
                  {memberData?.globalSubrole || user?.globalSubrole || user?.position || 'Miembro Oficial'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* ROSTER Y ROLES EN EL EQUIPO */}
        <div className="lg:col-span-7 space-y-4">
          <Card glow="gold" className="p-5 sm:p-6 space-y-5 h-full flex flex-col">
            <CardHeader className="p-0 border-b border-[#26143E] pb-3.5 flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-[#E2B86E]" />
                <span>Rosters & Alineaciones en el Equipo</span>
              </CardTitle>
              <span className="text-xs text-gray-400 font-semibold">
                {assignedRostersWithRoles.length} {assignedRostersWithRoles.length === 1 ? 'Roster' : 'Rosters'}
              </span>
            </CardHeader>

            <div className="flex-1 flex flex-col justify-between">
              {assignedRostersWithRoles.length > 0 ? (
                <div className="space-y-3">
                  {assignedRostersWithRoles.map((item, idx) => (
                    <div
                      key={item.rosterId || idx}
                      className="p-4 bg-[#180d29]/80 border border-[#522B80]/40 rounded-xl flex items-center justify-between gap-4 hover:border-[#8B44F7]/60 transition-colors"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E] shrink-0 font-bold text-sm">
                          {item.roster?.logoUrl ? (
                            <img src={item.roster.logoUrl} alt={item.roster.name} className="w-full h-full object-contain rounded-lg p-1" />
                          ) : (
                            <Gamepad2 className="w-6 h-6 text-[#8B44F7]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {item.roster?.name || 'Roster de Competencia'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            Juego: <strong className="text-gray-300">{item.roster?.game || 'Esport'}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <Badge
                          variant={
                            item.subrole?.toLowerCase().includes('titular') || item.subrole?.toLowerCase().includes('head')
                              ? 'gold'
                              : 'purple'
                          }
                          className="text-xs font-bold px-3 py-1"
                        >
                          {item.subrole || 'Asignado'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-[#180d29]/40 border border-dashed border-[#522B80]/50 rounded-xl text-center space-y-2.5 my-auto">
                  <div className="w-12 h-12 rounded-full bg-[#26143E] flex items-center justify-center mx-auto text-gray-400">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-white">Plantilla General del Club</p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Formas parte de la organización URS Gamara con acceso a las actividades y seguimiento competitivo.
                  </p>
                </div>
              )}

              {/* Roster footer note */}
              <div className="pt-3.5 border-t border-[#26143E]/60 flex items-center justify-between text-xs text-gray-400 mt-3">
                <span>Equipo Oficial: <strong className="text-white">{URS_GAMARA_TEAM.name}</strong></span>
                <span>Tag: <strong className="text-[#E2B86E]">{URS_GAMARA_TEAM.tag}</strong></span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 3. DETAILED STATS SECTION (GLOBAL KPIS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#26143E] pb-3">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-[#8B44F7]" />
              <span>Estadísticas Detalladas de Rendimiento</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Métricas individuales acumuladas de todos los partidos, scrims y torneos en los que has participado.
            </p>
          </div>
          <Badge variant="purple" className="text-xs font-bold uppercase px-3 py-1">
            {detailedUserStats.totalMatches} {detailedUserStats.totalMatches === 1 ? 'mapa' : 'mapas'}
          </Badge>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* KDA Card */}
          <Card glow="purple" className="p-4 sm:p-5 text-center space-y-1.5 bg-[#180d29]/90">
            <div className="w-10 h-10 rounded-xl bg-[#522B80]/50 flex items-center justify-center text-[#8B44F7] mx-auto mb-2">
              <Crosshair className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-400 uppercase font-semibold">KDA Ratio</p>
            <p className="text-2xl sm:text-3xl font-black text-white">{detailedUserStats.kdaRatio.toFixed(2)}</p>
            <p className="text-xs text-[#8B44F7] font-semibold">{detailedUserStats.formattedKda}</p>
          </Card>

          {/* K/D/A Average Card */}
          <Card glow="gold" className="p-4 sm:p-5 text-center space-y-1.5 bg-[#180d29]/90">
            <div className="w-10 h-10 rounded-xl bg-[#A88144]/30 flex items-center justify-center text-[#E2B86E] mx-auto mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-400 uppercase font-semibold">K / D / A Prom.</p>
            <p className="text-base sm:text-lg font-black text-[#E2B86E] font-mono">{detailedUserStats.formattedKda}</p>
            <p className="text-[11px] text-[#E2B86E] font-medium">Bajas / Muertes / Asist.</p>
          </Card>

          {/* Winrate Card */}
          <Card glow="purple" className="p-4 sm:p-5 text-center space-y-1.5 bg-[#180d29]/90">
            <div className="w-10 h-10 rounded-xl bg-[#522B80]/50 flex items-center justify-center text-[#8B44F7] mx-auto mb-2">
              <Flame className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Winrate</p>
            <p className="text-2xl sm:text-3xl font-black text-white">{detailedUserStats.winRate}%</p>
            <p className="text-xs text-emerald-400 font-semibold">
              {detailedUserStats.wins}W - {detailedUserStats.losses}L
            </p>
          </Card>

          {/* Matches Played */}
          <Card glow="purple" className="p-4 sm:p-5 text-center space-y-1.5 bg-[#180d29]/90">
            <div className="w-10 h-10 rounded-xl bg-[#522B80]/50 flex items-center justify-center text-[#8B44F7] mx-auto mb-2">
              <Swords className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Mapas</p>
            <p className="text-2xl sm:text-3xl font-black text-white">{detailedUserStats.totalMatches}</p>
            <p className="text-xs text-gray-400 font-medium">Disputados</p>
          </Card>

          {/* First Bloods / FK */}
          <Card glow="gold" className="p-4 sm:p-5 text-center space-y-1.5 bg-[#180d29]/90">
            <div className="w-10 h-10 rounded-xl bg-[#A88144]/30 flex items-center justify-center text-[#E2B86E] mx-auto mb-2">
              <Target className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-400 uppercase font-semibold">1st Kills (FK)</p>
            <p className="text-2xl sm:text-3xl font-black text-[#E2B86E]">{detailedUserStats.totalFirstKills}</p>
            <p className="text-xs text-gray-400 font-medium">
              {detailedUserStats.avgFirstKills} por mapa
            </p>
          </Card>

          {/* Total Kills */}
          <Card glow="purple" className="p-4 sm:p-5 text-center space-y-1.5 bg-[#180d29]/90">
            <div className="w-10 h-10 rounded-xl bg-[#522B80]/50 flex items-center justify-center text-[#8B44F7] mx-auto mb-2">
              <Award className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Bajas Totales</p>
            <p className="text-2xl sm:text-3xl font-black text-white">{detailedUserStats.totalKills}</p>
            <p className="text-xs text-purple-300 font-medium">{detailedUserStats.totalDeaths} muertes</p>
          </Card>
        </div>

        {/* 4. AGENTS & MAPS BREAKDOWN (SIDE BY SIDE) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Most Played Agents */}
          <Card glow="purple" className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#26143E] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#E2B86E] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8B44F7]" />
                <span>Agentes Más Jugados ({detailedUserStats.agentList.length})</span>
              </h3>
            </div>

            {detailedUserStats.agentList.length > 0 ? (
              <div className="space-y-3">
                {detailedUserStats.agentList.map((ag, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 bg-[#180d29]/80 border border-[#522B80]/40 rounded-xl flex items-center justify-between hover:border-[#8B44F7] transition-colors"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      {ag.agentIcon ? (
                        <img
                          src={ag.agentIcon}
                          alt={ag.agentName}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#26143E] p-1 border border-[#8B44F7]/40 object-contain shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#26143E] flex items-center justify-center text-sm font-bold text-gray-400 shrink-0">
                          {ag.agentName.slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm sm:text-base truncate">{ag.agentName}</p>
                        <p className="text-xs text-gray-400">
                          {ag.timesPlayed} {ag.timesPlayed === 1 ? 'mapa' : 'mapas'} • {ag.wins}W - {ag.losses}L
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-sm sm:text-base font-black text-[#E2B86E]">{ag.kdaRatio.toFixed(2)} KDA</p>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        {ag.winRate}% WR
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-8">
                Aún no hay registros de agentes en mapas para este usuario.
              </p>
            )}
          </Card>

          {/* Performance by Map */}
          <Card glow="gold" className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#26143E] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#E2B86E] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E2B86E]" />
                <span>Rendimiento por Mapa ({detailedUserStats.mapList.length})</span>
              </h3>
            </div>

            {detailedUserStats.mapList.length > 0 ? (
              <div className="space-y-3">
                {detailedUserStats.mapList.map((mapItem, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 bg-[#180d29]/80 border border-[#522B80]/40 rounded-xl flex items-center justify-between hover:border-[#E2B86E]/60 transition-colors relative overflow-hidden"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0 z-10">
                      {mapItem.displayIcon ? (
                        <img
                          src={mapItem.displayIcon}
                          alt={mapItem.mapName}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#26143E] p-1 border border-[#E2B86E]/40 object-contain shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#26143E] flex items-center justify-center text-sm font-bold text-[#E2B86E] shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm sm:text-base truncate">{mapItem.mapName}</p>
                        <p className="text-xs text-gray-400">
                          {mapItem.timesPlayed} {mapItem.timesPlayed === 1 ? 'mapa' : 'mapas'} • {mapItem.wins}W - {mapItem.losses}L
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1 z-10">
                      <p className="text-sm sm:text-base font-black text-white">{mapItem.kdaRatio.toFixed(2)} KDA</p>
                      <span className="text-xs font-bold text-[#E2B86E] bg-[#26143E] px-2 py-0.5 rounded border border-[#E2B86E]/30">
                        {mapItem.winRate}% WR
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-8">
                Aún no hay mapas registrados con participación de este usuario.
              </p>
            )}
          </Card>
        </div>

        {/* 5. RECENT MATCHES PARTICIPATION TABLE */}
        {detailedUserStats.participationList.length > 0 && (
          <Card glow="purple" className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#26143E] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#E2B86E] flex items-center gap-2">
                <Swords className="w-5 h-5 text-[#8B44F7]" />
                <span>Últimos Mapas Disputados ({detailedUserStats.participationList.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#26143E] bg-[#140b21]">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#180d29] text-gray-400 uppercase text-[11px] sm:text-xs font-bold border-b border-[#26143E]">
                    <th className="py-3.5 px-4">Fecha & Rival</th>
                    <th className="py-3.5 px-4">Mapa</th>
                    <th className="py-3.5 px-4">Agente</th>
                    <th className="py-3.5 px-4 text-center">Score Partido</th>
                    <th className="py-3.5 px-4 text-center">K / D / A</th>
                    <th className="py-3.5 px-4 text-center">KDA / FK</th>
                    <th className="py-3.5 px-4 text-center">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26143E]/60 text-gray-300">
                  {detailedUserStats.participationList.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#1f1035]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white text-sm">{item.opponentName}</p>
                        <p className="text-xs text-gray-400">{item.date} • {item.type === 'tournament' ? 'Torneo' : 'Scrim'}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-200">{item.mapName}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          {item.agentIcon && (
                            <img
                              src={item.agentIcon}
                              alt={item.agent || 'Agente'}
                              className="w-6 h-6 rounded-md bg-[#26143E] object-contain p-0.5 border border-[#8B44F7]/40 shrink-0"
                            />
                          )}
                          <span className="font-bold text-xs sm:text-sm text-white">{item.agent || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-sm sm:text-base text-[#E2B86E]">{item.overallScore}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-white text-xs sm:text-sm">
                        {item.kills} / {item.deaths} / {item.assists}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-white">{item.kdaRatio.toFixed(2)}</span>
                        {item.firstKills > 0 && (
                          <span className="text-amber-400 font-bold ml-1 text-xs">({item.firstKills} FK)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded uppercase ${
                            item.outcome === 'win'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                              : item.outcome === 'loss'
                              ? 'bg-red-950 text-red-400 border border-red-500/40'
                              : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {item.outcome === 'win' ? 'Victoria' : item.outcome === 'loss' ? 'Derrota' : 'Empate'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* 6. EDIT NICKNAME MODAL */}
      <EditNicknameModal
        isOpen={isEditNickModalOpen}
        onClose={() => setIsEditNickModalOpen(false)}
        currentNick={user?.displayName || memberData?.displayName || ''}
        currentGameTag={memberData?.gameTag || user?.gameTag}
        onSave={handleSaveNickname}
      />
    </div>
  );
};
