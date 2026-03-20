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

const TZ_OFFSETS: Record<string, string> = {
  UTC: '+00:00',
  CDT: '-05:00',
  CST: '-06:00',
  EDT: '-04:00',
  EST: '-05:00',
  PDT: '-07:00',
  PST: '-08:00'
};

const firstMatch = (patterns: RegExp[], source: string): string | null => {
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1]) return text(match[1]);
  }
  return null;
};

const normalizeSentence = (value: string): string =>
  value
    .replace(/\*+/g, '')
    .replace(/&trade;/gi, '™')
    .replace(/[ 	]+/g, ' ')
    .replace(/ *\n+ */g, '\n')
    .trim();

const slugName = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const parseDateWithTimezone = (value: string | null): string => {
  if (!value) return new Date().toISOString();
  const normalized = value.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})(AM|PM)\s+([A-Z]{2,4})$/i);
  if (!match) {
    const fallback = new Date(normalized);
    return Number.isNaN(fallback.getTime()) ? new Date().toISOString() : fallback.toISOString();
  }

  const [, datePart, timePart, meridiem, zone] = match;
  const [month, day, year] = datePart.split('/').map(Number);
  let [hours, minutes] = timePart.split(':').map(Number);
  if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
  const offset = TZ_OFFSETS[zone.toUpperCase()] ?? '+00:00';
  const iso = `${year.toString().padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00${offset}`;
  return new Date(iso).toISOString();
};

