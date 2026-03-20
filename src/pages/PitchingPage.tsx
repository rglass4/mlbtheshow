import { Card } from '../components/Card';
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useAsync } from '../hooks/useAsync';
import { fetchDashboardSnapshot } from '../lib/api';
import { formatOneDecimal } from '../lib/utils';

export const PitchingPage = () => {
  const { data, loading, error } = useAsync(fetchDashboardSnapshot, []);

  if (loading) return <LoadingState label="Loading pitching leaders…" />;
  if (error || !data) return <ErrorState message={error ?? 'Unable to load pitching leaders'} />;

  return (
    <div className="page-stack">
      <Card title="Pitching leaderboard" subtitle="ERA, WHIP, and K/9 are computed from imported pitching lines.">
        <DataTable
          rows={data.pitchingLeaders}
          emptyMessage="Import at least one game to see pitching leaders."
          search={(row) => row.playerName}
          columns={[
            { key: 'player', header: 'Pitcher', render: (row) => row.playerName },
            { key: 'games', header: 'G', render: (row) => row.games, sortValue: (row) => row.games },
            { key: 'ip', header: 'IP', render: (row) => formatOneDecimal(row.ip), sortValue: (row) => row.ip },
            { key: 'h', header: 'H', render: (row) => row.h, sortValue: (row) => row.h },
            { key: 'er', header: 'ER', render: (row) => row.er, sortValue: (row) => row.er },
            { key: 'bb', header: 'BB', render: (row) => row.bb, sortValue: (row) => row.bb },
            { key: 'so', header: 'SO', render: (row) => row.so, sortValue: (row) => row.so },
            { key: 'era', header: 'ERA', render: (row) => formatOneDecimal(row.era), sortValue: (row) => row.era },
            { key: 'whip', header: 'WHIP', render: (row) => formatOneDecimal(row.whip), sortValue: (row) => row.whip },
            { key: 'k9', header: 'K/9', render: (row) => formatOneDecimal(row.k9), sortValue: (row) => row.k9 }
          ]}
        />
      </Card>
    </div>
  );
};
