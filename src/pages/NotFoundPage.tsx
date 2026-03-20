import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <div className="empty-state">
    <h2>Page not found</h2>
    <p>GitHub Pages fallback redirected here, but the route was not recognized.</p>
    <Link className="button primary" to="/">
      Back to dashboard
    </Link>
  </div>
);
