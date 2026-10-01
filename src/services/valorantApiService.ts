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

// 13 Official standard Valorant maps (sorted alphabetically)
export const OFFICIAL_VALORANT_MAP_NAMES = [
  'Abyss',
  'Ascent',
  'Bind',
  'Breeze',
  'Corrode',
  'Fracture',
  'Haven',
  'Icebox',
  'Lotus',
  'Pearl',
  'Split',
  'Summit',
  'Sunset',
] as const;

export const FALLBACK_VALORANT_MAPS = [...OFFICIAL_VALORANT_MAP_NAMES];

export const FALLBACK_VALORANT_AGENTS: ValorantAgent[] = [
  { uuid: 'ded3520f-4264-bfed-162d-b080e2abccf9', displayName: 'Astra', description: '', developerName: 'Astra', displayIcon: 'https://media.valorant-api.com/agents/ded3520f-4264-bfed-162d-b080e2abccf9/displayicon.png' },
  { uuid: '5f8d3a7f-467b-97f3-062c-13acf203c006', displayName: 'Breach', description: '', developerName: 'Breach', displayIcon: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png' },
  { uuid: '9f0d8ba9-4140-b48e-cb97-70c153527238', displayName: 'Brimstone', description: '', developerName: 'Brimstone', displayIcon: 'https://media.valorant-api.com/agents/9f0d8ba9-4140-b48e-cb97-70c153527238/displayicon.png' },
  { uuid: '22697a3d-45bf-8dd7-4fec-84a9e28c69d7', displayName: 'Chamber', description: '', developerName: 'Chamber', displayIcon: 'https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png' },
  { uuid: '115ec03a-40a7-e63a-5a4e-99a7d488963a', displayName: 'Clove', description: '', developerName: 'Clove', displayIcon: 'https://media.valorant-api.com/agents/115ec03a-40a7-e63a-5a4e-99a7d488963a/displayicon.png' },
  { uuid: '117ed9e3-49f3-6512-3ccf-0cada7e3823b', displayName: 'Cypher', description: '', developerName: 'Cypher', displayIcon: 'https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png' },
  { uuid: 'cc8e01d3-4796-47d3-03e4-22abc1a02d23', displayName: 'Deadlock', description: '', developerName: 'Deadlock', displayIcon: 'https://media.valorant-api.com/agents/cc8e01d3-4796-47d3-03e4-22abc1a02d23/displayicon.png' },
  { uuid: 'dade69b4-4f5a-8528-247b-219e5a1facd6', displayName: 'Fade', description: '', developerName: 'Fade', displayIcon: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png' },
  { uuid: 'e370fa57-4757-3604-3648-499e1f642d3f', displayName: 'Gekko', description: '', developerName: 'Gekko', displayIcon: 'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png' },
  { uuid: '95b78ed7-4637-86d9-7e41-71ba8c293152', displayName: 'Harbor', description: '', developerName: 'Harbor', displayIcon: 'https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png' },
  { uuid: '0e38b510-41a8-5780-5e8f-568b2a4f2d6c', displayName: 'Iso', description: '', developerName: 'Iso', displayIcon: 'https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png' },
  { uuid: 'add6443a-41bd-e414-f6ad-e58d267f4e95', displayName: 'Jett', description: '', developerName: 'Jett', displayIcon: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png' },
  { uuid: '601db835-4377-80f1-ddae-071164169335', displayName: 'KAY/O', description: '', developerName: 'KAY/O', displayIcon: 'https://media.valorant-api.com/agents/601db835-4377-80f1-ddae-071164169335/displayicon.png' },
  { uuid: '1e58de9c-4950-5125-93e9-a0aee9f98746', displayName: 'Killjoy', description: '', developerName: 'Killjoy', displayIcon: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png' },
  { uuid: 'bb2a4830-4684-914e-d303-3297bce0158a', displayName: 'Neon', description: '', developerName: 'Neon', displayIcon: 'https://media.valorant-api.com/agents/bb2a4830-4684-914e-d303-3297bce0158a/displayicon.png' },
  { uuid: '8e252d04-4643-3281-92c4-84c277f2069d', displayName: 'Omen', description: '', developerName: 'Omen', displayIcon: 'https://media.valorant-api.com/agents/8e252d04-4643-3281-92c4-84c277f2069d/displayicon.png' },
  { uuid: 'eb93336a-449b-9c1b-0a54-a891f7921d69', displayName: 'Phoenix', description: '', developerName: 'Phoenix', displayIcon: 'https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png' },
  { uuid: 'f94c3b30-42be-e959-889c-5aa313dba261', displayName: 'Raze', description: '', developerName: 'Raze', displayIcon: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png' },
  { uuid: 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc', displayName: 'Reyna', description: '', developerName: 'Reyna', displayIcon: 'https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png' },
  { uuid: '569fdd95-4d10-43ab-ca70-79becc718b46', displayName: 'Sage', description: '', developerName: 'Sage', displayIcon: 'https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png' },
  { uuid: '6f2a04ca-43e0-be17-7f36-b39086d30f5b', displayName: 'Skye', description: '', developerName: 'Skye', displayIcon: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b39086d30f5b/displayicon.png' },
  { uuid: '3207dd43-4637-30d6-86ca-136302f80025', displayName: 'Sova', description: '', developerName: 'Sova', displayIcon: 'https://media.valorant-api.com/agents/3207dd43-4637-30d6-86ca-136302f80025/displayicon.png' },
  { uuid: 'b444168b-4aa4-d4fb-8e1e-db9fb5ba3017', displayName: 'Tejo', description: '', developerName: 'Tejo', displayIcon: 'https://media.valorant-api.com/agents/b444168b-4aa4-d4fb-8e1e-db9fb5ba3017/displayicon.png' },
  { uuid: '707eab51-4836-f488-046a-cda6bf494859', displayName: 'Viper', description: '', developerName: 'Viper', displayIcon: 'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png' },
  { uuid: 'efba5359-4016-a1e5-7626-b1ae76895940', displayName: 'Vyse', description: '', developerName: 'Vyse', displayIcon: 'https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/displayicon.png' },
  { uuid: '7f94d92c-4234-0a36-9646-3a87eb8b5c89', displayName: 'Yoru', description: '', developerName: 'Yoru', displayIcon: 'https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png' },
].sort((a, b) => a.displayName.localeCompare(b.displayName));

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
        cachedAgents = data.data.sort((a: ValorantAgent, b: ValorantAgent) =>
          a.displayName.localeCompare(b.displayName)
        );
        return cachedAgents!;
      }
      return [];
    } catch (err) {
      console.warn('Valorant API agents fetch failed, trying English fallback:', err);
      try {
        const resEng = await fetch(`${VALORANT_API_BASE}/agents?isPlayableCharacter=true`);
        const dataEng = await resEng.json();
        if (dataEng && Array.isArray(dataEng.data)) {
          cachedAgents = dataEng.data.sort((a: ValorantAgent, b: ValorantAgent) =>
            a.displayName.localeCompare(b.displayName)
          );
          return cachedAgents!;
        }
      } catch (e) {
        console.error('Failed to fetch Valorant agents:', e);
      }
      return FALLBACK_VALORANT_AGENTS;
    }
  },

  /**
   * Fetch strictly the 13 official standard competitive & casual maps (excludes TDM, Skirmish, Range).
   */
  async getMaps(): Promise<ValorantMapData[]> {
    if (cachedMaps && cachedMaps.length > 0) {
      return cachedMaps;
    }

    const officialSet = new Set(OFFICIAL_VALORANT_MAP_NAMES.map((name) => name.toLowerCase()));

    try {
      const res = await fetch(`${VALORANT_API_BASE}/maps?language=es-ES`);
      if (!res.ok) {
        throw new Error(`Failed to fetch maps: ${res.statusText}`);
      }
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        const standardMaps = data.data.filter((m: ValorantMapData) => {
          if (!m.displayName) return false;
          return officialSet.has(m.displayName.trim().toLowerCase());
        });

        // Deduplicate by displayName
        const uniqueMap = new Map<string, ValorantMapData>();
        for (const map of standardMaps) {
          const key = map.displayName.trim().toLowerCase();
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, map);
          }
        }

        const sorted = Array.from(uniqueMap.values()).sort((a, b) =>
          a.displayName.localeCompare(b.displayName)
        );

        cachedMaps = sorted.length > 0 ? sorted : [];
        return cachedMaps;
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
