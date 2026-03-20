import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { normalizeGithubPagesRedirect } from './lib/basePath';
import './styles/global.css';

normalizeGithubPagesRedirect();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
