import type { Match } from '../../scrims-tournaments/types';
import type { VodItem, VodProvider, VodSubItem } from '../types';
import { getVodThumbnail } from './vodThumbnail';

export function detectVodProvider(url: string): VodProvider {
  if (!url) return 'custom';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('twitch.tv')) return 'twitch';
  if (url.includes('drive.google.com')) return 'drive';
  return 'custom';
}

export function extractVodsFromMatches(matches: Match[]): VodItem[] {
  const result: VodItem[] = [];

  for (const match of matches) {
    if (!match.vods || match.vods.length === 0) continue;

    const validVods = match.vods.filter((v) => v && v.url && v.url.trim().length > 0);
    if (validVods.length === 0) continue;

    // Build sub-vod list for this match
    const subVods: VodSubItem[] = validVods.map((v, index) => {
      let displayTitle = v.title?.trim();
      if (!displayTitle) {
        if (v.isFullMatch) {
          displayTitle = 'Partido Completo';
        } else if (v.mapName) {
          displayTitle = `Mapa: ${v.mapName}`;
        } else {
          displayTitle = `VOD ${index + 1}`;
        }
      }

      return {
        id: `match-vod-${match.id}-${v.id}`,
        originalVodId: v.id,
        url: v.url.trim(),
        title: displayTitle,
        mapName: v.mapName,
        isFullMatch: v.isFullMatch,
        provider: detectVodProvider(v.url),
      };
    });

    // Primary VOD (prefer full match VOD, or first uploaded VOD)
    const primaryVod = validVods.find((v) => v.isFullMatch) || validVods[0];

    const isTournament = match.type === 'tournament';
    const isTryout = match.type === 'tryout';
    const typeLabel = isTournament ? (match.tournamentName || 'Torneo') : isTryout ? 'Tryouts' : 'Scrim';

    let mapLabel = '';
    if (validVods.length === 1 && validVods[0].mapName) {
      mapLabel = ` (${validVods[0].mapName})`;
    } else if ((match.type === 'scrim' || match.type === 'tryout') && match.maps?.length === 1 && match.maps[0]?.mapName) {
      mapLabel = ` (${match.maps[0].mapName})`;
    }

    const title = `${typeLabel} vs ${match.opponentName}${mapLabel}`;

    let mapScore = match.overallScore;
    let outcome = match.outcome;

    if (validVods.length === 1 && validVods[0].mapName && match.maps && match.maps.length > 0) {
      const foundMap = match.maps.find(
        (m) => m.mapName.toLowerCase() === validVods[0].mapName!.toLowerCase()
      );
      if (foundMap) {
        mapScore = `${foundMap.teamScore} - ${foundMap.opponentScore}`;
        if (foundMap.teamScore > foundMap.opponentScore) {
          outcome = 'win';
        } else if (foundMap.teamScore < foundMap.opponentScore) {
          outcome = 'loss';
        } else {
          outcome = 'draw';
        }
      }
    }

    const primaryMapName = primaryVod.mapName || (match.maps && match.maps.length === 1 ? match.maps[0].mapName : undefined);

    result.push({
      id: `match-vod-${match.id}`,
      title,
      videoUrl: primaryVod.url.trim(),
      provider: detectVodProvider(primaryVod.url),
      opponentName: match.opponentName,
      mapName: primaryMapName,
      matchDate: match.date,
      durationSeconds: 1200,
      annotationsCount: 0,
      createdAt: match.createdAt || (match.date ? new Date(match.date).toISOString() : new Date().toISOString()),
      matchType: match.type,
      tournamentName: match.tournamentName,
      outcome,
      overallScore: match.overallScore,
      mapScore,
      sourceMatchId: match.id,
      thumbnailUrl: getVodThumbnail(primaryVod.url, primaryMapName) || undefined,
      vods: subVods,
    });
  }

  return result;
}
