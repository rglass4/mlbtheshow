import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { getBasePath } from './lib/basePath';
import { BattingPage } from './pages/BattingPage';
import { GameDetailPage } from './pages/GameDetailPage';
import { GamesPage } from './pages/GamesPage';
import { HomePage } from './pages/HomePage';
import { ImportPage } from './pages/ImportPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PitchingPage } from './pages/PitchingPage';
import { PlayerDetailPage } from './pages/PlayerDetailPage';
import { PlayersPage } from './pages/PlayersPage';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'games', element: <GamesPage /> },
        { path: 'games/:gameId', element: <GameDetailPage /> },
        { path: 'batting', element: <BattingPage /> },
        { path: 'pitching', element: <PitchingPage /> },
        { path: 'players', element: <PlayersPage /> },
        { path: 'players/:playerName', element: <PlayerDetailPage /> },
        { path: 'import', element: <ImportPage /> },
        { path: '*', element: <NotFoundPage /> }
      ]
    }
  ],
  { basename: getBasePath() }
);

export const App = () => <RouterProvider router={router} />;
