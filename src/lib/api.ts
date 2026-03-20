import { sampleParsedGame } from './sampleData';
import { buildBattingLeaders, buildPitchingLeaders } from './stats';
import { supabase } from './supabase';
import type { BattingLine, ParsedGameData, PitchingLine, DashboardSnapshot, GameMetadata } from '../types/stats';

const sampleGames: GameMetadata[] = [sampleParsedGame.metadata];
const sampleBatting = sampleParsedGame.battingLines;
const samplePitching = sampleParsedGame.pitchingLines;

export const fetchDashboardSnapshot = async (): Promise<DashboardSnapshot> => {
  if (!supabase) {
    return {
      games: sampleGames,
      recentGames: sampleGames,
      battingLeaders: buildBattingLeaders(sampleBatting),
      pitchingLeaders: buildPitchingLeaders(samplePitching)
    };
  }

  const { data: games, error } = await supabase
    .from('games')
    .select('*')
    .eq('is_public', true)
    .order('played_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  const normalizedGames = (games ?? []).map((game) => ({
    id: game.id,
    playedAt: game.played_at,
    platform: game.platform,
    userUsername: game.user_username,
    opponentUsername: game.opponent_username,
    coopPlayers: game.coop_players ?? [game.user_username],
    userTeam: game.user_team,
    opponentTeam: game.opponent_team,
    userScore: game.user_score,
    opponentScore: game.opponent_score,
    result: game.result,
    stadium: game.stadium,
    stadiumElevationFt: game.stadium_elevation_ft,
    hittingDifficulty: game.hitting_difficulty,
    pitchingDifficulty: game.pitching_difficulty,
    weather: game.weather,
    temperatureF: game.temperature_f,
    wind: game.wind,
    attendance: game.attendance,
    attendanceCapacityPct: game.attendance_capacity_pct,
    scheduledFirstPitch: game.scheduled_first_pitch,
    winningPitcher: game.winning_pitcher,
    losingPitcher: game.losing_pitcher,
    winningPitcherRecord: game.winning_pitcher_record,
    losingPitcherRecord: game.losing_pitcher_record,
    userGameScore: game.user_game_score,
    opponentGameScore: game.opponent_game_score,
    rawHtmlFilename: game.raw_html_filename,
    isPublic: game.is_public
  } satisfies GameMetadata));

  const { data: batting } = await supabase.from('v_batting_leaders').select('*').limit(20);
  const { data: pitching } = await supabase.from('v_pitching_leaders').select('*').limit(20);

  return {
    games: normalizedGames,
    recentGames: normalizedGames.slice(0, 10),
    battingLeaders:
      batting?.map((row) => ({
        playerName: String(row.player_name),
        games: Number(row.games),
        ab: Number(row.ab),
        r: Number(row.r),
        h: Number(row.h),
        rbi: Number(row.rbi),
        bb: Number(row.bb),
        so: Number(row.so),
        avg: Number(row.avg),
        obp: Number(row.obp),
        slg: row.slg === null ? null : Number(row.slg),
        ops: row.ops === null ? null : Number(row.ops)
      })) ?? buildBattingLeaders(sampleBatting),
    pitchingLeaders:
      pitching?.map((row) => ({
        playerName: String(row.player_name),
        games: Number(row.games),
        ip: Number(row.ip),
        h: Number(row.h),
        r: Number(row.r),
        er: Number(row.er),
        bb: Number(row.bb),
        so: Number(row.so),
        era: Number(row.era),
        whip: Number(row.whip),
        k9: Number(row.k9)
      })) ?? buildPitchingLeaders(samplePitching)
  };
};

export const fetchGameDetail = async (gameId: number): Promise<ParsedGameData> => {
  if (!supabase || gameId === sampleParsedGame.metadata.id) return sampleParsedGame;

  const [{ data: game }, { data: inningLines }, { data: battingLines }, { data: pitchingLines }, { data: playEvents }, { data: perfectEvents }] =
    await Promise.all([
      supabase.from('games').select('*').eq('id', gameId).single(),
      supabase.from('inning_lines').select('*').eq('game_id', gameId).order('inning'),
      supabase.from('batting_lines').select('*').eq('game_id', gameId),
      supabase.from('pitching_lines').select('*').eq('game_id', gameId),
      supabase.from('play_events').select('*').eq('game_id', gameId).order('inning').order('sequence_num'),
      supabase.from('perfect_perfect_events').select('*').eq('game_id', gameId)
    ]);

  if (!game) throw new Error(`Game ${gameId} not found`);

  return {
    metadata: {
      id: game.id,
      playedAt: game.played_at,
      platform: game.platform,
      userUsername: game.user_username,
      opponentUsername: game.opponent_username,
      coopPlayers: game.coop_players ?? [game.user_username],
      userTeam: game.user_team,
      opponentTeam: game.opponent_team,
      userScore: game.user_score,
      opponentScore: game.opponent_score,
      result: game.result,
      stadium: game.stadium,
      stadiumElevationFt: game.stadium_elevation_ft,
      hittingDifficulty: game.hitting_difficulty,
      pitchingDifficulty: game.pitching_difficulty,
      weather: game.weather,
      temperatureF: game.temperature_f,
      wind: game.wind,
      attendance: game.attendance,
      attendanceCapacityPct: game.attendance_capacity_pct,
      scheduledFirstPitch: game.scheduled_first_pitch,
      winningPitcher: game.winning_pitcher,
      losingPitcher: game.losing_pitcher,
      winningPitcherRecord: game.winning_pitcher_record,
      losingPitcherRecord: game.losing_pitcher_record,
      userGameScore: game.user_game_score,
      opponentGameScore: game.opponent_game_score,
      rawHtmlFilename: game.raw_html_filename,
      isPublic: game.is_public
    },
    inningLines: (inningLines ?? []).map((row) => ({ teamSide: row.team_side, inning: row.inning, runs: row.runs })) as any,
    battingLines: battingLines as unknown as BattingLine[],
    pitchingLines: pitchingLines as unknown as PitchingLine[],
    playEvents: playEvents as any,
    perfectPerfectEvents: perfectEvents as any,
    notes: []
  };
};

