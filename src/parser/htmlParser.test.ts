import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseGameHtml } from './htmlParser';

const html = readFileSync(new URL('./fixtures/mlb26-game-sample.html', import.meta.url), 'utf8');

describe('parseGameHtml', () => {
  it('parses real MLB The Show 26 game metadata and box score sections', () => {
    const parsed = parseGameHtml(html, {
      coopPlayers: ['PraiseTheSunSon', 'TeammateOne'],
      filename: 'mlb26-game-sample.html'
    });

    expect(parsed.metadata.id).toBe(86146624);
    expect(parsed.metadata.userUsername).toBe('PraiseTheSunSon');
    expect(parsed.metadata.opponentUsername).toBe('Scrappy8121');
    expect(parsed.metadata.platform).toBe('PSN');
    expect(parsed.metadata.userTeam).toBe('Mustangs');
    expect(parsed.metadata.opponentTeam).toBe('Nightmares');
    expect(parsed.metadata.userScore).toBe(9);
    expect(parsed.metadata.opponentScore).toBe(2);
    expect(parsed.metadata.result).toBe('W');
    expect(parsed.metadata.stadium).toContain('PNC Park');
    expect(parsed.metadata.stadiumElevationFt).toBe(730);
    expect(parsed.metadata.hittingDifficulty).toBe('Veteran');
    expect(parsed.metadata.pitchingDifficulty).toBe('Veteran');
    expect(parsed.metadata.weather).toBe('Clear');
    expect(parsed.metadata.temperatureF).toBe(66);
    expect(parsed.metadata.attendance).toBe(22770);
    expect(parsed.metadata.attendanceCapacityPct).toBe(59);
    expect(parsed.metadata.scheduledFirstPitch).toBe('7:00pm');
    expect(parsed.metadata.winningPitcher).toBe('Eduardo Rodriguez');
    expect(parsed.metadata.losingPitcher).toBe('Shohei Ohtani');
  });

  it('parses inning lines, batting/pitching lines, play events, and perfect-perfect events', () => {
    const parsed = parseGameHtml(html, { coopPlayers: ['PraiseTheSunSon', 'TeammateOne'] });

    expect(parsed.inningLines.filter((line) => line.teamSide === 'user')).toHaveLength(9);
    expect(parsed.battingLines).toHaveLength(18);
    expect(parsed.pitchingLines).toHaveLength(7);
    expect(parsed.playEvents.length).toBeGreaterThan(50);
    expect(parsed.perfectPerfectEvents).toHaveLength(4);

    const witt = parsed.battingLines.find((line) => line.playerName === 'Witt Jr.');
    const raleigh = parsed.perfectPerfectEvents.find((event) => event.playerName === 'Raleigh');
    const finalUserEvent = parsed.playEvents.find((event) => event.description.includes('Raleigh homered to right'));

    expect(witt?.homeRuns).toBe(1);
    expect(witt?.rbi).toBe(4);
    expect(raleigh?.exitVelocityMph).toBe(112);
    expect(finalUserEvent?.battingTeamSide).toBe('user');
    expect(parsed.notes).toEqual([]);
  });
});
