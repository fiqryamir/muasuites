# Handoff — MUAsuites free-tier infra effort (`free-tier-infra`)

## Next session focus

Work the **free-tier-infra** build. The wayfinder map is charted, the spec is written, and the single open decision is resolved — the way to the destination is clear. Pick the first **frontier** ticket and build it.

Recommended order: **01 — Move auth gating server-side** (the prefactor, no blockers) → **02 — Prerender the landing page** (blocked by 01) → 03 / 04 (both unblocked; 04 is a human-checklist ticket) → **05 — Verify with numbers** (blocked by 01–04).

## Project & repo

- Repo: root of this project (SvelteKit 5 runes + Tailwind v4 + shadcn-svelte/bits-ui + Supabase + Cloudflare adapter, TypeScript strict, npm)
- Product: "invisible" booking micro-SaaS for Malaysian makeup artists — WhatsApp-first, DuitNow QR deposits, Telegram notifications, .ics calendar, magic-link auth at `/login`
- Deploys to a Cloudflare Worker + assets (`wrangler.jsonc`), KV namespace `MUA_CACHE`, SvelteKit adapter: `@sveltejs/adapter-cloudflare`
- The single biggest burn risk (per `INFRASTRUCTURE_CAPACITY_REPORT.md` in the Downloads folder): Worker CPU time (10ms) + request quota (100K/day), and the root layout runs an auth session check on **every** page including the static landing page and all public routes.

## Where the work lives (local-markdown tracker — see `docs/agents/issue-tracker.md`)

- Map: `.scratch/free-tier-infra/map.md` — Destination / Notes / Decisions-so-far / Fog / Out of scope
- Spec: `.scratch/free-tier-infra/spec.md` — problem, solution, user stories, implementation + testing decisions
- Decisions: `.scratch/free-tier-infra/decisions/` — 01–04 resolved; **05 resolved** (Pin the bot-protection defaults)
- Build tickets: `.scratch/free-tier-infra/issues/` — 01, 02, 03, 04, 05 (blocking wired in each file)
- No `gh`/`glab` CLI on this machine → issues are markdown files, not GitHub issues. **Frontier** = open, unblocked, unclaimed tickets (currently 01, 03, 04).

## Locked decisions (user-confirmed)

1. **Landing page leaves the Worker**: prerender `/` to a static edge asset (zero Worker invocations/CPU) — only after auth is out of the public layout.
2. **Auth hardens server-side**: session resolution + server-side redirect move into an authenticated subtree (`(auth)` group); `/login` stays outside it but redirects already-authed MUAs to the dashboard; public routes stop running auth entirely.
3. **Bot posture — moderate**: keep Google/Bing, **keep ALL AI crawlers** (AI-suggestion visibility; cheap on static/KV-cached pages), keep Instagram in-app WebView working; no blanket blocking, no Under-Attack.
4. **Bot defaults (decision 05)**: robots.txt blocks **only Google-Extended**; code UA-triage = rude/non-compliant scrapers only; core scanner path 404s (`.php/.asp/.aspx/.env/.git`, `/wp-*`, `/xmlrpc.php`, `/config.*`); dashboard = BIC on (default), Bot Fight Mode on with Instagram-WebView verification, and the single free rate-limit rule = `/login` >20 req/60s → Managed Challenge.
5. **Mechanism**: code in repo + human toggles the Cloudflare dashboard switches (ticket 04).

## Current state

- Wayfinder map charted; spec published; build tickets 01–05 published with blocking edges.
- Decision 05 resolved and recorded; tickets 03/04 unblocked; fog trimmed on the map.
- **No build work started yet** — codebase untouched by this effort. Current auth architecture (the thing 01 refactors):
  - `src/hooks.server.ts` — request-scoped Supabase client + route-based Cache-Control (`/` currently gets no cache header)
  - `src/routes/+layout.server.ts` — runs `safeGetSession()` for every page (including landing + all public routes)
  - `src/routes/+layout.ts` + `+layout.svelte` — universal client + auth-state subscription
  - `(dashboard)/+layout.svelte` — auth gating is **client-side only** today (`goto('/login')` after render)
  - `(dashboard)/bookings/all/+page.server.ts` — reads `parent()` session, returns empty data if none
- Landing page (`src/routes/+page.svelte`) is fully static (no `+page.server.ts`) — a clean prerender target.

## Remaining work

1. **Build tickets** (`.scratch/free-tier-infra/issues/`): 01 → 02 → 03 → 04 (human) → 05 (verify). Each has acceptance criteria; claim by setting `Status: claimed`, resolve by appending `## Answer` + `Status: resolved`, and append a Decisions-so-far pointer to the map for any new decision tickets you open.
2. **Landing-page leftovers from the previous effort** (carried forward): demo video for the hero (Phase 3b), OG PNG render of `static/og.svg`, and the deploy-blocker below.

## Known BLOCKER (pre-existing)

- `npm run build` **fails**: `MAPBOX_ACCESS_TOKEN` missing from `.env` (imported via `$env/static/private` in `src/routes/api/*/+server.ts`). This predates this effort and blocks any deploy until the key is added. Dev (`npm run dev`) and `svelte-check` work. Do not burn time fixing unrelated API files.

## Conventions observed in repo

- Tabs, single quotes, prettier + eslint — run `npm run check` (svelte-check) and `npm run lint` before finishing a ticket
- UI imports: `import * as Card from '$lib/components/ui/card'`, `import { Button } from '$lib/components/ui/button'`; icons via `@lucide/svelte`
- Deploy path: `npx wrangler deploy` (only once the build passes / key exists)

## User's own parallel todos (not ours)

Add `MAPBOX_ACCESS_TOKEN` to `.env` (unblocks deploys) · Cloudflare dashboard toggles per ticket 04 · later: free-capacity 2→5 in `secure_checkout_slot` RPC, Telegram inline buttons, .ics auto-dispatch, demo slug confirmation.

## Suggested skills

- `/wayfinder` to work the map (load `map.md`, pick/claim the frontier ticket, record resolutions)
- `/implement` or `/tdd` for build work; `/grilling` + `/domain-modeling` for any HITL decision that surfaces; `/code-review` to review finished slices
- `customize-opencode` and `find-skills` are irrelevant here — this is application code

## Sensitive info

- `.env` exists in repo root; was never read. No secrets in this handoff. Never read or commit `.env`.
