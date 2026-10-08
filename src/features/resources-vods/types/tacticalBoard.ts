export interface ValorantMap {
  uuid: string;
  displayName: string;
  displayIcon: string;
  splash: string;
  narrativeDescription?: string;
  tacticalDescription?: string;
  coordinates?: string;
  xMultiplier?: number;
  yMultiplier?: number;
  xScalarToAdd?: number;
  yScalarToAdd?: number;
}

export interface ValorantAbility {
  slot: string;
  displayName: string;
  description?: string;
  displayIcon: string;
}

export interface ValorantAgent {
  uuid: string;
  displayName: string;
  description?: string;
  displayIcon: string; // Round headshot icon
  bustPortrait?: string;
  fullPortrait?: string;
  role?: {
    uuid: string;
    displayName: string;
    displayIcon: string;
  };
  abilities: ValorantAbility[];
}

export type TacticalTeam = 'attack' | 'defense' | 'neutral';
export type TacticalTokenType = 'agent' | 'ability' | 'spike' | 'ping';
export type TacticalTool = 'select' | 'pen' | 'arrow' | 'eraser';

export interface TacticalToken {
  id: string;
  type: TacticalTokenType;
  name: string;
  iconUrl: string;
  x: number; // Porcentaje 0 a 100 relativo al lienzo
  y: number; // Porcentaje 0 a 100 relativo al lienzo
  team: TacticalTeam;
  subtext?: string;
  size?: number; // Radio o diámetro aproximado
}

export interface TacticalLine {
  id: string;
  tool: 'pen' | 'arrow';
  points: number[]; // Puntos normalizados en porcentaje [x1, y1, x2, y2, ...]
  color: string;
  width: number;
}

export interface TacticalBoardState {
  vodId: string;
  mapName: string;
  mapIconUrl: string;
  tokens: TacticalToken[];
  lines: TacticalLine[];
  updatedBy?: string;
  updatedAt?: string;
}