const extractGameId = (html: string): number => {
  const id = firstMatch([/page_path'\s*:\s*"\/games\/(\d+)"/i, /\/games\/(\d+)/i], html);
  const parsed = Number.parseInt(id ?? `${Date.now()}`, 10);
  return Number.isFinite(parsed) ? parsed : Date.now();
};

interface SummaryRow {
  teamName: string;
  username: string;
  platform: string | null;
  result: string;
  inningRuns: string[];
  runs: number;
  hits: number;
  errors: number;
}

const extractSummaryRows = (doc: Document): SummaryRow[] => {
  const section = Array.from(doc.querySelectorAll('.page-body > .section-block')).find((node) =>
    text(node.querySelector('h2')?.textContent).includes('VS')
  );
  const table = section?.querySelector('table');
  if (!table) return [];

  return Array.from(table.querySelectorAll('tbody tr')).flatMap((row) => {
    const cells = Array.from(row.querySelectorAll('th,td'));
    if (cells.length < 10) return [];
    const username = text(row.querySelector('a[href*="/universal_profiles/"]')?.textContent);
    const platform = row.querySelector('img.leaderboard-platform')?.getAttribute('alt');
    const values = cells.map((cell) => text(cell.textContent));
    const teamName = values[1];
    const result = values[3];
    if (!username || !teamName) return [];
    const totals = values.slice(-3);
    const inningRuns = values.slice(4, -3);

    return [{
      teamName,
      username,
      platform: platform ? platform.toUpperCase() : null,
      result,
      inningRuns,
      runs: parseInteger(totals[0]) ?? 0,
      hits: parseInteger(totals[1]) ?? 0,
      errors: parseInteger(totals[2]) ?? 0
    }];
  });
};

const parsePitcherLine = (summaryText: string, label: 'W' | 'L') => {
  const match = summaryText.match(new RegExp(`${label}:\\s*([^,(]+)\\s*\\(([^)]+)\\)`, 'i'));
  if (!match) return { pitcher: null, record: null };
  return { pitcher: text(match[1]), record: text(match[2]) };
};

const extractMetadata = (html: string, doc: Document, coopPlayers: string[], rawFilename?: string): ParsedGameData['metadata'] => {
  const summarySection = Array.from(doc.querySelectorAll('.page-body > .section-block')).find((node) =>
    text(node.querySelector('h2')?.textContent).includes('VS')
  );
  const links = Array.from(summarySection?.querySelectorAll('h2 a') ?? []);
  const userUsername = text(links[0]?.textContent) || coopPlayers[0] || 'Unknown User';
  const opponentUsername = text(links[1]?.textContent) || 'Unknown Opponent';
  const summaryWell = summarySection?.querySelector('.well');
  const wellText = text(summaryWell?.textContent);
  const dateLine = text(summaryWell?.childNodes[2]?.textContent) || firstMatch([/(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}(?:AM|PM)\s+[A-Z]{2,4})/], wellText);
  const playedAt = parseDateWithTimezone(dateLine);
  const summaryRows = extractSummaryRows(doc);
  const userRow = summaryRows.find((row) => row.username === userUsername) ?? summaryRows[1] ?? summaryRows[0];
  const opponentRow = summaryRows.find((row) => row.username === opponentUsername) ?? summaryRows.find((row) => row !== userRow) ?? summaryRows[0];
  const pitchers = parsePitcherLine(wellText, 'W');
  const losingPitcher = parsePitcherLine(wellText, 'L');
  const detailText = extractSectionText(extractGameLogSection(doc));
  const gameScoreMatch = detailText.match(/Game Scores:\s*(\d+)\s*\(([^)]+)\),\s*(\d+)\s*\(([^)]+)\)/i);

  return {
    id: extractGameId(html),
    playedAt,
    platform: userRow?.platform ?? null,
    userUsername,
    opponentUsername,
    coopPlayers,
    userTeam: userRow?.teamName ?? 'User Team',
    opponentTeam: opponentRow?.teamName ?? 'Opponent Team',
    userScore: userRow?.runs ?? 0,
    opponentScore: opponentRow?.runs ?? 0,
    result: formatGameResult(userRow?.runs ?? 0, opponentRow?.runs ?? 0),
    stadium: firstMatch([/Perfect-Perfect\)\s*([^\n]+?)\s*\((\d[\d,]*)\s*ft elevation\)/i, /([A-Za-z0-9 .&'™-]+)\s*\((\d[\d,]*)\s*ft elevation\)/i], detailText),
    stadiumElevationFt: parseInteger(firstMatch([/\((\d[\d,]*)\s*ft elevation\)/i], detailText)),
    hittingDifficulty: firstMatch([/Hitting Difficulty is\s+([^\.]+)\./i], detailText),
    pitchingDifficulty: firstMatch([/Pitching Difficulty is\s+([^\.]+)\./i], detailText),
    weather: firstMatch([/Weather:\s*\d+\s*degrees,\s*([^\n.]+)/i], detailText),
    temperatureF: parseInteger(firstMatch([/Weather:\s*(\d+)\s*degrees/i], detailText)),
    wind: firstMatch([/(No Wind|[\w\s-]+ Wind)/i], detailText),
    attendance: parseInteger(firstMatch([/Maximum attendance:\s*(\d[\d,]*)/i], detailText)),
    attendanceCapacityPct: parseFloatSafe(firstMatch([/\((\d+(?:\.\d+)?)%\s*capacity\)/i], detailText)),
    scheduledFirstPitch: firstMatch([/Scheduled First Pitch:\s*([^\n]+)/i], detailText),
    winningPitcher: pitchers.pitcher,
    losingPitcher: losingPitcher.pitcher,
    winningPitcherRecord: pitchers.record,
    losingPitcherRecord: losingPitcher.record,
    userGameScore:
      gameScoreMatch && slugName(gameScoreMatch[2]) === slugName(pitchers.pitcher ?? '')
        ? parseInteger(gameScoreMatch[1])
        : gameScoreMatch && slugName(gameScoreMatch[4]) === slugName(pitchers.pitcher ?? '')
          ? parseInteger(gameScoreMatch[3])
          : parseInteger(gameScoreMatch?.[1]),
    opponentGameScore:
      gameScoreMatch && slugName(gameScoreMatch[2]) === slugName(losingPitcher.pitcher ?? '')
        ? parseInteger(gameScoreMatch[1])
        : gameScoreMatch && slugName(gameScoreMatch[4]) === slugName(losingPitcher.pitcher ?? '')
          ? parseInteger(gameScoreMatch[3])
          : parseInteger(gameScoreMatch?.[3]),
    rawHtmlFilename: rawFilename ?? null,
    isPublic: true
  };
};

const sideFromTeam = (teamName: string, metadata: ParsedGameData['metadata']): TeamSide =>
  teamName === metadata.userTeam ? 'user' : 'opponent';

const extractInningLines = (doc: Document, metadata: ParsedGameData['metadata']): InningLine[] =>
  extractSummaryRows(doc).flatMap((row) =>
    row.inningRuns.map((runs, index) => ({
      teamSide: sideFromTeam(row.teamName, metadata),
      inning: index + 1,
      runs
    }))
  );

const parseBatterCell = (value: string): Pick<BattingLine, 'playerName' | 'position'> => {
  const trimmed = text(value);
  const lastComma = trimmed.lastIndexOf(',');
  if (lastComma === -1) return { playerName: trimmed, position: null };
  return {
    playerName: trimmed.slice(0, lastComma).trim(),
    position: trimmed.slice(lastComma + 1).trim() || null
  };
};

const extractBoxscoreSections = (doc: Document) =>
  Array.from(doc.querySelectorAll('.boxscore .boxscore-box .section-block')).map((section) => ({
    section,
    heading: text(section.querySelector('h3')?.textContent),
    tables: Array.from(section.querySelectorAll('table'))
  }));

const extractBattingLines = (doc: Document, metadata: ParsedGameData['metadata']): BattingLine[] =>
  extractBoxscoreSections(doc).flatMap(({ heading, tables }) => {
    const battingTable = tables.find((table) => text(table.querySelector('thead')?.textContent).includes('Batter'));
    if (!battingTable) return [];
    const teamSide = sideFromTeam(heading, metadata);

    return Array.from(battingTable.querySelectorAll('tbody tr')).flatMap((row, index) => {
      if (row.classList.contains('totals')) return [];
      const cells = Array.from(row.querySelectorAll('td')).map((cell) => text(cell.textContent));
      if (cells.length < 8) return [];
      const batter = parseBatterCell(cells[0]);
      return [{
        teamSide,
        playerName: batter.playerName,
        position: batter.position,
        battingOrder: index + 1,
        ab: parseInteger(cells[1]) ?? 0,
        r: parseInteger(cells[2]) ?? 0,
        h: parseInteger(cells[3]) ?? 0,
        rbi: parseInteger(cells[4]) ?? 0,
        bb: parseInteger(cells[5]) ?? 0,
        so: parseInteger(cells[6]) ?? 0,
        avgDisplay: cells[7] || null,
        doubles: 0,
        triples: 0,
        homeRuns: 0
      }];
    });
  });

const extractPitchingLines = (doc: Document, metadata: ParsedGameData['metadata']): PitchingLine[] =>
  extractBoxscoreSections(doc).flatMap(({ heading, tables }) => {
    const pitchingTable = tables.find((table) => text(table.querySelector('thead')?.textContent).includes('Pitcher'));
    if (!pitchingTable) return [];
    const teamSide = sideFromTeam(heading, metadata);

    return Array.from(pitchingTable.querySelectorAll('tbody tr')).flatMap((row) => {
      if (row.classList.contains('totals')) return [];
      const cells = Array.from(row.querySelectorAll('td')).map((cell) => text(cell.textContent));
      if (cells.length < 8) return [];
      const nameMatch = cells[0].match(/^(.*?)\s*\(([^)]+)\)$/);
      return [{
        teamSide,
        playerName: text(nameMatch?.[1] ?? cells[0]),
        ip: parseFloatSafe(cells[1]) ?? 0,
        h: parseInteger(cells[2]) ?? 0,
        r: parseInteger(cells[3]) ?? 0,
        er: parseInteger(cells[4]) ?? 0,
        bb: parseInteger(cells[5]) ?? 0,
        so: parseInteger(cells[6]) ?? 0,
        eraDisplay: cells[7] || null,
        decision: text(nameMatch?.[2] ?? '') || null
      }];
    });
  });

const extractGameLogSection = (doc: Document): HTMLElement | null =>
  (Array.from(doc.querySelectorAll('.section-block')).find((node) => text(node.querySelector('h3')?.textContent) === 'Game Log') as HTMLElement | undefined) ?? null;

const extractSectionText = (section: HTMLElement | null): string => {
  if (!section) return '';
  const container = document.createElement('div');
  container.innerHTML = section.innerHTML
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '');
  return normalizeSentence(container.textContent ?? '');
};

