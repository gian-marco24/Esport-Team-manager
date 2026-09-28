export interface ValorantAgent {
  uuid: string;
  displayName: string;
  description: string;
  developerName: string;
  displayIcon: string;
  displayIconSmall?: string;
  bustPortrait?: string;
  fullPortrait?: string;
  role?: {
    uuid: string;
    displayName: string;
    description: string;
    displayIcon: string;
  };
}

export interface ValorantMapData {
  uuid: string;
  displayName: string;
  coordinates?: string;
  displayIcon?: string;
  listViewIcon?: string;
  splash: string;
  tacticalDescription?: string;
}

const VALORANT_API_BASE = 'https://valorant-api.com/v1';

// In-memory cache
let cachedAgents: ValorantAgent[] | null = null;
let cachedMaps: ValorantMapData[] | null = null;

// Fallback hardcoded list of standard maps in case of offline/network issues
export const FALLBACK_VALORANT_MAPS = [
  'Lotus',
  'Ascent',
  'Haven',
  'Split',
  'Bind',
  'Abyss',
  'Sunset',
  'Icebox',
  'Breeze',
  'Fracture',
  'Pearl',
];

export const valorantApiService = {
  /**
   * Fetch all playable agents with their portraits, icons and roles.
   * Free & Public API - No Riot API key required.
   */
  async getAgents(): Promise<ValorantAgent[]> {
    if (cachedAgents && cachedAgents.length > 0) {
      return cachedAgents;
    }

    try {
      const res = await fetch(`${VALORANT_API_BASE}/agents?isPlayableCharacter=true&language=es-ES`);
      if (!res.ok) {
        throw new Error(`Failed to fetch agents: ${res.statusText}`);
      }
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        cachedAgents = data.data;
        return cachedAgents!;
      }
      return [];
    } catch (err) {
      console.warn('Valorant API agents fetch failed, trying English fallback:', err);
      try {
        const resEng = await fetch(`${VALORANT_API_BASE}/agents?isPlayableCharacter=true`);
        const dataEng = await resEng.json();
        if (dataEng && Array.isArray(dataEng.data)) {
          cachedAgents = dataEng.data;
          return cachedAgents!;
        }
      } catch (e) {
        console.error('Failed to fetch Valorant agents:', e);
      }
      return [];
    }
  },

  /**
   * Fetch standard competitive and casual maps.
   */
  async getMaps(): Promise<ValorantMapData[]> {
    if (cachedMaps && cachedMaps.length > 0) {
      return cachedMaps;
    }

    try {
      const res = await fetch(`${VALORANT_API_BASE}/maps?language=es-ES`);
      if (!res.ok) {
        throw new Error(`Failed to fetch maps: ${res.statusText}`);
      }
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        const standardMaps = data.data.filter(
          (m: ValorantMapData) =>
            m.coordinates &&
            !m.displayName.toLowerCase().includes('range') &&
            !m.displayName.toLowerCase().includes('training') &&
            !m.displayName.toLowerCase().includes('skirmish')
        );
        cachedMaps = standardMaps.length > 0 ? standardMaps : data.data;
        return cachedMaps!;
      }
      return [];
    } catch (err) {
      console.error('Valorant API maps fetch failed:', err);
      return [];
    }
  },

  /**
   * Helper to find an agent by name (case-insensitive fuzzy match)
   */
  async findAgentByName(name: string): Promise<ValorantAgent | null> {
    const agents = await this.getAgents();
    const clean = name.trim().toLowerCase();
    return (
      agents.find((a) => a.displayName.toLowerCase() === clean) ||
      agents.find((a) => a.displayName.toLowerCase().includes(clean) || clean.includes(a.displayName.toLowerCase())) ||
      null
    );
  },

  /**
   * Helper to find a map by name (case-insensitive fuzzy match)
   */
  async findMapByName(name: string): Promise<ValorantMapData | null> {
    const maps = await this.getMaps();
    const clean = name.trim().toLowerCase();
    return (
      maps.find((m) => m.displayName.toLowerCase() === clean) ||
      maps.find((m) => m.displayName.toLowerCase().includes(clean) || clean.includes(m.displayName.toLowerCase())) ||
      null
    );
  },
};
