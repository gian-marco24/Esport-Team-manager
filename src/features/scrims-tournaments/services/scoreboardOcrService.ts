import { createWorker, PSM } from 'tesseract.js';
import { valorantApiService, type ValorantAgent, FALLBACK_VALORANT_MAPS } from '../../../services/valorantApiService';
import type { MatchPlayerStats } from '../types';
import type { TeamMember } from '../../teams/types';

export interface ParsedScoreboardResult {
  mapName?: string;
  teamScore?: number;
  opponentScore?: number;
  outcome?: 'win' | 'loss' | 'draw';
  players: MatchPlayerStats[];
  detectedMapConfidence?: number;
  rawText?: string;
}

// Color signatures for Valorant playable agents in scoreboard (Multi-region: Top, Center, Bottom, Overall)
interface AgentColorSignature {
  name: string;
  top: [number, number, number];
  center: [number, number, number];
  bottom: [number, number, number];
  overall: [number, number, number];
}

const AGENT_SIGNATURES: AgentColorSignature[] = [
  { name: 'Omen', top: [82, 94, 178], center: [45, 68, 120], bottom: [52, 58, 97], overall: [59, 72, 129] },
  { name: 'Cypher', top: [141, 137, 132], center: [104, 101, 98], bottom: [113, 115, 114], overall: [111, 119, 116] },
  { name: 'Phoenix', top: [96, 72, 68], center: [107, 73, 66], bottom: [132, 90, 68], overall: [108, 77, 69] },
  { name: 'Brimstone', top: [181, 140, 81], center: [118, 79, 53], bottom: [88, 84, 72], overall: [124, 99, 67] },
  { name: 'Jett', top: [188, 179, 184], center: [172, 145, 143], bottom: [108, 98, 95], overall: [144, 130, 132] },
  { name: 'Sova', top: [162, 132, 125], center: [167, 142, 134], bottom: [117, 117, 112], overall: [152, 137, 129] },
  { name: 'Killjoy', top: [95, 90, 75], center: [115, 90, 78], bottom: [98, 85, 54], overall: [102, 86, 68] },
  { name: 'Viper', top: [114, 99, 102], center: [41, 42, 48], bottom: [57, 56, 58], overall: [72, 67, 69] },
  { name: 'Skye', top: [141, 105, 87], center: [136, 96, 80], bottom: [90, 77, 75], overall: [116, 87, 74] },
  { name: 'Raze', top: [128, 92, 76], center: [138, 97, 81], bottom: [90, 70, 61], overall: [119, 89, 75] },
  { name: 'Sage', top: [123, 105, 105], center: [157, 124, 115], bottom: [110, 93, 92], overall: [121, 102, 100] },
  { name: 'Neon', top: [88, 97, 120], center: [143, 114, 99], bottom: [71, 62, 67], overall: [102, 90, 92] },
  { name: 'Yoru', top: [113, 96, 119], center: [78, 73, 111], bottom: [51, 63, 102], overall: [68, 74, 107] },
  { name: 'Gekko', top: [120, 160, 60], center: [140, 130, 90], bottom: [80, 90, 60], overall: [110, 125, 70] },
  { name: 'Reyna', top: [100, 50, 120], center: [110, 60, 100], bottom: [70, 40, 80], overall: [90, 50, 100] },
  { name: 'Fade', top: [65, 65, 75], center: [90, 80, 85], bottom: [50, 50, 60], overall: [70, 65, 75] },
  { name: 'KAY/O', top: [70, 110, 140], center: [60, 120, 150], bottom: [60, 80, 100], overall: [65, 100, 130] },
  { name: 'Breach', top: [140, 80, 50], center: [130, 90, 60], bottom: [100, 70, 50], overall: [120, 80, 55] },
  { name: 'Astra', top: [90, 60, 110], center: [120, 90, 90], bottom: [80, 60, 90], overall: [95, 70, 95] },
  { name: 'Chamber', top: [70, 65, 75], center: [140, 115, 95], bottom: [90, 85, 90], overall: [100, 88, 86] },
  { name: 'Deadlock', top: [150, 140, 120], center: [135, 115, 105], bottom: [85, 90, 95], overall: [120, 115, 105] },
  { name: 'Iso', top: [60, 55, 70], center: [120, 100, 95], bottom: [65, 55, 80], overall: [80, 70, 80] },
  { name: 'Clove', top: [150, 100, 140], center: [140, 110, 110], bottom: [100, 70, 110], overall: [130, 95, 120] },
  { name: 'Vyse', top: [110, 110, 120], center: [120, 115, 125], bottom: [80, 75, 85], overall: [100, 100, 110] },
  { name: 'Tejo', top: [120, 110, 90], center: [140, 120, 100], bottom: [90, 80, 70], overall: [110, 100, 85] },
  { name: 'Miks', top: [100, 90, 120], center: [130, 110, 100], bottom: [80, 70, 90], overall: [100, 90, 105] },
  { name: 'Waylay', top: [110, 90, 130], center: [125, 100, 110], bottom: [85, 65, 95], overall: [105, 85, 110] },
  { name: 'Veto', top: [130, 110, 80], center: [135, 115, 90], bottom: [95, 85, 70], overall: [115, 100, 80] }
];

