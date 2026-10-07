import { z } from 'zod';

export type MatchType = 'scrim' | 'tournament';
export type MatchResultOutcome = 'win' | 'loss' | 'draw';

export const VALORANT_MAP_ROTATION = [
  'Abyss',
  'Ascent',
  'Haven',
  'Lotus',
  'Split',
  'Summit',
  'Sunset',
] as const;

export type ValorantMap = (typeof VALORANT_MAP_ROTATION)[number];

export interface MatchPlayerStats {
  playerId?: string;
  playerNick: string;
  gameTag?: string;
  agent?: string;
  agentIcon?: string;
  kills: number;
  deaths: number;
  assists: number;
  firstKills?: number;
  kdaRatio?: number;
  hsPercentage?: number;
  isGuest?: boolean;
}

export interface MatchMapResult {
  mapName: string;
  teamScore: number;
  opponentScore: number;
  playerStats?: MatchPlayerStats[];
}

export interface MatchVod {
  id: string;
  url: string;
  mapName?: string;
  isFullMatch: boolean;
}

export interface Match {
  id: string;
  rosterId?: string;
  game?: string;
  type: MatchType;
  tournamentName?: string;
  opponentName: string;
  date: string;
  outcome: MatchResultOutcome;
  overallScore: string;
  maps: MatchMapResult[];
  playerStats?: MatchPlayerStats[];
  vods?: MatchVod[];
  screenshotUrls?: string[];
  createdAt: string;
  updatedAt?: string;
}

export const createMatchSchema = z
  .object({
    rosterId: z.string().optional(),
    game: z.string().optional(),
    type: z.enum(['scrim', 'tournament'] as const),
    tournamentName: z.string().optional(),
    opponentName: z.string().min(2, 'Ingresa el nombre del equipo rival'),
    date: z.string().min(1, 'Selecciona la fecha del encuentro'),
    maps: z
      .array(
        z.object({
          mapName: z.string().min(1, 'Selecciona un mapa'),
          teamScore: z.number().min(0, 'Puntaje de URS Gamara debe ser 0 o superior'),
          opponentScore: z.number().min(0, 'Puntaje del rival debe ser 0 o superior'),
          playerStats: z
            .array(
              z.object({
                playerId: z.string().optional(),
                playerNick: z.string(),
                gameTag: z.string().optional(),
                agent: z.string().optional(),
                agentIcon: z.string().optional(),
                kills: z.number(),
                deaths: z.number(),
                assists: z.number(),
                firstKills: z.number().optional(),
                kdaRatio: z.number().optional(),
                hsPercentage: z.number().optional(),
                isGuest: z.boolean().optional(),
              })
            )
            .optional(),
        })
      )
      .min(1, 'Debes agregar al menos un mapa a la serie/partido'),
    playerStats: z
      .array(
        z.object({
          playerId: z.string().optional(),
          playerNick: z.string(),
          gameTag: z.string().optional(),
          agent: z.string().optional(),
          agentIcon: z.string().optional(),
          kills: z.number(),
          deaths: z.number(),
          assists: z.number(),
          firstKills: z.number().optional(),
          kdaRatio: z.number().optional(),
          hsPercentage: z.number().optional(),
          isGuest: z.boolean().optional(),
        })
      )
      .optional(),
    vods: z
      .array(
        z.object({
          id: z.string(),
          url: z.string().url('Ingresa una URL válida de VOD'),
          mapName: z.string().optional(),
          isFullMatch: z.boolean(),
        })
      )
      .optional(),
    screenshotUrls: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'tournament') {
        return Boolean(data.tournamentName && data.tournamentName.trim().length > 0);
      }
      return true;
    },
    {
      message: 'El nombre del torneo es obligatorio para partidos tipo Torneo',
      path: ['tournamentName'],
    }
  );

export type CreateMatchFormData = z.infer<typeof createMatchSchema>;

/**
 * Calculates outcome and overall score automatically based on map results
 */
export const calculateMatchSummary = (type: MatchType, maps: MatchMapResult[]) => {
  if (!maps || maps.length === 0) {
    return { outcome: 'draw' as MatchResultOutcome, overallScore: '0 - 0' };
  }

  if (type === 'scrim') {
    const singleMap = maps[0];
    const outcome: MatchResultOutcome =
      singleMap.teamScore > singleMap.opponentScore
        ? 'win'
        : singleMap.teamScore < singleMap.opponentScore
        ? 'loss'
        : 'draw';
    const overallScore = `${singleMap.teamScore} - ${singleMap.opponentScore}`;
    return { outcome, overallScore };
  }

  // Tournament series
  let teamMapsWon = 0;
  let opponentMapsWon = 0;

  maps.forEach((m) => {
    if (m.teamScore > m.opponentScore) teamMapsWon++;
    else if (m.opponentScore > m.teamScore) opponentMapsWon++;
  });

  const outcome: MatchResultOutcome =
    teamMapsWon > opponentMapsWon
      ? 'win'
      : opponentMapsWon > teamMapsWon
      ? 'loss'
      : 'draw';

  const overallScore = `${teamMapsWon} - ${opponentMapsWon}`;

  return { outcome, overallScore };
};
