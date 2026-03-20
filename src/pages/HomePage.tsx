import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { StatCard } from '../components/StatCard';
import { TrendCharts } from '../components/TrendCharts';
import { useAsync } from '../hooks/useAsync';
import { fetchDashboardSnapshot } from '../lib/api';
import { sampleParsedGame } from '../lib/sampleData';
import { formatPct, formatOneDecimal } from '../lib/utils';
import { lastTenRecord } from '../lib/stats';

export const HomePage = () => {
  const { data, loading, error } = useAsync(fetchDashboardSnapshot, []);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? 'Unable to load dashboard'} />;

  const totalWins = data.games.filter((game) => game.result === 'W').length;
  const totalLosses = data.games.filter((game) => game.result === 'L').length;
  const runsScored = data.games.reduce((sum, game) => sum + game.userScore, 0);
  const runsAllowed = data.games.reduce((sum, game) => sum + game.opponentScore, 0);

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Co-op control center</p>
          <h2>Track MLB The Show 26 box scores without a custom backend.</h2>
          <p>
            GitHub Pages-compatible React frontend, Supabase auth/data, and an in-browser importer for saved HTML box score pages.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="button primary" to="/import">
            Import game HTML
          </Link>
          <Link className="button secondary" to="/games">
            Browse game log
          </Link>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard label="Overall record" value={`${totalWins}-${totalLosses}`} hint={`${data.games.length} games tracked`} />
        <StatCard label="Runs scored" value={`${runsScored}`} hint={`${formatOneDecimal(runsScored / Math.max(data.games.length, 1))} per game`} />
        <StatCard label="Runs allowed" value={`${runsAllowed}`} hint={`${formatOneDecimal(runsAllowed / Math.max(data.games.length, 1))} per game`} />
        <StatCard label="Last 10" value={lastTenRecord(data.games)} hint="Recent form" />
      </div>

      <div className="dashboard-grid">
        <Card title="Recent games" subtitle="Quick access to your latest uploads">
          <div className="list-stack">
            {data.recentGames.map((game) => (
              <Link key={game.id} to={`/games/${game.id}`} className="list-row">
                <div>
                  <strong>
                    {game.userTeam} {game.userScore} - {game.opponentScore} {game.opponentTeam}
                  </strong>
                  <span>
                    {new Date(game.playedAt).toLocaleDateString()} · {game.stadium ?? 'Unknown stadium'}
                  </span>
                </div>
                <span className={`pill ${game.result === 'W' ? 'win' : game.result === 'L' ? 'loss' : ''}`}>{game.result}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Top hitters" subtitle="Public batting leaderboard snapshot">
          <div className="leader-list">
            {data.battingLeaders.slice(0, 5).map((player) => (
              <Link key={player.playerName} to={`/players/${encodeURIComponent(player.playerName)}`} className="leader-row">
                <div>
                  <strong>{player.playerName}</strong>
                  <span>{player.games} G</span>
                </div>
                <div>
                  <strong>{formatPct(player.avg)}</strong>
                  <span>OPS {player.ops !== null ? formatPct(player.ops) : '--'}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Top pitchers" subtitle="Keep tabs on your best arms">
          <div className="leader-list">
            {data.pitchingLeaders.slice(0, 5).map((player) => (
              <Link key={player.playerName} to={`/players/${encodeURIComponent(player.playerName)}`} className="leader-row">
                <div>
                  <strong>{player.playerName}</strong>
                  <span>{player.games} G</span>
                </div>
                <div>
                  <strong>{formatOneDecimal(player.era)}</strong>
                  <span>K/9 {formatOneDecimal(player.k9)}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <TrendCharts games={data.games} playEvents={sampleParsedGame.playEvents} />
    </div>
  );
};
