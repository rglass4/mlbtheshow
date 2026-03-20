import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const repoName = env.VITE_GITHUB_PAGES_REPO?.trim() ?? '';
  const customBase = env.VITE_APP_BASE_PATH?.trim();
  const base = customBase || (repoName ? `/${repoName}/` : '/');

  return {
    base,
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts'
    }
  };
});
