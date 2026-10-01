import type { Match, MatchPlayerStats } from '../../scrims-tournaments/types';
import type { TeamMember } from '../../teams/types';
import type { ValorantAgent, ValorantMapData } from '../../../services/valorantApiService';

export interface GeneralTeamStats {
  totalMatches: number;
  scrimsCount: number;
  scrimsWins: number;
  scrimsLosses: number;
  scrimsDraws: number;
  scrimsWinRate: number;
  tournamentsCount: number;
  tournamentsWins: number;
  tournamentsLosses: number;
  tournamentsDraws: number;
  tournamentsWinRate: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  overallWinRate: number;
  teamRoundsWon: number;
  opponentRoundsWon: number;
  roundDifferential: number;
  roundWinRate: number;
  avgRoundsPerMatch: number;
}

export interface MapStatsSummary {
  mapName: string;
  splashUrl?: string;
  displayIcon?: string;
  timesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  roundsWon: number;
  roundsLost: number;
  roundDiff: number;
  teamAvgKda: string;
  bestPlayerNick?: string;
}

export interface PlayerStatsSummary {
  playerId?: string;
  displayName: string;
  gameTag?: string;
  teamRole?: string;
  avatarUrl?: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  kdaRatio: number;
  formattedKda: string;
  totalFirstKills: number;
  avgFirstKills: number;
  mostPlayedAgent?: string;
  mostPlayedAgentIcon?: string;
  bestMap?: string;
  bestMapWinRate?: number;
}

export interface HistoricalPlayerMapStats {
  playerId?: string;
  playerNick: string;
  mapName: string;
  timesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  totalFirstKills: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgFirstKills: number;
  kdaRatio: number;
  formattedKda: string;
  mostPlayedAgent?: string;
  mostPlayedAgentIcon?: string;
  agentUsageCount: number;
}

export interface PlayerMapComparison {
  playerNick: string;
  playerId?: string;
  avatarUrl?: string;
  isGuest?: boolean;
  matchAgent?: string;
  matchAgentIcon?: string;
  matchKills: number;
  matchDeaths: number;
  matchAssists: number;
  matchKdaRatio: number;
  matchFirstKills: number;
  historical: HistoricalPlayerMapStats;
  kdaDelta: number;
  killsDelta: number;
  deathsDelta: number;
  firstKillsDelta: number;
  isMainAgentOnMap: boolean;
}

