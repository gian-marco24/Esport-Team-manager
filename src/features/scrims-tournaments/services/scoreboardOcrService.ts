import { createWorker, PSM } from 'tesseract.js';
import { valorantApiService, type ValorantAgent, FALLBACK_VALORANT_MAPS, FALLBACK_VALORANT_AGENTS } from '../../../services/valorantApiService';
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

interface AgentColorSignature {
  name: string;
  top: [number, number, number];
  center: [number, number, number];
  bottom: [number, number, number];
  overall: [number, number, number];
}

const AGENT_SIGNATURES: AgentColorSignature[] = [
  { name: 'Cypher', top: [135, 139, 135], center: [75, 92, 92], bottom: [111, 114, 110], overall: [107, 115, 112] },
  { name: 'Astra', top: [76, 57, 51], center: [107, 79, 68], bottom: [101, 82, 95], overall: [94, 71, 68] },
  { name: 'Raze', top: [132, 112, 94], center: [131, 102, 88], bottom: [95, 75, 65], overall: [122, 99, 85] },
  { name: 'Raze', top: [135, 133, 124], center: [139, 110, 93], bottom: [91, 72, 66], overall: [125, 110, 99] },
  { name: 'Fade', top: [118, 103, 103], center: [130, 106, 102], bottom: [104, 97, 101], overall: [119, 102, 102] },
  { name: 'Sova', top: [156, 134, 124], center: [162, 145, 136], bottom: [164, 158, 146], overall: [160, 144, 134] },
  { name: 'Breach', top: [133, 104, 90], center: [128, 98, 79], bottom: [90, 59, 45], overall: [120, 90, 75] },
  { name: 'Yoru', top: [79, 80, 106], center: [103, 98, 117], bottom: [61, 76, 108], overall: [83, 86, 110] },
  { name: 'Omen', top: [88, 91, 153], center: [62, 83, 135], bottom: [47, 54, 91], overall: [68, 79, 131] },
  { name: 'Omen', top: [140, 113, 96], center: [94, 76, 84], bottom: [75, 118, 162], overall: [108, 101, 109] },
  { name: 'Neon', top: [40, 62, 127], center: [56, 93, 146], bottom: [90, 89, 101], overall: [58, 80, 127] },
  { name: 'Waylay', top: [70, 96, 96], center: [109, 120, 118], bottom: [140, 115, 96], overall: [101, 109, 104] },
  { name: 'Phoenix', top: [120, 85, 55], center: [130, 90, 65], bottom: [140, 110, 75], overall: [130, 95, 65] },
  { name: 'Chamber', top: [139, 113, 103], center: [137, 103, 96], bottom: [121, 97, 93], overall: [133, 105, 98] },
  { name: 'Skye', top: [129, 107, 84], center: [144, 101, 89], bottom: [107, 81, 77], overall: [128, 98, 84] },
  { name: 'Killjoy', top: [80, 76, 57], center: [119, 90, 71], bottom: [81, 77, 54], overall: [94, 81, 61] },
  { name: 'Sage', top: [120, 105, 105], center: [130, 110, 105], bottom: [100, 95, 100], overall: [120, 105, 105] },
  { name: 'Jett', top: [155, 150, 145], center: [145, 125, 110], bottom: [110, 95, 85], overall: [138, 123, 113] },
  { name: 'Brimstone', top: [175, 135, 75], center: [118, 79, 53], bottom: [88, 84, 72], overall: [124, 99, 67] },
  { name: 'Viper', top: [141, 132, 128], center: [86, 77, 83], bottom: [93, 85, 80], overall: [109, 100, 99] },
  { name: 'Reyna', top: [95, 45, 115], center: [110, 55, 100], bottom: [70, 40, 80], overall: [90, 50, 98] },
  { name: 'Gekko', top: [110, 155, 60], center: [135, 130, 85], bottom: [80, 90, 60], overall: [110, 125, 70] },
  { name: 'KAY/O', top: [70, 110, 140], center: [60, 120, 150], bottom: [60, 80, 100], overall: [65, 100, 130] },
  { name: 'Deadlock', top: [150, 140, 120], center: [135, 115, 105], bottom: [85, 90, 95], overall: [120, 115, 105] },
  { name: 'Iso', top: [60, 55, 70], center: [120, 100, 95], bottom: [65, 55, 80], overall: [80, 70, 80] },
  { name: 'Clove', top: [150, 100, 140], center: [140, 110, 110], bottom: [100, 70, 110], overall: [130, 95, 120] },
  { name: 'Vyse', top: [110, 110, 120], center: [120, 115, 125], bottom: [80, 75, 85], overall: [100, 100, 110] },
  { name: 'Tejo', top: [120, 110, 90], center: [140, 120, 100], bottom: [90, 80, 70], overall: [110, 100, 85] },
];

