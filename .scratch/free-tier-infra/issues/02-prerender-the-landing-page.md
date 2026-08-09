# 02 — Prerender the landing page

**What to build:** the landing page is baked to a static HTML asset at build time and served from the Cloudflare edge without invoking the Worker, so every visit (including bot traffic) costs zero Worker requests and zero CPU.

**Blocked by:** 01 — Move auth gating server-side (the public layout must be free of auth work first).

**Status:** resolved

Related decision: [Serve the landing page without the Worker](../decisions/01-serve-the-landing-page-without-the-worker.md).

- [x] The build emits the landing page as a static asset and the Worker routing config marks it excluded from Worker-run routes.
- [x] A request to the landing page returns the same content and structured data as before (no visual, SEO, or schema regression).
- [x] The landing page response carries an edge-friendly public cache header.
- [x] Dashboard, login, and public profile routes are unaffected.
- [x] Edge freshness on redeploy verified: no stale landing HTML is served after a new deploy (or a zero-config cache-busting path is confirmed).
- [ ] Observability shows the landing page serving with zero Worker invocations / ~0 CPU after deploy.

## Answer

The landing page is now a static edge asset: prerendered at build time into the Cloudflare assets store, served by the edge without invoking the Worker.

**What changed:**
- New `src/routes/+page.ts` with `export const prerender = true` — the landing page bakes to `index.html` at build.
- New project-root `_headers` file (adapter-cloudflare v7 copies it into the assets dir and appends SvelteKit's auto headers): `/` gets `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` — edge-friendly, bounded staleness (~60s worst case on redeploy; SWR revalidates against the new asset store), mirroring the repo's existing balance-page pattern.
- No wrangler.jsonc change needed: `assets.directory` = `.svelte-kit/cloudflare` already puts prerendered output in the Workers static-assets store, which serves asset hits directly (no `run_worker_first`) — that **is** the "excluded from Worker-run routes" mechanism (verified in `@sveltejs/adapter-cloudflare@7.2.8` `index.js`: `builder.writePrerendered(assets_dest)` + `_headers` copy). `_routes.json` is Pages-only and not used here.

**Verification:**
- `npm run build` green (exit 0) with `MAPBOX_ACCESS_TOKEN` injected in the **shell env only** — `.env` untouched, per effort rules. Output inspected: `index.html` (83KB) in `.svelte-kit/cloudflare/` alongside `_worker.js`, `_headers` (my `/` rule + Svelte auto headers), `.assetsignore`, `og.svg`, `robots.txt`, `_app/`.
- Parity: prerendered `index.html` is byte-identical (after EOL/whitespace normalization) to a live SSR render via `vite preview` — title, OG/JSON-LD, all sections, hydration scripts intact. No visual/SEO/schema regression.
- Production-build smoke test (`vite preview` on 5178): `/` → 200; `/bookings`, `/settings`, `/bookings/all` → 303 → `/login`; `/login` → 200. Dashboard/login/public routes unaffected.
- `npm run check`: 0 errors, 13 pre-existing warnings. eslint clean on the new file.
- Prerender crawler: the landing's links to `/login` (SSR-only) and `/aina-beauty` (dynamic) did **not** trip `prerender.strict` — build passes with default config, no svelte.config.js change needed.

**Notes / follow-ups:**
- Windows quirk: the adapter's `rimraf(.svelte-kit/cloudflare)` intermittently hit `EPERM` (transient file lock, likely Defender/editor); a clean delete + ~20s wait resolves it. Not a code issue; the adapter output was complete each time.
- Deploy-time human checks remain: confirm `wrangler deploy` is green, and use Workers observability to confirm `/` serves with zero Worker invocations (~0 CPU) — final acceptance criterion, needs the deployed edge.
- `robots.txt` (63 bytes) already exists in `static/` — untouched; it belongs to ticket 03.
