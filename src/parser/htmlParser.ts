import type {
  BattingLine,
  InningLine,
  ParsedGameData,
  PerfectPerfectEvent,
  PitchingLine,
  PlayEvent,
  TeamSide
} from '../types/stats';
import { formatGameResult, parseFloatSafe, parseInteger } from '../lib/utils';

const text = (value: string | null | undefined): string => value?.replace(/\s+/g, ' ').trim() ?? '';

const firstMatch = (patterns: RegExp[], source: string): string | null => {
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1]) return text(match[1]);
  }
  return null;
};

const getCellValue = (cells: string[], index: number): string => text(cells[index] ?? '');

const inferEventType = (description: string): string | null => {
  const normalized = description.toLowerCase();
  if (normalized.includes('home run') || normalized.includes('homers')) return 'home_run';
  if (normalized.includes('doubles')) return 'double';
  if (normalized.includes('triples')) return 'triple';
  if (normalized.includes('walks')) return 'walk';
  if (normalized.includes('strikes out')) return 'strikeout';
  if (normalized.includes('singles')) return 'single';
  if (normalized.includes('grounds into a double play')) return 'double_play';
  return null;
};

const inferCountingStat = (description: string, keyword: string): number => (description.toLowerCase().includes(keyword) ? 1 : 0);

const extractTableRows = (doc: Document, labelHints: string[]): HTMLTableRowElement[] => {
  const tables = Array.from(doc.querySelectorAll('table'));
  const target = tables.find((table) => {
    const caption = text(table.caption?.textContent);
    const heading = text(table.previousElementSibling?.textContent);
    const tableText = `${caption} ${heading}`.toLowerCase();
    return labelHints.some((hint) => tableText.includes(hint.toLowerCase()));
  });

  return target ? Array.from(target.querySelectorAll('tbody tr')) : [];
};

