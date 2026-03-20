import { NavLink, Outlet } from 'react-router-dom';
import { getBasePath } from '../lib/basePath';

const links = [
  ['Dashboard', '/'],
  ['Games', '/games'],
  ['Batting', '/batting'],
  ['Pitching', '/pitching'],
  ['Players', '/players'],
  ['Import', '/import']
] as const;

export const Layout = () => (
  <div className="app-shell">
    <aside className="sidebar">
      <div>
        <p className="eyebrow">MLB The Show 26</p>
        <h1>Co-op Tracker</h1>
        <p className="sidebar-copy">Static React + Supabase stack built for GitHub Pages deployments.</p>
      </div>
      <nav className="nav-list" aria-label="Primary">
        {links.map(([label, to]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footnote">
        <span>Base path:</span>
        <code>{getBasePath() || '/'}</code>
      </div>
    </aside>
    <main className="main-content">
      <Outlet />
    </main>
  </div>
);
