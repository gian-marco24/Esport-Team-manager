import { useState, useEffect } from 'react';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import { matchService } from '../../scrims-tournaments/services/matchService';
import type { Match } from '../../scrims-tournaments/types';

export const useTeamStats = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await matchService.getMatches();
        setMatches(data);
      } catch (e) {
        console.error('Failed to load team stats from DB:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  let totalMaps = 0;
  let wins = 0;
  let losses = 0;

  matches.forEach((m) => {
    if (m.maps && m.maps.length > 0) {
      m.maps.forEach((map) => {
        totalMaps++;
        if (map.teamScore > map.opponentScore) wins++;
        else if (map.teamScore < map.opponentScore) losses++;
      });
    } else {
      totalMaps++;
      if (m.outcome === 'win') wins++;
      else if (m.outcome === 'loss') losses++;
    }
  });

  const winRate = totalMaps > 0 ? Math.round((wins / totalMaps) * 100) : 0;

  const teamOverview = {
    teamName: URS_GAMARA_TEAM.name,
    tag: URS_GAMARA_TEAM.tag,
    totalMatches: totalMaps,
    wins,
    losses,
    winRate,
    scrimsThisWeek: matches.filter((m) => m.type === 'scrim').length,
    nextMatch: null as { opponent: string; tournament: string; date: string; map: string } | null,
    activeRosterCount: 5,
  };

  return {
    teamOverview,
    recentMatches: matches,
    isLoading,
  };
};
