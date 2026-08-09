# Handoff — MUAsuites free-tier infra effort (`free-tier-infra`)

## Next session focus

Work the **free-tier-infra** build. Tickets 01 (auth gating) and 02 (landing prerender) are **resolved and committed**. Pick the first **frontier** ticket and build it.

Recommended order: **01 — Move auth gating server-side** ✅ resolved → **02 — Prerender the landing page** ✅ resolved → **03 — Bot & scanner triage in the request hook** (code, unblocked) → **04 — Cloudflare dashboard protection checklist** (HUMAN checklist — hand it to the user, you can't click Cloudflare) → **05 — Verify with numbers** (blocked by 01–04).

## Project & repo

- Repo: root of this project (SvelteKit 5 runes + Tailwind v4 + shadcn-svelte/bits-ui + Supabase + Cloudflare adapter, TypeScript strict, npm)
- Product: "invisible" booking micro-SaaS for Malaysian makeup artists — WhatsApp-first, DuitNow QR deposits, Telegram notifications, .ics calendar, magic-link auth at `/login`
- Deploys to a Cloudflare Worker + assets (`wrangler.jsonc`), KV namespace `MUA_CACHE`, SvelteKit adapter: `@sveltejs/adapter-cloudflare`
- The biggest burn risks (per `INFRASTRUCTURE_CAPACITY_REPORT.md` in the Downloads folder): Worker CPU time (10ms) + request quota (100K/day) — both now largely retired for the landing page (static edge asset) and the auth surface (server-gated subtree).

## Where the work lives (local-markdown tracker — see `docs/agents/issue-tracker.md`)

- Map: `.scratch/free-tier-infra/map.md` — Destination / Notes / Decisions-so-far / Fog / Out of scope
- Spec: `.scratch/free-tier-infra/spec.md` — problem, solution, user stories, implementation + testing decisions
- Decisions: `.scratch/free-tier-infra/decisions/` — 01–05 all resolved
- Build tickets: `.scratch/free-tier-infra/issues/` — 01, 02 resolved; 03, 04 open (03 = code, 04 = human); 05 blocked by 01–04
- Session prompt for the next agent: `.scratch/free-tier-infra/new-session-prompt.md` (kept up to date each session)
- No `gh`/`glab` CLI on this machine → issues are markdown files, not GitHub issues. **Frontier** = open, unblocked, unclaimed tickets (currently 03, 04).

## Locked decisions (user-confirmed)

1. **Landing page leaves the Worker** ✅ done: prerender `/` to a static edge asset (zero Worker invocations/CPU) — `src/routes/+page.ts` (`prerender = true`) + project-root `_headers` (`/` → `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`).
2. **Auth hardens server-side** ✅ done: session resolution + server-side redirect live in the `(auth)` route group (was `(dashboard)`); `/login` sits outside it and 303-redirects already-authed MUAs to `/bookings`; the public tree runs zero auth in server loads (root `+layout.server.ts`/`+layout.ts` deleted).
3. **Bot posture — moderate**: keep Google/Bing, **keep ALL AI crawlers** (AI-suggestion visibility; cheap on static/KV-cached pages), keep Instagram in-app WebView working; no blanket blocking, no Under-Attack.
4. **Bot defaults (decision 05)**: robots.txt blocks **only Google-Extended**; code UA-triage = rude/non-compliant scrapers only; core scanner path 404s (`.php/.asp/.aspx/.env/.git`, `/wp-*`, `/xmlrpc.php`, `/config.*`); dashboard = BIC on (default — verify, don't re-enable), Bot Fight Mode on with Instagram-WebView verification, and the single free rate-limit rule = `/login` >20 req/60s → Managed Challenge.
5. **Mechanism**: code in repo + human toggles the Cloudflare dashboard switches (ticket 04).

## Current state

- Tickets 01 + 02 resolved and committed (`61ef1cc`, `00405fd` on `feat/landing-page`).
- **Auth**: root layout is static; `(auth)/` group has the gating server layout (303 → `/login`), universal Supabase client layout, and the shell (auth-state subscription moved in; client-side-only gate removed; dead `mua_configs` studioName fetch removed). `login/+page.server.ts` redirects authed MUAs; `login/+page.ts` bootstraps the client. `src/app.d.ts` no longer declares `App.PageData.session`.
- **Landing**: prerendered to `index.html` in `.svelte-kit/cloudflare/` (the Workers static-assets store — asset hits never invoke the Worker); `_headers` carries the `/` cache rule (SvelteKit appends its immutable-asset rules).
- **Caveats carried forward**:
  - `npm run check` shows 0 errors **only when** `.svelte-kit` was generated with `MAPBOX_ACCESS_TOKEN` in the env; on a fresh sync without it, the 3 pre-existing `$env/static/private` errors in `api/*` return. The real fix is the user adding the key to `.env`.
  - `npm run lint` fails repo-wide on a pre-existing prettier drift (139 files, incl. files untouched by this effort). eslint on *touched* files passes.
  - Windows quirk: the adapter's `rimraf(.svelte-kit/cloudflare)` intermittently EPERMs (transient file lock). Workaround: delete `.svelte-kit/cloudflare`, wait ~20s, rebuild. Also: `git mv` on route-group dirs can hit "Permission denied" — plain `Move-Item` works.
  - Orphaned dev-server note: kill stray node processes before building (vite dev holds `.svelte-kit` locks).

## Remaining work

1. **Ticket 03 — Bot & scanner triage in the request hook** (next frontier). Design facts: triage goes at the top of `src/hooks.server.ts` `handle()`; UA substring match (rude/non-compliant scrapers only — no curated AI blocklist) returning a minimal response **before** the Supabase client init; scanner path regex → instant 404; robots.txt lives in `static/robots.txt` (63 bytes, exists — blocks only Google-Extended, keeps GPTBot/ClaudeBot/CCBot/Bytespider/PerplexityBot/OAI-SearchBot/googlebot/bingbot). Never match mobile/WebView UAs.
2. **Ticket 04 — Cloudflare dashboard checklist** (human): BIC verify-on, Bot Fight Mode on + IG-WebView verification, the single rate-limit rule on `/login`.
3. **Ticket 05 — Verify with numbers** (blocked by 01–04): before/after metrics, deploy verification, Test-1–12-style edge checks.
4. **Landing-page leftovers** (carried forward): demo video for the hero, OG PNG render of `static/og.svg`, deploy-blocker below.

## Known BLOCKER (pre-existing)

- `npm run build` **fails on a fresh machine**: `MAPBOX_ACCESS_TOKEN` missing from `.env` (imported via `$env/static/private` in `src/routes/api/*/+server.ts`). Predates this effort; blocks deploys until the key is added. Sessions so far inject the key in the **shell env only** (never touching `.env`) to verify builds. Do not burn time fixing unrelated API files.

## Conventions observed in repo

- Tabs, single quotes, prettier + eslint — run `npm run check` (svelte-check) and eslint on touched files before finishing a ticket
- UI imports: `import * as Card from '$lib/components/ui/card'`, `import { Button } from '$lib/components/ui/button'`; icons via `@lucide/svelte`
- Deploy path: `npx wrangler deploy` (only once the build passes / key exists)
- Route groups: authenticated area is `(auth)/`; public tree is bare (landing `+page.svelte` + `+page.ts` prerender, `[mua_slug]`, `[mua_slug]/[token]`, `pay/balance/[token]`)

## User's own parallel todos (not ours)

Add `MAPBOX_ACCESS_TOKEN` to `.env` (unblocks deploys) · Cloudflare dashboard toggles per ticket 04 · later: free-capacity 2→5 in `secure_checkout_slot` RPC, Telegram inline buttons, .ics auto-dispatch, demo slug confirmation.

## Suggested skills

- `/wayfinder` to work the map (load `map.md`, pick/claim the frontier ticket, record resolutions)
- `/implement` or `/tdd` for build work; `/grilling` + `/domain-modeling` for any HITL decision that surfaces; `/code-review` to review finished slices
- `customize-opencode` and `find-skills` are irrelevant here — this is application code

## Sensitive info

- `.env` exists in repo root; was never read. No secrets in this handoff. Never read or commit `.env`.
