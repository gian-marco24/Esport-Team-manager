import type { ValorantMap, ValorantAgent } from '../types/tacticalBoard';

const MAPS_STORAGE_KEY = 'urs_gamara_valorant_maps_v3';
const AGENTS_STORAGE_KEY = 'urs_gamara_valorant_agents_v1';

export const COMPETITIVE_MAP_NAMES = new Set([
  'abyss',
  'ascent',
  'bind',
  'breeze',
  'corrode',
  'fracture',
  'haven',
  'icebox',
  'lotus',
  'pearl',
  'split',
  'summit',
  'sunset',
]);

// Rotación base en grados para que los spawns queden alineados verticalmente (Arriba y Abajo)
export const BASE_MAP_ROTATION: Record<string, number> = {
  Abyss: -90,
  Ascent: -90,
  Bind: 180,
  Breeze: 180,
  Corrode: -90,
  Fracture: 180,
  Haven: -90,
  Icebox: 90,
  Lotus: 180,
  Pearl: 180,
  Split: -90,
  Summit: 0,
  Sunset: 180,
};

// Mapas de fallback oficiales ordenados alfabéticamente
const FALLBACK_MAPS: ValorantMap[] = [
  {
    uuid: '224b0a95-48b9-f703-1bd8-67aca101a61f',
    displayName: 'Abyss',
    displayIcon: 'https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/displayicon.png',
    splash: 'https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png',
  },
  {
    uuid: '7eaecc1b-4337-bbf6-6ab9-04b8f06b3319',
    displayName: 'Ascent',
    displayIcon: 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png',
    splash: 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png',
  },
  {
    uuid: '2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba',
    displayName: 'Bind',
    displayIcon: 'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/displayicon.png',
    splash: 'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png',
  },
  {
    uuid: '2fb9a4fd-47b8-4e7d-a969-74b4046ebd53',
    displayName: 'Breeze',
    displayIcon: 'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/displayicon.png',
    splash: 'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png',
  },
  {
    uuid: '1c18ab1f-420d-0d8b-71d0-77ad3c439115',
    displayName: 'Corrode',
    displayIcon: 'https://media.valorant-api.com/maps/1c18ab1f-420d-0d8b-71d0-77ad3c439115/displayicon.png',
    splash: 'https://media.valorant-api.com/maps/1c18ab1f-420d-0d8b-71d0-77ad3c439115/splash.png',
  },
  {
    uuid: 'b529448b-4d60-346e-e89e-00a4c527a405',
    displayName: 'Fracture',
    displayIcon: 'https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/displayicon.png',
    splash: 'https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png',
  },
  {
    uuid: '2bee0c78-4309-9c16-0202-c4b77b595dac',
    displayName: 'Haven',
    displayIcon: 'https://media.valorant-api.com/maps/2bee0c78-4309-9c16-0202-c4b77b595dac/displayicon.png',
    splash: 'https://media.valorant-api.com/maps/2bee0c78-4309-9c16-0202-c4b77b595dac/splash.png',
  },
  {
    uuid: 'e2ad5c54-4114-a870-9641-8ea21279579a',
    displayName: 'Icebox',
    displayIcon: 'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/displayicon.png',
    splash: 'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png',
  },
  {
    uuid: '2fe4ed3a-450a-948b-6d6b-e89a78e680a9',
    displayName: 'Lotus',
    displayIcon: 'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/displayicon.png',
    splash: 'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png',
  },
  {
    uuid: 'fd267378-4d1d-484f-ff52-77821ed10dc2',
    displayName: 'Pearl',
    displayIcon: 'https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/displayicon.png',
    splash: 'https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png',
  },
  {
    uuid: 'd960549e-485c-68e3-6170-71823b463657',
    displayName: 'Split',
    displayIcon: 'https://media.valorant-api.com/maps/d960549e-485c-68e3-6170-71823b463657/displayicon.png',
    splash: 'https://media.valorant-api.com/maps/d960549e-485c-68e3-6170-71823b463657/splash.png',
  },
  {
    uuid: '756da597-416b-c0f2-f47b-afbdf28670bc',
    displayName: 'Summit',
    displayIcon: 'https://media.valorant-api.com/maps/756da597-416b-c0f2-f47b-afbdf28670bc/displayicon.png',
    splash: 'https://media.valorant-api.com/maps/756da597-416b-c0f2-f47b-afbdf28670bc/splash.png',
  },
  {
    uuid: '92584fbe-486a-b1b2-9faa-39b0f486b498',
    displayName: 'Sunset',
    displayIcon: 'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/displayicon.png',
    splash: 'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png',
  },
];

