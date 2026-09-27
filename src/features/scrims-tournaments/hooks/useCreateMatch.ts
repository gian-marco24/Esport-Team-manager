import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  VALORANT_MAP_ROTATION,
  type MatchType,
  type MatchMapResult,
  type MatchVod,
  type ValorantMap,
} from '../types';
import { matchService } from '../services/matchService';
import { uploadImageToBackend } from '../services/uploadService';

export const useCreateMatch = (matchId?: string) => {
  const navigate = useNavigate();

  // General Form State
  const [matchType, setMatchType] = useState<MatchType>('scrim');
  const [tournamentName, setTournamentName] = useState<string>('');
  const [opponentName, setOpponentName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Maps Management State
  const [addedMaps, setAddedMaps] = useState<MatchMapResult[]>([]);
  const [currentMapName, setCurrentMapName] = useState<ValorantMap>(VALORANT_MAP_ROTATION[0]);
  const [currentTeamScore, setCurrentTeamScore] = useState<number | ''>(13);
  const [currentOpponentScore, setCurrentOpponentScore] = useState<number | ''>(8);

  // VODs State
  const [addedVods, setAddedVods] = useState<MatchVod[]>([]);
  const [newVodUrl, setNewVodUrl] = useState<string>('');
  const [newVodIsFullMatch, setNewVodIsFullMatch] = useState<boolean>(true);
  const [newVodMapName, setNewVodMapName] = useState<string>(VALORANT_MAP_ROTATION[0]);

  // Screenshots State
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Loading & Error States
  const [isLoadingMatch, setIsLoadingMatch] = useState<boolean>(Boolean(matchId));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch match details if editing
  useEffect(() => {
    if (!matchId) return;

    const loadMatchForEditing = async () => {
      setIsLoadingMatch(true);
      try {
        const existing = await matchService.getMatchById(matchId);
        if (existing) {
          setMatchType(existing.type);
          setTournamentName(existing.tournamentName || '');
          setOpponentName(existing.opponentName);
          setDate(existing.date);
          setAddedMaps(existing.maps || []);
          setAddedVods(existing.vods || []);

          const screenshots = existing.screenshotUrls && existing.screenshotUrls.length > 0
            ? existing.screenshotUrls
            : (existing as unknown as { screenshotUrl?: string }).screenshotUrl
            ? [(existing as unknown as { screenshotUrl?: string }).screenshotUrl as string]
            : [];
          setScreenshotUrls(screenshots);

          if (existing.maps && existing.maps.length > 0) {
            const firstMap = existing.maps[0];
            if (VALORANT_MAP_ROTATION.includes(firstMap.mapName as ValorantMap)) {
              setCurrentMapName(firstMap.mapName as ValorantMap);
            }
            setCurrentTeamScore(firstMap.teamScore);
            setCurrentOpponentScore(firstMap.opponentScore);
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

  // Dynamic Opponent Rounds Label
  const opponentRoundsLabel = `Rondas ${opponentName.trim() || 'Rival'}`;

  // Add a map to series
  const handleAddMapToSeries = () => {
    if (currentTeamScore === '' || currentOpponentScore === '') {
      setFormError('Por favor ingresa las rondas de ambos equipos.');
      return;
    }

    const newMap: MatchMapResult = {
      mapName: currentMapName,
      teamScore: Number(currentTeamScore),
      opponentScore: Number(currentOpponentScore),
    };

    setAddedMaps((prev) => [...prev, newMap]);
    setFormError(null);

    // Reset current map inputs
    setCurrentTeamScore(13);
    setCurrentOpponentScore(8);
  };

  const handleRemoveMapFromSeries = (index: number) => {
    setAddedMaps((prev) => prev.filter((_, idx) => idx !== index));
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
        type: matchType,
        tournamentName: matchType === 'tournament' ? tournamentName.trim() : undefined,
        opponentName: opponentName.trim(),
        date,
        maps: finalMaps,
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
    opponentRoundsLabel,
    handleAddMapToSeries,
    handleRemoveMapFromSeries,
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
    formError,
    isSubmitting,
    handleSubmit,
  };
};
