import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Trophy,
  Swords,
  Target,
  Flame,
  Filter,
  ArrowUpDown,
  Search,
  Crosshair,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';
import { matchService } from '../../scrims-tournaments/services/matchService';
import { teamService } from '../../teams/services/teamService';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import { valorantApiService, type ValorantAgent, type ValorantMapData } from '../../../services/valorantApiService';
import {
  statsCalculationService,
  type GeneralTeamStats,
  type MapStatsSummary,
  type PlayerStatsSummary,
} from '../services/statsCalculationService';
import type { Match } from '../../scrims-tournaments/types';
import type { Roster, TeamMember } from '../../teams/types';

export const StatsAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [agents, setAgents] = useState<ValorantAgent[]>([]);
  const [mapsData, setMapsData] = useState<ValorantMapData[]>([]);

  // Filter & Sort State
  const [selectedRosterId, setSelectedRosterId] = useState<string>('all');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof PlayerStatsSummary>('kdaRatio');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [matchList, rosterList, memberList, agentList, mapList] = await Promise.all([
          matchService.getMatches(),
          teamService.getRosters(URS_GAMARA_TEAM.id),
          teamService.getMembers(URS_GAMARA_TEAM.id),
          valorantApiService.getAgents(),
          valorantApiService.getMaps(),
        ]);

        setMatches(matchList);
        setRosters(rosterList);
        setMembers(memberList);
        setAgents(agentList);
        setMapsData(mapList);

        // If there are rosters and one is Valorant, default to it
        if (rosterList.length > 0) {
          const val = rosterList.find((r) => r.game.toLowerCase().includes('valorant'));
          if (val) {
            setSelectedRosterId(val.id);
          }
        }
      } catch (err) {
        console.error('Error loading stats data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Filter matches and members by selected roster
  const filteredMatches = useMemo(() => {
    return statsCalculationService.filterMatchesByRoster(matches, selectedRosterId);
  }, [matches, selectedRosterId]);

  const filteredMembers = useMemo(() => {
    if (selectedRosterId === 'all') return members;
    return members.filter((m) =>
      m.rosterAssignments?.some((a) => a.rosterId === selectedRosterId)
    );
  }, [members, selectedRosterId]);

  // Derived Statistics
  const generalStats: GeneralTeamStats = useMemo(() => {
    return statsCalculationService.calculateGeneralStats(filteredMatches);
  }, [filteredMatches]);

  const mapStats: MapStatsSummary[] = useMemo(() => {
    return statsCalculationService.calculateMapStats(filteredMatches, mapsData);
  }, [filteredMatches, mapsData]);

  const playerStats: PlayerStatsSummary[] = useMemo(() => {
    const raw = statsCalculationService.calculatePlayerStats(filteredMatches, filteredMembers, agents);
    return raw;
  }, [filteredMatches, filteredMembers, agents]);

  // Filtered & Sorted Player Table
  const sortedAndFilteredPlayers = useMemo(() => {
    let list = playerStats;
    if (playerSearchQuery.trim()) {
      const q = playerSearchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          (p.gameTag && p.gameTag.toLowerCase().includes(q)) ||
          p.mostPlayedAgent?.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = (aVal as string).toLowerCase();
        bVal = ((bVal as string) || '').toLowerCase();
      }

      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [playerStats, playerSearchQuery, sortField, sortAsc]);

  const handleSort = (field: keyof PlayerStatsSummary) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Compilando métricas y análisis competitivo..." />;
  }

  return (
    <div className="space-y-6 w-full pb-12 animate-fadeIn">
      {/* 1. TOP HEADER & ROSTER FILTER */}
      <div className="bg-gradient-to-r from-[#1c0c32] via-[#26143E] to-[#140b21] border border-[#8B44F7]/40 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-8 opacity-10 pointer-events-none">
          <Activity className="w-80 h-80 text-[#E2B86E]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <Badge variant="gold" className="text-xs font-bold">
                URS GAMARA ANALYTICS
              </Badge>
              <span className="text-sm text-gray-400 font-medium">• Panel de Rendimiento</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wide flex items-center gap-2.5">
              <span>Estadísticas & Análisis Táctico</span>
            </h1>
            <p className="text-sm text-gray-300 max-w-2xl">
              Métricas consolidadas de scrims y torneos, análisis por mapa y rendimiento individual de cada jugador del roster.
            </p>
          </div>

          {/* ROSTER FILTER SELECTOR */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="flex items-center space-x-2.5 bg-[#140b21]/90 border border-[#8B44F7]/40 rounded-2xl p-2.5 shadow-md">
              <Filter className="w-5 h-5 text-[#E2B86E] ml-2 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-gray-400 px-1">Filtro por Roster</span>
                <select
                  value={selectedRosterId}
                  onChange={(e) => setSelectedRosterId(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer pr-4"
                >
                  <option value="all" className="bg-[#140b21] text-white">
                    🌐 Todos los Rosters ({matches.length} partidos)
                  </option>
                  {rosters.map((r) => {
                    const matchCount = matches.filter((m) => m.rosterId === r.id).length;
                    return (
                      <option key={r.id} value={r.id} className="bg-[#140b21] text-white">
                        🎮 {r.name} ({r.game}) • {matchCount} partidas
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GENERAL KPIS GRID (SCRIMS + TOURNAMENTS + ROUNDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Matches & Winrate */}
        <Card glow="purple" className="p-5 sm:p-6 flex items-center space-x-4 bg-[#180d29]/90">
          <div className="w-14 h-14 rounded-2xl bg-[#522B80]/50 border border-[#8B44F7]/40 flex items-center justify-center text-[#8B44F7] shrink-0">
            <Swords className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase font-bold text-gray-400">Total Partidos</p>
            <p className="text-2xl sm:text-3xl font-black text-white">{generalStats.totalMatches}</p>
            <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold mt-1">
              <span className="text-emerald-400">{generalStats.totalWins}W</span>
              <span className="text-gray-500">-</span>
              <span className="text-red-400">{generalStats.totalLosses}L</span>
              {generalStats.totalDraws > 0 && (
                <>
                  <span className="text-gray-500">-</span>
                  <span className="text-amber-400">{generalStats.totalDraws}D</span>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Winrate Global */}
        <Card glow="gold" className="p-5 sm:p-6 flex items-center space-x-4 bg-[#180d29]/90">
          <div className="w-14 h-14 rounded-2xl bg-[#A88144]/30 border border-[#E2B86E]/40 flex items-center justify-center text-[#E2B86E] shrink-0">
            <Flame className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase font-bold text-gray-400">Winrate Global</p>
            <p className="text-2xl sm:text-3xl font-black text-[#E2B86E]">{generalStats.overallWinRate}%</p>
            <div className="w-full bg-[#26143E] h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-[#8B44F7] to-[#E2B86E] h-full rounded-full"
                style={{ width: `${generalStats.overallWinRate}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Scrims vs Torneos Breakdown */}
        <Card glow="purple" className="p-5 sm:p-6 flex items-center space-x-4 bg-[#180d29]/90">
          <div className="w-14 h-14 rounded-2xl bg-[#522B80]/50 border border-[#8B44F7]/40 flex items-center justify-center text-[#8B44F7] shrink-0">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs uppercase font-bold text-gray-400">Modalidades</p>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-300 font-semibold">Scrims:</span>
              <span className="font-extrabold text-white">
                {generalStats.scrimsWins}W - {generalStats.scrimsLosses}L ({generalStats.scrimsWinRate}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-300 font-semibold">Torneos:</span>
              <span className="font-extrabold text-[#E2B86E]">
                {generalStats.tournamentsWins}W - {generalStats.tournamentsLosses}L ({generalStats.tournamentsWinRate}%)
              </span>
            </div>
          </div>
        </Card>

        {/* Round Differential (+/-) */}
        <Card glow="gold" className="p-5 sm:p-6 flex items-center space-x-4 bg-[#180d29]/90">
          <div className="w-14 h-14 rounded-2xl bg-[#A88144]/30 border border-[#E2B86E]/40 flex items-center justify-center text-[#E2B86E] shrink-0">
            <Target className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase font-bold text-gray-400">Diferencia de Rondas</p>
            <p
              className={`text-2xl sm:text-3xl font-black ${
                generalStats.roundDifferential >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {generalStats.roundDifferential >= 0 ? `+${generalStats.roundDifferential}` : generalStats.roundDifferential}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {generalStats.teamRoundsWon} ganadas / {generalStats.opponentRoundsWon} perdidas ({generalStats.roundWinRate}%)
            </p>
          </div>
        </Card>
      </div>

      {/* 3. MAP ANALYSIS SECTION ("MEJORES MAPAS") */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                Rendimiento por Mapa & Mejores Mapas
              </h2>
              <p className="text-xs text-gray-400">
                Partidas jugadas, récord de victorias, rondas y K/D promedio del equipo en cada mapa disputado.
              </p>
            </div>
          </div>
          <Badge variant="purple" className="text-xs font-bold">
            {mapStats.length} Mapas Jugados
          </Badge>
        </div>

        {mapStats.length === 0 ? (
          <Card glow="purple" className="p-10 text-center space-y-2 bg-[#180d29]/60">
            <MapPin className="w-10 h-10 text-gray-500 mx-auto" />
            <p className="text-sm font-bold text-white">Sin datos de mapas para este roster</p>
            <p className="text-xs text-gray-400">
              Al cargar resultados de scrims o torneos con capturas procesadas aparecerán aquí las estadísticas por mapa.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
            {mapStats.map((m, idx) => {
              const isBestMap = idx === 0 && m.winRate >= 50;
              return (
                <div
                  key={m.mapName}
                  className={`relative rounded-2xl overflow-hidden border transition-all duration-300 group ${
                    isBestMap
                      ? 'border-[#E2B86E] bg-gradient-to-b from-[#26143E] to-[#140b21] shadow-xl shadow-[#E2B86E]/10'
                      : 'border-[#522B80]/40 bg-[#180d29]/90 hover:border-[#8B44F7]'
                  }`}
                >
                  {/* Map Background Splash Banner */}
                  <div className="h-36 sm:h-40 relative overflow-hidden bg-[#0D0914]">
                    {m.splashUrl ? (
                      <img
                        src={m.splashUrl}
                        alt={m.mapName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-[#522B80] to-[#26143E] opacity-40" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#140b21] via-transparent to-black/40" />

                    {/* Badge on top */}
                    <div className="absolute top-3 left-3.5 right-3.5 flex items-center justify-between">
                      <span className="text-sm sm:text-base font-black text-white tracking-wider uppercase drop-shadow-md">
                        {m.mapName}
                      </span>
                      {isBestMap && (
                        <Badge variant="gold" className="text-xs font-bold shadow-lg flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Mejor Mapa</span>
                        </Badge>
                      )}
                    </div>

                    <div className="absolute bottom-2.5 left-3.5 flex items-center space-x-2">
                      <span className="px-2.5 py-1 bg-black/70 rounded-lg text-xs text-gray-300 font-semibold border border-white/10">
                        {m.timesPlayed} {m.timesPlayed === 1 ? 'partida' : 'partidas'}
                      </span>
                    </div>
                  </div>

                  {/* Map Stats Details */}
                  <div className="p-4 sm:p-5 space-y-3.5">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-[#140b21] rounded-xl border border-[#522B80]/30">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Winrate</span>
                        <span className="text-sm sm:text-base font-extrabold text-[#E2B86E]">{m.winRate}%</span>
                      </div>
                      <div className="p-2.5 bg-[#140b21] rounded-xl border border-[#522B80]/30">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Record</span>
                        <span className="text-xs sm:text-sm font-bold text-white">
                          <span className="text-emerald-400">{m.wins}W</span> - <span className="text-red-400">{m.losses}L</span>
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#140b21] rounded-xl border border-[#522B80]/30">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">K/D Equipo</span>
                        <span className="text-xs sm:text-sm font-bold text-purple-300">{m.teamAvgKda}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#26143E] flex items-center justify-between text-xs text-gray-400">
                      <span>
                        Rondas: <strong className="text-white">{m.roundsWon}</strong> - <strong className="text-gray-300">{m.roundsLost}</strong>{' '}
                        <span className={m.roundDiff >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          ({m.roundDiff >= 0 ? `+${m.roundDiff}` : m.roundDiff})
                        </span>
                      </span>
                      {m.bestPlayerNick && (
                        <span className="text-right truncate max-w-[140px]">
                          MVP: <strong className="text-[#E2B86E]">{m.bestPlayerNick}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. INDIVIDUAL PLAYER STATISTICS TABLE */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#8B44F7]">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                Estadísticas Individuales del Roster
              </h2>
              <p className="text-xs text-gray-400">
                KDA Ratio de partido, efectividad, agente principal y primeras bajas de cada integrante.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-72">
            <Input
              type="text"
              placeholder="Buscar por nickname o agente..."
              leftIcon={<Search className="w-4 h-4 text-gray-400" />}
              value={playerSearchQuery}
              onChange={(e) => setPlayerSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card glow="purple" className="p-0 overflow-hidden border border-[#522B80]/50 bg-[#140b21]/95 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#26143E] text-gray-300 uppercase font-semibold text-xs tracking-wider border-b border-[#522B80]/60">
                <tr>
                  <th className="py-4 px-4 cursor-pointer hover:text-white select-none" onClick={() => handleSort('displayName')}>
                    <div className="flex items-center space-x-1.5">
                      <span>Jugador</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-4 px-4 select-none">Agente Principal</th>
                  <th className="py-4 px-4 text-center cursor-pointer hover:text-white select-none" onClick={() => handleSort('matchesPlayed')}>
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Partidas</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center cursor-pointer hover:text-white select-none" onClick={() => handleSort('winRate')}>
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Winrate</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center cursor-pointer hover:text-white select-none" onClick={() => handleSort('kdaRatio')}>
                    <div className="flex items-center justify-center space-x-1.5 text-[#E2B86E]">
                      <span>KDA Ratio</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center select-none">K / D / A Prom.</th>
                  <th className="py-4 px-4 text-center cursor-pointer hover:text-white select-none" onClick={() => handleSort('totalFirstKills')}>
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>1st Kills (FK)</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-4 px-4 text-right select-none">Mejor Mapa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26143E]/70">
                {sortedAndFilteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-400 italic">
                      No se encontraron jugadores registrados en este roster.
                    </td>
                  </tr>
                ) : (
                  sortedAndFilteredPlayers.map((p) => {
                    const isPositiveKda = p.kdaRatio >= 1.2;

                    return (
                      <tr key={p.displayName} className="hover:bg-[#1c0c32]/70 transition-colors">
                        {/* Player Nickname & Tag */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#8B44F7] to-[#522B80] flex items-center justify-center font-bold text-white shadow shrink-0 text-sm sm:text-base">
                              {p.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs sm:text-sm flex items-center space-x-1.5 truncate">
                                <span>{p.displayName}</span>
                                {p.gameTag && (
                                  <span className="text-xs text-[#E2B86E] font-mono bg-[#26143E] px-1.5 py-0.5 rounded border border-[#8B44F7]/30">
                                    {p.gameTag}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 capitalize">{p.teamRole || 'Player'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Main Agent */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2.5">
                            {p.mostPlayedAgentIcon ? (
                              <img
                                src={p.mostPlayedAgentIcon}
                                alt={p.mostPlayedAgent}
                                className="w-8 h-8 rounded-lg bg-[#26143E] object-contain p-0.5 border border-[#8B44F7]/40 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-[#26143E] flex items-center justify-center text-gray-500 text-xs shrink-0">
                                ?
                              </div>
                            )}
                            <span className="font-semibold text-gray-200 text-xs sm:text-sm truncate max-w-[100px]">
                              {p.mostPlayedAgent}
                            </span>
                          </div>
                        </td>

                        {/* Matches */}
                        <td className="py-4 px-4 text-center font-bold text-white">
                          {p.matchesPlayed}
                        </td>

                        {/* Winrate */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`font-extrabold text-xs sm:text-sm ${
                              p.winRate >= 60
                                ? 'text-emerald-400'
                                : p.winRate >= 45
                                ? 'text-[#E2B86E]'
                                : 'text-gray-300'
                            }`}
                          >
                            {p.winRate}%
                          </span>
                        </td>

                        {/* KDA Ratio */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
                              isPositiveKda
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                                : p.kdaRatio >= 1.0
                                ? 'bg-[#522B80]/60 text-purple-200 border border-[#8B44F7]/40'
                                : 'bg-red-950/60 text-red-300 border border-red-500/40'
                            }`}
                          >
                            {p.kdaRatio.toFixed(2)}
                          </span>
                        </td>

                        {/* Formatted KDA */}
                        <td className="py-4 px-4 text-center font-mono text-xs sm:text-sm text-gray-300">
                          {p.formattedKda}
                        </td>

                        {/* First Kills */}
                        <td className="py-4 px-4 text-center">
                          <span className="font-bold text-[#E2B86E] text-xs sm:text-sm">{p.totalFirstKills}</span>
                          <span className="text-xs text-gray-400 ml-1">({p.avgFirstKills}/p)</span>
                        </td>

                        {/* Best Map */}
                        <td className="py-4 px-4 text-right">
                          <div className="font-bold text-white text-xs sm:text-sm">{p.bestMap}</div>
                          {p.bestMapWinRate !== undefined ? (
                            <span className="text-xs text-[#8B44F7] font-semibold">
                              {p.bestMapWinRate}% WR
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
