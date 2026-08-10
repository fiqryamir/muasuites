# 02 — Onboarding gate + route shell

**What to build:** the hard gate and the wizard's home. Every authenticated dashboard route (bookings, all bookings, settings, off days) 303-redirects a not-onboarded MUA to `/onboarding`; login redirects stay unchanged (the gate catches them on the next hop). The `/onboarding` route exists as a top-level page outside the dashboard nav with its own guards — unauthenticated → `/login`, already onboarded → `/bookings`, otherwise it loads the MUA's config and packages as prefill and boots a Supabase client for the browser. Onboarding responses get `private, no-cache` cache headers.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [ ] As an authenticated, not-onboarded MUA, `/bookings`, `/bookings/all`, `/settings` and `/blackouts` all 303 to `/onboarding` — no exemptions.
- [ ] As an unauthenticated visitor, `/onboarding` 303s to `/login`.
- [ ] As an onboarded MUA, `/onboarding` 303s to `/bookings`.
- [ ] The `/onboarding` server load returns session, cookies and prefill (config + packages); the browser Supabase client initialises (needed for QR upload).
- [ ] `/onboarding` responses carry `private, no-cache`; public routes are untouched.

Reference: decisions 01 + 03 in `.scratch/onboarding-flow/decisions/`.

## Answer

Gate + route shell built exactly per decision 03's contract; all route-level checks green except the authed browser smokes (need the user — see below).

**1. Gate — `src/routes/(auth)/+layout.server.ts`.** After the existing `safeGetSession()` + unauth → `/login` check, one `select('onboarded_at').from('mua_configs').eq('mua_id', userId).maybeSingle()`; `!config?.onboarded_at` (also covers a missing row, defensive) → `redirect(303, '/onboarding')`. Gates all four dashboard routes (`/bookings`, `/bookings/all`, `/settings`, `/blackouts`) via the single `(auth)` layout — verified no nested layouts exist. Reads `onboarded_at` only, never the data or `onboarding_step` (decision 01). `login/+page.server.ts` and `login/+page.svelte` untouched — not-onboarded MUAs bounce on the next hop via the layout.

**2. `/onboarding` route** (top-level, outside `(auth)` — no dashboard nav shell):
- `+page.server.ts` — no session → 303 `/login`; `onboarded_at` set → 303 `/bookings`; else returns `{ session, cookies, prefill: { slug, config, packages } }` — `muas` row for the slug (step 1 prefill), `mua_configs` `select('*')`, active packages ordered by price (same shapes as settings' `loadSettings()`).
- `+layout.server.ts` (addition to the decision-03 plan) — returns `{ cookies: cookies.getAll() }` only, no auth logic. Needed because the universal `+layout.ts` cannot see `+page.server.ts` data; this mirrors how `(auth)/+layout.ts` receives cookies from its sibling layout server. All auth decisions stay in `+page.server.ts` per contract.
- `+layout.ts` — universal Supabase client bootstrap, byte-identical to `login/+page.ts` / `(auth)/+layout.ts` (`createBrowserClient` on client / `createServerClient` with `data.cookies` on server), so the wizard can upload the DuitNow QR from the browser later.
- `+page.svelte` — minimal shell ONLY: "Welcome" heading + prefill readout (studio name, booking page link, package count) as placeholder. No wizard steps (tickets 04/05).

**3. Cache — `src/hooks.server.ts`.** `/onboarding` added to the authenticated bucket (`private, no-cache`); public routes untouched.

**Verification:** `npm run check` — 0 errors, 13 warnings (pre-existing baseline, none in touched files). Eslint clean on all 6 touched/new files. Dev smoke on 5177: unauth `GET /onboarding` → **303 `/login`**, `Cache-Control: private, no-cache` ✓. (Note: a stale dev server from the previous session was still holding port 5177 and had to be killed — it predated the route and served 404s.)

**Remaining — user browser smoke (needs the live DB):** log in as the gated (not-onboarded) MUA → `/bookings`, `/settings`, `/blackouts` should each 303 to `/onboarding`, which renders the shell with prefill; log in as the backfilled (onboarded) MUA → `/onboarding` should 303 to `/bookings`.

No new decision ticket needed — the `+layout.server.ts` cookie-carrier is a type-level necessity of the decision-03 structure, recorded here only; map.md unchanged.
