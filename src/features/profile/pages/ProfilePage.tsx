import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Shield,
  Trophy,
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
} from 'lucide-react';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import { teamService } from '../../teams/services/teamService';
import { matchService } from '../../scrims-tournaments/services/matchService';
import type { Roster, TeamMember, TeamRole } from '../../teams/types';
import type { Match } from '../../scrims-tournaments/types';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [allRosters, setAllRosters] = useState<Roster[]>([]);
  const [memberData, setMemberData] = useState<TeamMember | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        const [rosters, members, matchesData] = await Promise.all([
          teamService.getRosters(URS_GAMARA_TEAM.id),
          teamService.getMembers(URS_GAMARA_TEAM.id),
          matchService.getMatches(),
        ]);

        setAllRosters(rosters);
        setMatches(matchesData);

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

  const isPlayer = activeRole.toLowerCase() === 'player';
  const isCoach = activeRole.toLowerCase() === 'coach';

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

  // Coach roster match stats calculation
  const totalMatchesCount = matches.length;
  const winsCount = matches.filter((m) => m.outcome === 'win').length;
  const lossesCount = matches.filter((m) => m.outcome === 'loss').length;
  const drawsCount = matches.filter((m) => m.outcome === 'draw').length;
  const winRate =
    totalMatchesCount > 0
      ? Math.round((winsCount / totalMatchesCount) * 100)
      : 0;

  if (loading) {
    return <LoadingSpinner label="Cargando perfil del usuario..." />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-8">
      {/* 1. HEADER HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1c0c32] via-[#26143E] to-[#140b21] border border-[#522B80]/60 rounded-2xl p-6 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
          <Sparkles className="w-80 h-80 text-[#E2B86E]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center space-x-4 sm:space-x-5">
            {/* User Avatar */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#8B44F7] via-[#522B80] to-[#26143E] p-1 shadow-lg shadow-[#8B44F7]/30 flex items-center justify-center">
                <div className="w-full h-full rounded-xl bg-[#140b21]/80 flex items-center justify-center text-2xl sm:text-3xl font-black text-white border border-[#E2B86E]/40">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#140b21] flex items-center justify-center shadow" title="Activo">
                <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[3]" />
              </div>
            </div>

            {/* Basic Identity Details */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  {user?.displayName || 'Integrante'}
                </h1>
                <Badge variant={getRoleBadgeVariant(activeRole)} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                  {activeRole}
                </Badge>
              </div>

              <p className="text-xs text-gray-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#E2B86E]" />
                <span className="font-semibold text-white">{URS_GAMARA_TEAM.name}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-300">
                  {memberData?.globalSubrole || user?.globalSubrole || user?.position || `${activeRole} oficial`}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#8B44F7]" />
                  {user?.email}
                </span>
                {(memberData?.country || user?.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#E2B86E]" />
                    {memberData?.country || user?.country}
                  </span>
                )}
                {age !== null && (
                  <span className="flex items-center gap-1 text-gray-300">
                    <Calendar className="w-3 h-3 text-[#8B44F7]" />
                    {age} años
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Team Status Tag */}
          <div className="hidden lg:flex flex-col items-end justify-center bg-[#140b21]/70 border border-[#8B44F7]/30 rounded-xl px-4 py-2.5 text-right space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-[#E2B86E] tracking-wider">Estado en el Club</span>
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Miembro Activo
            </span>
            <span className="text-[10px] text-gray-400">
              Registrado: {formatDate(memberData?.createdAt || user?.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN DETAILS GRID (DATOS CARGADOS & ROSTERS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DATOS CARGADOS */}
        <div className="lg:col-span-5 space-y-4">
          <Card glow="purple" className="p-5 space-y-4 h-full flex flex-col justify-between">
            <CardHeader className="p-0 border-b border-[#26143E] pb-3 flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#8B44F7]" />
                <span>Datos del Perfil</span>
              </CardTitle>
              <Badge variant="purple" className="text-[9px]">ID Verificado</Badge>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs flex-1">
              <div className="p-3 bg-[#180d29]/70 border border-[#522B80]/30 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Nickname</span>
                <p className="font-bold text-white text-sm truncate">{user?.displayName}</p>
              </div>

              <div className="p-3 bg-[#180d29]/70 border border-[#522B80]/30 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Rol Principal</span>
                <p className="font-bold text-[#E2B86E] truncate">{activeRole}</p>
              </div>

              <div className="p-3 bg-[#180d29]/70 border border-[#522B80]/30 rounded-xl space-y-1 sm:col-span-2">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Correo Electrónico</span>
                <p className="font-medium text-gray-200 truncate">{user?.email}</p>
              </div>

              <div className="p-3 bg-[#180d29]/70 border border-[#522B80]/30 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">País de Residencia</span>
                <p className="font-semibold text-gray-200 truncate">{memberData?.country || user?.country || 'No especificado'}</p>
              </div>

              <div className="p-3 bg-[#180d29]/70 border border-[#522B80]/30 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Nacimiento / Edad</span>
                <p className="font-semibold text-gray-200 truncate">
                  {birthDateValue ? (
                    <>
                      {birthDateValue} {age !== null && <span className="text-gray-400 font-normal">({age} años)</span>}
                    </>
                  ) : (
                    'No especificada'
                  )}
                </p>
              </div>

              <div className="p-3 bg-[#180d29]/70 border border-[#522B80]/30 rounded-xl space-y-1 sm:col-span-2">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Función / Posición en Equipo</span>
                <p className="font-semibold text-white truncate">
                  {memberData?.globalSubrole || user?.globalSubrole || user?.position || 'Sin subrol asignado'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* ROSTER Y ROLES EN EL EQUIPO */}
        <div className="lg:col-span-7 space-y-4">
          <Card glow="gold" className="p-5 space-y-4 h-full flex flex-col">
            <CardHeader className="p-0 border-b border-[#26143E] pb-3 flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#E2B86E]" />
                <span>Rosters & Roles en el Equipo</span>
              </CardTitle>
              <span className="text-[10px] text-gray-400 font-medium">
                {assignedRostersWithRoles.length} {assignedRostersWithRoles.length === 1 ? 'Roster' : 'Rosters'}
              </span>
            </CardHeader>

            <div className="flex-1 flex flex-col justify-between">
              {assignedRostersWithRoles.length > 0 ? (
                <div className="space-y-2.5">
                  {assignedRostersWithRoles.map((item, idx) => (
                    <div
                      key={item.rosterId || idx}
                      className="p-3.5 bg-[#180d29]/80 border border-[#522B80]/40 rounded-xl flex items-center justify-between gap-3 hover:border-[#8B44F7]/60 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E] shrink-0 font-bold text-xs">
                          {item.roster?.logoUrl ? (
                            <img src={item.roster.logoUrl} alt={item.roster.name} className="w-full h-full object-contain rounded-lg p-1" />
                          ) : (
                            <Gamepad2 className="w-5 h-5 text-[#8B44F7]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {item.roster?.name || 'Roster de Competencia'}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
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
                          className="text-[10px] font-bold"
                        >
                          {item.subrole || 'Asignado'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-[#180d29]/40 border border-dashed border-[#522B80]/50 rounded-xl text-center space-y-2 my-auto">
                  <div className="w-10 h-10 rounded-full bg-[#26143E] flex items-center justify-center mx-auto text-gray-400">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  {isPlayer || isCoach ? (
                    <>
                      <p className="text-xs font-bold text-white">Sin asignación a roster activo</p>
                      <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                        Actualmente no figuras en ningún roster de juego. La administración o coach te asignará al equipo competitivo correspondiente.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-white">Rol Organizacional / Administrativo</p>
                      <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                        Como miembro de {activeRole}, gestionas las operaciones y estructura general de URS Gamara.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Roster footer note */}
              <div className="pt-3 border-t border-[#26143E]/60 flex items-center justify-between text-[11px] text-gray-400 mt-2">
                <span>Equipo Oficial: <strong className="text-white">{URS_GAMARA_TEAM.name}</strong></span>
                <span>Tag: <strong className="text-[#E2B86E]">{URS_GAMARA_TEAM.tag}</strong></span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 3. CONDITIONAL STATS SECTION (ONLY FOR PLAYER OR COACH) */}
      {isPlayer && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white tracking-wide flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#8B44F7]" />
              <span>Estadísticas Individuales del Jugador</span>
            </h2>
            <Badge variant="purple" className="text-[9px]">Rendimiento Personal</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* KDA Card */}
            <Card glow="purple" className="p-4 text-center space-y-1 bg-[#180d29]/90">
              <div className="w-8 h-8 rounded-lg bg-[#522B80]/50 flex items-center justify-center text-[#8B44F7] mx-auto mb-1.5">
                <Crosshair className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">KDA Ratio</p>
              <p className="text-xl font-black text-white">{user?.stats?.kda || '0.00'}</p>
              <p className="text-[9px] text-[#8B44F7] font-medium">Promedio</p>
            </Card>

            {/* Winrate Card */}
            <Card glow="gold" className="p-4 text-center space-y-1 bg-[#180d29]/90">
              <div className="w-8 h-8 rounded-lg bg-[#A88144]/30 flex items-center justify-center text-[#E2B86E] mx-auto mb-1.5">
                <Flame className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Winrate</p>
              <p className="text-xl font-black text-[#E2B86E]">{user?.stats?.winrate ?? 0}%</p>
              <p className="text-[9px] text-emerald-400 font-medium">Efectividad</p>
            </Card>

            {/* Matches Played */}
            <Card glow="purple" className="p-4 text-center space-y-1 bg-[#180d29]/90">
              <div className="w-8 h-8 rounded-lg bg-[#522B80]/50 flex items-center justify-center text-[#8B44F7] mx-auto mb-1.5">
                <Swords className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Partidas</p>
              <p className="text-xl font-black text-white">{user?.stats?.matchesPlayed ?? 0}</p>
              <p className="text-[9px] text-gray-400 font-medium">Disputadas</p>
            </Card>

            {/* Headshot % */}
            <Card glow="purple" className="p-4 text-center space-y-1 bg-[#180d29]/90">
              <div className="w-8 h-8 rounded-lg bg-[#522B80]/50 flex items-center justify-center text-[#8B44F7] mx-auto mb-1.5">
                <Target className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Headshot %</p>
              <p className="text-xl font-black text-white">{user?.stats?.hsPercentage ?? 0}%</p>
              <p className="text-[9px] text-purple-300 font-medium">Precisión</p>
            </Card>

            {/* MVPs */}
            <Card glow="gold" className="p-4 text-center space-y-1 bg-[#180d29]/90">
              <div className="w-8 h-8 rounded-lg bg-[#A88144]/30 flex items-center justify-center text-[#E2B86E] mx-auto mb-1.5">
                <Trophy className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">MVPs</p>
              <p className="text-xl font-black text-[#E2B86E]">{user?.stats?.mvpCount ?? 0}</p>
              <p className="text-[9px] text-[#E2B86E] font-medium">Reconocimientos</p>
            </Card>

            {/* Main Agent / Hero */}
            <Card glow="purple" className="p-4 text-center space-y-1 bg-[#180d29]/90">
              <div className="w-8 h-8 rounded-lg bg-[#522B80]/50 flex items-center justify-center text-[#8B44F7] mx-auto mb-1.5">
                <Award className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Agente / Rol</p>
              <p className="text-sm font-black text-white truncate px-1">
                {user?.stats?.mainAgentOrHero || 'Por definir'}
              </p>
              <p className="text-[9px] text-gray-400 font-medium">Principal</p>
            </Card>
          </div>
        </div>
      )}

      {isCoach && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white tracking-wide flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#E2B86E]" />
              <span>Estadísticas de Rosters a Cargo</span>
            </h2>
            <Badge variant="gold" className="text-[9px]">Rendimiento Táctico</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card glow="gold" className="p-4 space-y-2 bg-[#180d29]/90">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Partidas del Equipo</span>
                <Swords className="w-4 h-4 text-[#E2B86E]" />
              </div>
              <p className="text-2xl font-black text-white">{totalMatchesCount}</p>
              <p className="text-[10px] text-gray-400">Total registradas en el portal</p>
            </Card>

            <Card glow="purple" className="p-4 space-y-2 bg-[#180d29]/90">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Victorias / Derrotas</span>
                <Trophy className="w-4 h-4 text-[#8B44F7]" />
              </div>
              <p className="text-2xl font-black text-white">
                <span className="text-emerald-400">{winsCount}W</span>
                <span className="text-gray-500 text-lg mx-1.5">-</span>
                <span className="text-red-400">{lossesCount}L</span>
              </p>
              <p className="text-[10px] text-gray-400">
                {drawsCount > 0 ? `${drawsCount} empates registrados` : 'Historial competitivo'}
              </p>
            </Card>

            <Card glow="gold" className="p-4 space-y-2 bg-[#180d29]/90">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Winrate Global</span>
                <Flame className="w-4 h-4 text-[#E2B86E]" />
              </div>
              <p className="text-2xl font-black text-[#E2B86E]">{winRate}%</p>
              <div className="w-full bg-[#26143E] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#8B44F7] to-[#E2B86E] h-full rounded-full transition-all duration-500"
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </Card>

            <Card glow="purple" className="p-4 space-y-2 bg-[#180d29]/90">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Rosters Asignados</span>
                <Layers className="w-4 h-4 text-[#8B44F7]" />
              </div>
              <p className="text-2xl font-black text-white">
                {assignedRostersWithRoles.length || 1}
              </p>
              <p className="text-[10px] text-gray-400">
                {assignedRostersWithRoles.length > 0
                  ? assignedRostersWithRoles.map((a) => a.roster?.game || 'Esport').join(', ')
                  : 'URS Gamara General'}
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* 4. MODULAR EXTENSIBLE SECTION (SLOTS READY FOR FUTURE EXPANSIONS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Próximos compromisos / Estado */}
        <Card glow="purple" className="p-4 space-y-3 bg-[#140b21]/70 border border-[#26143E]">
          <div className="flex items-center justify-between border-b border-[#26143E] pb-2.5">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#8B44F7]" />
              <span>Compromisos & Calendario</span>
            </h3>
            <Badge variant="purple" className="text-[9px]">Sincronizado</Badge>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Tus horarios de entrenamientos, scrims oficiales y sesiones de VOD Review asignados aparecerán sincronizados con el calendario del equipo.
          </p>
        </Card>

        {/* Cuentas vinculadas & Logros */}
        <Card glow="gold" className="p-4 space-y-3 bg-[#140b21]/70 border border-[#26143E]">
          <div className="flex items-center justify-between border-b border-[#26143E] pb-2.5">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#E2B86E]" />
              <span>Identidad & Cuentas Vinculadas</span>
            </h3>
            <Badge variant="gold" className="text-[9px]">Próximamente</Badge>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Podrás vincular tus IDs oficiales de Riot Games, Steam y Discord para mostrar tu rango competitivo y logros dentro del club.
          </p>
        </Card>
      </div>
    </div>
  );
};