const extractMetadata = (html: string, doc: Document, coopPlayers: string[], rawFilename?: string): ParsedGameData['metadata'] => {
  const title = text(doc.querySelector('title')?.textContent);
  const gameIdFromUrl = firstMatch([/game(?:id)?[=/:\-\s]+(\d{6,})/i], html) ?? firstMatch([/boxscore\/(\d{6,})/i], html);
  const gameId = Number.parseInt(gameIdFromUrl ?? `${Date.now()}`, 10);

  const userUsername =
    firstMatch([/user(?:name)?[\s:]+([A-Za-z0-9_\-.]+)/i, /gamertag[\s:]+([A-Za-z0-9_\-.]+)/i], html) ??
    coopPlayers[0] ??
    'Unknown User';
  const opponentUsername =
    firstMatch([/opponent(?:name)?[\s:]+([A-Za-z0-9_\-.]+)/i, /vs\.?\s+([A-Za-z0-9_\-.]+)/i], html) ??
    'Unknown Opponent';

  const teamPattern = /([A-Za-z .&'-]+)\s+(\d+)\s*[-–]\s*(\d+)\s+([A-Za-z .&'-]+)/;
  const teamMatch = title.match(teamPattern) ?? html.match(teamPattern);
  const userTeam = text(teamMatch?.[1]) || firstMatch([/user team[\s:]+([^<\n]+)/i], html) || 'User Team';
  const opponentTeam = text(teamMatch?.[4]) || firstMatch([/opponent team[\s:]+([^<\n]+)/i], html) || 'Opponent Team';
  const userScore = Number.parseInt(teamMatch?.[2] ?? `${parseInteger(firstMatch([/user score[\s:]+(\d+)/i], html)) ?? 0}`, 10);
  const opponentScore = Number.parseInt(teamMatch?.[3] ?? `${parseInteger(firstMatch([/opponent score[\s:]+(\d+)/i], html)) ?? 0}`, 10);

  const playedAtRaw =
    firstMatch([
      /(?:played|date|game time)[\s:]+([A-Z][a-z]{2,9}\.?\s+\d{1,2},\s+\d{4}[^<\n]*)/i,
      /datetime["'>:\s=]+([^"'<\n]+)/i
    ], html) ?? new Date().toISOString();
  const playedDate = new Date(playedAtRaw);
  const playedAt = Number.isNaN(playedDate.getTime()) ? new Date().toISOString() : playedDate.toISOString();

  return {
    id: Number.isFinite(gameId) ? gameId : Date.now(),
    playedAt,
    platform: firstMatch([/platform[\s:]+([^<\n]+)/i], html),
    userUsername,
    opponentUsername,
    coopPlayers,
    userTeam,
    opponentTeam,
    userScore,
    opponentScore,
    result: formatGameResult(userScore, opponentScore),
    stadium: firstMatch([/stadium[\s:]+([^<\n]+)/i], html),
    stadiumElevationFt: parseInteger(firstMatch([/elevation[^\d]*(\d[\d,]*)/i], html)),
    hittingDifficulty: firstMatch([/hitting difficulty[\s:]+([^<\n]+)/i], html),
    pitchingDifficulty: firstMatch([/pitching difficulty[\s:]+([^<\n]+)/i], html),
    weather: firstMatch([/weather[\s:]+([^<\n]+)/i], html),
    temperatureF: parseInteger(firstMatch([/temperature[^\d]*(\d+)/i], html)),
    wind: firstMatch([/wind[\s:]+([^<\n]+)/i], html),
    attendance: parseInteger(firstMatch([/attendance[^\d]*(\d[\d,]*)/i], html)),
    attendanceCapacityPct: parseFloatSafe(firstMatch([/capacity[^\d]*(\d+(?:\.\d+)?)%/i], html)),
    scheduledFirstPitch: firstMatch([/first pitch[\s:]+([^<\n]+)/i], html),
    winningPitcher: firstMatch([/winning pitcher[\s:]+([^<\n]+)/i], html),
    losingPitcher: firstMatch([/losing pitcher[\s:]+([^<\n]+)/i], html),
    winningPitcherRecord: firstMatch([/winning pitcher record[\s:]+([^<\n]+)/i], html),
    losingPitcherRecord: firstMatch([/losing pitcher record[\s:]+([^<\n]+)/i], html),
    userGameScore: parseInteger(firstMatch([/user game score[^\d]*(\d+)/i], html)),
    opponentGameScore: parseInteger(firstMatch([/opponent game score[^\d]*(\d+)/i], html)),
    rawHtmlFilename: rawFilename ?? null,
    isPublic: true
  };
};

const extractInningLines = (doc: Document): InningLine[] => {
  const rows = extractTableRows(doc, ['linescore', 'inning']);
  const inningLines: InningLine[] = [];

  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll('th,td')).map((cell) => text(cell.textContent));
    if (cells.length < 3) return;
    const sideValue = cells[0].toLowerCase();
    const teamSide: TeamSide = /user|home|you/.test(sideValue) ? 'user' : 'opponent';
    cells.slice(1).forEach((runs, index) => {
      inningLines.push({ teamSide, inning: index + 1, runs });
    });
  });

  return inningLines;
};

const extractBattingLines = (doc: Document): BattingLine[] => {
  return extractTableRows(doc, ['batting']).flatMap((row) => {
    const cells = Array.from(row.querySelectorAll('th,td')).map((cell) => text(cell.textContent));
    if (cells.length < 7) return [];
    const nameCell = getCellValue(cells, 0);
    if (!nameCell || /totals?/i.test(nameCell)) return [];

    const teamSide: TeamSide = row.closest('table')?.textContent?.toLowerCase().includes('opponent') ? 'opponent' : 'user';
    return [{
      teamSide,
      playerName: nameCell,
      position: getCellValue(cells, 1) || null,
      battingOrder: parseInteger(getCellValue(cells, 2)),
      ab: parseInteger(getCellValue(cells, 3)) ?? 0,
      r: parseInteger(getCellValue(cells, 4)) ?? 0,
      h: parseInteger(getCellValue(cells, 5)) ?? 0,
      rbi: parseInteger(getCellValue(cells, 6)) ?? 0,
      bb: parseInteger(getCellValue(cells, 7)) ?? 0,
      so: parseInteger(getCellValue(cells, 8)) ?? 0,
      avgDisplay: getCellValue(cells, 9) || null,
      doubles: parseInteger(getCellValue(cells, 10)) ?? 0,
      triples: parseInteger(getCellValue(cells, 11)) ?? 0,
      homeRuns: parseInteger(getCellValue(cells, 12)) ?? 0
    }];
  });
};