// Determine if a row belongs to friendly team (Cyan / Teal / Blue / Gold) vs Enemy (Red)
function isFriendlyRow(r: number, g: number, b: number): boolean {
  // Red enemy row check:
  if (r > g + 14 && r > b + 10 && r >= 65 && g < 60) {
    return false;
  }
  // Cyan / Teal / Blue teammates:
  if (g >= 55 && g > r + 14 && b > r + 14) {
    return true;
  }
  // Gold / Yellowish self player:
  if (g >= 58 && r >= 58 && Math.abs(r - g) <= 15 && r > b + 2) {
    return true;
  }
  // General fallback: Green is elevated and not dominated by Red
  if (g >= 60 && r - g < 12) {
    return true;
  }
  return false;
}

// Leetspeak normalization to match in-game styling (e.g. Wi7SaN -> witsan)
function normalizeLeet(str: string): string {
  return str
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/[^a-z0-9]/g, '');
}

// Levenshtein distance for fuzzy matching player nicks
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1.toLowerCase() : s2.toLowerCase();
  const shorter = s1.length > s2.length ? s2.toLowerCase() : s1.toLowerCase();
  if (longer.length === 0) return 1.0;
  if (longer.includes(shorter) || shorter.includes(longer)) return 0.88;

  const costs: number[] = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  return (longer.length - costs[shorter.length]) / longer.length;
}

// Clean Premier tag prefix (e.g., "UG | KimiFPS", "UCT | Maxi", "[UG] Witsan")
function cleanPremierPrefix(rawNick: string): string {
  let cleaned = rawNick.replace(/[\n\r]/g, '').trim();
  cleaned = cleaned.replace(/^[|\[\]\(\)\.\s_—-]+/, '');

  const tagMatch = cleaned.match(/^(?:[A-Za-z0-9]{2,4})\s*[|:;—\-_/\\]\s*(.+)$/i);
  if (tagMatch) {
    cleaned = tagMatch[1].trim();
  }

  return cleaned.replace(/^[|\[\]\(\)\.\s_—-]+/, '').trim();
}

// Helper to load image to HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

// Helper to convert crop to canvas data URL
function cropToDataUrl(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  scale = 2,
  enhanceContrast = true
): string {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  if (enhanceContrast) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const factor = 1.8;
      const adjusted = Math.min(255, Math.max(0, factor * (avg - 60)));
      d[i] = adjusted;
      d[i + 1] = adjusted;
      d[i + 2] = adjusted;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas.toDataURL('image/png');
}

// Helper to sample average RGB in a region
function sampleAverageRgb(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number
): [number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));
  const ctx = canvas.getContext('2d');
  if (!ctx) return [0, 0, 0];

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  const count = d.length / 4;

  for (let i = 0; i < d.length; i += 4) {
    totalR += d[i];
    totalG += d[i + 1];
    totalB += d[i + 2];
  }

  return [
    Math.round(totalR / count),
    Math.round(totalG / count),
    Math.round(totalB / count),
  ];
}

