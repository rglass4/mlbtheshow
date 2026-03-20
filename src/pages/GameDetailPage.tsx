import { useParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useAsync } from '../hooks/useAsync';
import { fetchGameDetail } from '../lib/api';

export const GameDetailPage = () => {
  const params = useParams();
  const gameId = Number(params.gameId);
  const { data, loading, error } = useAsync(() => fetchGameDetail(gameId), [gameId]);

  if (loading) return <LoadingState label="Loading game detail…" />;
  if (error || !data) return <ErrorState message={error ?? 'Unable to load game detail'} />;

  const notableLines = data.battingLines
    .filter((line) => line.teamSide === 'user')
    .sort((a, b) => b.h + b.rbi - (a.h + a.rbi))
    .slice(0, 2)
    .map((line) => `${line.playerName}: ${line.h} H, ${line.rbi} RBI`);

  return (
    <div className="page-stack">
      <section className="hero-card compact">
        <div>
          <p className="eyebrow">Game #{data.metadata.id}</p>
          <h2>
            {data.metadata.userTeam} {data.metadata.userScore} - {data.metadata.opponentScore} {data.metadata.opponentTeam}
          </h2>
          <p>
            {new Date(data.metadata.playedAt).toLocaleString()} · {data.metadata.stadium ?? 'Unknown stadium'} · {data.metadata.weather ?? 'Indoor'}
          </p>
        </div>
        <div className="badge-grid">
          <span className={`pill ${data.metadata.result === 'W' ? 'win' : 'loss'}`}>{data.metadata.result}</span>
          {notableLines.map((line) => (
            <span key={line} className="pill info">
              {line}
            </span>
          ))}
        </div>
      </section>

      <div className="dashboard-grid two-up">
        <Card title="Game context" subtitle="Park, weather, attendance, and scores">
          <dl className="detail-grid">
            <div><dt>Platform</dt><dd>{data.metadata.platform ?? '--'}</dd></div>
            <div><dt>Players</dt><dd>{data.metadata.coopPlayers.join(', ') || data.metadata.userUsername}</dd></div>
            <div><dt>Difficulty</dt><dd>{data.metadata.hittingDifficulty ?? '--'} / {data.metadata.pitchingDifficulty ?? '--'}</dd></div>
            <div><dt>Attendance</dt><dd>{data.metadata.attendance?.toLocaleString() ?? '--'}</dd></div>
            <div><dt>Temperature</dt><dd>{data.metadata.temperatureF ? `${data.metadata.temperatureF}°F` : '--'}</dd></div>
            <div><dt>Game scores</dt><dd>{data.metadata.userGameScore ?? '--'} / {data.metadata.opponentGameScore ?? '--'}</dd></div>
          </dl>
        </Card>

        <Card title="Linescore" subtitle="Inning-by-inning breakdown">
          <div className="linescore-grid">
            {['user', 'opponent'].map((teamSide) => (
              <div key={teamSide}>
                <strong>{teamSide === 'user' ? data.metadata.userTeam : data.metadata.opponentTeam}</strong>
                <div className="linescore-row">
                  {data.inningLines
                    .filter((line) => line.teamSide === teamSide)
                    .map((line) => (
                      <span key={`${teamSide}-${line.inning}`}>{line.runs}</span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="dashboard-grid two-up">
        <Card title="Batting" subtitle="Both teams">
          <DataTable
            rows={data.battingLines}
            emptyMessage="No batting lines parsed for this game."
            search={(row) => `${row.playerName} ${row.teamSide}`}
            columns={[
              { key: 'team', header: 'Side', render: (row) => row.teamSide },
              { key: 'name', header: 'Player', render: (row) => row.playerName },
              { key: 'pos', header: 'Pos', render: (row) => row.position ?? '--' },
              { key: 'ab', header: 'AB', render: (row) => row.ab, sortValue: (row) => row.ab },
              { key: 'h', header: 'H', render: (row) => row.h, sortValue: (row) => row.h },
              { key: 'rbi', header: 'RBI', render: (row) => row.rbi, sortValue: (row) => row.rbi },
              { key: 'avg', header: 'AVG', render: (row) => row.avgDisplay ?? '--' }
            ]}
          />
        </Card>
        <Card title="Pitching" subtitle="Both teams">
          <DataTable
            rows={data.pitchingLines}
            emptyMessage="No pitching lines parsed for this game."
            search={(row) => `${row.playerName} ${row.teamSide}`}
            columns={[
              { key: 'team', header: 'Side', render: (row) => row.teamSide },
              { key: 'name', header: 'Pitcher', render: (row) => row.playerName },
              { key: 'ip', header: 'IP', render: (row) => row.ip, sortValue: (row) => row.ip },
              { key: 'h', header: 'H', render: (row) => row.h, sortValue: (row) => row.h },
              { key: 'er', header: 'ER', render: (row) => row.er, sortValue: (row) => row.er },
              { key: 'bb', header: 'BB', render: (row) => row.bb, sortValue: (row) => row.bb },
              { key: 'so', header: 'SO', render: (row) => row.so, sortValue: (row) => row.so },
              { key: 'decision', header: 'Decision', render: (row) => row.decision ?? '--' }
            ]}
          />
        </Card>
      </div>

      <div className="dashboard-grid two-up">
        <Card title="Play-by-play" subtitle="Full parsed event log">
          <div className="timeline">
            {data.playEvents.length ? (
              data.playEvents.map((event) => (
                <article key={`${event.inning}-${event.half}-${event.sequenceNum}`} className="timeline-item">
                  <header>
                    <strong>
                      {event.half} {event.inning}.{event.sequenceNum}
                    </strong>
                    <span>{event.eventType ?? 'event'}</span>
                  </header>
                  <p>{event.description}</p>
                </article>
              ))
            ) : (
              <div className="empty-state small">No play events parsed from this file yet.</div>
            )}
          </div>
        </Card>
        <Card title="Perfect-perfect events" subtitle="Hard-hit highlights">
          <div className="timeline">
            {data.perfectPerfectEvents.length ? (
              data.perfectPerfectEvents.map((event, index) => (
                <article key={`${event.playerName}-${index}`} className="timeline-item">
                  <header>
                    <strong>{event.playerName}</strong>
                    <span>{event.exitVelocityMph ? `${event.exitVelocityMph} mph` : 'EV unavailable'}</span>
                  </header>
                  <p>{event.description}</p>
                </article>
              ))
            ) : (
              <div className="empty-state small">No perfect-perfect events found.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
