import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Flame,
  Target,
  Video,
  ExternalLink,
  Edit3,
  Image as ImageIcon,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { matchService } from '../services/matchService';
import type { Match, MatchMapResult, MatchPlayerStats } from '../types';
import { teamService } from '../../teams/services/teamService';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import type { TeamMember } from '../../teams/types';
import { valorantApiService, type ValorantAgent, type ValorantMapData } from '../../../services/valorantApiService';
import { statsCalculationService, type PlayerMapComparison } from '../../stats-analytics/services/statsCalculationService';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';

export const MatchStatsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [match, setMatch] = useState<Match | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [rosterMembers, setRosterMembers] = useState<TeamMember[]>([]);
  const [agentsData, setAgentsData] = useState<ValorantAgent[]>([]);
  const [mapsData, setMapsData] = useState<ValorantMapData[]>([]);

  const [selectedMapIndex, setSelectedMapIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllData = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);

      try {
        const [targetMatch, matchesList, members, agents, maps] = await Promise.all([
          matchService.getMatchById(id),
          matchService.getMatches(),
          teamService.getMembers(URS_GAMARA_TEAM.id),
          valorantApiService.getAgents(),
          valorantApiService.getMaps(),
        ]);

        if (!targetMatch) {
          setError('El partido solicitado no fue encontrado.');
          return;
        }

        setMatch(targetMatch);
        setAllMatches(matchesList);
        setRosterMembers(members);
        setAgentsData(agents);
        setMapsData(maps);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar los datos del partido.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner label="Analizando estadísticas y rendimiento del partido..." />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-4 text-center">
        <div className="p-6 bg-red-950/40 border border-red-500/50 rounded-2xl space-y-3">
          <p className="text-red-300 font-bold text-base">{error || 'Partido no encontrado'}</p>
          <Link to="/dashboard/scrims">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Volver a Scrims & Torneos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Determine maps available in this match
  const mapsList: MatchMapResult[] =
    match.maps && match.maps.length > 0
      ? match.maps
      : [
          {
            mapName: 'Mapa Principal',
            teamScore: Number(match.overallScore.split('-')[0] || 0),
            opponentScore: Number(match.overallScore.split('-')[1] || 0),
            playerStats: match.playerStats,
          },
        ];

  const currentMap = mapsList[selectedMapIndex] || mapsList[0];
  const currentMapStats: MatchPlayerStats[] =
    currentMap.playerStats && currentMap.playerStats.length > 0
      ? currentMap.playerStats
      : match.playerStats || [];

  const mapMeta = mapsData.find(
    (m) => m.displayName.toLowerCase() === currentMap.mapName.toLowerCase()
  );

  // Compute comparative data
  const comparisons: PlayerMapComparison[] =
    currentMapStats.length > 0
      ? statsCalculationService.calculateMapComparison(
          currentMap.mapName,
          currentMapStats,
          allMatches,
          rosterMembers,
          agentsData
        )
      : [];

  const isWin = match.outcome === 'win';
  const isLoss = match.outcome === 'loss';

  // Current Map MVP
  let mapMvp: PlayerMapComparison | undefined;
  if (comparisons.length > 0) {
    mapMvp = [...comparisons].sort((a, b) => {
      const scoreA = a.matchKills * 2 + a.matchAssists + a.matchFirstKills * 3;
      const scoreB = b.matchKills * 2 + b.matchAssists + b.matchFirstKills * 3;
      return scoreB - scoreA;
    })[0];
  }

  // Map Outcome
  const isMapWon = currentMap.teamScore > currentMap.opponentScore;
  const isMapLost = currentMap.teamScore < currentMap.opponentScore;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#26143E] pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link
              to="/dashboard/scrims"
              className="p-1.5 rounded-lg bg-[#180d29] hover:bg-[#26143E] text-gray-300 hover:text-white transition-colors border border-[#522B80]/40"
              title="Volver a lista de partidos"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <span>Análisis de Estadísticas del Partido</span>
              <Sparkles className="w-5 h-5 text-[#E2B86E]" />
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Comparativa detallada del rendimiento individual de cada jugador contra su histórico en cada mapa jugado.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to={`/dashboard/scrims/edit/${match.id}`}>
            <Button variant="outline" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5 text-[#E2B86E]" />}>
              Editar Partido / Cargar Stats
            </Button>
          </Link>
        </div>
      </div>

      {/* Match Overview Banner */}
      <Card
        glow={match.type === 'tournament' ? 'gold' : 'purple'}
        className="p-5 relative overflow-hidden bg-gradient-to-r from-[#140b21] via-[#1a0f2e] to-[#140b21]"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 flex-wrap">
              <Badge variant={match.type === 'tournament' ? 'gold' : 'purple'} className="text-xs uppercase font-extrabold px-2.5">
                {match.type === 'tournament' ? 'Torneo Oficial' : 'Scrim'}
              </Badge>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#E2B86E]" /> {match.date}
              </span>
              {match.game && (
                <span className="text-xs px-2 py-0.5 bg-[#26143E] text-[#E2B86E] rounded-md font-semibold border border-[#522B80]/40">
                  {match.game}
                </span>
              )}
            </div>

            {match.type === 'tournament' && match.tournamentName && (
              <h3 className="text-sm font-bold text-[#E2B86E] flex items-center gap-1.5 pt-0.5">
                <Trophy className="w-4 h-4 text-[#E2B86E] shrink-0" />
                <span>{match.tournamentName}</span>
              </h3>
            )}
          </div>

          {/* Versus Banner */}
          <div className="flex items-center space-x-4 bg-[#0D0914]/90 p-3 px-6 rounded-2xl border border-[#522B80]/50 shadow-xl self-start md:self-auto">
            <div className="text-right min-w-[100px]">
              <p className="text-xs font-bold text-white truncate">{URS_GAMARA_TEAM.name}</p>
              <p className="text-2xl font-black text-[#E2B86E]">
                {match.overallScore.split('-')[0]?.trim() || '0'}
              </p>
            </div>

            <div className="px-2.5 py-1 bg-[#26143E] text-[#8B44F7] font-black text-xs rounded-lg border border-[#8B44F7]/40">
              VS
            </div>

            <div className="text-left min-w-[100px]">
              <p className="text-xs font-bold text-gray-300 truncate">{match.opponentName}</p>
              <p className="text-2xl font-black text-gray-200">
                {match.overallScore.split('-')[1]?.trim() || '0'}
              </p>
            </div>

            <div className="pl-3 border-l border-[#26143E]">
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                  isWin
                    ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/50'
                    : isLoss
                    ? 'bg-red-950/90 text-red-400 border border-red-500/50'
                    : 'bg-amber-950/90 text-amber-400 border border-amber-500/50'
                }`}
              >
                {isWin ? 'Victoria' : isLoss ? 'Derrota' : 'Empate'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Map Tabs Selector (if tournament / multi-map) */}
      {mapsList.length > 1 && (
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
            Mapas Jugados en la Serie ({mapsList.length})
          </label>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
            {mapsList.map((m, idx) => {
              const mapWon = m.teamScore > m.opponentScore;
              const isSelected = idx === selectedMapIndex;
              const hasStats = m.playerStats && m.playerStats.length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedMapIndex(idx)}
                  className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-[#522B80] border-[#8B44F7] text-white shadow-lg shadow-[#8B44F7]/25 ring-1 ring-[#8B44F7]'
                      : 'bg-[#140b21] border-[#26143E] text-gray-400 hover:text-gray-200 hover:border-[#522B80]'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-[#E2B86E]' : 'text-gray-500'}`} />
                  <span>
                    Mapa {idx + 1}: {m.mapName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      mapWon
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-950 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {m.teamScore} - {m.opponentScore}
                  </span>
                  {hasStats && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Estadísticas de jugadores cargadas" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Map Detail Header */}
      <div className="relative rounded-2xl overflow-hidden border border-[#522B80]/40 bg-[#140b21]">
        {/* Background Splash Image */}
        {mapMeta?.splash && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none filter blur-[1px]"
            style={{ backgroundImage: `url(${mapMeta.splash})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#140b21] via-[#140b21]/90 to-transparent pointer-events-none" />

        <div className="relative z-10 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            {mapMeta?.displayIcon ? (
              <img
                src={mapMeta.displayIcon}
                alt={currentMap.mapName}
                className="w-12 h-12 object-contain bg-[#26143E]/80 p-1.5 rounded-xl border border-[#8B44F7]/40"
              />
            ) : (
              <div className="w-12 h-12 bg-[#26143E] rounded-xl flex items-center justify-center text-[#E2B86E] font-black text-sm">
                <MapPin className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-white">{currentMap.mapName}</h2>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                    isMapWon
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                      : isMapLost
                      ? 'bg-red-950/80 text-red-400 border border-red-500/40'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {isMapWon ? 'Victoria' : isMapLost ? 'Derrota' : 'Empate'} ({currentMap.teamScore} - {currentMap.opponentScore})
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Resumen de combate y comparativa histórica de jugadores en este escenario.
              </p>
            </div>
          </div>

          {/* Quick Map KPIs */}
          <div className="flex items-center gap-2 flex-wrap">
            {mapMvp && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#26143E]/80 border border-[#E2B86E]/40 rounded-xl">
                <Flame className="w-4 h-4 text-[#E2B86E]" />
                <div className="text-xs">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">MVP del Mapa</p>
                  <p className="font-bold text-white">
                    {mapMvp.playerNick} <span className="text-[#E2B86E]">({mapMvp.matchKills} Kills)</span>
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#26143E]/80 border border-[#8B44F7]/40 rounded-xl">
              <Target className="w-4 h-4 text-[#8B44F7]" />
              <div className="text-xs">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Kills Totales</p>
                <p className="font-bold text-white">
                  {currentMapStats.reduce((acc, p) => acc + (p.kills || 0), 0)} Bajas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scoreboard & Historical Performance Table */}
      {comparisons.length === 0 ? (
        <Card className="p-8 text-center space-y-4 bg-[#140b21] border-[#26143E]">
          <div className="w-12 h-12 rounded-full bg-[#522B80]/40 text-[#E2B86E] flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">Sin Estadísticas Individuales para {currentMap.mapName}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              No se han cargado las estadísticas individuales de los jugadores (KDA, Agente, First Kills) para este mapa.
              Puedes editar el partido y escanear la captura del resultado con OCR para extraerlas al instante.
            </p>
          </div>
          <Link to={`/dashboard/scrims/edit/${match.id}`}>
            <Button variant="secondary" size="sm" leftIcon={<Edit3 className="w-4 h-4" />}>
              Escanear Captura con OCR en Editor
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E2B86E] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#8B44F7]" />
              <span>Tabla Comparativa: Rendimiento en el Partido vs Histórico en {currentMap.mapName}</span>
            </h3>
            <span className="text-[11px] text-gray-400">
              Mostrando {comparisons.length} jugadores de nuestro equipo
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#26143E] bg-[#140b21]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#180d29] text-gray-400 uppercase text-[10px] font-bold border-b border-[#26143E]">
                  <th className="py-3 px-3.5">Jugador</th>
                  <th className="py-3 px-3.5">Agente en Partido</th>
                  <th className="py-3 px-3.5 text-center">Stats en Partido</th>
                  <th className="py-3 px-3.5">Agente Principal Histórico en {currentMap.mapName}</th>
                  <th className="py-3 px-3.5 text-center">Histórico en {currentMap.mapName}</th>
                  <th className="py-3 px-3.5 text-center">Diferencial (+ / -)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26143E]/60 text-gray-300">
                {comparisons.map((c, idx) => {
                  const isPositiveKda = c.kdaDelta > 0;
                  const isNegativeKda = c.kdaDelta < 0;

                  return (
                    <tr key={idx} className="hover:bg-[#1f1035]/60 transition-colors">
                      {/* 1. Jugador */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#26143E] border border-[#522B80]/40 flex items-center justify-center font-bold text-xs text-[#E2B86E] overflow-hidden shrink-0">
                            {c.avatarUrl ? (
                              <img src={c.avatarUrl} alt={c.playerNick} className="w-full h-full object-cover" />
                            ) : (
                              c.playerNick.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-white text-xs truncate">{c.playerNick}</span>
                              {c.isGuest && (
                                <span className="text-[9px] bg-amber-950 text-amber-300 px-1 py-0.2 rounded font-semibold">
                                  Inv.
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 block truncate">
                              {c.historical.timesPlayed} {c.historical.timesPlayed === 1 ? 'partido histórico' : 'partidos históricos'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Agente en Partido */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center space-x-2">
                          {c.matchAgentIcon ? (
                            <img
                              src={c.matchAgentIcon}
                              alt={c.matchAgent || 'Agente'}
                              className="w-7 h-7 rounded-lg bg-[#26143E] p-0.5 border border-[#8B44F7]/50 object-contain shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-[#26143E] flex items-center justify-center text-[10px] font-bold text-gray-400">
                              ?
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white text-xs">{c.matchAgent || 'No especificado'}</p>
                            {c.isMainAgentOnMap ? (
                              <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Pick Habitual
                              </span>
                            ) : c.historical.mostPlayedAgent ? (
                              <span className="text-[9px] text-purple-400 font-medium">Pick Secundario</span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* 3. Stats en Partido */}
                      <td className="py-3 px-3.5 text-center">
                        <p className="font-extrabold text-[#E2B86E] text-xs">
                          {c.matchKills} / {c.matchDeaths} / {c.matchAssists}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold">
                          KDA: <span className="text-white font-bold">{c.matchKdaRatio.toFixed(2)}</span>
                          {c.matchFirstKills > 0 && (
                            <span className="text-amber-400 font-bold ml-1.5">({c.matchFirstKills} FK)</span>
                          )}
                        </p>
                      </td>

                      {/* 4. Agente Principal Histórico en este mapa */}
                      <td className="py-3 px-3.5">
                        {c.historical.mostPlayedAgent ? (
                          <div className="flex items-center space-x-2">
                            {c.historical.mostPlayedAgentIcon ? (
                              <img
                                src={c.historical.mostPlayedAgentIcon}
                                alt={c.historical.mostPlayedAgent}
                                className="w-6 h-6 rounded-md bg-[#26143E] p-0.5 border border-[#E2B86E]/40 object-contain shrink-0"
                              />
                            ) : null}
                            <div>
                              <p className="font-bold text-gray-200 text-xs">{c.historical.mostPlayedAgent}</p>
                              <span className="text-[10px] text-gray-400">
                                Usado en {c.historical.agentUsageCount} {c.historical.agentUsageCount === 1 ? 'partida' : 'partidas'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs italic">Sin historial</span>
                        )}
                      </td>

                      {/* 5. Histórico en este mapa */}
                      <td className="py-3 px-3.5 text-center">
                        {c.historical.timesPlayed > 0 ? (
                          <div>
                            <p className="font-semibold text-gray-200 text-xs">{c.historical.formattedKda}</p>
                            <p className="text-[10px] text-gray-400">
                              KDA Hist: <span className="text-white font-bold">{c.historical.kdaRatio.toFixed(2)}</span>{' '}
                              • WR: <span className="text-[#E2B86E] font-bold">{c.historical.winRate}%</span>
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-[11px] italic">Primer partido registrado</span>
                        )}
                      </td>

                      {/* 6. Diferencial vs Histórico */}
                      <td className="py-3 px-3.5 text-center">
                        {c.historical.timesPlayed > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                                isPositiveKda
                                  ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/40'
                                  : isNegativeKda
                                  ? 'bg-red-950/90 text-red-400 border border-red-500/40'
                                  : 'bg-gray-800 text-gray-300 border border-gray-700'
                              }`}
                            >
                              {isPositiveKda ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : isNegativeKda ? (
                                <TrendingDown className="w-3 h-3" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                              <span>
                                {c.kdaDelta > 0 ? `+${c.kdaDelta.toFixed(2)}` : c.kdaDelta.toFixed(2)} KDA
                              </span>
                            </span>

                            <span className="text-[9px] text-gray-400 mt-0.5">
                              {c.killsDelta >= 0 ? `+${c.killsDelta}` : `${c.killsDelta}`} Bajas vs Prom.
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 px-2 py-0.5 bg-[#26143E] rounded border border-gray-700">
                            Base inicial
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VODs & Screenshots Footer Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* VODs Card */}
        <div className="p-4 bg-[#140b21] border border-[#26143E] rounded-xl space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2B86E] flex items-center gap-1.5">
            <Video className="w-4 h-4 text-[#8B44F7]" />
            <span>VODs del Encuentro</span>
          </h4>
          {match.vods && match.vods.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {match.vods.map((v) => (
                <a
                  key={v.id}
                  href={v.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 bg-[#180d29] hover:bg-[#26143E] border border-[#522B80]/40 rounded-lg text-xs text-[#E2B86E] transition-colors"
                >
                  <span className="font-bold">
                    {v.isFullMatch ? 'VOD: Partido Completo' : `VOD: ${v.mapName || 'Mapa'}`}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic pt-1">No se han registrado enlaces de VOD para este partido.</p>
          )}
        </div>

        {/* Screenshots Card */}
        <div className="p-4 bg-[#140b21] border border-[#26143E] rounded-xl space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2B86E] flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#8B44F7]" />
            <span>Capturas del Scoreboard</span>
          </h4>
          {match.screenshotUrls && match.screenshotUrls.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {match.screenshotUrls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative group rounded-lg overflow-hidden border border-[#522B80]/40 block aspect-video bg-black"
                >
                  <img src={url} alt={`Captura ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                    Ver Imagen Completa
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic pt-1">No hay capturas adjuntas a este partido.</p>
          )}
        </div>
      </div>
    </div>
  );
};