class ValorantApiService {
  private cachedMaps: ValorantMap[] | null = null;
  private cachedAgents: ValorantAgent[] | null = null;

  async getMaps(): Promise<ValorantMap[]> {
    if (this.cachedMaps && this.cachedMaps.length > 0) {
      return this.cachedMaps;
    }

    try {
      const local = localStorage.getItem(MAPS_STORAGE_KEY);
      if (local) {
        this.cachedMaps = JSON.parse(local);
        return this.cachedMaps!;
      }
    } catch {
      // ignore
    }

    try {
      const response = await fetch('https://valorant-api.com/v1/maps?language=es-ES');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const json = await response.json();
      if (json?.data && Array.isArray(json.data)) {
        // Filtrar exclusivamente mapas oficiales del competitivo
        const validMaps: ValorantMap[] = json.data
          .filter(
            (m: any) =>
              m.displayIcon &&
              m.displayName &&
              COMPETITIVE_MAP_NAMES.has(m.displayName.toLowerCase().trim())
          )
          .map((m: any) => ({
            uuid: m.uuid,
            displayName: m.displayName,
            displayIcon: m.displayIcon,
            splash: m.splash || m.listViewIcon || '',
            narrativeDescription: m.narrativeDescription,
            tacticalDescription: m.tacticalDescription,
            coordinates: m.coordinates,
            xMultiplier: m.xMultiplier,
            yMultiplier: m.yMultiplier,
            xScalarToAdd: m.xScalarToAdd,
            yScalarToAdd: m.yScalarToAdd,
          }));

        if (validMaps.length > 0) {
          validMaps.sort((a, b) => a.displayName.localeCompare(b.displayName));
          this.cachedMaps = validMaps;
          try {
            localStorage.setItem(MAPS_STORAGE_KEY, JSON.stringify(validMaps));
          } catch {
            // ignore
          }
          return validMaps;
        }
      }
    } catch (err) {
      console.warn('⚠️ Error al obtener mapas de Valorant API, usando fallback:', err);
    }

    this.cachedMaps = FALLBACK_MAPS;
    return FALLBACK_MAPS;
  }

  async getAgents(): Promise<ValorantAgent[]> {
    if (this.cachedAgents && this.cachedAgents.length > 0) {
      return this.cachedAgents;
    }

    try {
      const local = localStorage.getItem(AGENTS_STORAGE_KEY);
      if (local) {
        this.cachedAgents = JSON.parse(local);
        return this.cachedAgents!;
      }
    } catch {
      // ignore
    }

    try {
      const response = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=es-ES');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const json = await response.json();
      if (json?.data && Array.isArray(json.data)) {
        const agents: ValorantAgent[] = json.data.map((a: any) => ({
          uuid: a.uuid,
          displayName: a.displayName,
          description: a.description,
          displayIcon: a.displayIcon,
          bustPortrait: a.bustPortrait,
          fullPortrait: a.fullPortrait,
          role: a.role ? {
            uuid: a.role.uuid,
            displayName: a.role.displayName,
            displayIcon: a.role.displayIcon,
          } : undefined,
          abilities: Array.isArray(a.abilities)
            ? a.abilities
                .filter((ab: any) => ab.displayIcon && ab.displayName)
                .map((ab: any) => ({
                  slot: ab.slot,
                  displayName: ab.displayName,
                  description: ab.description,
                  displayIcon: ab.displayIcon,
                }))
            : [],
        }));

        if (agents.length > 0) {
          // Ordenar alfabéticamente
          agents.sort((a, b) => a.displayName.localeCompare(b.displayName));
          this.cachedAgents = agents;
          try {
            localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
          } catch {
            // ignore
          }
          return agents;
        }
      }
    } catch (err) {
      console.warn('⚠️ Error al obtener agentes de Valorant API:', err);
    }

    return [];
  }
}

export const valorantApiService = new ValorantApiService();