// Detect Valorant Agent from the agent portrait thumbnail in the scoreboard row
function detectAgentFromImage(
  img: HTMLImageElement,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number,
  agentList: ValorantAgent[]
): { agentName: string; agentIcon?: string } | null {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, 32, 32);
  const imgData = ctx.getImageData(0, 0, 32, 32).data;

  function getPixel(x: number, y: number): [number, number, number] {
    const idx = (y * 32 + x) * 4;
    return [imgData[idx], imgData[idx + 1], imgData[idx + 2]];
  }

  function getAvg(x1: number, y1: number, x2: number, y2: number): [number, number, number] {
    let r = 0, g = 0, b = 0, count = 0;
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const p = getPixel(x, y);
        r += p[0]; g += p[1]; b += p[2]; count++;
      }
    }
    return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
  }

  const feat = {
    top: getAvg(6, 2, 26, 10),
    center: getAvg(8, 11, 24, 20),
    bottom: getAvg(6, 21, 26, 30),
    overall: getAvg(4, 4, 28, 28),
  };

  let bestName: string | null = null;
  let lowestDist = Infinity;

  function colorDist(c1: [number, number, number], c2: [number, number, number]): number {
    const dr = c1[0] - c2[0];
    const dg = c1[1] - c2[1];
    const db = c1[2] - c2[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  for (const sig of AGENT_SIGNATURES) {
    const dTop = colorDist(feat.top, sig.top) * 1.2;
    const dCenter = colorDist(feat.center, sig.center) * 1.3;
    const dBottom = colorDist(feat.bottom, sig.bottom) * 1.0;
    const dOverall = colorDist(feat.overall, sig.overall) * 1.1;

    let total = dTop + dCenter + dBottom + dOverall;

    if (sig.name === 'Omen') {
      const isBlueDom = feat.overall[2] > feat.overall[0] + 30 && feat.top[2] > feat.top[0] + 40;
      if (isBlueDom) total *= 0.4;
      else total *= 2.0;
    }
    if (sig.name === 'Cypher') {
      const topVariance = Math.max(
        Math.abs(feat.top[0] - feat.top[1]),
        Math.abs(feat.top[1] - feat.top[2]),
        Math.abs(feat.top[0] - feat.top[2])
      );
      if (topVariance < 10 && feat.top[0] > 120) total *= 0.4;
    }
    if (sig.name === 'Viper') {
      if (feat.center[0] < 55 && feat.center[1] < 55 && feat.center[2] < 55) total *= 0.4;
    }
    if (sig.name === 'Jett') {
      if (feat.top[0] > 170 && feat.top[2] > 150) total *= 0.5;
    }
    if (sig.name === 'Brimstone') {
      if (feat.top[0] > 165 && feat.top[0] > feat.top[2] + 70) total *= 0.4;
    }
    if (sig.name === 'Killjoy') {
      if (
        (feat.bottom[0] > feat.bottom[2] + 25 && feat.bottom[1] > feat.bottom[2] + 20) ||
        feat.center[0] > feat.center[2] + 30
      ) {
        total *= 0.5;
      }
    }

    if (total < lowestDist) {
      lowestDist = total;
      bestName = sig.name;
    }
  }

  if (!bestName) return null;

  const matchedAgent = agentList.find(
    (a) => a.displayName.toLowerCase() === bestName?.toLowerCase()
  );

  return {
    agentName: matchedAgent ? matchedAgent.displayName : bestName,
    agentIcon: matchedAgent?.displayIcon,
  };
}

export const scoreboardOcrService = {
  /**
   * Process a scoreboard image:
   * 1. Extracts map and scores from the header
   * 2. Distinguishes friendly team rows (Cyan/Green/Blue + Gold self) from enemy rows (Red)
   * 3. Detects the Valorant Agent used by each player from their portrait icon
   * 4. Cleans Premier tags and matches player nick against roster member display names and gameTag prefixes
   * 5. Categorizes unmatched friendly players as Guests ("Invitado (Nick)")
   * 6. Extracts KDA, First Bloods and computes KDA Ratio
   */
  async parseValorantScoreboard(
    imageSource: string | File,
    rosterMembers: TeamMember[] = []
  ): Promise<ParsedScoreboardResult> {
    let imageUrl: string;
    if (typeof imageSource === 'string') {
      imageUrl = imageSource;
    } else {
      imageUrl = URL.createObjectURL(imageSource);
    }

    try {
      const img = await loadImage(imageUrl);
      const W = img.naturalWidth || img.width;
      const H = img.naturalHeight || img.height;

      const [mapsList, agentList] = await Promise.all([
        valorantApiService.getMaps(),
        valorantApiService.getAgents(),
      ]);
      const mapNames = mapsList.length > 0 ? mapsList.map((m) => m.displayName) : FALLBACK_VALORANT_MAPS;

      // Create OCR worker
      const worker = await createWorker('spa+eng');

      // 1. Process Header (Score, Outcome, Map)
      const headerUrl = cropToDataUrl(img, 0, 0, W, Math.round(H * 0.22), 2, true);
      const headerResult = await worker.recognize(headerUrl);
      const headerText = headerResult.data.text;

      let detectedMap: string | undefined;
      let detectedTeamScore: number | undefined;
      let detectedOpponentScore: number | undefined;
      let detectedOutcome: 'win' | 'loss' | 'draw' | undefined;

      // Detect outcome and scores
      const scoreMatch = headerText.match(/(\d{1,2})\s*(VICTORIA|DERROTA|EMPATE|VICTORY|DEFEAT|DRAW)?\s*(\d{1,2})/i);
      if (scoreMatch) {
        detectedTeamScore = parseInt(scoreMatch[1], 10);
        detectedOpponentScore = parseInt(scoreMatch[3], 10);
        const outcomeWord = (scoreMatch[2] || '').toUpperCase();
        if (outcomeWord.includes('VIC')) detectedOutcome = 'win';
        else if (outcomeWord.includes('DER') || outcomeWord.includes('DEF')) detectedOutcome = 'loss';
        else if (detectedTeamScore > detectedOpponentScore) detectedOutcome = 'win';
        else if (detectedTeamScore < detectedOpponentScore) detectedOutcome = 'loss';
        else detectedOutcome = 'draw';
      }

      // Check map in header
      for (const mapName of mapNames) {
        if (new RegExp(`\\b${mapName}\\b`, 'i').test(headerText)) {
          detectedMap = mapName;
          break;
        }
      }

      // If map not found in full header, crop top right specifically
      if (!detectedMap) {
        const mapCropUrl = cropToDataUrl(
          img,
          Math.round(W * 0.75),
          Math.round(H * 0.03),
          Math.round(W * 0.24),
          Math.round(H * 0.18),
          3,
          true
        );
        const mapRes = await worker.recognize(mapCropUrl);
        const mapText = mapRes.data.text;
        for (const mapName of mapNames) {
          if (new RegExp(`\\b${mapName}\\b`, 'i').test(mapText) || similarity(mapText, mapName) > 0.6) {
            detectedMap = mapName;
            break;
          }
        }
      }

      // 2. Process Scoreboard Rows
      const startYRel = 0.312;
      const rowStepRel = 0.0430;
      const rowHRel = 0.0420;

      const parsedPlayers: MatchPlayerStats[] = [];

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
      });

      for (let i = 0; i < 10; i++) {
        const top = Math.round((startYRel + i * rowStepRel) * H);
        const height = Math.round(rowHRel * H);

        // Check row team color on the left-center background
        const [r, g, b] = sampleAverageRgb(
          img,
          Math.round(W * 0.35),
          top + 5,
          20,
          Math.max(1, height - 10)
        );

        const isFriendly = isFriendlyRow(r, g, b);

        // ONLY PROCESS OUR TEAM'S FRIENDLY PLAYERS (Cyan/Green/Blue or Gold rows)
        if (!isFriendly) {
          continue;
        }

        // Detect Agent from portrait thumbnail
        const detectedAgent = detectAgentFromImage(
          img,
          Math.round(W * 0.220),
          top + 2,
          Math.round(W * 0.024),
          Math.max(1, height - 4),
          agentList
        );

        // Crop player name area (x: 24.5% to 47%)
        const nameCropUrl = cropToDataUrl(
          img,
          Math.round(W * 0.245),
          top,
          Math.round(W * 0.225),
          height,
          2.5,
          true
        );
        const nameRes = await worker.recognize(nameCropUrl);
        const rawNick = nameRes.data.text.trim();
        const cleanNick = cleanPremierPrefix(rawNick);

        // Crop stats numbers (x: 47% to 80%)
        const statsCropUrl = cropToDataUrl(
          img,
          Math.round(W * 0.47),
          top,
          Math.round(W * 0.33),
          height,
          2.5,
          true
        );
        const statsRes = await worker.recognize(statsCropUrl);
        const statsText = statsRes.data.text.replace(/[\n\r]/g, ' ').trim();

        // Extract numbers from statsText: K / D / A / FK
        const numbers = statsText
          .replace(/[oO]/g, '0')
          .replace(/[zZ]/g, '2')
          .replace(/[lI|]/g, '1')
          .replace(/[sS]/g, '5')
          .match(/\d+/g)
          ?.map(Number) || [];

        const kills = numbers[0] ?? 0;
        const deaths = numbers[1] ?? 0;
        const assists = numbers[2] ?? 0;
        const firstKills = numbers[3] ?? 0;

        const kdaRatio = deaths > 0 ? Number(((kills + assists) / deaths).toFixed(2)) : kills + assists;

        // Match against roster members
        let matchedMember: TeamMember | undefined;
        let highestSim = 0;

        const cleanLeet = normalizeLeet(cleanNick);

        for (const member of rosterMembers) {
          const memberNickSim = similarity(cleanNick, member.displayName);
          const memberNickLeetSim = similarity(cleanLeet, normalizeLeet(member.displayName));

          let tagPrefixSim = 0;
          let tagPrefixLeetSim = 0;
          if (member.gameTag) {
            const tagPrefix = member.gameTag.split('#')[0].trim();
            if (tagPrefix.length > 0) {
              tagPrefixSim = similarity(cleanNick, tagPrefix);
              tagPrefixLeetSim = similarity(cleanLeet, normalizeLeet(tagPrefix));
            }
          }

          const bestMemberSim = Math.max(memberNickSim, memberNickLeetSim, tagPrefixSim, tagPrefixLeetSim);

          const isDirectLeetMatch =
            cleanLeet.length > 2 &&
            (cleanLeet === normalizeLeet(member.displayName) ||
              (member.gameTag && cleanLeet === normalizeLeet(member.gameTag.split('#')[0])));

          if (isDirectLeetMatch) {
            matchedMember = member;
            highestSim = 1.0;
            break;
          }

          if (bestMemberSim > highestSim && bestMemberSim >= 0.42) {
            highestSim = bestMemberSim;
            matchedMember = member;
          }
        }

        if (matchedMember) {
          parsedPlayers.push({
            playerId: matchedMember.id,
            playerNick: matchedMember.displayName,
            gameTag: matchedMember.gameTag,
            agent: detectedAgent?.agentName,
            agentIcon: detectedAgent?.agentIcon,
            kills,
            deaths,
            assists,
            firstKills,
            kdaRatio,
            isGuest: false,
          });
        } else {
          parsedPlayers.push({
            playerId: undefined,
            playerNick: cleanNick ? `Invitado (${cleanNick})` : `Invitado (Jugador ${parsedPlayers.length + 1})`,
            gameTag: undefined,
            agent: detectedAgent?.agentName,
            agentIcon: detectedAgent?.agentIcon,
            kills,
            deaths,
            assists,
            firstKills,
            kdaRatio,
            isGuest: true,
          });
        }
      }

      await worker.terminate();

      // Ensure at most 5 players for standard team
      const finalPlayers = parsedPlayers.length > 0 ? parsedPlayers.slice(0, 5) : [];

      return {
        mapName: detectedMap,
        teamScore: detectedTeamScore,
        opponentScore: detectedOpponentScore,
        outcome: detectedOutcome,
        players: finalPlayers,
        rawText: headerText,
      };
    } catch (error) {
      console.error('Scoreboard OCR processing error:', error);
      throw error;
    }
  },
};