export const statsCalculationService = {
  /**
   * Filter matches by Roster ID if specified
   */
  filterMatchesByRoster(matches: Match[], rosterId?: string): Match[] {
    if (!rosterId || rosterId === 'all') return matches;
    return matches.filter((m) => m.rosterId === rosterId);
  },

  /**
   * Calculate Historical stats for a single player on a specific map
   */
  calculatePlayerHistoricalMapStats(
    allMatches: Match[],
    mapName: string,
    playerNickOrId: string,
    rosterMembers: TeamMember[] = [],
    agentsData: ValorantAgent[] = []
  ): HistoricalPlayerMapStats {
    const cleanMap = mapName.trim().toLowerCase();
    const cleanIdentifier = playerNickOrId.trim().toLowerCase();

    // Member mapping for nicknames and gameTags
    const member = rosterMembers.find(
      (m) =>
        m.id.toLowerCase() === cleanIdentifier ||
        m.displayName.toLowerCase() === cleanIdentifier ||
        (m.gameTag && m.gameTag.toLowerCase().includes(cleanIdentifier))
    );

    let timesPlayed = 0;
    let wins = 0;
    let losses = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalFirstKills = 0;
    const agentCounts: Record<string, number> = {};

    allMatches.forEach((m) => {
      const matchMaps = m.maps && m.maps.length > 0 ? m.maps : [];
      matchMaps.forEach((map) => {
        if (map.mapName.trim().toLowerCase() !== cleanMap) return;

        const isMapWon = map.teamScore > map.opponentScore;
        const pStats = map.playerStats || m.playerStats || [];

        const targetP = pStats.find((p) => {
          if (p.isGuest || p.playerNick.toLowerCase().startsWith('invitado')) return false;
          const pNick = p.playerNick.trim().toLowerCase();
          const pTag = (p.gameTag || '').trim().toLowerCase();
          const pId = (p.playerId || '').trim().toLowerCase();

          if (member) {
            return (
              pId === member.id.toLowerCase() ||
              pNick === member.displayName.toLowerCase() ||
              (member.gameTag && pTag.includes(member.gameTag.toLowerCase())) ||
              pNick === cleanIdentifier
            );
          }
          return pNick === cleanIdentifier || (pId && pId === cleanIdentifier);
        });

        if (targetP) {
          timesPlayed++;
          if (isMapWon) wins++;
          else losses++;

          totalKills += targetP.kills || 0;
          totalDeaths += targetP.deaths || 0;
          totalAssists += targetP.assists || 0;
          totalFirstKills += targetP.firstKills || 0;

          if (targetP.agent) {
            agentCounts[targetP.agent] = (agentCounts[targetP.agent] || 0) + 1;
          }
        }
      });
    });

    const winRate = timesPlayed > 0 ? Math.round((wins / timesPlayed) * 100) : 0;
    const avgKills = timesPlayed > 0 ? Math.round((totalKills / timesPlayed) * 10) / 10 : 0;
    const avgDeaths = timesPlayed > 0 ? Math.round((totalDeaths / timesPlayed) * 10) / 10 : 0;
    const avgAssists = timesPlayed > 0 ? Math.round((totalAssists / timesPlayed) * 10) / 10 : 0;
    const avgFirstKills = timesPlayed > 0 ? Math.round((totalFirstKills / timesPlayed) * 10) / 10 : 0;

    const kdaRatio =
      totalDeaths > 0
        ? Math.round(((totalKills + totalAssists) / totalDeaths) * 100) / 100
        : totalKills + totalAssists;

    let mostPlayedAgent: string | undefined;
    let agentUsageCount = 0;
    Object.entries(agentCounts).forEach(([ag, count]) => {
      if (count > agentUsageCount) {
        agentUsageCount = count;
        mostPlayedAgent = ag;
      }
    });

    let mostPlayedAgentIcon: string | undefined;
    if (mostPlayedAgent) {
      const found = agentsData.find(
        (a) => a.displayName.toLowerCase() === mostPlayedAgent!.toLowerCase()
      );
      mostPlayedAgentIcon = found?.displayIcon;
    }

    return {
      playerId: member?.id,
      playerNick: member?.displayName || playerNickOrId,
      mapName,
      timesPlayed,
      wins,
      losses,
      winRate,
      totalKills,
      totalDeaths,
      totalAssists,
      totalFirstKills,
      avgKills,
      avgDeaths,
      avgAssists,
      avgFirstKills,
      kdaRatio,
      formattedKda: `${avgKills} / ${avgDeaths} / ${avgAssists}`,
      mostPlayedAgent,
      mostPlayedAgentIcon,
      agentUsageCount,
    };
  },

  /**
   * Build complete comparison table between match map performance and historical map performance
   */
  calculateMapComparison(
    mapName: string,
    playerStatsList: MatchPlayerStats[],
    allMatches: Match[],
    rosterMembers: TeamMember[] = [],
    agentsData: ValorantAgent[] = []
  ): PlayerMapComparison[] {
    return playerStatsList.map((p) => {
      const matchKdaRatio =
        p.kdaRatio ??
        (p.deaths > 0
          ? Math.round(((p.kills + p.assists) / p.deaths) * 100) / 100
          : p.kills + p.assists);

      const member = rosterMembers.find(
        (m) =>
          m.id === p.playerId ||
          m.displayName.toLowerCase() === p.playerNick.toLowerCase() ||
          (p.gameTag && m.gameTag && m.gameTag.toLowerCase() === p.gameTag.toLowerCase())
      );

      const historical = this.calculatePlayerHistoricalMapStats(
        allMatches,
        mapName,
        p.playerId || p.playerNick,
        rosterMembers,
        agentsData
      );

      let matchAgentIcon = p.agentIcon;
      if (!matchAgentIcon && p.agent) {
        const found = agentsData.find(
          (a) => a.displayName.toLowerCase() === p.agent!.toLowerCase()
        );
        matchAgentIcon = found?.displayIcon;
      }

      const kdaDelta =
        historical.timesPlayed > 0
          ? Math.round((matchKdaRatio - historical.kdaRatio) * 100) / 100
          : 0;

      const killsDelta =
        historical.timesPlayed > 0
          ? Math.round((p.kills - historical.avgKills) * 10) / 10
          : 0;

      const deathsDelta =
        historical.timesPlayed > 0
          ? Math.round((p.deaths - historical.avgDeaths) * 10) / 10
          : 0;

      const firstKillsDelta =
        historical.timesPlayed > 0
          ? Math.round(((p.firstKills || 0) - historical.avgFirstKills) * 10) / 10
          : 0;

      const isMainAgentOnMap =
        Boolean(p.agent && historical.mostPlayedAgent && p.agent.toLowerCase() === historical.mostPlayedAgent.toLowerCase());

      return {
        playerNick: p.playerNick,
        playerId: p.playerId || member?.id,
        avatarUrl: member?.avatarUrl,
        isGuest: p.isGuest,
        matchAgent: p.agent,
        matchAgentIcon,
        matchKills: p.kills,
        matchDeaths: p.deaths,
        matchAssists: p.assists,
        matchKdaRatio,
        matchFirstKills: p.firstKills || 0,
        historical,
        kdaDelta,
        killsDelta,
        deathsDelta,
        firstKillsDelta,
        isMainAgentOnMap,
      };
    });
  },

  /**
   * Calculate General Team KPI metrics (per individual map played)
   */
  calculateGeneralStats(matches: Match[]): GeneralTeamStats {
    let scrimsCount = 0;
    let scrimsWins = 0;
    let scrimsLosses = 0;
    let scrimsDraws = 0;

    let tournamentsCount = 0;
    let tournamentsWins = 0;
    let tournamentsLosses = 0;
    let tournamentsDraws = 0;

    let teamRoundsWon = 0;
    let opponentRoundsWon = 0;

    matches.forEach((m) => {
      const matchMaps = m.maps && m.maps.length > 0 ? m.maps : [];
      const isScrim = m.type === 'scrim';

      if (matchMaps.length > 0) {
        matchMaps.forEach((map) => {
          const isMapWon = map.teamScore > map.opponentScore;
          const isMapLost = map.teamScore < map.opponentScore;

          if (isScrim) {
            scrimsCount++;
            if (isMapWon) scrimsWins++;
            else if (isMapLost) scrimsLosses++;
            else scrimsDraws++;
          } else {
            tournamentsCount++;
            if (isMapWon) tournamentsWins++;
            else if (isMapLost) tournamentsLosses++;
            else tournamentsDraws++;
          }

          teamRoundsWon += Number(map.teamScore || 0);
          opponentRoundsWon += Number(map.opponentScore || 0);
        });
      } else {
        if (isScrim) {
          scrimsCount++;
          if (m.outcome === 'win') scrimsWins++;
          else if (m.outcome === 'loss') scrimsLosses++;
          else scrimsDraws++;
        } else {
          tournamentsCount++;
          if (m.outcome === 'win') tournamentsWins++;
          else if (m.outcome === 'loss') tournamentsLosses++;
          else tournamentsDraws++;
        }
      }
    });

    const totalMatches = scrimsCount + tournamentsCount;
    const totalWins = scrimsWins + tournamentsWins;
    const totalLosses = scrimsLosses + tournamentsLosses;
    const totalDraws = scrimsDraws + tournamentsDraws;

    const overallWinRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
    const scrimsWinRate = scrimsCount > 0 ? Math.round((scrimsWins / scrimsCount) * 100) : 0;
    const tournamentsWinRate = tournamentsCount > 0 ? Math.round((tournamentsWins / tournamentsCount) * 100) : 0;

    const totalRoundsPlayed = teamRoundsWon + opponentRoundsWon;
    const roundWinRate = totalRoundsPlayed > 0 ? Math.round((teamRoundsWon / totalRoundsPlayed) * 100) : 0;
    const roundDifferential = teamRoundsWon - opponentRoundsWon;
    const avgRoundsPerMatch = totalMatches > 0 ? Math.round((totalRoundsPlayed / totalMatches) * 10) / 10 : 0;

    return {
      totalMatches,
      scrimsCount,
      scrimsWins,
      scrimsLosses,
      scrimsDraws,
      scrimsWinRate,
      tournamentsCount,
      tournamentsWins,
      tournamentsLosses,
      tournamentsDraws,
      tournamentsWinRate,
      totalWins,
      totalLosses,
      totalDraws,
      overallWinRate,
      teamRoundsWon,
      opponentRoundsWon,
      roundDifferential,
      roundWinRate,
      avgRoundsPerMatch,
    };
  },

  /**
   * Calculate Map by Map performance rankings
   */
  calculateMapStats(matches: Match[], mapsData: ValorantMapData[] = []): MapStatsSummary[] {
    const mapMap: Record<
      string,
      {
        timesPlayed: number;
        wins: number;
        losses: number;
        draws: number;
        roundsWon: number;
        roundsLost: number;
        totalKills: number;
        totalDeaths: number;
        totalAssists: number;
        playerScores: Record<string, { kills: number; assists: number; deaths: number; score: number }>;
      }
    > = {};

    matches.forEach((m) => {
      if (!m.maps) return;
      m.maps.forEach((map) => {
        const name = map.mapName.trim();
        if (!name) return;

        if (!mapMap[name]) {
          mapMap[name] = {
            timesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            roundsWon: 0,
            roundsLost: 0,
            totalKills: 0,
            totalDeaths: 0,
            totalAssists: 0,
            playerScores: {},
          };
        }

        const entry = mapMap[name];
        entry.timesPlayed++;
        entry.roundsWon += map.teamScore || 0;
        entry.roundsLost += map.opponentScore || 0;

        if (map.teamScore > map.opponentScore) entry.wins++;
        else if (map.teamScore < map.opponentScore) entry.losses++;
        else entry.draws++;

        // Player stats in this map
        const pStats = map.playerStats || m.playerStats || [];
        pStats.forEach((p) => {
          entry.totalKills += p.kills || 0;
          entry.totalDeaths += p.deaths || 0;
          entry.totalAssists += p.assists || 0;

          // Exclude guests from MVP calculation if marked
          if (!p.isGuest && !p.playerNick.startsWith('Invitado')) {
            const pKey = p.playerNick;
            if (!entry.playerScores[pKey]) entry.playerScores[pKey] = { kills: 0, assists: 0, deaths: 0, score: 0 };
            entry.playerScores[pKey].kills += p.kills || 0;
            entry.playerScores[pKey].assists += p.assists || 0;
            entry.playerScores[pKey].deaths += p.deaths || 0;
            // Weighted performance score = (Kills * 2) + Assists + (FirstKills * 3)
            entry.playerScores[pKey].score += (p.kills * 2) + (p.assists) + ((p.firstKills || 0) * 3);
          }
        });
      });
    });

    const result: MapStatsSummary[] = Object.keys(mapMap).map((mapName) => {
      const e = mapMap[mapName];
      const winRate = e.timesPlayed > 0 ? Math.round((e.wins / e.timesPlayed) * 100) : 0;
      const roundDiff = e.roundsWon - e.roundsLost;

      const kdRatio = e.totalDeaths > 0 ? (e.totalKills / e.totalDeaths).toFixed(2) : e.totalKills.toFixed(2);
      const teamAvgKda = `${kdRatio} K/D`;

      // Find best MVP player on this map (Highest kills; if tied, highest KDA)
      let bestPlayerNick: string | undefined;
      let maxKills = -1;
      let maxKda = -1;
      Object.entries(e.playerScores).forEach(([nick, stats]) => {
        const kda = stats.deaths > 0 ? (stats.kills + stats.assists) / stats.deaths : stats.kills + stats.assists;
        if (stats.kills > maxKills) {
          maxKills = stats.kills;
          maxKda = kda;
          bestPlayerNick = nick;
        } else if (stats.kills === maxKills && kda > maxKda) {
          maxKda = kda;
          bestPlayerNick = nick;
        }
      });

      // Match with Valorant API map metadata
      const mapMeta = mapsData.find(
        (m) => m.displayName.toLowerCase() === mapName.toLowerCase()
      );

      return {
        mapName,
        splashUrl: mapMeta?.splash,
        displayIcon: mapMeta?.displayIcon || mapMeta?.listViewIcon,
        timesPlayed: e.timesPlayed,
        wins: e.wins,
        losses: e.losses,
        draws: e.draws,
        winRate,
        roundsWon: e.roundsWon,
        roundsLost: e.roundsLost,
        roundDiff,
        teamAvgKda,
        bestPlayerNick,
      };
    });

    // Sort by Times Played descending then Winrate descending
    return result.sort((a, b) => b.timesPlayed - a.timesPlayed || b.winRate - a.winRate);
  },

  /**
   * Calculate detailed individual Player statistics table (per individual map played)
   * NOTE: Guest players (isGuest: true or unmatched) are strictly excluded from roster tables!
   */
  calculatePlayerStats(
    matches: Match[],
    rosterMembers: TeamMember[],
    agentsData: ValorantAgent[] = []
  ): PlayerStatsSummary[] {
    const playerMap: Record<
      string,
      {
        id: string;
        displayName: string;
        gameTag?: string;
        teamRole?: string;
        avatarUrl?: string;
        matchesPlayed: number;
        wins: number;
        losses: number;
        totalKills: number;
        totalDeaths: number;
        totalAssists: number;
        totalFirstKills: number;
        agentCounts: Record<string, number>;
        mapStats: Record<string, { wins: number; total: number; kdaSum: number }>;
      }
    > = {};

    // Initialize only the official roster members
    rosterMembers.forEach((m) => {
      const key = m.id;
      playerMap[key] = {
        id: m.id,
        displayName: m.displayName,
        gameTag: m.gameTag,
        teamRole: m.teamRole,
        avatarUrl: m.avatarUrl,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        totalKills: 0,
        totalDeaths: 0,
        totalAssists: 0,
        totalFirstKills: 0,
        agentCounts: {},
        mapStats: {},
      };
    });

    // Helper map to match player by ID, displayName, or gameTag prefix
    const memberLookup = new Map<string, string>();
    rosterMembers.forEach((m) => {
      memberLookup.set(m.id, m.id);
      memberLookup.set(m.displayName.toLowerCase(), m.id);
      if (m.gameTag) {
        memberLookup.set(m.gameTag.toLowerCase(), m.id);
        const prefix = m.gameTag.split('#')[0].trim().toLowerCase();
        if (prefix) memberLookup.set(prefix, m.id);
      }
    });

    // Process all matches and individual maps
    matches.forEach((m) => {
      const matchMaps = m.maps && m.maps.length > 0 ? m.maps : [];

      if (matchMaps.length > 0) {
        matchMaps.forEach((map) => {
          const isMapWon = map.teamScore > map.opponentScore;
          const isMapLost = map.teamScore < map.opponentScore;
          const pStats = map.playerStats || [];

          pStats.forEach((stats) => {
            // Exclude guest players
            if (stats.isGuest || stats.playerNick.toLowerCase().startsWith('invitado')) {
              return;
            }

            // Find corresponding member
            let memberId: string | undefined;
            if (stats.playerId && playerMap[stats.playerId]) {
              memberId = stats.playerId;
            } else {
              memberId =
                memberLookup.get(stats.playerNick.toLowerCase()) ||
                (stats.gameTag ? memberLookup.get(stats.gameTag.toLowerCase()) : undefined);
            }

            if (!memberId || !playerMap[memberId]) {
              // Player is not a member of this roster -> Ignore
              return;
            }

            const p = playerMap[memberId];
            p.matchesPlayed++;
            if (isMapWon) p.wins++;
            else if (isMapLost) p.losses++;

            p.totalKills += stats.kills || 0;
            p.totalDeaths += stats.deaths || 0;
            p.totalAssists += stats.assists || 0;
            p.totalFirstKills += stats.firstKills || 0;

            if (stats.agent) {
              p.agentCounts[stats.agent] = (p.agentCounts[stats.agent] || 0) + 1;
            }

            const mapName = map.mapName.trim();
            if (mapName) {
              if (!p.mapStats[mapName]) p.mapStats[mapName] = { wins: 0, total: 0, kdaSum: 0 };
              p.mapStats[mapName].total++;
              if (isMapWon) p.mapStats[mapName].wins++;
              const matchKda =
                stats.deaths > 0 ? (stats.kills + stats.assists) / stats.deaths : stats.kills + stats.assists;
              p.mapStats[mapName].kdaSum += matchKda;
            }
          });
        });
      } else if (m.playerStats && m.playerStats.length > 0) {
        const isMatchWon = m.outcome === 'win';
        const isMatchLost = m.outcome === 'loss';

        m.playerStats.forEach((stats) => {
          if (stats.isGuest || stats.playerNick.toLowerCase().startsWith('invitado')) {
            return;
          }

          let memberId: string | undefined;
          if (stats.playerId && playerMap[stats.playerId]) {
            memberId = stats.playerId;
          } else {
            memberId =
              memberLookup.get(stats.playerNick.toLowerCase()) ||
              (stats.gameTag ? memberLookup.get(stats.gameTag.toLowerCase()) : undefined);
          }

          if (!memberId || !playerMap[memberId]) {
            return;
          }

          const p = playerMap[memberId];
          p.matchesPlayed++;
          if (isMatchWon) p.wins++;
          else if (isMatchLost) p.losses++;

          p.totalKills += stats.kills || 0;
          p.totalDeaths += stats.deaths || 0;
          p.totalAssists += stats.assists || 0;
          p.totalFirstKills += stats.firstKills || 0;

          if (stats.agent) {
            p.agentCounts[stats.agent] = (p.agentCounts[stats.agent] || 0) + 1;
          }
        });
      }
    });

    const result: PlayerStatsSummary[] = Object.values(playerMap).map((p) => {
      const count = Math.max(1, p.matchesPlayed);
      const winRate = p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0;

      const avgKills = Math.round((p.totalKills / count) * 10) / 10;
      const avgDeaths = Math.round((p.totalDeaths / count) * 10) / 10;
      const avgAssists = Math.round((p.totalAssists / count) * 10) / 10;
      const avgFirstKills = Math.round((p.totalFirstKills / count) * 10) / 10;

      const kdaRatio =
        p.totalDeaths > 0
          ? Math.round(((p.totalKills + p.totalAssists) / p.totalDeaths) * 100) / 100
          : p.totalKills + p.totalAssists;

      const formattedKda = `${avgKills} / ${avgDeaths} / ${avgAssists}`;

      // Most played agent
      let mostPlayedAgent: string | undefined;
      let highestAgentCount = 0;
      Object.entries(p.agentCounts).forEach(([agent, c]) => {
        if (c > highestAgentCount) {
          highestAgentCount = c;
          mostPlayedAgent = agent;
        }
      });

      let mostPlayedAgentIcon: string | undefined;
      if (mostPlayedAgent) {
        const ag = agentsData.find(
          (a) => a.displayName.toLowerCase() === mostPlayedAgent!.toLowerCase()
        );
        mostPlayedAgentIcon = ag?.displayIcon;
      }

      // Best map by WinRate and performance
      let bestMap: string | undefined;
      let bestMapWinRate = 0;
      let highestMapScore = -1;

      Object.entries(p.mapStats).forEach(([map, s]) => {
        const mWinRate = s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0;
        const avgKda = s.total > 0 ? s.kdaSum / s.total : 0;
        const score = (mWinRate * 2) + avgKda;

        if (score > highestMapScore) {
          highestMapScore = score;
          bestMap = map;
          bestMapWinRate = mWinRate;
        }
      });

      return {
        playerId: p.id,
        displayName: p.displayName,
        gameTag: p.gameTag,
        teamRole: p.teamRole,
        avatarUrl: p.avatarUrl,
        matchesPlayed: p.matchesPlayed,
        wins: p.wins,
        losses: p.losses,
        winRate,
        totalKills: p.totalKills,
        totalDeaths: p.totalDeaths,
        totalAssists: p.totalAssists,
        avgKills,
        avgDeaths,
        avgAssists,
        kdaRatio,
        formattedKda,
        totalFirstKills: p.totalFirstKills,
        avgFirstKills,
        mostPlayedAgent: mostPlayedAgent || 'Por definir',
        mostPlayedAgentIcon,
        bestMap: bestMap || 'N/A',
        bestMapWinRate: bestMap ? bestMapWinRate : undefined,
      };
    });

    // Sort by matches played descending and KDA ratio descending
    return result.sort((a, b) => b.matchesPlayed - a.matchesPlayed || b.kdaRatio - a.kdaRatio);
  },
};
