import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useAsync } from '../hooks/useAsync';
import { fetchDashboardSnapshot } from '../lib/api';

export const PlayersPage = () => {
  const { data, loading, error } = useAsync(fetchDashboardSnapshot, []);

  if (loading) return <LoadingState label="Loading player list…" />;
  if (error || !data) return <ErrorState message={error ?? 'Unable to load player list'} />;

  return (
    <div className="page-stack">
      <Card title="Players" subtitle="Unified directory of hitters and pitchers. Click through for profile detail.">
        <DataTable
          rows={data.battingLeaders}
          emptyMessage="Import a game to generate player pages."
          search={(row) => row.playerName}
          columns={[
            {
              key: 'name',
              header: 'Player',
              render: (row) => <Link to={`/players/${encodeURIComponent(row.playerName)}`}>{row.playerName}</Link>,
              sortValue: (row) => row.playerName
            },
            { key: 'games', header: 'Games', render: (row) => row.games, sortValue: (row) => row.games },
            { key: 'hits', header: 'Hits', render: (row) => row.h, sortValue: (row) => row.h },
            { key: 'rbi', header: 'RBI', render: (row) => row.rbi, sortValue: (row) => row.rbi }
          ]}
        />
      </Card>
    </div>
  );
};
