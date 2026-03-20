import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useAsync } from '../hooks/useAsync';
import { fetchDashboardSnapshot } from '../lib/api';

export const GamesPage = () => {
  const { data, loading, error } = useAsync(fetchDashboardSnapshot, []);

  if (loading) return <LoadingState label="Loading games…" />;
  if (error || !data) return <ErrorState message={error ?? 'Unable to load games'} />;

  return (
    <div className="page-stack">
      <Card title="Game log" subtitle="Paginate in Supabase later; this scaffold ships with flexible sorting and filtering.">
        <DataTable
          rows={data.games}
          emptyMessage="No games imported yet."
          search={(row) => `${row.userTeam} ${row.opponentTeam} ${row.stadium ?? ''} ${row.opponentUsername}`}
          columns={[
            { key: 'date', header: 'Date', render: (row) => new Date(row.playedAt).toLocaleDateString(), sortValue: (row) => row.playedAt },
            {
              key: 'matchup',
              header: 'Matchup',
              render: (row) => (
                <Link to={`/games/${row.id}`} className="table-link">
                  {row.userTeam} vs {row.opponentTeam}
                </Link>
              ),
              sortValue: (row) => `${row.userTeam}-${row.opponentTeam}`
            },
            { key: 'score', header: 'Score', render: (row) => `${row.userScore}-${row.opponentScore}`, sortValue: (row) => row.userScore - row.opponentScore },
            { key: 'result', header: 'W/L', render: (row) => row.result, sortValue: (row) => row.result },
            { key: 'opponent', header: 'Opponent', render: (row) => row.opponentUsername, sortValue: (row) => row.opponentUsername },
            { key: 'stadium', header: 'Stadium', render: (row) => row.stadium ?? '--', sortValue: (row) => row.stadium ?? '' },
            { key: 'difficulty', header: 'Difficulty', render: (row) => `${row.hittingDifficulty ?? '--'} / ${row.pitchingDifficulty ?? '--'}` }
          ]}
        />
      </Card>
    </div>
  );
};
