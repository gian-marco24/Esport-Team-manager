import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  VALORANT_MAP_ROTATION,
  type MatchType,
  type MatchMapResult,
  type MatchVod,
  type MatchPlayerStats,
} from '../types';
import { matchService } from '../services/matchService';
import { uploadImageToBackend } from '../services/uploadService';
import { teamService } from '../../teams/services/teamService';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import type { Roster, TeamMember } from '../../teams/types';

export const useCreateMatch = (matchId?: string) => {
  const navigate = useNavigate();

  // Rosters State
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [selectedRosterId, setSelectedRosterId] = useState<string>('');
  const [rosterMembers, setRosterMembers] = useState<TeamMember[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);

  // General Form State
  const [matchType, setMatchType] = useState<MatchType>('scrim');
  const [tournamentName, setTournamentName] = useState<string>('');
  const [opponentName, setOpponentName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Maps Management State
  const [addedMaps, setAddedMaps] = useState<MatchMapResult[]>([]);
  const [currentMapName, setCurrentMapName] = useState<string>(VALORANT_MAP_ROTATION[0]);
  const [currentTeamScore, setCurrentTeamScore] = useState<number | ''>(13);
  const [currentOpponentScore, setCurrentOpponentScore] = useState<number | ''>(8);
  const [currentPlayerStats, setCurrentPlayerStats] = useState<MatchPlayerStats[]>([]);

  // VODs State
  const [addedVods, setAddedVods] = useState<MatchVod[]>([]);
  const [newVodUrl, setNewVodUrl] = useState<string>('');
  const [newVodIsFullMatch, setNewVodIsFullMatch] = useState<boolean>(true);
  const [newVodMapName, setNewVodMapName] = useState<string>(VALORANT_MAP_ROTATION[0]);

  // Screenshots State
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // OCR Modal State
  const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
  const [ocrTargetImage, setOcrTargetImage] = useState<string | undefined>(undefined);
  const [ocrTargetFile, setOcrTargetFile] = useState<File | null>(null);

  // Loading & Error States
  const [isLoadingMatch, setIsLoadingMatch] = useState<boolean>(Boolean(matchId));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load Rosters and Members
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        const [rosterList, memberList] = await Promise.all([
          teamService.getRosters(URS_GAMARA_TEAM.id),
          teamService.getMembers(URS_GAMARA_TEAM.id),
        ]);
        setRosters(rosterList);
        setAllMembers(memberList);

        if (rosterList.length > 0 && !selectedRosterId) {
          // Default to first Valorant roster or first roster
          const valRoster = rosterList.find((r) => r.game.toLowerCase().includes('valorant'));
          setSelectedRosterId(valRoster ? valRoster.id : rosterList[0].id);
        }
      } catch (e) {
        console.error('Error loading rosters in match form:', e);
      }
    };
    loadTeamData();
  }, []);

  // Filter members assigned to current selected roster
  useEffect(() => {
    if (!selectedRosterId) {
      setRosterMembers(allMembers);
      return;
    }
    const filtered = allMembers.filter((m) =>
      m.rosterAssignments?.some((a) => a.rosterId === selectedRosterId)
    );
    setRosterMembers(filtered.length > 0 ? filtered : allMembers);
  }, [selectedRosterId, allMembers]);

  // Fetch match details if editing
  useEffect(() => {
    if (!matchId) return;

    const loadMatchForEditing = async () => {
      setIsLoadingMatch(true);
      try {
        const existing = await matchService.getMatchById(matchId);
        if (existing) {
          setMatchType(existing.type);
          if (existing.rosterId) setSelectedRosterId(existing.rosterId);
          setTournamentName(existing.tournamentName || '');
          setOpponentName(existing.opponentName);
          setDate(existing.date);
          setAddedMaps(existing.maps || []);
          setAddedVods(existing.vods || []);

          const screenshots =
            existing.screenshotUrls && existing.screenshotUrls.length > 0
              ? existing.screenshotUrls
              : (existing as unknown as { screenshotUrl?: string }).screenshotUrl
              ? [(existing as unknown as { screenshotUrl?: string }).screenshotUrl as string]
              : [];
          setScreenshotUrls(screenshots);

          if (existing.maps && existing.maps.length > 0) {
            const firstMap = existing.maps[0];
            setCurrentMapName(firstMap.mapName);
            setCurrentTeamScore(firstMap.teamScore);
            setCurrentOpponentScore(firstMap.opponentScore);
            if (firstMap.playerStats && firstMap.playerStats.length > 0) {
              setCurrentPlayerStats(firstMap.playerStats);
            }
          } else if (existing.playerStats && existing.playerStats.length > 0) {
            setCurrentPlayerStats(existing.playerStats);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar el partido para editar.';
        setFormError(message);
      } finally {
        setIsLoadingMatch(false);
      }
    };

    loadMatchForEditing();
  }, [matchId]);

  const selectedRoster = rosters.find((r) => r.id === selectedRosterId);
  const isValorantRoster =
    !selectedRoster ||
    selectedRoster.game.toLowerCase().includes('valorant') ||
    selectedRoster.name.toLowerCase().includes('valorant');

  // Dynamic Opponent Rounds Label
  const opponentRoundsLabel = `Rondas ${opponentName.trim() || 'Rival'}`;

  // Add or update a map in the series
  const handleAddMapToSeries = () => {
    if (currentTeamScore === '' || currentOpponentScore === '') {
      setFormError('Por favor ingresa las rondas de ambos equipos.');
      return;
    }

    const newMap: MatchMapResult = {
      mapName: currentMapName,
      teamScore: Number(currentTeamScore),
      opponentScore: Number(currentOpponentScore),
      playerStats: currentPlayerStats.length > 0 ? [...currentPlayerStats] : undefined,
    };

    setAddedMaps((prev) => {
      const existingIdx = prev.findIndex(
        (m) => m.mapName.trim().toLowerCase() === currentMapName.trim().toLowerCase()
      );
      if (existingIdx !== -1) {
        return prev.map((m, idx) => (idx === existingIdx ? newMap : m));
      }
      return [...prev, newMap];
    });

    setFormError(null);

    // Reset current map inputs and clear draft stats
    setCurrentTeamScore(13);
    setCurrentOpponentScore(8);
    setCurrentPlayerStats([]);

    // Select next unused map in rotation if available
    const usedMapNames = new Set(
      [...addedMaps, newMap].map((m) => m.mapName.trim().toLowerCase())
    );
    const nextAvailable = VALORANT_MAP_ROTATION.find(
      (m) => !usedMapNames.has(m.trim().toLowerCase())
    );
    if (nextAvailable) {
      setCurrentMapName(nextAvailable);
    }
  };

  const handleRemoveMapFromSeries = (index: number) => {
    setAddedMaps((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearCurrentMapDraft = () => {
    setCurrentPlayerStats([]);
    setCurrentTeamScore(13);
    setCurrentOpponentScore(8);
  };

  // Add VOD link
  const handleAddVod = () => {
    if (!newVodUrl.trim()) {
      setFormError('Por favor ingresa un enlace VOD válido.');
      return;
    }

    try {
      new URL(newVodUrl.trim());
    } catch {
      setFormError('La URL de la VOD ingresada no es válida.');
      return;
    }

    const isScrim = matchType === 'scrim';

    const vod: MatchVod = {
      id: `vod-${Date.now()}`,
      url: newVodUrl.trim(),
      isFullMatch: isScrim ? true : newVodIsFullMatch,
      mapName: isScrim ? undefined : newVodIsFullMatch ? undefined : newVodMapName,
    };

    setAddedVods((prev) => [...prev, vod]);
    setNewVodUrl('');
    setFormError(null);
  };

  const handleRemoveVod = (id: string) => {
    setAddedVods((prev) => prev.filter((v) => v.id !== id));
  };

  // Upload screenshot via Cloudinary backend
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxAllowed = Math.max(1, matchType === 'scrim' ? 1 : addedMaps.length || 1);
      if (screenshotUrls.length >= maxAllowed) {
        setFormError(`El máximo de capturas permitidas para este partido es ${maxAllowed}.`);
        return;
      }

      setIsUploadingImage(true);
      setFormError(null);

      try {
        const cloudinaryUrl = await uploadImageToBackend(file);
        setScreenshotUrls((prev) => [...prev, cloudinaryUrl]);

        // If Valorant roster, offer instant OCR scanning
        if (isValorantRoster) {
          setOcrTargetFile(file);
          setOcrTargetImage(cloudinaryUrl);
          setIsOcrModalOpen(true);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al procesar la captura en el servidor.';
        setFormError(message);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshotUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddDirectScreenshotUrl = (url: string) => {
    if (url.trim()) {
      setScreenshotUrls((prev) => [...prev, url.trim()]);
      if (isValorantRoster) {
        setOcrTargetImage(url.trim());
        setOcrTargetFile(null);
        setIsOcrModalOpen(true);
      }
    }
  };

  const handleScanSpecificScreenshot = (urlOrIndex: string | number) => {
    const url = typeof urlOrIndex === 'number' ? screenshotUrls[urlOrIndex] : urlOrIndex;
    if (url) {
      setOcrTargetImage(url);
      setOcrTargetFile(null);
      setIsOcrModalOpen(true);
    }
  };

  // Load a map from the series back into the editor
  const handleEditMapInSeries = (index: number) => {
    const target = addedMaps[index];
    if (!target) return;
    setCurrentMapName(target.mapName);
    setCurrentTeamScore(target.teamScore);
    setCurrentOpponentScore(target.opponentScore);
    setCurrentPlayerStats(target.playerStats ? [...target.playerStats] : []);
  };

  const handleApplyOcrResults = (data: {
    mapName?: string;
    teamScore?: number;
    opponentScore?: number;
    playerStats: MatchPlayerStats[];
  }) => {
    // If tournament and map already exists in series: auto-merge and CLEAR draft inputs
    if (matchType === 'tournament' && data.mapName && addedMaps.length > 0) {
      const targetMapName = data.mapName.trim().toLowerCase();
      const matchIndex = addedMaps.findIndex(
        (m) => m.mapName.trim().toLowerCase() === targetMapName
      );

      if (matchIndex !== -1) {
        setAddedMaps((prev) =>
          prev.map((m, idx) => {
            if (idx === matchIndex) {
              return {
                ...m,
                teamScore: data.teamScore !== undefined ? data.teamScore : m.teamScore,
                opponentScore: data.opponentScore !== undefined ? data.opponentScore : m.opponentScore,
                playerStats:
                  data.playerStats && data.playerStats.length > 0
                    ? data.playerStats
                    : m.playerStats,
              };
            }
            return m;
          })
        );

        // Clear draft below so it doesn't linger
        setCurrentPlayerStats([]);
        setCurrentTeamScore(13);
        setCurrentOpponentScore(8);

        const usedMapNames = new Set(addedMaps.map((m) => m.mapName.trim().toLowerCase()));
        const nextAvailable = VALORANT_MAP_ROTATION.find(
          (m) => !usedMapNames.has(m.trim().toLowerCase())
        );
        if (nextAvailable) {
          setCurrentMapName(nextAvailable);
        }
        return;
      }
    }

    // Default flow (scrim or map not yet in addedMaps)
    if (data.mapName) setCurrentMapName(data.mapName);
    if (data.teamScore !== undefined) setCurrentTeamScore(data.teamScore);
    if (data.opponentScore !== undefined) setCurrentOpponentScore(data.opponentScore);
    if (data.playerStats && data.playerStats.length > 0) {
      setCurrentPlayerStats(data.playerStats);
    }
  };

  // Final Form Submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!opponentName.trim()) {
      setFormError('Ingresa el nombre del equipo rival.');
      return;
    }

    if (matchType === 'tournament' && !tournamentName.trim()) {
      setFormError('El nombre del torneo es obligatorio.');
      return;
    }

    // Determine final maps list
    let finalMaps: MatchMapResult[];
    if (matchType === 'scrim') {
      if (currentTeamScore === '' || currentOpponentScore === '') {
        setFormError('Ingresa el resultado de rondas.');
        return;
      }
      finalMaps = [
        {
          mapName: currentMapName,
          teamScore: Number(currentTeamScore),
          opponentScore: Number(currentOpponentScore),
          playerStats: currentPlayerStats.length > 0 ? currentPlayerStats : undefined,
        },
      ];
    } else {
      if (addedMaps.length === 0) {
        if (currentTeamScore !== '' && currentOpponentScore !== '') {
          finalMaps = [
            {
              mapName: currentMapName,
              teamScore: Number(currentTeamScore),
              opponentScore: Number(currentOpponentScore),
              playerStats: currentPlayerStats.length > 0 ? currentPlayerStats : undefined,
            },
          ];
        } else {
          setFormError('Debes agregar al menos un mapa a la serie del torneo.');
          return;
        }
      } else {
        finalMaps = addedMaps;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        rosterId: selectedRosterId || undefined,
        game: selectedRoster?.game || (isValorantRoster ? 'Valorant' : undefined),
        type: matchType,
        tournamentName: matchType === 'tournament' ? tournamentName.trim() : undefined,
        opponentName: opponentName.trim(),
        date,
        maps: finalMaps,
        playerStats: currentPlayerStats.length > 0 ? currentPlayerStats : undefined,
        vods: addedVods,
        screenshotUrls,
      };

      if (matchId) {
        await matchService.updateMatch(matchId, payload);
      } else {
        await matchService.createMatch(payload);
      }

      navigate('/dashboard/scrims', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar el partido.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isEditing: Boolean(matchId),
    isLoadingMatch,
    rosters,
    selectedRosterId,
    setSelectedRosterId,
    selectedRoster,
    rosterMembers,
    isValorantRoster,
    matchType,
    setMatchType,
    tournamentName,
    setTournamentName,
    opponentName,
    setOpponentName,
    date,
    setDate,
    addedMaps,
    currentMapName,
    setCurrentMapName,
    currentTeamScore,
    setCurrentTeamScore,
    currentOpponentScore,
    setCurrentOpponentScore,
    currentPlayerStats,
    setCurrentPlayerStats,
    opponentRoundsLabel,
    handleAddMapToSeries,
    handleRemoveMapFromSeries,
    handleEditMapInSeries,
    handleClearCurrentMapDraft,
    addedVods,
    newVodUrl,
    setNewVodUrl,
    newVodIsFullMatch,
    setNewVodIsFullMatch,
    newVodMapName,
    setNewVodMapName,
    handleAddVod,
    handleRemoveVod,
    screenshotUrls,
    isUploadingImage,
    handleImageFileChange,
    handleRemoveScreenshot,
    handleAddDirectScreenshotUrl,
    isOcrModalOpen,
    setIsOcrModalOpen,
    ocrTargetImage,
    ocrTargetFile,
    handleScanSpecificScreenshot,
    handleApplyOcrResults,
    formError,
    isSubmitting,
    handleSubmit,
  };
};
