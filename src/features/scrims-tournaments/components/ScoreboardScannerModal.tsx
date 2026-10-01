import React, { useState, useEffect } from 'react';
import {
  Scan,
  Sparkles,
  CheckCircle,
  AlertCircle,
  X,
  User,
  Trash2,
  Plus,
  Gamepad2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';
import { scoreboardOcrService } from '../services/scoreboardOcrService';
import { valorantApiService, type ValorantAgent, type ValorantMapData, FALLBACK_VALORANT_MAPS, FALLBACK_VALORANT_AGENTS } from '../../../services/valorantApiService';
import type { TeamMember } from '../../teams/types';
import type { MatchPlayerStats } from '../types';

interface ScoreboardScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  imageFile?: File | null;
  rosterMembers: TeamMember[];
  currentMapName?: string;
  currentTeamScore?: number | '';
  currentOpponentScore?: number | '';
  existingMaps?: Array<{ mapName: string; teamScore: number; opponentScore: number }>;
  onApplyResults: (data: {
    mapName?: string;
    teamScore?: number | '';
    opponentScore?: number | '';
    playerStats: MatchPlayerStats[];
  }) => void;
}

export const ScoreboardScannerModal: React.FC<ScoreboardScannerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageFile,
  rosterMembers,
  currentMapName,
  currentTeamScore,
  currentOpponentScore,
  existingMaps = [],
  onApplyResults,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [agents, setAgents] = useState<ValorantAgent[]>(FALLBACK_VALORANT_AGENTS);
  const [maps, setMaps] = useState<ValorantMapData[]>([]);

  // Parsed Form State
  const [mapName, setMapName] = useState<string>(currentMapName || 'Abyss');
  const [teamScore, setTeamScore] = useState<number | ''>(currentTeamScore ?? '');
  const [opponentScore, setOpponentScore] = useState<number | ''>(currentOpponentScore ?? '');
  const [players, setPlayers] = useState<MatchPlayerStats[]>([]);
  const [isRoundsPreserved, setIsRoundsPreserved] = useState<boolean>(false);

  // Fetch agents and maps from Valorant API
  useEffect(() => {
    const loadValorantAssets = async () => {
      try {
        const [agentData, mapData] = await Promise.all([
          valorantApiService.getAgents(),
          valorantApiService.getMaps(),
        ]);
        if (agentData && agentData.length > 0) setAgents(agentData);
        if (mapData && mapData.length > 0) setMaps(mapData);
      } catch (err) {
        console.warn('Failed loading assets in scanner modal:', err);
      }
    };
    loadValorantAssets();
  }, []);

  // Run OCR when modal opens with an image
  useEffect(() => {
    if (!isOpen) {
      setScanError(null);
      setIsRoundsPreserved(false);
      return;
    }

    const startScan = async () => {
      const source = imageFile || imageUrl;
      if (!source) {
        setScanError('No se encontró ninguna captura para procesar.');
        return;
      }

      setIsScanning(true);
      setScanError(null);

      try {
        const result = await scoreboardOcrService.parseValorantScoreboard(source, rosterMembers);

        const targetMap = result.mapName || currentMapName || 'Abyss';
        setMapName(targetMap);

        // Check if user already loaded/typed rounds for this map
        const existingInList = existingMaps.find(
          (m) => m.mapName.trim().toLowerCase() === targetMap.trim().toLowerCase()
        );

        if (existingInList && existingInList.teamScore !== undefined && existingInList.opponentScore !== undefined) {
          setTeamScore(existingInList.teamScore);
          setOpponentScore(existingInList.opponentScore);
          setIsRoundsPreserved(true);
        } else if (
          currentMapName &&
          currentMapName.trim().toLowerCase() === targetMap.trim().toLowerCase() &&
          currentTeamScore !== '' &&
          currentTeamScore !== undefined &&
          currentOpponentScore !== '' &&
          currentOpponentScore !== undefined
        ) {
          setTeamScore(Number(currentTeamScore));
          setOpponentScore(Number(currentOpponentScore));
          setIsRoundsPreserved(true);
        } else {
          setTeamScore(result.teamScore !== undefined ? result.teamScore : '');
          setOpponentScore(result.opponentScore !== undefined ? result.opponentScore : '');
          setIsRoundsPreserved(false);
        }

        if (result.players && result.players.length > 0) {
          const currentAgents = agents.length > 0 ? agents : FALLBACK_VALORANT_AGENTS;
          const enriched = result.players.map((p) => {
            const ag = currentAgents.find((a) => a.displayName.toLowerCase() === p.agent?.toLowerCase());
            return {
              ...p,
              agent: ag ? ag.displayName : p.agent,
              agentIcon: ag ? ag.displayIcon : p.agentIcon,
            };
          });
          setPlayers(enriched);
        } else if (rosterMembers.length > 0) {
          // Initialize empty slots for roster members
          const initial: MatchPlayerStats[] = rosterMembers.slice(0, 5).map((m) => ({
            playerId: m.id,
            playerNick: m.displayName,
            gameTag: m.gameTag,
            kills: 0,
            deaths: 0,
            assists: 0,
            firstKills: 0,
            kdaRatio: 0,
            isGuest: false,
          }));
          setPlayers(initial);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al procesar la imagen con OCR.';
        setScanError(msg);
      } finally {
        setIsScanning(false);
      }
    };

    startScan();
  }, [isOpen, imageUrl, imageFile]);

  if (!isOpen) return null;

  const handlePlayerChange = (index: number, field: keyof MatchPlayerStats, value: any) => {
    setPlayers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Handle roster member vs guest selection
      if (field === 'playerId') {
        if (value === 'guest') {
          updated[index].isGuest = true;
          updated[index].playerId = undefined;
          if (!updated[index].playerNick.startsWith('Invitado')) {
            updated[index].playerNick = `Invitado (${updated[index].playerNick})`;
          }
          updated[index].gameTag = undefined;
        } else if (value) {
          const matched = rosterMembers.find((m) => m.id === value);
          if (matched) {
            updated[index].isGuest = false;
            updated[index].playerId = matched.id;
            updated[index].playerNick = matched.displayName;
            updated[index].gameTag = matched.gameTag;
          }
        }
      }

      // If changing agent, update agentIcon
      if (field === 'agent') {
        const ag = agents.find((a) => a.displayName.toLowerCase() === String(value).toLowerCase());
        if (ag) {
          updated[index].agent = ag.displayName;
          updated[index].agentIcon = ag.displayIcon;
        } else {
          updated[index].agent = value || undefined;
          updated[index].agentIcon = undefined;
        }
      }

      // Recalculate KDA ratio automatically
      if (['kills', 'deaths', 'assists'].includes(field)) {
        const k = Number(updated[index].kills || 0);
        const d = Number(updated[index].deaths || 0);
        const a = Number(updated[index].assists || 0);
        updated[index].kdaRatio = d > 0 ? Number(((k + a) / d).toFixed(2)) : k + a;
      }

      return updated;
    });
  };

  const handleAddPlayerRow = () => {
    const newPlayer: MatchPlayerStats = {
      playerNick: `Invitado (${players.length + 1})`,
      kills: 0,
      deaths: 0,
      assists: 0,
      firstKills: 0,
      kdaRatio: 0,
      isGuest: true,
    };
    setPlayers((prev) => [...prev, newPlayer]);
  };

  const handleRemovePlayerRow = (index: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    onApplyResults({
      mapName,
      teamScore,
      opponentScore,
      playerStats: players,
    });
    onClose();
  };

  const availableMapNames = maps.length > 0 ? maps.map((m) => m.displayName) : FALLBACK_VALORANT_MAPS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#140b21] border border-[#8B44F7]/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-5 bg-gradient-to-r from-[#26143E] via-[#1c0c32] to-[#26143E] border-b border-[#8B44F7]/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B44F7]/20 border border-[#8B44F7]/50 flex items-center justify-center text-[#E2B86E]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Análisis & Extracción OCR de Scoreboard</span>
                <Badge variant="gold" className="text-[10px]">Valorant AI</Badge>
              </h3>
              <p className="text-xs text-gray-400">
                Extracción automática de KDA, Primeras Kills, mapa y distinción de integrantes y jugadores invitados.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isScanning ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#522B80]/40 border border-[#8B44F7]/50 flex items-center justify-center mx-auto text-[#E2B86E] animate-bounce">
                <Scan className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Procesando Captura con OCR...</h4>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Detectando filas de equipo (jugador propio dorado y aliados cyan), limpiando tags de premier y emparejando integrantes del roster.
                </p>
              </div>
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {scanError && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* 1. MAP & SCORE OVERVIEW */}
              <div className="p-4 bg-[#180d29] border border-[#522B80]/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2B86E] flex items-center gap-1.5">
                    <Gamepad2 className="w-4 h-4 text-[#8B44F7]" />
                    <span>Datos del Encuentro & Mapa</span>
                  </h4>
                  <div className="flex items-center space-x-2">
                    {isRoundsPreserved && (
                      <Badge variant="gold" className="text-[9px]">
                        Rondas Preservadas
                      </Badge>
                    )}
                    {teamScore !== '' && opponentScore !== '' && (
                      <Badge variant="purple" className="text-[10px]">
                        {Number(teamScore) > Number(opponentScore)
                          ? 'Victoria'
                          : Number(teamScore) < Number(opponentScore)
                          ? 'Derrota'
                          : 'Empate'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Mapa de Valorant"
                    value={mapName}
                    onChange={(e) => setMapName(e.target.value)}
                  >
                    {availableMapNames.map((m) => (
                      <option key={m} value={m} className="bg-[#140b21] text-white">
                        {m}
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Rondas URS Gamara"
                    type="number"
                    placeholder="ej. 13"
                    value={teamScore}
                    onChange={(e) => setTeamScore(e.target.value === '' ? '' : Number(e.target.value))}
                  />

                  <Input
                    label="Rondas Rival"
                    type="number"
                    placeholder="ej. 11"
                    value={opponentScore}
                    onChange={(e) => setOpponentScore(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              </div>

              {/* 2. PLAYERS STATS TABLE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#E2B86E]" />
                    <span>Jugadores Detectados de Nuestro Equipo ({players.length})</span>
                  </h4>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPlayerRow}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Agregar Jugador
                  </Button>
                </div>

                <div className="border border-[#522B80]/40 rounded-xl overflow-hidden bg-[#180d29]/90">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#26143E] text-gray-300 uppercase font-semibold text-[10px] tracking-wider border-b border-[#522B80]/40">
                        <tr>
                          <th className="py-2.5 px-3">Integrante / Nickname</th>
                          <th className="py-2.5 px-3">Agente</th>
                          <th className="py-2.5 px-2 text-center">Kills</th>
                          <th className="py-2.5 px-2 text-center">Deaths</th>
                          <th className="py-2.5 px-2 text-center">Assists</th>
                          <th className="py-2.5 px-2 text-center">1st Bloods</th>
                          <th className="py-2.5 px-2 text-center">KDA Ratio</th>
                          <th className="py-2.5 px-2 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#26143E]/60">
                        {players.map((player, idx) => {
                          const isGuest = player.isGuest || !player.playerId;

                          return (
                            <tr key={idx} className="hover:bg-[#26143E]/40 transition-colors">
                              {/* Member Nick / Dropdown */}
                              <td className="py-2 px-3 min-w-[200px]">
                                <div className="space-y-1">
                                  {rosterMembers.length > 0 ? (
                                    <select
                                      value={player.playerId || (isGuest ? 'guest' : '')}
                                      onChange={(e) => handlePlayerChange(idx, 'playerId', e.target.value)}
                                      className="w-full bg-[#140b21] border border-[#522B80]/60 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#8B44F7]"
                                    >
                                      <option value="">Seleccionar del Roster...</option>
                                      {rosterMembers.map((m) => (
                                        <option key={m.id} value={m.id}>
                                          {m.displayName} {m.gameTag ? `(${m.gameTag})` : ''}
                                        </option>
                                      ))}
                                      <option value="guest">👤 Jugador Invitado (No en roster)</option>
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={player.playerNick}
                                      onChange={(e) => handlePlayerChange(idx, 'playerNick', e.target.value)}
                                      className="w-full bg-[#140b21] border border-[#522B80]/60 rounded-lg px-2 py-1 text-xs text-white"
                                    />
                                  )}

                                  {isGuest && (
                                    <div className="flex items-center space-x-1.5 pt-0.5">
                                      <span className="text-[9px] bg-amber-950/70 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold">
                                        Invitado
                                      </span>
                                      <input
                                        type="text"
                                        placeholder="Nombre del invitado"
                                        value={player.playerNick}
                                        onChange={(e) => handlePlayerChange(idx, 'playerNick', e.target.value)}
                                        className="bg-transparent text-[11px] text-gray-300 underline focus:outline-none w-32"
                                      />
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Agent Selector with Icon */}
                              <td className="py-2 px-3 min-w-[130px]">
                                <div className="flex items-center space-x-1.5">
                                  {player.agentIcon && (
                                    <img
                                      src={player.agentIcon}
                                      alt={player.agent || 'Agent'}
                                      className="w-6 h-6 rounded bg-[#26143E] object-contain shrink-0"
                                    />
                                  )}
                                  <select
                                    value={player.agent || ''}
                                    onChange={(e) => handlePlayerChange(idx, 'agent', e.target.value)}
                                    className="w-full bg-[#140b21] border border-[#522B80]/60 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#8B44F7]"
                                  >
                                    <option value="">Selecciona Agente...</option>
                                    {agents.map((a) => (
                                      <option key={a.uuid} value={a.displayName}>
                                        {a.displayName}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </td>

                              {/* Kills */}
                              <td className="py-2 px-2 text-center w-14">
                                <input
                                  type="number"
                                  min={0}
                                  value={player.kills}
                                  onChange={(e) => handlePlayerChange(idx, 'kills', Number(e.target.value))}
                                  className="w-12 text-center bg-[#140b21] border border-[#522B80]/60 rounded px-1 py-1 text-xs font-bold text-white"
                                />
                              </td>

                              {/* Deaths */}
                              <td className="py-2 px-2 text-center w-14">
                                <input
                                  type="number"
                                  min={0}
                                  value={player.deaths}
                                  onChange={(e) => handlePlayerChange(idx, 'deaths', Number(e.target.value))}
                                  className="w-12 text-center bg-[#140b21] border border-[#522B80]/60 rounded px-1 py-1 text-xs font-bold text-gray-300"
                                />
                              </td>

                              {/* Assists */}
                              <td className="py-2 px-2 text-center w-14">
                                <input
                                  type="number"
                                  min={0}
                                  value={player.assists}
                                  onChange={(e) => handlePlayerChange(idx, 'assists', Number(e.target.value))}
                                  className="w-12 text-center bg-[#140b21] border border-[#522B80]/60 rounded px-1 py-1 text-xs font-bold text-gray-300"
                                />
                              </td>

                              {/* First Kills */}
                              <td className="py-2 px-2 text-center w-14">
                                <input
                                  type="number"
                                  min={0}
                                  value={player.firstKills || 0}
                                  onChange={(e) => handlePlayerChange(idx, 'firstKills', Number(e.target.value))}
                                  className="w-12 text-center bg-[#140b21] border border-[#522B80]/60 rounded px-1 py-1 text-xs font-bold text-[#E2B86E]"
                                />
                              </td>

                              {/* KDA Ratio */}
                              <td className="py-2 px-2 text-center w-16 font-extrabold text-[#E2B86E]">
                                {(
                                  player.kdaRatio ??
                                  (player.deaths > 0
                                    ? Number(((player.kills + player.assists) / player.deaths).toFixed(2))
                                    : player.kills + player.assists)
                                ).toFixed(2)}
                              </td>

                              {/* Actions */}
                              <td className="py-2 px-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePlayerRow(idx)}
                                  className="p-1 text-gray-400 hover:text-red-400"
                                  title="Eliminar fila"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-[#180d29] border-t border-[#26143E] flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleApply}
            disabled={isScanning}
            leftIcon={<CheckCircle className="w-4 h-4 text-[#1c0c32]" />}
          >
            Aplicar Datos al Partido
          </Button>
        </div>
      </div>
    </div>
  );
};
