import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useAsync } from '../hooks/useAsync';
import { fetchDashboardSnapshot, fetchGameDetail } from '../lib/api';
import { formatOneDecimal, formatPct } from '../lib/utils';

export const PlayerDetailPage = () => {
  const params = useParams();
  const playerName = decodeURIComponent(params.playerName ?? '');
  const { data, loading, error } = useAsync(fetchDashboardSnapshot, []);
  const gameDetail = useAsync(() => fetchGameDetail(2603202401), []);

  const battingLine = useMemo(() => data?.battingLeaders.find((row) => row.playerName === playerName), [data, playerName]);
  const pitchingLine = useMemo(() => data?.pitchingLeaders.find((row) => row.playerName === playerName), [data, playerName]);
  const gameLog = (gameDetail.data?.battingLines ?? []).filter((line) => line.playerName === playerName);

  if (loading || gameDetail.loading) return <LoadingState label="Loading player page…" />;
  if (error || !data) return <ErrorState message={error ?? 'Unable to load player page'} />;
  if (!battingLine && !pitchingLine) return <ErrorState message={`No stats found for ${playerName}.`} />;

  return (
    <div className="page-stack">
      <section className="hero-card compact">
        <div>
          <p className="eyebrow">Player snapshot</p>
          <h2>{playerName}</h2>
          <p>Best games, trend placeholders, and per-game performance from imported data.</p>
        </div>
      </section>
      <div className="stats-grid">
        {battingLine ? <div className="stat-card"><span>AVG</span><strong>{formatPct(battingLine.avg)}</strong><small>{battingLine.ab} AB</small></div> : null}
        {battingLine ? <div className="stat-card"><span>OPS</span><strong>{battingLine.ops !== null ? formatPct(battingLine.ops) : '--'}</strong><small>{battingLine.rbi} RBI</small></div> : null}
        {pitchingLine ? <div className="stat-card"><span>ERA</span><strong>{formatOneDecimal(pitchingLine.era)}</strong><small>{formatOneDecimal(pitchingLine.ip)} IP</small></div> : null}
        {pitchingLine ? <div className="stat-card"><span>K/9</span><strong>{formatOneDecimal(pitchingLine.k9)}</strong><small>{formatOneDecimal(pitchingLine.whip)} WHIP</small></div> : null}
      </div>
      <Card title="Game log" subtitle="Sample structure; connect to v_player_game_log for live multi-game detail.">
        <DataTable
          rows={gameLog}
          emptyMessage="No batting game log rows found yet for this player."
          columns={[
            { key: 'ab', header: 'AB', render: (row) => row.ab, sortValue: (row) => row.ab },
            { key: 'hits', header: 'H', render: (row) => row.h, sortValue: (row) => row.h },
            { key: 'rbi', header: 'RBI', render: (row) => row.rbi, sortValue: (row) => row.rbi },
            { key: 'avg', header: 'AVG', render: (row) => row.avgDisplay ?? '--' }
          ]}
        />
      </Card>
    </div>
  );
};
