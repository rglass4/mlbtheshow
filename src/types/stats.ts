export type TeamSide = 'user' | 'opponent';
export type GameResult = 'W' | 'L' | 'T';
export type EventHalf = 'top' | 'bottom';

export interface GameMetadata {
  id: number;
  playedAt: string;
  platform?: string | null;
  userUsername: string;
  opponentUsername: string;
  coopPlayers: string[];
  userTeam: string;
  opponentTeam: string;
  userScore: number;
  opponentScore: number;
  result: GameResult;
  stadium?: string | null;
  stadiumElevationFt?: number | null;
  hittingDifficulty?: string | null;
  pitchingDifficulty?: string | null;
  weather?: string | null;
  temperatureF?: number | null;
  wind?: string | null;
  attendance?: number | null;
  attendanceCapacityPct?: number | null;
  scheduledFirstPitch?: string | null;
  winningPitcher?: string | null;
  losingPitcher?: string | null;
  winningPitcherRecord?: string | null;
  losingPitcherRecord?: string | null;
  userGameScore?: number | null;
  opponentGameScore?: number | null;
  rawHtmlFilename?: string | null;
  isPublic?: boolean;
}

export interface InningLine {
  teamSide: TeamSide;
  inning: number;
  runs: string;
}

export interface BattingLine {
  teamSide: TeamSide;
  playerName: string;
  position?: string | null;
  battingOrder?: number | null;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  avgDisplay?: string | null;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
}

export interface PitchingLine {
  teamSide: TeamSide;
  playerName: string;
  ip: number;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  eraDisplay?: string | null;
  decision?: string | null;
}

export interface PlayEvent {
  inning: number;
  half: EventHalf;
  battingTeamSide: TeamSide;
  sequenceNum: number;
  description: string;
  runsScored: number;
  hits: number;
  walks: number;
  errors: number;
  pitches?: number | null;
  runnersLeftOn?: number | null;
  eventType?: string | null;
  batterName?: string | null;
  pitcherName?: string | null;
}

export interface PerfectPerfectEvent {
  teamSide: TeamSide;
  playerName: string;
  exitVelocityMph?: number | null;
  description: string;
}

export interface ParsedGameData {
  metadata: GameMetadata;
  inningLines: InningLine[];
  battingLines: BattingLine[];
  pitchingLines: PitchingLine[];
  playEvents: PlayEvent[];
  perfectPerfectEvents: PerfectPerfectEvent[];
  notes: string[];
}

export interface DateFilter {
  start?: string;
  end?: string;
}

export interface BattingLeaderboardRow {
  playerName: string;
  games: number;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  avg: number;
  obp: number;
  slg?: number | null;
  ops?: number | null;
}

export interface PitchingLeaderboardRow {
  playerName: string;
  games: number;
  ip: number;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  era: number;
  whip: number;
  k9: number;
}

export interface DashboardSnapshot {
  games: GameMetadata[];
  recentGames: GameMetadata[];
  battingLeaders: BattingLeaderboardRow[];
  pitchingLeaders: PitchingLeaderboardRow[];
}
