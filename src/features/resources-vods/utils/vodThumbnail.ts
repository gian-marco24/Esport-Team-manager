const VALORANT_MAP_SPLASHES: Record<string, string> = {
  abyss: 'https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png',
  ascent: 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png',
  bind: 'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png',
  breeze: 'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png',
  fracture: 'https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png',
  haven: 'https://media.valorant-api.com/maps/2bee0c78-4309-9c16-0202-c4b77b595dac/splash.png',
  icebox: 'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png',
  lotus: 'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png',
  pearl: 'https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png',
  split: 'https://media.valorant-api.com/maps/d960549e-485c-68e3-6170-71823b463657/splash.png',
  sunset: 'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png',
};

export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

export function getMapSplash(mapName?: string): string | null {
  if (!mapName) return null;
  const key = mapName.trim().toLowerCase();
  return VALORANT_MAP_SPLASHES[key] || null;
}

export function getVodThumbnail(videoUrl: string, mapName?: string, customThumbnail?: string): string | null {
  if (customThumbnail) return customThumbnail;

  const ytId = getYouTubeVideoId(videoUrl);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  return getMapSplash(mapName);
}
