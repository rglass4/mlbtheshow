import { describe, expect, it } from 'vitest';
import { parseGameHtml } from './htmlParser';

const html = `
<!doctype html>
<html>
  <head>
    <title>New York Yankees 6 - 3 Los Angeles Dodgers</title>
  </head>
  <body>
    <div>gameId: 2603202401</div>
    <div>User: AceCaptain</div>
    <div>Opponent: RivalSlugger</div>
    <div>Played: March 18, 2026 10:15 PM UTC</div>
    <div>Platform: Crossplay</div>
    <div>Stadium: Laughing Mountain Park</div>
    <div>Hitting Difficulty: Hall of Fame</div>
    <div>Pitching Difficulty: Legend</div>
    <table>
      <caption>Linescore</caption>
      <tbody>
        <tr><td>User</td><td>1</td><td>0</td><td>2</td></tr>
        <tr><td>Opponent</td><td>0</td><td>0</td><td>1</td></tr>
      </tbody>
    </table>
    <table>
      <caption>Batting</caption>
      <tbody>
        <tr><td>Derek Jeter</td><td>SS</td><td>1</td><td>4</td><td>2</td><td>3</td><td>1</td><td>1</td><td>0</td><td>.750</td><td>1</td><td>0</td><td>0</td></tr>
      </tbody>
    </table>
    <table>
      <caption>Pitching</caption>
      <tbody>
        <tr><td>Gerrit Cole</td><td>6.2</td><td>5</td><td>1</td><td>1</td><td>1</td><td>9</td><td>1.35</td><td>W</td></tr>
      </tbody>
    </table>
    <ul>
      <li class="play-event">Top 1 Derek Jeter doubles to left.</li>
      <li class="play-event">Top 1 Aaron Judge singles, Derek Jeter scores.</li>
    </ul>
    <div class="perfect-perfect">Aaron Judge perfect-perfect line drive 112.4 mph.</div>
  </body>
</html>`;

describe('parseGameHtml', () => {
  it('parses box score metadata and rows', () => {
    const parsed = parseGameHtml(html, { coopPlayers: ['AceCaptain', 'ClutchLefty'], filename: 'sample.html' });

    expect(parsed.metadata.id).toBe(2603202401);
    expect(parsed.metadata.userUsername).toBe('AceCaptain');
    expect(parsed.metadata.opponentUsername).toBe('RivalSlugger');
    expect(parsed.metadata.coopPlayers).toEqual(['AceCaptain', 'ClutchLefty']);
    expect(parsed.metadata.stadium).toBe('Laughing Mountain Park');
    expect(parsed.inningLines).toHaveLength(6);
    expect(parsed.battingLines[0]?.playerName).toBe('Derek Jeter');
    expect(parsed.pitchingLines[0]?.playerName).toBe('Gerrit Cole');
    expect(parsed.playEvents).toHaveLength(2);
    expect(parsed.perfectPerfectEvents[0]?.exitVelocityMph).toBe(112.4);
  });
});
