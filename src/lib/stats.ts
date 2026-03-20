import type {
  BattingLeaderboardRow,
  BattingLine,
  GameMetadata,
  PitchingLeaderboardRow,
  PitchingLine,
  PlayEvent
} from '../types/stats';
import { inningsToDecimal } from './utils';

export const calcAvg = (hits: number, atBats: number): number => (atBats > 0 ? hits / atBats : 0);
export const calcObp = (hits: number, walks: number, atBats: number): number => {
  const denominator = atBats + walks;
  return denominator > 0 ? (hits + walks) / denominator : 0;
};
export const calcSlg = (hits: number, doubles = 0, triples = 0, homeRuns = 0, atBats: number): number | null => {
  if (atBats <= 0) return null;
  const singles = hits - doubles - triples - homeRuns;
  return (singles + doubles * 2 + triples * 3 + homeRuns * 4) / atBats;
};

export const calcEra = (earnedRuns: number, inningsPitched: number): number => {
  const innings = inningsToDecimal(inningsPitched);
  return innings > 0 ? (earnedRuns * 9) / innings : 0;
};
export const calcWhip = (walks: number, hits: number, inningsPitched: number): number => {
  const innings = inningsToDecimal(inningsPitched);
  return innings > 0 ? (walks + hits) / innings : 0;
};
export const calcK9 = (strikeouts: number, inningsPitched: number): number => {
  const innings = inningsToDecimal(inningsPitched);
  return innings > 0 ? (strikeouts * 9) / innings : 0;
};

export const buildBattingLeaders = (lines: BattingLine[]): BattingLeaderboardRow[] => {
  const grouped = new Map<string, BattingLeaderboardRow>();
  lines.forEach((line) => {
    const existing = grouped.get(line.playerName) ?? {
      playerName: line.playerName,
      games: 0,
      ab: 0,
      r: 0,
      h: 0,
      rbi: 0,
      bb: 0,
      so: 0,
      avg: 0,
      obp: 0,
      slg: null,
      ops: null
    };
    existing.games += 1;
    existing.ab += line.ab;
    existing.r += line.r;
    existing.h += line.h;
    existing.rbi += line.rbi;
    existing.bb += line.bb;
    existing.so += line.so;
    existing.avg = calcAvg(existing.h, existing.ab);
    existing.obp = calcObp(existing.h, existing.bb, existing.ab);
    const slg = calcSlg(existing.h, (line.doubles ?? 0), (line.triples ?? 0), (line.homeRuns ?? 0), existing.ab);
    existing.slg = slg;
    existing.ops = slg === null ? null : existing.obp + slg;
    grouped.set(line.playerName, existing);
  });
  return [...grouped.values()].sort((a, b) => b.ops! - a.ops! || b.avg - a.avg);
};

export const buildPitchingLeaders = (lines: PitchingLine[]): PitchingLeaderboardRow[] => {
  const grouped = new Map<string, PitchingLeaderboardRow>();
  lines.forEach((line) => {
    const existing = grouped.get(line.playerName) ?? {
      playerName: line.playerName,
      games: 0,
      ip: 0,
      h: 0,
      r: 0,
      er: 0,
      bb: 0,
      so: 0,
      era: 0,
      whip: 0,
      k9: 0
    };
    existing.games += 1;
    existing.ip += line.ip;
    existing.h += line.h;
    existing.r += line.r;
    existing.er += line.er;
    existing.bb += line.bb;
    existing.so += line.so;
    existing.era = calcEra(existing.er, existing.ip);
    existing.whip = calcWhip(existing.bb, existing.h, existing.ip);
    existing.k9 = calcK9(existing.so, existing.ip);
    grouped.set(line.playerName, existing);
  });
  return [...grouped.values()].sort((a, b) => a.era - b.era || b.k9 - a.k9);
};

export const lastTenRecord = (games: GameMetadata[]): string => {
  const ten = [...games].sort((a, b) => +new Date(b.playedAt) - +new Date(a.playedAt)).slice(0, 10);
  const wins = ten.filter((game) => game.result === 'W').length;
  const losses = ten.filter((game) => game.result === 'L').length;
  const ties = ten.filter((game) => game.result === 'T').length;
  return `${wins}-${losses}${ties ? `-${ties}` : ''}`;
};

export const runDifferentialSeries = (games: GameMetadata[]) =>
  [...games]
    .sort((a, b) => +new Date(a.playedAt) - +new Date(b.playedAt))
    .map((game, index) => ({
      game: index + 1,
      date: game.playedAt.slice(0, 10),
      differential: game.userScore - game.opponentScore,
      cumulativeRecord:
        games
          .slice(0, index + 1)
          .filter((candidate) => candidate.result === 'W').length -
        games.slice(0, index + 1).filter((candidate) => candidate.result === 'L').length
    }));

export const runsByGameSeries = (games: GameMetadata[]) =>
  [...games]
    .sort((a, b) => +new Date(a.playedAt) - +new Date(b.playedAt))
    .map((game) => ({ date: game.playedAt.slice(0, 10), scored: game.userScore, allowed: game.opponentScore }));

export const playerProductionSeries = (events: PlayEvent[]) =>
  events.reduce<Record<string, { player: string; runsCreated: number }>>((acc, event) => {
    const player = event.batterName ?? 'Unknown';
    acc[player] ??= { player, runsCreated: 0 };
    acc[player].runsCreated += event.runsScored + event.hits;
    return acc;
  }, {});
