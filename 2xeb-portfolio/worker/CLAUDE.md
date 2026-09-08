# Worker — CLAUDE.md

The Cloudflare Worker that fronts the static site. Configured in
`wrangler.jsonc`; deployed with `npm run deploy` (build + `wrangler deploy`).

## What it does

`assets.run_worker_first` is `["/log/*"]`, so this script only runs for Log
paths. Everything else is served directly from `dist/` by the assets binding
with `not_found_handling: single-page-application`, exactly as before.

- `GET /log/<slug>` — calls the `get_post` function in Supabase (published or
  unlisted, by exact slug), fetches the app shell from `ASSETS`, and rewrites
  `<title>`, `description`, `og:*`, `twitter:*`, and a canonical link with the
  piece's title and opening lines via `HTMLRewriter`. Unlisted pieces get
  `noindex`. Unknown slugs serve the untouched shell; the SPA shows its 404.
- `GET /log/feed.xml` — RSS 2.0 of published pieces.
- Supabase responses are cached at the edge (`caches.default`) for 5 minutes.
  Any Supabase failure degrades to the generic site card, never an error page.

## Config

`vars` in `wrangler.jsonc`: `SUPABASE_URL` and `SITE_ORIGIN` (`https://2xeb.me`,
used for canonical URLs and cache keys).

`SUPABASE_ANON_KEY` is a **Worker secret**, set once with
`npx wrangler secret put SUPABASE_ANON_KEY` (paste the public anon key from
Supabase → Project Settings → API). It is the same key the client bundle
ships, so it is not sensitive — but any JWT committed to the repo trips secret
scanners, so it stays out of config. Until the secret exists the Worker
serves the untouched app shell for `/log/*` and no feed.

## Type-checking

Separate `worker/tsconfig.json` (Workers types, no DOM). `npm run typecheck`
runs both the app and the worker. Keep `stripMarkdown`/`excerptOf` in sync
with `src/lib/log.ts`; the worker cannot import from `src/`.
