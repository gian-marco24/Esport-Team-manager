import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Swords,
  Target,
  Flame,
  Award,
  Calendar,
  TrendingUp,
  Plus,
  Sparkles,
  Gamepad2,
  Crosshair,
  ChevronRight,
} from 'lucide-react';
import { useUserStats } from '../hooks/useUserStats';
import { useTeamStats } from '../hooks/useTeamStats';
import { teamService } from '../../teams/services/teamService';
import { matchService } from '../../scrims-tournaments/services/matchService';
import { valorantApiService, type ValorantAgent } from '../../../services/valorantApiService';
import { statsCalculationService } from '../services/statsCalculationService';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import type { TeamMember, Roster } from '../../teams/types';
import type { Match } from '../../scrims-tournaments/types';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { user } = useUserStats();
  const { teamOverview, recentMatches } = useTeamStats();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [agents, setAgents] = useState<ValorantAgent[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [memberList, rosterList, matchList, agentList] = await Promise.all([
          teamService.getMembers(URS_GAMARA_TEAM.id),
          teamService.getRosters(URS_GAMARA_TEAM.id),
          matchService.getMatches(),
          valorantApiService.getAgents(),
        ]);
        setMembers(memberList);
        setRosters(rosterList);
        setMatches(matchList);
        setAgents(agentList);
      } catch (err) {
        console.error('Error loading dashboard extra metrics:', err);
      }
    };
    loadData();
  }, []);

  // Top 5 players by average KDA
  const topKdaPlayers = useMemo(() => {
    if (members.length === 0) return [];
    const calculated = statsCalculationService.calculatePlayerStats(matches, members, agents);
    return calculated
      .sort((a, b) => b.kdaRatio - a.kdaRatio || b.matchesPlayed - a.matchesPlayed)
      .slice(0, 5);
  }, [members, matches, agents]);

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#26143E] via-[#522B80]/80 to-[#26143E] border border-[#8B44F7]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none">
          <Trophy className="w-64 h-64 text-[#E2B86E]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="gold" className="text-[10px]">
                {user?.role || 'Jugador'}
              </Badge>
              <span className="text-xs text-[#E2B86E] font-bold">• {URS_GAMARA_TEAM.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              Bienvenido, {user?.displayName || 'Integrante'}
            </h1>
            <p className="text-xs text-gray-300">
              Posición: <strong className="text-white">{user?.position || 'Miembro Oficial'}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="px-4 py-2 bg-[#0D0914]/80 border border-[#8B44F7]/40 rounded-xl text-center">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Winrate Equipo</p>
              <p className="text-lg font-extrabold text-[#E2B86E]">{teamOverview.winRate}%</p>
            </div>
            <div className="px-4 py-2 bg-[#0D0914]/80 border border-[#8B44F7]/40 rounded-xl text-center">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Partidas Registradas</p>
              <p className="text-lg font-extrabold text-[#8B44F7]">{teamOverview.totalMatches}</p>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glow="purple" className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#8B44F7]">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Partidas Jugadas</p>
            <p className="text-xl font-black text-white">{teamOverview.totalMatches}</p>
            <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> Partidas disputadas
            </p>
          </div>
        </Card>

        <Card glow="gold" className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#A88144]/30 border border-[#E2B86E]/40 flex items-center justify-center text-[#E2B86E]">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Victorias</p>
            <p className="text-xl font-black text-white">{teamOverview.wins}</p>
            <p className="text-[10px] text-[#E2B86E] font-semibold mt-0.5">Partidas ganadas</p>
          </div>
        </Card>

        <Card glow="purple" className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#8B44F7]">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Derrotas</p>
            <p className="text-xl font-black text-white">{teamOverview.losses}</p>
            <p className="text-[10px] text-purple-300 font-semibold mt-0.5">Partidas perdidas</p>
          </div>
        </Card>

        <Card glow="gold" className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#A88144]/30 border border-[#E2B86E]/40 flex items-center justify-center text-[#E2B86E]">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Winrate Global</p>
            <p className="text-xl font-black text-white">{teamOverview.winRate}%</p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Efectividad del equipo</p>
          </div>
        </Card>
      </div>

      {/* TOP 5 KDA PLAYERS ROW (5 CARDS SIDE BY SIDE / STACKED ON MOBILE) */}
      <Card glow="purple" className="space-y-4 p-5">
        <CardHeader className="p-0 border-b border-[#26143E] pb-3 flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
            <Crosshair className="w-5 h-5 text-[#8B44F7]" />
            <span>Top Rendimiento KDA del Equipo</span>
          </CardTitle>
          <Link
            to="/dashboard/stats"
            className="text-xs text-[#E2B86E] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Ver tabla completa</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        {topKdaPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
            {topKdaPlayers.map((p, idx) => {
              const memberObj = members.find((m) => m.id === p.playerId);
              const firstAssignment = memberObj?.rosterAssignments?.[0];
              const assignedRoster = rosters.find((r) => r.id === firstAssignment?.rosterId);
              const rosterName = assignedRoster?.name || 'Roster Principal';
              const position = firstAssignment?.subrole || memberObj?.teamRole || 'Player';

              return (
                <div
                  key={p.playerId || idx}
                  className="p-3.5 bg-[#140b21] hover:bg-[#180d29] border border-[#522B80]/40 hover:border-[#8B44F7] rounded-xl flex flex-col justify-between space-y-3 transition-all group"
                >
                  {/* Top: Rank Badge & Avatar */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#26143E] border border-[#8B44F7]/50 flex items-center justify-center font-black text-xs text-[#E2B86E] overflow-hidden shrink-0">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt={p.displayName} className="w-full h-full object-cover" />
                        ) : (
                          p.displayName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-white text-xs truncate group-hover:text-[#E2B86E] transition-colors">
                          {p.displayName}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {p.gameTag || memberObj?.gameTag || 'URS'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                        idx === 0
                          ? 'bg-amber-950 text-[#E2B86E] border border-amber-500/40'
                          : idx === 1
                          ? 'bg-gray-800 text-gray-200 border border-gray-600'
                          : idx === 2
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          : 'bg-[#26143E] text-gray-400'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Middle: KDA Big Metric */}
                  <div className="p-2.5 bg-[#0D0914]/80 rounded-lg border border-[#26143E] text-center space-y-0.5">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Promedio KDA</p>
                    <p className="text-lg font-black text-[#E2B86E]">{p.kdaRatio.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-300 font-mono font-medium">{p.formattedKda}</p>
                  </div>

                  {/* Bottom: Roster, Role & Main Agent */}
                  <div className="space-y-1.5 text-[11px] pt-1 border-t border-[#26143E]">
                    <div className="flex items-center justify-between text-gray-300">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Gamepad2 className="w-3 h-3 text-[#8B44F7]" /> Roster:
                      </span>
                      <span className="font-bold text-white truncate max-w-[90px]">{rosterName}</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-300">
                      <span className="text-[10px] text-gray-400">Rol:</span>
                      <span className="font-semibold text-purple-300 truncate max-w-[90px]">{position}</span>
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-gray-400">Agente Top:</span>
                      <div className="flex items-center space-x-1 min-w-0">
                        {p.mostPlayedAgentIcon && (
                          <img
                            src={p.mostPlayedAgentIcon}
                            alt={p.mostPlayedAgent || 'Agente'}
                            className="w-4 h-4 rounded-full bg-[#26143E] object-contain shrink-0 border border-[#8B44F7]/40"
                          />
                        )}
                        <span className="font-bold text-[#E2B86E] text-[10px] truncate max-w-[70px]">
                          {p.mostPlayedAgent || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center bg-[#0D0914]/40 border border-dashed border-[#522B80]/40 rounded-xl space-y-2">
            <Crosshair className="w-8 h-8 text-gray-500 mx-auto" />
            <p className="text-xs text-gray-300 font-semibold">Sin estadísticas de jugadores cargadas aún</p>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
              A medida que registres partidos y escanees capturas con OCR, aquí figurarán los 5 mejores promedios KDA del equipo.
            </p>
          </div>
        )}
      </Card>

      {/* NEXT MATCH ROW & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Match Card */}
        <Card glow="gold" className="lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-[#E2B86E]">
                <Calendar className="w-5 h-5" />
                <span>Próximo Enfrentamiento</span>
              </CardTitle>
              <Badge variant="gold">Oficial</Badge>
            </CardHeader>

            {teamOverview.nextMatch ? (
              <div className="space-y-3 text-center py-6 bg-[#0D0914]/60 rounded-xl border border-[#A88144]/30">
                <p className="text-xs text-gray-400 font-semibold uppercase">{teamOverview.nextMatch.tournament}</p>
                <div className="flex items-center justify-center space-x-4">
                  <span className="font-extrabold text-white text-lg">{URS_GAMARA_TEAM.name}</span>
                  <span className="text-xs text-[#E2B86E] font-bold px-2 py-0.5 bg-[#26143E] rounded">VS</span>
                  <span className="font-extrabold text-white text-lg">{teamOverview.nextMatch.opponent}</span>
                </div>
                <p className="text-xs text-[#E2B86E] font-medium">{teamOverview.nextMatch.date}</p>
              </div>
            ) : (
              <div className="text-center py-8 bg-[#0D0914]/40 rounded-xl border border-dashed border-[#A88144]/30 space-y-1">
                <p className="text-xs text-gray-400 font-medium">Sin partidos próximos agendados</p>
                <p className="text-[11px] text-gray-500">Consulta el calendario del equipo.</p>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Link to="/dashboard/schedule">
              <Button variant="outline" size="sm" leftIcon={<Calendar className="w-4 h-4 text-[#E2B86E]" />}>
                Ver Calendario Completo
              </Button>
            </Link>
          </div>
        </Card>

        {/* Action Center Card */}
        <Card glow="purple" className="p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <Sparkles className="w-4 h-4 text-[#8B44F7]" />
              <span>Accesos Rápidos</span>
            </CardTitle>
            <p className="text-xs text-gray-400 leading-relaxed">
              Carga nuevos resultados con escaneo OCR o revisa el rendimiento global de los integrantes.
            </p>
          </div>

          <div className="space-y-2">
            <Link to="/dashboard/scrims/new">
              <Button variant="secondary" className="w-full text-xs" leftIcon={<Plus className="w-4 h-4" />}>
                Cargar Nuevo Resultado
              </Button>
            </Link>
            <Link to="/dashboard/stats">
              <Button variant="outline" className="w-full text-xs" leftIcon={<Award className="w-4 h-4 text-[#E2B86E]" />}>
                Estadísticas & Análisis
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* RECENT SCRIMS TABLE */}
      <Card glow="purple" className="space-y-4">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#8B44F7]" />
            <span>Historial Reciente de Scrims y Torneos</span>
          </CardTitle>
          <span className="text-xs text-gray-400">Total: {recentMatches.length}</span>
        </CardHeader>

        {recentMatches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#140b21] text-gray-400 uppercase font-semibold border-b border-[#26143E]">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Rival</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Mapas / Score</th>
                  <th className="p-3">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26143E]">
                {recentMatches.map((m) => (
                  <tr key={m.id} className="hover:bg-[#26143E]/40 transition-colors">
                    <td className="p-3 font-medium text-gray-400">{m.date}</td>
                    <td className="p-3 font-bold text-white">{m.opponentName}</td>
                    <td className="p-3">
                      <Badge variant={m.type === 'tournament' ? 'gold' : 'purple'}>
                        {m.type === 'tournament' ? 'Torneo' : 'Scrim'}
                      </Badge>
                    </td>
                    <td className="p-3 text-gray-300">
                      {m.maps?.map((map) => map.mapName).join(', ') || 'N/A'} ({m.overallScore})
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          m.outcome === 'win'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                            : m.outcome === 'loss'
                            ? 'bg-red-950/80 text-red-400 border border-red-500/30'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {m.outcome === 'win' ? 'Victoria' : m.outcome === 'loss' ? 'Derrota' : 'Empate'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#0D0914]/40 border border-dashed border-[#522B80]/40 rounded-xl space-y-3">
            <p className="text-xs text-gray-400">Aún no hay partidas o scrims registradas.</p>
            <Link to="/dashboard/scrims/new">
              <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Cargar Primer Partido
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};
