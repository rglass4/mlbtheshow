import { Card } from '../components/Card';
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useAsync } from '../hooks/useAsync';
import { fetchDashboardSnapshot } from '../lib/api';
import { formatPct } from '../lib/utils';

export const BattingPage = () => {
  const { data, loading, error } = useAsync(fetchDashboardSnapshot, []);

  if (loading) return <LoadingState label="Loading batting leaders…" />;
  if (error || !data) return <ErrorState message={error ?? 'Unable to load batting leaders'} />;

  return (
    <div className="page-stack">
      <Card title="Batting leaderboard" subtitle="Filter by query now; add date range and min AB to Supabase views later.">
        <DataTable
          rows={data.battingLeaders}
          emptyMessage="Import at least one game to see batting leaders."
          search={(row) => row.playerName}
          columns={[
            { key: 'player', header: 'Player', render: (row) => row.playerName },
            { key: 'games', header: 'G', render: (row) => row.games, sortValue: (row) => row.games },
            { key: 'ab', header: 'AB', render: (row) => row.ab, sortValue: (row) => row.ab },
            { key: 'h', header: 'H', render: (row) => row.h, sortValue: (row) => row.h },
            { key: 'rbi', header: 'RBI', render: (row) => row.rbi, sortValue: (row) => row.rbi },
            { key: 'avg', header: 'AVG', render: (row) => formatPct(row.avg), sortValue: (row) => row.avg },
            { key: 'obp', header: 'OBP', render: (row) => formatPct(row.obp), sortValue: (row) => row.obp },
            { key: 'slg', header: 'SLG', render: (row) => (row.slg !== null ? formatPct(row.slg) : '--'), sortValue: (row) => row.slg ?? -1 },
            { key: 'ops', header: 'OPS', render: (row) => (row.ops !== null ? formatPct(row.ops) : '--'), sortValue: (row) => row.ops ?? -1 }
          ]}
        />
      </Card>
    </div>
  );
};