const inferBatterName = (description: string): string | null => {
  const match = description.match(/^(.+?)\s+(?:grounded|flied|lined|struck|doubled|tripled|homered|popped|bunted|hit|reached|walked|was|stole)/i);
  return text(match?.[1]) || null;
};

const parseHalfInningEvents = (segment: string, inning: number, half: 'top' | 'bottom', metadata: ParsedGameData['metadata']): PlayEvent[] => {
  const match = segment.match(/^([^\.]+) batting\.\s+([^\.]+) pitching\.\s+([\s\S]+?)Runs:\s*(\d+)\s+Hits:\s*(\d+)\s+Walks:\s*(\d+)\s+Errors:\s*(\d+)\s+Pitches:\s*(\d+)(?:\s+Runners Left On:\s*(\d+))?/i);
  if (!match) return [];

  const teamName = text(match[1]);
  const pitcherName = text(match[2]);
  const narrative = text(match[3]);
  const runsScored = parseInteger(match[4]) ?? 0;
  const hits = parseInteger(match[5]) ?? 0;
  const walks = parseInteger(match[6]) ?? 0;
  const errors = parseInteger(match[7]) ?? 0;
  const pitches = parseInteger(match[8]);
  const runnersLeftOn = parseInteger(match[9]);
  const battingTeamSide = sideFromTeam(teamName, metadata);

  const rawSentences = narrative
    .split(/\.\s+/)
    .map((entry) => normalizeSentence(entry.endsWith('.') ? entry : `${entry}.`))
    .filter(Boolean);

  let activePitcher = pitcherName;
  const events = rawSentences.flatMap((description) => {
    const pitchingChange = description.match(/^([A-Za-z .']+) pitching\.$/);
    if (pitchingChange) {
      activePitcher = text(pitchingChange[1]);
      return [];
    }

    return [{
      inning,
      half,
      battingTeamSide,
      sequenceNum: 0,
      description,
      runsScored: 0,
      hits: 0,
      walks: 0,
      errors: 0,
      pitches: null,
      runnersLeftOn: null,
      eventType: inferEventType(description),
      batterName: inferBatterName(description),
      pitcherName: activePitcher
    } satisfies PlayEvent];
  });

  return events.map((event, index) => ({
    ...event,
    sequenceNum: index + 1,
    runsScored: index === events.length - 1 ? runsScored : 0,
    hits: index === events.length - 1 ? hits : 0,
    walks: index === events.length - 1 ? walks : 0,
    errors: index === events.length - 1 ? errors : 0,
    pitches: index === events.length - 1 ? pitches : null,
    runnersLeftOn: index === events.length - 1 ? runnersLeftOn : null
  }));
};

const extractPlayEvents = (doc: Document, metadata: ParsedGameData['metadata']): PlayEvent[] => {
  const section = extractGameLogSection(doc);
  if (!section) return [];
  const content = extractSectionText(section);
  const logBody = content.split('Game Log Legend')[0] ?? content;
  const inningParts = logBody.split(/Inning\s+(\d+):/i);
  const events: PlayEvent[] = [];

  for (let index = 1; index < inningParts.length; index += 2) {
    const inning = parseInteger(inningParts[index]) ?? 0;
    const body = inningParts[index + 1] ?? '';
    const segments = body
      .split(/(?=(?:Nightmares|Mustangs|[A-Za-z0-9 .&'™-]+) batting\.)/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    segments.forEach((segment, segmentIndex) => {
      const half = segmentIndex === 0 ? 'top' : 'bottom';
      events.push(...parseHalfInningEvents(segment, inning, half, metadata));
    });
  }

  return events;
};

const extractPerfectPerfectEvents = (
  doc: Document,
  metadata: ParsedGameData['metadata'],
  battingLines: BattingLine[]
): PerfectPerfectEvent[] => {
  const section = extractGameLogSection(doc);
  if (!section) return [];
  const content = extractSectionText(section);
  const perfectSection = content.split('Perfect Contact Hits (Perfect-Perfect)')[1]?.split(metadata.stadium ?? 'Online Game')[0] ?? '';
  const battingMap = new Map(battingLines.map((line) => [slugName(line.playerName), line.teamSide]));

  return perfectSection
    .split(/\n+/)
    .map((line) => normalizeSentence(line))
    .filter((line) => /:\s*\d+\s*mph/i.test(line))
    .flatMap((line) => {
      const match = line.match(/^([^:]+):\s*(\d+(?:\.\d+)?)\s*mph\s*\((.+)\)$/i);
      if (!match) return [];
      const playerName = text(match[1]);
      return [{
        teamSide: battingMap.get(slugName(playerName)) ?? 'user',
        playerName,
        exitVelocityMph: parseFloatSafe(match[2]),
        description: normalizeSentence(match[3])
      }];
    });
};

const applyDerivedBattingStats = (battingLines: BattingLine[], playEvents: PlayEvent[]): BattingLine[] => {
  const extras = new Map<string, { doubles: number; triples: number; homeRuns: number }>();
  playEvents.forEach((event) => {
    const batterName = event.batterName ? slugName(event.batterName.replace(/\.$/, '')) : '';
    if (!batterName) return;
    const current = extras.get(batterName) ?? { doubles: 0, triples: 0, homeRuns: 0 };
    if (event.eventType === 'double') current.doubles += 1;
    if (event.eventType === 'triple') current.triples += 1;
    if (event.eventType === 'home_run') current.homeRuns += 1;
    extras.set(batterName, current);
  });

  return battingLines.map((line) => ({ ...line, ...(extras.get(slugName(line.playerName)) ?? {}) }));
};

const inferEventType = (description: string): string | null => {
  const normalized = description.toLowerCase();
  if (normalized.includes('homered') || normalized.includes('home run')) return 'home_run';
  if (normalized.includes('doubled')) return 'double';
  if (normalized.includes('tripled')) return 'triple';
  if (normalized.includes('walk')) return 'walk';
  if (normalized.includes('struck out')) return 'strikeout';
  if (normalized.includes('single')) return 'single';
  if (normalized.includes('double play')) return 'double_play';
  if (normalized.includes('sacrifice fly')) return 'sac_fly';
  if (normalized.includes('fielder\'s choice')) return 'fielders_choice';
  return null;
};

export const parseGameHtml = (html: string, options?: { coopPlayers?: string[]; filename?: string }): ParsedGameData => {
  const coopPlayers = (options?.coopPlayers ?? []).map(text).filter(Boolean);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const metadata = extractMetadata(html, doc, coopPlayers, options?.filename);
  const inningLines = extractInningLines(doc, metadata);
  const rawBattingLines = extractBattingLines(doc, metadata);
  const pitchingLines = extractPitchingLines(doc, metadata);
  const playEvents = extractPlayEvents(doc, metadata);
  const battingLines = applyDerivedBattingStats(rawBattingLines, playEvents);
  const perfectPerfectEvents = extractPerfectPerfectEvents(doc, metadata, battingLines);
  const notes: string[] = [];

  if (!inningLines.length) notes.push('No inning lines found in the game log summary table.');
  if (!battingLines.length) notes.push('No batting rows found in boxscore tables.');
  if (!pitchingLines.length) notes.push('No pitching rows found in boxscore tables.');
  if (!playEvents.length) notes.push('No play-by-play events found in the Game Log section.');

  return { metadata, inningLines, battingLines, pitchingLines, playEvents, perfectPerfectEvents, notes };
};
