import { useAuthContext } from '../../../app/providers/AuthProvider';

export const useUserStats = () => {
  const { user } = useAuthContext();

  const stats = user?.stats || {
    kda: '0.00',
    winrate: 0,
    matchesPlayed: 0,
    hsPercentage: 0,
    mvpCount: 0,
    mainAgentOrHero: 'Por definir',
  };

  const performanceHistory: Array<{ match: string; kda: number; kills: number; deaths: number; assists: number; win: boolean }> = [];

  return {
    user,
    stats,
    performanceHistory,
  };
};
