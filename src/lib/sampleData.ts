import type { ParsedGameData } from '../types/stats';

export const sampleParsedGame: ParsedGameData = {
  metadata: {
    id: 2603202401,
    playedAt: '2026-03-18T22:15:00Z',
    platform: 'Crossplay',
    userUsername: 'AceCaptain',
    opponentUsername: 'RivalSlugger',
    coopPlayers: ['AceCaptain', 'ClutchLefty'],
    userTeam: 'New York Yankees',
    opponentTeam: 'Los Angeles Dodgers',
    userScore: 6,
    opponentScore: 3,
    result: 'W',
    stadium: 'Laughing Mountain Park',
    stadiumElevationFt: 5280,
    hittingDifficulty: 'Hall of Fame',
    pitchingDifficulty: 'Legend',
    weather: 'Clear',
    temperatureF: 72,
    wind: '5 mph Out to LF',
    attendance: 18244,
    attendanceCapacityPct: 96.2,
    scheduledFirstPitch: '8:15 PM',
    winningPitcher: 'Gerrit Cole',
    losingPitcher: 'Walker Buehler',
    winningPitcherRecord: '1-0',
    losingPitcherRecord: '0-1',
    userGameScore: 87,
    opponentGameScore: 71,
    rawHtmlFilename: 'sample-show26-boxscore.html',
    isPublic: true
  },
  inningLines: [
    { teamSide: 'user', inning: 1, runs: '1' },
    { teamSide: 'user', inning: 2, runs: '0' },
    { teamSide: 'user', inning: 3, runs: '2' },
    { teamSide: 'user', inning: 4, runs: '0' },
    { teamSide: 'user', inning: 5, runs: '0' },
    { teamSide: 'user', inning: 6, runs: '1' },
    { teamSide: 'user', inning: 7, runs: '2' },
    { teamSide: 'opponent', inning: 1, runs: '0' },
    { teamSide: 'opponent', inning: 2, runs: '0' },
    { teamSide: 'opponent', inning: 3, runs: '1' },
    { teamSide: 'opponent', inning: 4, runs: '0' },
    { teamSide: 'opponent', inning: 5, runs: '0' },
    { teamSide: 'opponent', inning: 6, runs: '0' },
    { teamSide: 'opponent', inning: 7, runs: '2' }
  ],
  battingLines: [
    { teamSide: 'user', playerName: 'Derek Jeter', position: 'SS', battingOrder: 1, ab: 4, r: 2, h: 3, rbi: 1, bb: 1, so: 0, avgDisplay: '.750', doubles: 1, triples: 0, homeRuns: 0 },
    { teamSide: 'user', playerName: 'Aaron Judge', position: 'RF', battingOrder: 2, ab: 4, r: 1, h: 2, rbi: 3, bb: 0, so: 1, avgDisplay: '.500', doubles: 0, triples: 0, homeRuns: 1 },
    { teamSide: 'opponent', playerName: 'Mookie Betts', position: 'RF', battingOrder: 1, ab: 4, r: 1, h: 1, rbi: 0, bb: 0, so: 1, avgDisplay: '.250', doubles: 0, triples: 0, homeRuns: 0 }
  ],
  pitchingLines: [
    { teamSide: 'user', playerName: 'Gerrit Cole', ip: 6.2, h: 5, r: 1, er: 1, bb: 1, so: 9, eraDisplay: '1.35', decision: 'W' },
    { teamSide: 'opponent', playerName: 'Walker Buehler', ip: 5.1, h: 7, r: 4, er: 4, bb: 2, so: 5, eraDisplay: '6.75', decision: 'L' }
  ],
  playEvents: [
    { inning: 1, half: 'top', battingTeamSide: 'user', sequenceNum: 1, description: 'Derek Jeter doubles to left.', runsScored: 0, hits: 1, walks: 0, errors: 0, eventType: 'double', batterName: 'Derek Jeter', pitcherName: 'Walker Buehler' },
    { inning: 1, half: 'top', battingTeamSide: 'user', sequenceNum: 2, description: 'Aaron Judge singles, Derek Jeter scores.', runsScored: 1, hits: 1, walks: 0, errors: 0, eventType: 'single', batterName: 'Aaron Judge', pitcherName: 'Walker Buehler' },
    { inning: 7, half: 'bottom', battingTeamSide: 'opponent', sequenceNum: 1, description: 'Two-run homer to left-center.', runsScored: 2, hits: 1, walks: 0, errors: 0, eventType: 'home_run', batterName: 'Freddie Freeman', pitcherName: 'Mariano Rivera' }
  ],
  perfectPerfectEvents: [
    { teamSide: 'user', playerName: 'Aaron Judge', exitVelocityMph: 112.4, description: 'Perfect-perfect home run to left field.' }
  ],
  notes: ['Sample data is shown until Supabase has imported games.']
};
