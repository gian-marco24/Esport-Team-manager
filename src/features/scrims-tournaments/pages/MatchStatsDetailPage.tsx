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

  // Current Map MVP (Highest kills; if tied, highest KDA ratio)
  let mapMvp: PlayerMapComparison | undefined;
  if (comparisons.length > 0) {
    mapMvp = [...comparisons].sort((a, b) => {
      if (b.matchKills !== a.matchKills) {
        return b.matchKills - a.matchKills;
      }
      if (b.matchKdaRatio !== a.matchKdaRatio) {
        return b.matchKdaRatio - a.matchKdaRatio;
      }
      if (b.matchFirstKills !== a.matchFirstKills) {
        return b.matchFirstKills - a.matchFirstKills;
      }
      return b.matchAssists - a.matchAssists;
    })[0];
  }

  // Map Outcome
  const isMapWon = currentMap.teamScore > currentMap.opponentScore;
  const isMapLost = currentMap.teamScore < currentMap.opponentScore;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#26143E] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard/scrims"
              className="p-2 2xl:p-2.5 rounded-xl bg-[#180d29] hover:bg-[#26143E] text-gray-300 hover:text-white transition-colors border border-[#522B80]/40 shadow-sm"
              title="Volver a lista de partidos"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl 2xl:text-4xl font-black text-white tracking-wide flex items-center gap-2.5">
              <span>Análisis de Estadísticas del Partido</span>
              <Sparkles className="w-6 h-6 2xl:w-7 2xl:h-7 text-[#E2B86E]" />
            </h1>
          </div>
          <p className="text-sm 2xl:text-base text-gray-300">
            Comparativa detallada del rendimiento individual de cada jugador contra su histórico en cada mapa jugado.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link to={`/dashboard/scrims/edit/${match.id}`}>
            <Button variant="outline" size="md" className="px-4 py-2.5 2xl:px-5 2xl:py-3 text-sm 2xl:text-base font-bold shadow-md" leftIcon={<Edit3 className="w-4 h-4 2xl:w-5 2xl:h-5 text-[#E2B86E]" />}>
              Editar Partido / Cargar Stats
            </Button>
          </Link>
        </div>
      </div>

      {/* Match Overview Banner */}
      <Card
        glow={match.type === 'tournament' ? 'gold' : 'purple'}
        className="p-6 2xl:p-8 relative overflow-hidden bg-gradient-to-r from-[#140b21] via-[#1a0f2e] to-[#140b21] rounded-2xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <Badge variant={match.type === 'tournament' ? 'gold' : 'purple'} className="text-xs 2xl:text-sm uppercase font-black px-3 py-1 rounded-lg">
                {match.type === 'tournament' ? 'Torneo Oficial' : 'Scrim'}
              </Badge>
              <span className="text-sm 2xl:text-base text-gray-300 flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 2xl:w-5 2xl:h-5 text-[#E2B86E]" /> {match.date}
              </span>
              {match.game && (
                <span className="text-xs 2xl:text-sm px-2.5 py-1 bg-[#26143E] text-[#E2B86E] rounded-lg font-bold border border-[#522B80]/40">
                  {match.game}
                </span>
              )}
            </div>

            {match.type === 'tournament' && match.tournamentName && (
              <h3 className="text-base 2xl:text-lg font-bold text-[#E2B86E] flex items-center gap-2 pt-1">
                <Trophy className="w-5 h-5 text-[#E2B86E] shrink-0" />
                <span>{match.tournamentName}</span>
              </h3>
            )}
          </div>

          {/* Versus Banner */}
          <div className="flex items-center space-x-5 bg-[#0D0914]/90 p-4 px-7 2xl:p-5 2xl:px-8 rounded-2xl border border-[#522B80]/50 shadow-2xl self-start lg:self-auto">
            <div className="text-right min-w-[110px] 2xl:min-w-[130px]">
              <p className="text-sm 2xl:text-base font-extrabold text-white truncate">{URS_GAMARA_TEAM.name}</p>
              <p className="text-3xl sm:text-4xl 2xl:text-5xl font-black text-[#E2B86E] tracking-tight">
                {match.overallScore.split('-')[0]?.trim() || '0'}
              </p>
            </div>

            <div className="px-3 py-1.5 bg-[#26143E] text-[#8B44F7] font-black text-xs 2xl:text-sm rounded-xl border border-[#8B44F7]/40 shadow-inner">
              VS
            </div>

            <div className="text-left min-w-[110px] 2xl:min-w-[130px]">
              <p className="text-sm 2xl:text-base font-extrabold text-gray-200 truncate">{match.opponentName}</p>
              <p className="text-3xl sm:text-4xl 2xl:text-5xl font-black text-gray-200 tracking-tight">
                {match.overallScore.split('-')[1]?.trim() || '0'}
              </p>
            </div>

            <div className="pl-4 border-l border-[#26143E]">
              <span
                className={`text-xs 2xl:text-sm font-black px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-sm ${
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
        <div className="space-y-2.5">
          <label className="block text-xs 2xl:text-sm font-bold uppercase tracking-wider text-gray-300">
            Mapas Jugados en la Serie ({mapsList.length})
          </label>
          <div className="flex items-center space-x-3 overflow-x-auto pb-1.5 scrollbar-thin">
            {mapsList.map((m, idx) => {
              const mapWon = m.teamScore > m.opponentScore;
              const isSelected = idx === selectedMapIndex;
              const hasStats = m.playerStats && m.playerStats.length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedMapIndex(idx)}
                  className={`flex items-center space-x-3 px-4 py-3 2xl:px-5 2xl:py-3.5 rounded-xl text-xs 2xl:text-sm font-bold transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-[#522B80] border-[#8B44F7] text-white shadow-lg shadow-[#8B44F7]/25 ring-1 ring-[#8B44F7]'
                      : 'bg-[#140b21] border-[#26143E] text-gray-400 hover:text-gray-200 hover:border-[#522B80]'
                  }`}
                >
                  <MapPin className={`w-4 h-4 2xl:w-5 2xl:h-5 ${isSelected ? 'text-[#E2B86E]' : 'text-gray-500'}`} />
                  <span>
                    Mapa {idx + 1}: {m.mapName}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-black ${
                      mapWon
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-950 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {m.teamScore} - {m.opponentScore}
                  </span>
                  {hasStats && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" title="Estadísticas de jugadores cargadas" />
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
            className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none filter blur-[1px]"
            style={{ backgroundImage: `url(${mapMeta.splash})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#140b21] via-[#140b21]/90 to-transparent pointer-events-none" />

        <div className="relative z-10 p-6 2xl:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center space-x-4">
            {mapMeta?.displayIcon ? (
              <img
                src={mapMeta.displayIcon}
                alt={currentMap.mapName}
                className="w-14 h-14 2xl:w-16 2xl:h-16 object-contain bg-[#26143E]/80 p-2 rounded-2xl border border-[#8B44F7]/40 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 2xl:w-16 2xl:h-16 bg-[#26143E] rounded-2xl flex items-center justify-center text-[#E2B86E] font-black shadow-md">
                <MapPin className="w-7 h-7 2xl:w-8 2xl:h-8" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                <h2 className="text-2xl 2xl:text-3xl font-black text-white tracking-tight">{currentMap.mapName}</h2>
                <span
                  className={`text-xs 2xl:text-sm font-black px-2.5 py-1 rounded-lg uppercase ${
                    isMapWon
                      ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/40'
                      : isMapLost
                      ? 'bg-red-950/90 text-red-400 border border-red-500/40'
                      : 'bg-amber-950/90 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {isMapWon ? 'Victoria' : isMapLost ? 'Derrota' : 'Empate'} ({currentMap.teamScore} - {currentMap.opponentScore})
                </span>
              </div>
              <p className="text-xs 2xl:text-sm text-gray-300 mt-1">
                Resumen de combate y comparativa histórica de jugadores en este escenario.
              </p>
            </div>
          </div>

          {/* Quick Map KPIs */}
          <div className="flex items-center gap-3 flex-wrap">
            {mapMvp && (
              <div className="flex items-center space-x-3 px-4 py-2.5 2xl:px-5 2xl:py-3 bg-[#26143E]/90 border border-[#E2B86E]/50 rounded-2xl shadow-md">
                <Flame className="w-5 h-5 2xl:w-6 2xl:h-6 text-[#E2B86E]" />
                <div>
                  <p className="text-[11px] 2xl:text-xs text-gray-400 font-bold uppercase tracking-wider">MVP del Mapa</p>
                  <p className="font-extrabold text-white text-sm 2xl:text-base">
                    {mapMvp.playerNick} <span className="text-[#E2B86E]">({mapMvp.matchKills} Kills)</span>
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 px-4 py-2.5 2xl:px-5 2xl:py-3 bg-[#26143E]/90 border border-[#8B44F7]/50 rounded-2xl shadow-md">
              <Target className="w-5 h-5 2xl:w-6 2xl:h-6 text-[#8B44F7]" />
              <div>
                <p className="text-[11px] 2xl:text-xs text-gray-400 font-bold uppercase tracking-wider">Kills Totales</p>
                <p className="font-extrabold text-white text-sm 2xl:text-base">
                  {currentMapStats.reduce((acc, p) => acc + (p.kills || 0), 0)} Bajas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scoreboard & Historical Performance Table */}
      {comparisons.length === 0 ? (
        <Card className="p-8 2xl:p-10 text-center space-y-4 bg-[#140b21] border-[#26143E] rounded-2xl">
          <div className="w-14 h-14 2xl:w-16 2xl:h-16 rounded-2xl bg-[#522B80]/40 text-[#E2B86E] flex items-center justify-center mx-auto shadow-inner">
            <HelpCircle className="w-7 h-7 2xl:w-8 2xl:h-8" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-lg 2xl:text-xl font-black text-white">Sin Estadísticas Individuales para {currentMap.mapName}</h3>
            <p className="text-xs 2xl:text-sm text-gray-300 leading-relaxed">
              No se han cargado las estadísticas individuales de los jugadores (KDA, Agente, First Kills) para este mapa.
              Puedes editar el partido y escanear la captura del resultado con OCR para extraerlas al instante.
            </p>
          </div>
          <Link to={`/dashboard/scrims/edit/${match.id}`}>
            <Button variant="secondary" size="md" className="px-5 py-2.5 text-sm font-bold" leftIcon={<Edit3 className="w-4 h-4 2xl:w-5 2xl:h-5" />}>
              Escanear Captura con OCR en Editor
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs 2xl:text-sm font-black uppercase tracking-wider text-[#E2B86E] flex items-center gap-2">
              <Sparkles className="w-4 h-4 2xl:w-5 2xl:h-5 text-[#8B44F7]" />
              <span>Tabla Comparativa: Rendimiento en el Partido vs Histórico en {currentMap.mapName}</span>
            </h3>
            <span className="text-xs 2xl:text-sm text-gray-400 font-medium">
              Mostrando {comparisons.length} jugadores de nuestro equipo
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#26143E] bg-[#140b21] shadow-xl">
            <table className="w-full text-left border-collapse text-xs 2xl:text-sm">
              <thead>
                <tr className="bg-[#180d29] text-gray-300 uppercase text-[11px] 2xl:text-xs font-extrabold border-b border-[#26143E] tracking-wider">
                  <th className="py-4 px-4 2xl:py-4.5 2xl:px-5">Jugador</th>
                  <th className="py-4 px-4 2xl:py-4.5 2xl:px-5">Agente en Partido</th>
                  <th className="py-4 px-4 2xl:py-4.5 2xl:px-5 text-center">Stats en Partido</th>
                  <th className="py-4 px-4 2xl:py-4.5 2xl:px-5">Agente Principal Histórico en {currentMap.mapName}</th>
                  <th className="py-4 px-4 2xl:py-4.5 2xl:px-5 text-center">Histórico en {currentMap.mapName}</th>
                  <th className="py-4 px-4 2xl:py-4.5 2xl:px-5 text-center">Diferencial (+ / -)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26143E]/80 text-gray-300">
                {comparisons.map((c, idx) => {
                  const isPositiveKda = c.kdaDelta > 0;
                  const isNegativeKda = c.kdaDelta < 0;

                  return (
                    <tr key={idx} className="hover:bg-[#1f1035]/80 transition-colors">
                      {/* 1. Jugador */}
                      <td className="py-4 px-4 2xl:py-4.5 2xl:px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 2xl:w-11 2xl:h-11 rounded-xl bg-[#26143E] border border-[#522B80]/50 flex items-center justify-center font-black text-xs 2xl:text-sm text-[#E2B86E] overflow-hidden shrink-0 shadow-sm">
                            {c.avatarUrl ? (
                              <img src={c.avatarUrl} alt={c.playerNick} className="w-full h-full object-cover" />
                            ) : (
                              c.playerNick.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-extrabold text-white text-sm 2xl:text-base truncate">{c.playerNick}</span>
                              {c.isGuest && (
                                <span className="text-[10px] 2xl:text-xs bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-500/40">
                                  Inv.
                                </span>
                              )}
                            </div>
                            <span className="text-xs 2xl:text-sm text-gray-400 block truncate font-medium">
                              {c.historical.timesPlayed} {c.historical.timesPlayed === 1 ? 'mapa histórico' : 'mapas históricos'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Agente en Partido */}
                      <td className="py-4 px-4 2xl:py-4.5 2xl:px-5">
                        <div className="flex items-center space-x-3">
                          {c.matchAgentIcon ? (
                            <img
                              src={c.matchAgentIcon}
                              alt={c.matchAgent || 'Agente'}
                              className="w-9 h-9 2xl:w-10 2xl:h-10 rounded-xl bg-[#26143E] p-0.5 border border-[#8B44F7]/50 object-contain shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-9 h-9 2xl:w-10 2xl:h-10 rounded-xl bg-[#26143E] flex items-center justify-center text-xs font-bold text-gray-400">
                              ?
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-white text-sm 2xl:text-base">{c.matchAgent || 'No especificado'}</p>
                            {c.isMainAgentOnMap ? (
                              <span className="text-[11px] 2xl:text-xs text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 2xl:w-3.5 2xl:h-3.5" /> Pick Habitual
                              </span>
                            ) : c.historical.mostPlayedAgent ? (
                              <span className="text-[11px] 2xl:text-xs text-purple-400 font-medium">Pick Secundario</span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* 3. Stats en Partido */}
                      <td className="py-4 px-4 2xl:py-4.5 2xl:px-5 text-center">
                        <p className="font-black text-[#E2B86E] text-sm 2xl:text-base tracking-wide">
                          {c.matchKills} / {c.matchDeaths} / {c.matchAssists}
                        </p>
                        <p className="text-xs 2xl:text-sm text-gray-400 font-semibold mt-0.5">
                          KDA: <span className="text-white font-black">{c.matchKdaRatio.toFixed(2)}</span>
                          {c.matchFirstKills > 0 && (
                            <span className="text-amber-400 font-black ml-1.5">({c.matchFirstKills} FK)</span>
                          )}
                        </p>
                      </td>

                      {/* 4. Agente Principal Histórico en este mapa */}
                      <td className="py-4 px-4 2xl:py-4.5 2xl:px-5">
                        {c.historical.mostPlayedAgent ? (
                          <div className="flex items-center space-x-3">
                            {c.historical.mostPlayedAgentIcon ? (
                              <img
                                src={c.historical.mostPlayedAgentIcon}
                                alt={c.historical.mostPlayedAgent}
                                className="w-8 h-8 2xl:w-9 2xl:h-9 rounded-xl bg-[#26143E] p-0.5 border border-[#E2B86E]/40 object-contain shrink-0 shadow-sm"
                              />
                            ) : null}
                            <div>
                              <p className="font-extrabold text-gray-200 text-sm 2xl:text-base">{c.historical.mostPlayedAgent}</p>
                              <span className="text-xs 2xl:text-sm text-gray-400 font-medium">
                                Usado en {c.historical.agentUsageCount} {c.historical.agentUsageCount === 1 ? 'mapa' : 'mapas'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs 2xl:text-sm italic">Sin historial</span>
                        )}
                      </td>

                      {/* 5. Histórico en este mapa */}
                      <td className="py-4 px-4 2xl:py-4.5 2xl:px-5 text-center">
                        {c.historical.timesPlayed > 0 ? (
                          <div>
                            <p className="font-extrabold text-gray-200 text-sm 2xl:text-base">{c.historical.formattedKda}</p>
                            <p className="text-xs 2xl:text-sm text-gray-400 font-medium mt-0.5">
                              KDA Hist: <span className="text-white font-black">{c.historical.kdaRatio.toFixed(2)}</span>{' '}
                              • WR: <span className="text-[#E2B86E] font-black">{c.historical.winRate}%</span>
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs 2xl:text-sm italic">Primer mapa registrado</span>
                        )}
                      </td>

                      {/* 6. Diferencial vs Histórico */}
                      <td className="py-4 px-4 2xl:py-4.5 2xl:px-5 text-center">
                        {c.historical.timesPlayed > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`inline-flex items-center space-x-1.5 px-3 py-1 2xl:px-3.5 2xl:py-1.5 rounded-full text-xs 2xl:text-sm font-black shadow-sm ${
                                isPositiveKda
                                  ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/40'
                                  : isNegativeKda
                                  ? 'bg-red-950/90 text-red-400 border border-red-500/40'
                                  : 'bg-gray-800 text-gray-300 border border-gray-700'
                              }`}
                            >
                              {isPositiveKda ? (
                                <TrendingUp className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" />
                              ) : isNegativeKda ? (
                                <TrendingDown className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" />
                              ) : (
                                <Minus className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" />
                              )}
                              <span>
                                {c.kdaDelta > 0 ? `+${c.kdaDelta.toFixed(2)}` : c.kdaDelta.toFixed(2)} KDA
                              </span>
                            </span>

                            <span className="text-[11px] 2xl:text-xs text-gray-400 font-medium mt-1">
                              {c.killsDelta >= 0 ? `+${c.killsDelta}` : `${c.killsDelta}`} Bajas vs Prom.
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs 2xl:text-sm text-gray-400 px-2.5 py-1 bg-[#26143E] rounded-lg border border-gray-700 font-medium">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* VODs Card */}
        <div className="p-5 2xl:p-6 bg-[#140b21] border border-[#26143E] rounded-2xl space-y-3 shadow-lg">
          <h4 className="text-xs 2xl:text-sm font-black uppercase tracking-wider text-[#E2B86E] flex items-center gap-2">
            <Video className="w-4 h-4 2xl:w-5 2xl:h-5 text-[#8B44F7]" />
            <span>VODs del Encuentro</span>
          </h4>
          {match.vods && match.vods.length > 0 ? (
            <div className="space-y-2 pt-1">
              {match.vods.map((v) => (
                <a
                  key={v.id}
                  href={v.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 2xl:p-4 bg-[#180d29] hover:bg-[#26143E] border border-[#522B80]/40 rounded-xl text-xs 2xl:text-sm text-[#E2B86E] transition-all group font-bold shadow-sm"
                >
                  <span className="group-hover:text-white transition-colors">
                    {v.isFullMatch ? 'VOD: Partido Completo' : `VOD: ${v.mapName || 'Mapa'}`}
                  </span>
                  <ExternalLink className="w-4 h-4 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs 2xl:text-sm text-gray-400 italic pt-1">No se han registrado enlaces de VOD para este partido.</p>
          )}
        </div>

        {/* Screenshots Card */}
        <div className="p-5 2xl:p-6 bg-[#140b21] border border-[#26143E] rounded-2xl space-y-3 shadow-lg">
          <h4 className="text-xs 2xl:text-sm font-black uppercase tracking-wider text-[#E2B86E] flex items-center gap-2">
            <ImageIcon className="w-4 h-4 2xl:w-5 2xl:h-5 text-[#8B44F7]" />
            <span>Capturas del Scoreboard</span>
          </h4>
          {match.screenshotUrls && match.screenshotUrls.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {match.screenshotUrls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative group rounded-xl overflow-hidden border border-[#522B80]/50 block aspect-video bg-black shadow-md"
                >
                  <img src={url} alt={`Captura ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs 2xl:text-sm font-bold backdrop-blur-[1px]">
                    Ver Imagen Completa
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs 2xl:text-sm text-gray-400 italic pt-1">No hay capturas adjuntas a este partido.</p>
          )}
        </div>
      </div>
    </div>
  );
};
