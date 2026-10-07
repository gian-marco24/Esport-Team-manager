import { useState, useEffect, useMemo } from 'react';
import type { Match, MatchType, MatchResultOutcome } from '../types';
import { matchService } from '../services/matchService';

export const useMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedType, setSelectedType] = useState<MatchType | 'all'>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<MatchResultOutcome | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sortMatchesByCreated = (list: Match[]) => {
    return [...list].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeB - timeA;
    });
  };

  const fetchMatches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await matchService.getMatches();
      setMatches(sortMatchesByCreated(data));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar los resultados de partidas.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    matchService
      .getMatches()
      .then((data) => {
        if (isSubscribed) {
          setMatches(sortMatchesByCreated(data));
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isSubscribed) {
          const message = err instanceof Error ? err.message : 'Error al cargar los resultados de partidas.';
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedType !== 'all' && m.type !== selectedType) return false;
      if (selectedOutcome !== 'all' && m.outcome !== selectedOutcome) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const rivalMatch = m.opponentName.toLowerCase().includes(query);
        const tourneyMatch = m.tournamentName?.toLowerCase().includes(query);
        if (!rivalMatch && !tourneyMatch) return false;
      }
      return true;
    });
  }, [matches, selectedType, selectedOutcome, searchQuery]);

  const stats = useMemo(() => {
    const total = matches.length;
    const wins = matches.filter((m) => m.outcome === 'win').length;
    const losses = matches.filter((m) => m.outcome === 'loss').length;
    const scrimsCount = matches.filter((m) => m.type === 'scrim').length;
    const tournamentsCount = matches.filter((m) => m.type === 'tournament').length;
    const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;

    return {
      total,
      wins,
      losses,
      scrimsCount,
      tournamentsCount,
      winrate,
    };
  }, [matches]);

  const removeMatch = async (id: string) => {
    try {
      await matchService.deleteMatch(id);
      setMatches((prev) => prev.filter((m) => m.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el partido';
      alert(message);
    }
  };

  return {
    matches: filteredMatches,
    rawMatches: matches,
    isLoading,
    error,
    stats,
    selectedType,
    setSelectedType,
    selectedOutcome,
    setSelectedOutcome,
    searchQuery,
    setSearchQuery,
    refetch: fetchMatches,
    removeMatch,
  };
};
