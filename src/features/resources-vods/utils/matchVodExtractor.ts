import type { Match } from '../../scrims-tournaments/types';
import type { VodItem, VodProvider } from '../types';

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

    for (const v of match.vods) {
      if (!v.url || !v.url.trim()) continue;

      let mapScore = match.overallScore;
      let outcome = match.outcome;

      if (v.mapName && match.maps && match.maps.length > 0) {
        const foundMap = match.maps.find(
          (m) => m.mapName.toLowerCase() === v.mapName!.toLowerCase()
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

      const isTournament = match.type === 'tournament';
      const typeLabel = isTournament ? (match.tournamentName || 'Torneo') : 'Scrim';
      const mapLabel = v.mapName
        ? ` (${v.mapName})`
        : match.type === 'scrim' && match.maps[0]?.mapName
        ? ` (${match.maps[0].mapName})`
        : '';
      const title = `${typeLabel} vs ${match.opponentName}${mapLabel}`;

      result.push({
        id: `match-vod-${match.id}-${v.id}`,
        title,
        videoUrl: v.url,
        provider: detectVodProvider(v.url),
        opponentName: match.opponentName,
        mapName: v.mapName || (match.type === 'scrim' ? match.maps[0]?.mapName : undefined),
        matchDate: match.date,
        durationSeconds: 1200,
        annotationsCount: 0,
        createdAt: match.createdAt || new Date().toISOString(),
        matchType: match.type,
        tournamentName: match.tournamentName,
        outcome,
        overallScore: match.overallScore,
        mapScore,
        sourceMatchId: match.id,
      });
    }
  }

  return result;
}
