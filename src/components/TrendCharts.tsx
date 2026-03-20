import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { GameMetadata, PlayEvent } from '../types/stats';
import { playerProductionSeries, runDifferentialSeries, runsByGameSeries } from '../lib/stats';
import { Card } from './Card';

export const TrendCharts = ({ games, playEvents }: { games: GameMetadata[]; playEvents: PlayEvent[] }) => {
  const runsSeries = runsByGameSeries(games);
  const differentialSeries = runDifferentialSeries(games);
  const productionSeries = Object.values(playerProductionSeries(playEvents)).sort((a, b) => b.runsCreated - a.runsCreated).slice(0, 8);

  return (
    <div className="chart-grid">
      <Card title="Runs by game" subtitle="Scored vs allowed over time">
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={runsSeries}>
              <CartesianGrid stroke="#1f304d" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#95a8c6" />
              <YAxis stroke="#95a8c6" />
              <Tooltip />
              <Legend />
              <Bar dataKey="scored" fill="#3fb950" radius={[6, 6, 0, 0]} />
              <Bar dataKey="allowed" fill="#ff7b72" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Run differential" subtitle="With cumulative record trend">
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={differentialSeries}>
              <CartesianGrid stroke="#1f304d" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#95a8c6" />
              <YAxis stroke="#95a8c6" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="differential" stroke="#6cb6ff" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="cumulativeRecord" stroke="#d2a8ff" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Top player production" subtitle="Derived from play-by-play events">
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={productionSeries} layout="vertical" margin={{ left: 12, right: 12 }}>
              <CartesianGrid stroke="#1f304d" strokeDasharray="3 3" />
              <XAxis type="number" stroke="#95a8c6" />
              <YAxis type="category" dataKey="player" stroke="#95a8c6" width={100} />
              <Tooltip />
              <Bar dataKey="runsCreated" fill="#f2cc60" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
