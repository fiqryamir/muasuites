# 03 — Gate mechanics

**Type:** grilling
**Status:** resolved
**Blocked by:** 01

## Question

Where exactly does the hard redirect live, and which routes are exempt?

## Context

- `(auth)/+layout.server.ts` already 303s unauthenticated visitors → `/login`; `login/+page.server.ts` 303s authenticated MUAs → `/bookings`; `login/+page.svelte` also client-side `goto('/bookings')`. The gate hooks into these three spots once decision 01 supplies the signal.
- `/onboarding` route placement: outside the `(auth)` group (no dashboard nav header) — confirm; an unauthenticated visit to `/onboarding` → `/login`.
- Are any auth routes reachable mid-wizard (e.g., `/bookings` visited directly → redirect back to `/onboarding`)? Public pages (`[mua_slug]`, booking, balance) and `/login` unaffected.
- Watch out for: the backfill (decision 05) making the gate a no-op for existing profiles, and the cache headers in `hooks.server.ts` (onboarding route needs `private, no-cache`).

## Answer

The gate lives entirely in the existing authenticated boundary — `(auth)/+layout.server.ts` — which per free-tier-infra decision 03 already owns all session work; the public tree keeps running zero auth.

**1. `(auth)/+layout.server.ts` (the gate).** After the existing `safeGetSession()` + unauth → `/login` check, query the MUA's config row (`select('onboarded_at').from('mua_configs').eq('mua_id', userId).maybeSingle()`) — one PK-indexed lookup, cheap per decision 01. If `onboarded_at` is NULL (or the row is missing, defensive — the signup trigger always creates it), `redirect(303, '/onboarding')`. This automatically gates every dashboard route (`/bookings`, `/bookings/all`, `/settings`, `/blackouts`) with **no exemptions** — the hard gate stays hard mid-wizard.

**2. `login/+page.server.ts` and `login/+page.svelte` — unchanged.** Authenticated logins still 303 / `goto('/bookings')`; the layout catches not-onboarded MUAs and bounces them on the next hop (works for both SSR and client-side navigation). Server stays the single source of truth, no duplicated branching.

**3. `/onboarding` — new top-level route outside `(auth)`** (no dashboard nav shell):
- `src/routes/onboarding/+page.server.ts`: no session → 303 `/login`; `onboarded_at` set → 303 `/bookings`; otherwise return session, cookies, and prefill data (config + packages) so resume-from-last-step works (decision 01).
- `src/routes/onboarding/+layout.ts`: universal Supabase client bootstrap mirroring `login/+page.ts`, so the wizard can upload the DuitNow QR from the browser.

**4. `hooks.server.ts` cache headers.** Add `/onboarding` to the authenticated bucket: `private, no-cache` (never CDN-cached — it's gated content).

**5. Untouched:** public routes (`/`, `[mua_slug]`, `[mua_slug]/[token]`, `pay/balance/[token]`), `/api/*`, `/login`.

**Edge cases resolved:** onboarded MUA visiting `/onboarding` → 303 `/bookings`; mid-wizard MUA hitting any auth route → 303 `/onboarding` (wizard resumes at step `onboarding_step + 1`); backfilled profiles have `onboarded_at` set → never gated.
