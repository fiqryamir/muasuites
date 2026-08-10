# New-session prompt — MUAsuites onboarding-flow build

Paste the block below into a fresh agent session to continue this effort. It orients the session, tells it where the work lives, and assigns the recommended first ticket.

---

```
You are continuing the `onboarding-flow` effort in the MUAsuites repo (git repo at repo root).

Orientation — read these first (in order):
1. docs/agents/issue-tracker.md — this repo uses the LOCAL-MARKDOWN issue tracker: issues live as files under `.scratch/<effort>/`. There is NO `gh` CLI; don't try to create GitHub issues.
2. CONTEXT.md — the MUAsuites domain glossary (MUA / Client / Booking Link / Deposit / Onboarding, etc.). Use this vocabulary in everything you write.
3. .scratch/onboarding-flow/map.md — the wayfinder MAP: destination, Decisions-so-far, fog, out-of-scope.
4. .scratch/onboarding-flow/spec.md — the SPEC (problem, solution, user stories, implementation + testing decisions).
5. .scratch/onboarding-flow/decisions/ — the five RESOLVED decision tickets (state model, wizard content, gate mechanics, shared components, backfill).
6. .scratch/onboarding-flow/issues/ — the BUILD TICKETS. Each file has "What to build", "Blocked by", and acceptance criteria.

Goal: build the first-login onboarding wizard for new MUAs — hard-gated after login, 5 linear steps (identity → payment → packages → optional extras → reveal), resumable, ending with their booking-page link. The wayfinder map is fully charted and every decision is resolved — this is a BUILD session, not a planning session. The DB columns (`mua_configs.onboarding_step` + `onboarded_at`) and the existing-user backfill are already applied live.

Status so far: ticket 01 (extract shared form components) is RESOLVED — `$lib/components/forms/` holds 8 field components (slug, whatsapp, deposit, DuitNow QR, telegram, working hours, buffer, package form), `$lib/schemas.ts` holds `configSchema`/`packageSchema`/`PackageRow`, `$lib/duitnow.ts` + `$lib/cache.ts` hold the QR-upload and cache-invalidation helpers, and the settings page consumes them. The working tree is NOT committed (modified CONTEXT.md + docs/agents/supabase-state.md; untracked `.scratch/` and `src/routes/prototype/`). Don't commit unless the user asks.

Do this now:
1. Load the map and the ticket list under .scratch/onboarding-flow/issues/.
2. The frontier (open, unblocked, unclaimed) is: 02 — Onboarding gate + route shell, then 03 — Settings travel-fee section.
3. CLAIM the first frontier ticket — set `Status: claimed` in that ticket file NOW, before any work.
4. Resolve it fully: implement, verify with `npm run check` and eslint on touched files, then append `## Answer` to the ticket, set `Status: resolved`, and update map.md's Decisions-so-far if any new decision ticket was needed.
5. When a ticket is done, move to the next frontier ticket (03), claiming it before work.

Technical facts for ticket 02 (Onboarding gate + route shell) — decision 03 is the contract:
- The gate lives in `src/routes/(auth)/+layout.server.ts` (currently: `safeGetSession()` → unauth 303 `/login` → returns `{ session, cookies }`). After the session check, query the MUA's config row — `select('onboarded_at').from('mua_configs').eq('mua_id', userId).maybeSingle()` via `locals.supabase` — and if `onboarded_at` is NULL (or the row is missing, defensive), `redirect(303, '/onboarding')`. This gates EVERY dashboard route (`/bookings`, `/bookings/all`, `/settings`, `/blackouts`) with no exemptions. Gate reads `onboarded_at` ONLY — never the data, and never `onboarding_step` (decision 01).
- `login/+page.server.ts` and `login/+page.svelte` stay UNCHANGED — the layout bounces not-onboarded MUAs on the next hop (works for SSR + client nav).
- New top-level route `src/routes/onboarding/` (outside the `(auth)` group — no dashboard nav shell):
  - `+page.server.ts`: no session → 303 `/login`; `onboarded_at` set → 303 `/bookings`; otherwise return session, cookies, and PREFILL: the MUA's config row (`select('*').from('mua_configs')`), active packages (`select('*').from('packages').eq('is_active', true).order('price')`), and the `muas` row for the slug (slug lives on `muas`, not config — step 1 prefill needs it). Same shapes as the settings page's `loadSettings()`.
  - `+layout.ts`: universal Supabase client bootstrap mirroring `src/routes/login/+page.ts` (createBrowserClient on client / createServerClient on server using `data.cookies`) so the wizard can upload the DuitNow QR from the browser.
  - `+page.svelte`: minimal shell ONLY — this ticket is the route home, not the wizard. Do NOT build wizard steps (that's tickets 04/05); a plain placeholder page that renders the returned prefill data or a simple "Onboarding coming next" shell is enough, as long as the route renders without error.
- `src/hooks.server.ts` (~line 67): add `/onboarding` to the authenticated cache bucket — `pathname.startsWith('/bookings') || pathname.startsWith('/settings') || pathname.startsWith('/onboarding') || pathname === '/login'` → `private, no-cache`. Public routes stay untouched.
- Untouched: public routes, `/api/*`, `/login`, settings, shared form components, `/prototype/onboarding` (cleanup is ticket 06). Do NOT add travel-fee/base-location fields — ticket 03.

Verification pattern (matches the spec's testing decisions — no test framework exists; use dev smoke + DB-row checks):
- `npm run check` — baseline is 0 errors, 13 pre-existing warnings in `src/routes/[mua_slug]/[token]/+page.svelte` (+ `(auth)/bookings/all`); your work must add no new errors.
- eslint on touched files only (`npm run lint` fails repo-wide on pre-existing prettier drift — don't fix unrelated files). Note: the original settings file had pre-existing eslint findings (now fixed); don't chase violations in files you didn't touch.
- Dev smoke: start `npm run dev -- --port 5177 --strictPort` as a background process (cmd.exe wrapper, log to `$env:TEMP\opencode\muasuites-dev.log`; kill the process on port 5177 afterward — node holds .svelte-kit locks and breaks builds). Route checks that need no login: `/onboarding` unauth → 303 `/login` (curl with `-MaximumRedirection 0 -SkipHttpErrorCheck`). Authed-path checks need the user: the live DB has 2 profiles — 1 backfilled onboarded, 1 incomplete that stays gated — log in as each and confirm `/bookings`, `/settings`, `/blackouts` → 303 `/onboarding` for the gated one, and `/onboarding` → `/bookings` for the onboarded one. Ask the user to do this browser smoke, then continue.
- Do NOT read .env or commit secrets. Do NOT modify anything outside this effort without asking (in particular the booking funnel, api/*, checkout, public pages). If you hit the known deploy blocker (MAPBOX_ACCESS_TOKEN missing from .env breaks `npm run build`), note it and keep working with dev/svelte-check verification. Known Windows quirks: the adapter's rimraf of `.svelte-kit/cloudflare` intermittently EPERMs (delete the dir, wait ~20s, rebuild).

Resolve only ONE ticket per session unless a research step needs a subagent. Give the user a concise final summary: which ticket was claimed/resolved, the answer you recorded, and the new frontier.
```
