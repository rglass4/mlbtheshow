# MLB The Show 26 Co-op Tracker

Static, production-ready MLB The Show 26 co-op stat tracking site built with **Vite + React + TypeScript** for the frontend, **Supabase** for data/auth/storage, and **GitHub Pages** for hosting.

## What this scaffold includes

- Dark sports-dashboard UI with responsive cards, tables, trend charts, and friendly empty states.
- GitHub Pages-safe SPA routing with repository-subpath basename support and a `404.html` redirect fallback.
- Supabase client integration using the official `@supabase/supabase-js` SDK.
- In-browser HTML upload/import flow using `DOMParser` with typed parser output and duplicate game protection.
- Core app sections: dashboard, games, game detail, batting leaders, pitching leaders, players, and import page.
- Supabase SQL migration with schema, indexes, views, RLS, and policies.
- GitHub Actions workflow to build and deploy to GitHub Pages.
- Parser unit test scaffold with Vitest.

## Project structure

```text
src/
  components/
  hooks/
  lib/
  pages/
  parser/
  styles/
  types/
supabase/
  migrations/
  seed.sql
.github/workflows/
public/
```

## Local development

1. Copy `.env.example` to `.env`.
2. Fill in your Supabase values:

```bash
cp .env.example .env
```

Required variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GITHUB_PAGES_REPO=mlbtheshow
```

Optional override:

```env
VITE_APP_BASE_PATH=/mlbtheshow/
```

3. Install dependencies:

```bash
npm install
```

4. Start the app locally:

```bash
npm run dev
```

5. Run tests:

```bash
npm run test
```

## Supabase setup

1. Create a new Supabase project.
2. In the Supabase SQL editor, run the migration in `supabase/migrations/20260320160000_initial_schema.sql`.
3. Optional: run `supabase/seed.sql` for one sample game.
4. In **Authentication**, enable **Email** provider for email/password auth.
5. Add your frontend domain(s) to Supabase Auth redirect URLs:
   - local: `http://localhost:5173`
   - GitHub Pages: `https://<username>.github.io/<repo>/`
6. If you want admin overrides, add `is_admin: true` to the user `app_metadata` or use the service role in trusted workflows only.
7. Optional storage: create a bucket like `raw-html` if you want to preserve uploaded files, but the app does not require storage to function.

## GitHub Pages deployment

This project is designed to work on both:
- root domains, and
- repository pages such as `https://<username>.github.io/<repo>/`

### Required GitHub settings

1. Push this repository to GitHub.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. Add repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Ensure the default branch or deployment branch is one of the workflow trigger branches, or update `.github/workflows/deploy-pages.yml`. The workflow uses `npm install` so it does not depend on a checked-in lockfile.

### Why refreshes won’t break

GitHub Pages does not natively support SPA route rewrites. This scaffold handles that by:
- building with a repository-aware `base` value in `vite.config.ts`,
- using a repository-aware React Router `basename`, and
- shipping `public/404.html`, which redirects unknown deep links back into the SPA using a `?p=` query pattern.

### Custom domains

A custom domain is optional. If you use one, you can:
- set `VITE_APP_BASE_PATH=/`, or
- omit `VITE_GITHUB_PAGES_REPO` if your app is served from the root.

If you later add a `CNAME`, GitHub Pages will still work with this routing approach.

## How to import a game

1. Go to the **Import** page.
2. Enter **2–3 co-op player usernames**.
3. Upload a saved MLB The Show box score HTML file.
4. The parser previews:
   - metadata
   - inning lines
   - batting rows
   - pitching rows
   - play-by-play events
   - perfect-perfect events
5. Review the counts and notes.
6. Save to Supabase.
7. The app prevents duplicates by checking `games.id` before insert.

## Parser notes

The parser is intentionally modular and defensive:
- it uses `DOMParser` in-browser,
- it extracts typed sections separately,
- it tolerates missing fields,
- and it is now targeted to the current MLB The Show 26 saved-game structure from `theshow.com`, including the summary block, boxscore tables, game log narrative, perfect-perfect section, and stadium metadata.

Current parser assumptions:
- the saved HTML includes the `/games/<id>` path in inline scripts or markup,
- the first `.page-body > .section-block` is the summary/linescore card,
- the `.boxscore` area contains two team blocks with batting and pitching tables,
- and the final `Game Log` section preserves inning markers plus the `Perfect Contact Hits (Perfect-Perfect)` block.

If the upstream HTML changes, you can update the isolated parser logic and fixture-backed tests without changing the rest of the UI.

## Setup checklist

- [ ] Create Supabase project.
- [ ] Run the schema migration.
- [ ] Enable Email auth.
- [ ] Add `.env` with Supabase URL and anon key.
- [ ] Push repo to GitHub.
- [ ] Add GitHub Actions secrets.
- [ ] Enable GitHub Pages via GitHub Actions.
- [ ] Upload one saved MLB The Show HTML file.
- [ ] Verify the game appears in **Games**.
- [ ] Verify game detail, batting leaders, and pitching leaders render correctly.

## Future enhancements

- Opponent records page.
- Co-op teammate combination splits.
- Stadium splits and park factors.
- Public/private share controls per game import.
- Auth UI for sign-in/sign-up and import ownership management.
- Supabase Storage-backed raw HTML archive with re-parse support.
- Better date range / minimum threshold filters wired directly into SQL RPCs or views.
- More advanced play-event classification for extra-base hits, RBIs, leverage moments, and notable game badges.
- Dark/light theme toggle.

## Assumptions made

- You want a static-only architecture with no custom API server.
- Public visitors should be able to view rows where `games.is_public = true`.
- Imported HTML structure matches the current MLB The Show 26 game-log page shape you provided, so the parser is now targeted to that DOM and narrative layout.
- Co-op players should be stored per game as an array and entered during import.
- GitHub Pages deployment will build from a repository subpath unless explicitly overridden.
- A sample fallback dataset is acceptable for first-run UX before Supabase is configured.

## Notes about the current environment

During this scaffolding session, `npm install` failed with an HTTP 403 from the npm registry in the execution environment. The codebase, workflow, and tests were still scaffolded, but you should run dependency installation locally or in CI where package registry access is available.