function colorDist(c1: [number, number, number], c2: [number, number, number]): number {
  const dr = c1[0] - c2[0];
  const dg = c1[1] - c2[1];
  const db = c1[2] - c2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

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

// Helper to convert crop to canvas data URL with contrast and binarization options
function cropToDataUrl(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  scale = 2,
  enhanceContrast = true,
  binarizeForScore = false
): string {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  if (binarizeForScore) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      // Black text on white background binarization
      const isText = maxC > 75 && (maxC - minC > 25 || (r > 140 && g > 140 && b > 140));
      const val = isText ? 0 : 255;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (enhanceContrast) {
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

// Detect Valorant Agent accurately using exact pixel sampling without resizing distortion
function detectAgentFromImage(
  img: HTMLImageElement,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number,
  agentList: ValorantAgent[]
): { agentName: string; agentIcon?: string } | null {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, cropW);
  canvas.height = Math.max(1, cropH);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  function getPixel(x: number, y: number): [number, number, number] {
    const idx = (y * canvas.width + x) * 4;
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
    return [
      Math.round(r / Math.max(1, count)),
      Math.round(g / Math.max(1, count)),
      Math.round(b / Math.max(1, count)),
    ];
  }

  // Inset horizontal by 3px on left and right to avoid row borders
  const ix1 = 3;
  const ix2 = Math.max(ix1, canvas.width - 3);
  const topH = Math.round(canvas.height * 0.33);
  const midH = Math.round(canvas.height * 0.33);

  const feat = {
    top: getAvg(ix1, 1, ix2, topH),
    center: getAvg(ix1, topH + 1, ix2, topH + midH),
    bottom: getAvg(ix1, topH + midH + 1, ix2, canvas.height - 1),
    overall: getAvg(ix1, 1, ix2, canvas.height - 1),
  };

  let bestName: string | null = null;
  let minDist = Infinity;

  for (const sig of AGENT_SIGNATURES) {
    const dTop = colorDist(feat.top, sig.top);
    const dCenter = colorDist(feat.center, sig.center);
    const dBottom = colorDist(feat.bottom, sig.bottom);
    const dOverall = colorDist(feat.overall, sig.overall);
    const totalDist = dTop * 1.2 + dCenter * 1.3 + dBottom * 1.0 + dOverall * 1.0;

    if (totalDist < minDist) {
      minDist = totalDist;
      bestName = sig.name;
    }
  }

  if (!bestName) return null;

  let matchedAgent = agentList.find(
    (a) => a.displayName.toLowerCase() === bestName?.toLowerCase()
  );

  if (!matchedAgent) {
    matchedAgent = FALLBACK_VALORANT_AGENTS.find(
      (a) => a.displayName.toLowerCase() === bestName?.toLowerCase()
    );
  }

  return {
    agentName: matchedAgent ? matchedAgent.displayName : bestName,
    agentIcon: matchedAgent?.displayIcon,
  };
}

export const scoreboardOcrService = {
  /**
   * Process a scoreboard image:
   * 1. Extracts map and scores precisely from the top-left scoreboard outcome area
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

      // 1. Process Score & Outcome Box
      // Try Resumen tab left score box first (X: 1% to 22%, Y: 8% to 22%)
      const scoreBoxUrl = cropToDataUrl(
        img,
        Math.round(W * 0.01),
        Math.round(H * 0.08),
        Math.round(W * 0.22),
        Math.round(H * 0.14),
        3,
        false,
        true
      );
      const scoreBoxResult = await worker.recognize(scoreBoxUrl);
      const scoreBoxText = scoreBoxResult.data.text.trim();

      let detectedMap: string | undefined;
      let detectedTeamScore: number | undefined;
      let detectedOpponentScore: number | undefined;
      let detectedOutcome: 'win' | 'loss' | 'draw' | undefined;

      let scoreNumbers = scoreBoxText.match(/\d{1,2}/g)?.map(Number);
      let outcomeText = scoreBoxText;

      // If no valid score on left, check Center Score Box (Marcador tab: X: 37% to 62%, Y: 7.5% to 14.5%)
      if (!scoreNumbers || scoreNumbers.length < 2) {
        const centerScoreUrl = cropToDataUrl(
          img,
          Math.round(W * 0.37),
          Math.round(H * 0.075),
          Math.round(W * 0.25),
          Math.round(H * 0.07),
          3,
          false,
          true
        );
        const centerRes = await worker.recognize(centerScoreUrl);
        const centerText = centerRes.data.text.trim();
        const centerDigits = centerText.match(/\d{1,2}/g)?.map(Number);
        if (centerDigits && centerDigits.length >= 2) {
          scoreNumbers = centerDigits;
          outcomeText = centerText;
        }
      }

      if (scoreNumbers && scoreNumbers.length >= 2) {
        detectedTeamScore = scoreNumbers[0];
        detectedOpponentScore = scoreNumbers[1];

        const upperText = outcomeText.toUpperCase();
        if (upperText.includes('VIC')) {
          detectedOutcome = 'win';
        } else if (upperText.includes('DER') || upperText.includes('DEF')) {
          detectedOutcome = 'loss';
        } else if (upperText.includes('EMP') || upperText.includes('DRAW')) {
          detectedOutcome = 'draw';
        } else if (detectedTeamScore > detectedOpponentScore) {
          detectedOutcome = 'win';
        } else if (detectedTeamScore < detectedOpponentScore) {
          detectedOutcome = 'loss';
        } else {
          detectedOutcome = 'draw';
        }
      }

      // Check map name from top-right info crop (x: 75% to 98%, y: 2% to 18%)
      const mapCropUrl = cropToDataUrl(
        img,
        Math.round(W * 0.75),
        Math.round(H * 0.02),
        Math.round(W * 0.23),
        Math.round(H * 0.16),
        3,
        true
      );
      const mapRes = await worker.recognize(mapCropUrl);
      const mapText = mapRes.data.text;

      const matchMap = (text: string) => {
        for (const mapName of mapNames) {
          if (new RegExp(`\\b${mapName}\\b`, 'i').test(text) || similarity(text, mapName) > 0.55) {
            return mapName;
          }
        }
        return undefined;
      };

      detectedMap = matchMap(mapText);
      if (!detectedMap) {
        const topLeftMapUrl = cropToDataUrl(
          img,
          Math.round(W * 0.01),
          Math.round(H * 0.03),
          Math.round(W * 0.18),
          Math.round(H * 0.09),
          3,
          true
        );
        const tlRes = await worker.recognize(topLeftMapUrl);
        detectedMap = matchMap(tlRes.data.text);
      }

      // 2. Process Scoreboard Rows (Precise Valorant 1080p alignment)
      const startYRel = 0.3113;
      const rowStepRel = 0.04522;
      const rowHRel = 0.04174;

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
          top + 4,
          20,
          Math.max(1, height - 8)
        );

        const isFriendly = isFriendlyRow(r, g, b);

        // ONLY PROCESS OUR TEAM'S FRIENDLY PLAYERS (Cyan/Green/Blue or Gold rows)
        if (!isFriendly) {
          continue;
        }

        // Try Resumen layout first (X: 22.17%), then Marcador layout (X: 14.5%)
        let cropX = Math.round(W * 0.2217);
        let cropW = Math.round(W * 0.0234);
        let nameX = Math.round(W * 0.249);
        let nameW = Math.round(W * 0.216);
        let statsX = Math.round(W * 0.468);
        let statsW = Math.round(W * 0.342);

        const cropY = top + 2;
        const cropH = Math.max(1, height - 4);

        let detectedAgent = detectAgentFromImage(
          img,
          cropX,
          cropY,
          cropW,
          cropH,
          agentList
        );

        // If no confident agent at 22.17%, try Marcador tab layout at 14.5%
        if (!detectedAgent) {
          cropX = Math.round(W * 0.145);
          cropW = Math.round(W * 0.023);
          nameX = Math.round(W * 0.172);
          nameW = Math.round(W * 0.15);
          statsX = Math.round(W * 0.33);
          statsW = Math.round(W * 0.48);

          detectedAgent = detectAgentFromImage(
            img,
            cropX,
            cropY,
            cropW,
            cropH,
            agentList
          );
        }

        // Crop player name area
        const nameCropUrl = cropToDataUrl(
          img,
          nameX,
          top,
          nameW,
          height,
          2.5,
          true
        );
        const nameRes = await worker.recognize(nameCropUrl);
        const rawNick = nameRes.data.text.trim();
        const cleanNick = cleanPremierPrefix(rawNick);

        // Crop stats numbers
        const statsCropUrl = cropToDataUrl(
          img,
          statsX,
          top,
          statsW,
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
        rawText: scoreBoxText,
      };
    } catch (error) {
      console.error('Scoreboard OCR processing error:', error);
      throw error;
    }
  },
};