export const saveImportedGame = async (parsed: ParsedGameData, uploadedBy?: string | null): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase environment variables are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { data: existing } = await supabase.from('games').select('id').eq('id', parsed.metadata.id).maybeSingle();
  if (existing) throw new Error(`Game ${parsed.metadata.id} already exists.`);

  const gameInsert = {
    id: parsed.metadata.id,
    played_at: parsed.metadata.playedAt,
    platform: parsed.metadata.platform ?? null,
    user_username: parsed.metadata.userUsername,
    opponent_username: parsed.metadata.opponentUsername,
    user_team: parsed.metadata.userTeam,
    opponent_team: parsed.metadata.opponentTeam,
    user_score: parsed.metadata.userScore,
    opponent_score: parsed.metadata.opponentScore,
    result: parsed.metadata.result,
    stadium: parsed.metadata.stadium ?? null,
    stadium_elevation_ft: parsed.metadata.stadiumElevationFt ?? null,
    hitting_difficulty: parsed.metadata.hittingDifficulty ?? null,
    pitching_difficulty: parsed.metadata.pitchingDifficulty ?? null,
    weather: parsed.metadata.weather ?? null,
    temperature_f: parsed.metadata.temperatureF ?? null,
    wind: parsed.metadata.wind ?? null,
    attendance: parsed.metadata.attendance ?? null,
    attendance_capacity_pct: parsed.metadata.attendanceCapacityPct ?? null,
    scheduled_first_pitch: parsed.metadata.scheduledFirstPitch ?? null,
    winning_pitcher: parsed.metadata.winningPitcher ?? null,
    losing_pitcher: parsed.metadata.losingPitcher ?? null,
    winning_pitcher_record: parsed.metadata.winningPitcherRecord ?? null,
    losing_pitcher_record: parsed.metadata.losingPitcherRecord ?? null,
    user_game_score: parsed.metadata.userGameScore ?? null,
    opponent_game_score: parsed.metadata.opponentGameScore ?? null,
    raw_html_filename: parsed.metadata.rawHtmlFilename ?? null,
    created_by: uploadedBy ?? null,
    is_public: parsed.metadata.isPublic ?? true,
    coop_players: parsed.metadata.coopPlayers
  };

  const { error: gameError } = await supabase.from('games').insert(gameInsert);
  if (gameError) throw gameError;

  const inserts = [
    parsed.inningLines.length
      ? supabase.from('inning_lines').insert(parsed.inningLines.map((line) => ({ game_id: parsed.metadata.id, team_side: line.teamSide, inning: line.inning, runs: line.runs })))
      : Promise.resolve({ error: null }),
    parsed.battingLines.length
      ? supabase.from('batting_lines').insert(parsed.battingLines.map((line) => ({ game_id: parsed.metadata.id, team_side: line.teamSide, player_name: line.playerName, position: line.position ?? null, batting_order: line.battingOrder ?? null, ab: line.ab, r: line.r, h: line.h, rbi: line.rbi, bb: line.bb, so: line.so, avg_display: line.avgDisplay ?? null })))
      : Promise.resolve({ error: null }),
    parsed.pitchingLines.length
      ? supabase.from('pitching_lines').insert(parsed.pitchingLines.map((line) => ({ game_id: parsed.metadata.id, team_side: line.teamSide, player_name: line.playerName, ip: line.ip, h: line.h, r: line.r, er: line.er, bb: line.bb, so: line.so, era_display: line.eraDisplay ?? null, decision: line.decision ?? null })))
      : Promise.resolve({ error: null }),
    parsed.playEvents.length
      ? supabase.from('play_events').insert(parsed.playEvents.map((event) => ({ game_id: parsed.metadata.id, inning: event.inning, half: event.half, batting_team_side: event.battingTeamSide, sequence_num: event.sequenceNum, description: event.description, runs_scored: event.runsScored, hits: event.hits, walks: event.walks, errors: event.errors, pitches: event.pitches ?? null, runners_left_on: event.runnersLeftOn ?? null, event_type: event.eventType ?? null, batter_name: event.batterName ?? null, pitcher_name: event.pitcherName ?? null })))
      : Promise.resolve({ error: null }),
    parsed.perfectPerfectEvents.length
      ? supabase.from('perfect_perfect_events').insert(parsed.perfectPerfectEvents.map((event) => ({ game_id: parsed.metadata.id, team_side: event.teamSide, player_name: event.playerName, exit_velocity_mph: event.exitVelocityMph ?? null, description: event.description })))
      : Promise.resolve({ error: null })
  ];

  const results = await Promise.all(inserts);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
};