const extractPitchingLines = (doc: Document): PitchingLine[] => {
  return extractTableRows(doc, ['pitching']).flatMap((row) => {
    const cells = Array.from(row.querySelectorAll('th,td')).map((cell) => text(cell.textContent));
    if (cells.length < 7) return [];
    const nameCell = getCellValue(cells, 0);
    if (!nameCell || /totals?/i.test(nameCell)) return [];

    const teamSide: TeamSide = row.closest('table')?.textContent?.toLowerCase().includes('opponent') ? 'opponent' : 'user';
    return [{
      teamSide,
      playerName: nameCell,
      ip: parseFloatSafe(getCellValue(cells, 1)) ?? 0,
      h: parseInteger(getCellValue(cells, 2)) ?? 0,
      r: parseInteger(getCellValue(cells, 3)) ?? 0,
      er: parseInteger(getCellValue(cells, 4)) ?? 0,
      bb: parseInteger(getCellValue(cells, 5)) ?? 0,
      so: parseInteger(getCellValue(cells, 6)) ?? 0,
      eraDisplay: getCellValue(cells, 7) || null,
      decision: getCellValue(cells, 8) || null
    }];
  });
};

const extractPlayEvents = (doc: Document): PlayEvent[] => {
  const nodes = Array.from(doc.querySelectorAll('[data-play-event], .play-event, li'));
  const playEvents: PlayEvent[] = [];
  let sequenceByFrame = new Map<string, number>();

  nodes.forEach((node) => {
    const description = text(node.textContent);
    if (!description || description.length < 6) return;
    const inning = parseInteger(node.getAttribute('data-inning')) ?? parseInteger(firstMatch([/(?:top|bottom)\s+(\d+)/i], description)) ?? 1;
    const halfText = text(node.getAttribute('data-half')) || firstMatch([/(top|bottom)/i], description) || 'top';
    const half = halfText.toLowerCase() === 'bottom' ? 'bottom' : 'top';
    const key = `${inning}-${half}`;
    const nextSeq = (sequenceByFrame.get(key) ?? 0) + 1;
    sequenceByFrame.set(key, nextSeq);

    playEvents.push({
      inning,
      half,
      battingTeamSide: half === 'top' ? 'user' : 'opponent',
      sequenceNum: nextSeq,
      description,
      runsScored: (description.match(/scores?/gi) ?? []).length,
      hits: inferCountingStat(description, 'single') + inferCountingStat(description, 'double') + inferCountingStat(description, 'triple') + inferCountingStat(description, 'home run'),
      walks: inferCountingStat(description, 'walk'),
      errors: inferCountingStat(description, 'error'),
      eventType: inferEventType(description),
      batterName: firstMatch([/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/], description),
      pitcherName: firstMatch([/off\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/], description)
    });
  });

  return playEvents;
};

const extractPerfectPerfectEvents = (doc: Document): PerfectPerfectEvent[] => {
  const nodes = Array.from(doc.querySelectorAll('[data-perfect-perfect], .perfect-perfect, .exit-velo'));
  return nodes.flatMap((node) => {
    const description = text(node.textContent);
    if (!description || !/perfect/i.test(description)) return [];
    return [{
      teamSide: /opponent/i.test(node.closest('section,table,div')?.textContent ?? '') ? 'opponent' : 'user',
      playerName: firstMatch([/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/], description) ?? 'Unknown Player',
      exitVelocityMph: parseFloatSafe(firstMatch([/(\d+(?:\.\d+)?)\s*mph/i], description)),
      description
    }];
  });
};

export const parseGameHtml = (html: string, options?: { coopPlayers?: string[]; filename?: string }): ParsedGameData => {
  const coopPlayers = (options?.coopPlayers ?? []).map(text).filter(Boolean);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const metadata = extractMetadata(html, doc, coopPlayers, options?.filename);
  const inningLines = extractInningLines(doc);
  const battingLines = extractBattingLines(doc);
  const pitchingLines = extractPitchingLines(doc);
  const playEvents = extractPlayEvents(doc);
  const perfectPerfectEvents = extractPerfectPerfectEvents(doc);
  const notes: string[] = [];

  if (!inningLines.length) notes.push('No inning lines found; parser fell back to summary fields only.');
  if (!battingLines.length) notes.push('No batting rows found. Check table headings in the saved HTML.');
  if (!pitchingLines.length) notes.push('No pitching rows found. Check table headings in the saved HTML.');

  return { metadata, inningLines, battingLines, pitchingLines, playEvents, perfectPerfectEvents, notes };
};
