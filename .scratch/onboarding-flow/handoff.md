# Handoff — onboarding-flow (after tickets 01–03)

> Paste the block below into a fresh agent session to continue this effort.

---

```
You are continuing the `onboarding-flow` effort in the MUAsuites repo (git repo at repo root).

Orientation — read these first (in order):
1. docs/agents/issue-tracker.md — this repo uses the LOCAL-MARKDOWN issue tracker: issues live as files under `.scratch/<effort>/`. There is NO `gh` CLI; don't try to create GitHub issues.
2. CONTEXT.md — the MUAsuites domain glossary (MUA / Client / Booking Link / Deposit / Balance / Onboarding, etc.). Use this vocabulary in everything you write.
3. .scratch/onboarding-flow/map.md — the wayfinder MAP: destination, Decisions-so-far, fog, out-of-scope.
4. .scratch/onboarding-flow/spec.md — the SPEC (problem, solution, user stories, implementation + testing decisions).
5. .scratch/onboarding-flow/decisions/ — the five RESOLVED decision tickets (state model, wizard content, gate mechanics, shared components, backfill).
6. .scratch/onboarding-flow/issues/ — the BUILD TICKETS. Each file has "What to build", "Blocked by", and acceptance criteria.

Goal: build the first-login onboarding wizard for new MUAs — hard-gated after login, 5 linear steps (identity → payment → packages → optional extras → reveal), resumable, ending with their booking-page link. The wayfinder map is fully charted and every decision is resolved — this is a BUILD session, not a planning session.

Status so far: tickets 01, 02, 03 are RESOLVED.
- 01: `$lib/components/forms/` holds 9 field components (slug, whatsapp, deposit, DuitNow QR, telegram, working hours, buffer, package form, travel fee), `$lib/schemas.ts` holds `configSchema`/`packageSchema`/`PackageRow`, `$lib/duitnow.ts` + `$lib/cache.ts` hold the QR-upload and cache-invalidation helpers, and the settings page consumes them.
- 02: the gate lives in `(auth)/+layout.server.ts` (one `onboarded_at` lookup → 303 `/onboarding`; login redirects unchanged); `src/routes/onboarding/` exists as a top-level route OUTSIDE the `(auth)` group — `+page.server.ts` (unauth → /login, onboarded → /bookings, else `{ session, cookies, prefill: { slug, config, packages } }`), `+layout.server.ts` (cookie carrier only), `+layout.ts` (universal Supabase client bootstrap), `+page.svelte` (placeholder shell — THIS is what ticket 04 replaces). `hooks.server.ts` has `/onboarding` in the `private, no-cache` bucket.
- 03: `mua_configs.base_place_name text NULL` added live (idempotent apply script at `.scratch/onboarding-flow/apply-travel-fields.mjs`, Management-API pattern from `scripts/sync-supabase.mjs`); settings gained a Travel section using the shared travel field; `npm run sync:supabase` re-ran and `docs/agents/supabase-state.md` is current (7 tables).
The working tree is NOT committed (modified CONTEXT.md, docs/agents/supabase-state.md, src/hooks.server.ts, src/lib/schemas.ts, (auth)/+layout.server.ts, (auth)/settings/+page.svelte; untracked `.scratch/`, src/lib/{cache.ts,duitnow.ts}, src/lib/components/forms/, src/routes/onboarding/, src/routes/prototype/). Don't commit unless the user asks.

Do this now:
1. Load the map and the ticket list under .scratch/onboarding-flow/issues/.
2. The frontier (open, unblocked, unclaimed) is: 04 — Wizard steps 1–2 (identity + payment), then 05 — Wizard steps 3–5 (packages, optional, reveal).
3. CLAIM the first frontier ticket — set `Status: claimed` in that ticket file NOW, before any work.
4. Resolve it fully: implement, verify with `npm run check` and eslint on touched files, then append `## Answer` to the ticket, set `Status: resolved`, and update map.md's Decisions-so-far if any new decision ticket was needed.
5. When a ticket is done, move to the next frontier ticket (05), claiming it before work.

Technical facts for ticket 04 (Wizard steps 1–2) — decision 02 is the contract:
- The wizard replaces the placeholder in `src/routes/onboarding/+page.svelte`. It's a linear shell (prototype variant A at `src/routes/prototype/onboarding/`, variant-a.svelte + switcher.svelte): step indicator, Back/Continue, Continue disabled until the step's required fields are valid (real-time validation), per-step save.
- Step 1 — identity: slug (muasuite.com/{slug}), studio name, WhatsApp number. Prefill comes from `page.data.prefill` — the server load already returns `{ slug, config, packages }` (slug lives on `muas`, studio/WhatsApp on the config row). Use the shared `SlugField`, `WhatsappField`, and the plain-language teaching copy LOCKED in `src/routes/prototype/onboarding/steps.ts` (decision 02 — do not rewrite the copy).
- Step 2 — payment: deposit type + value (`DepositFields`), DuitNow QR upload (`DuitnowQrField` + `uploadDuitNowQr` from `$lib/duitnow.ts` — same storage path as settings).
- Save contract (decision 01): each step's save writes its fields AND `onboarding_step` in the SAME update on `mua_configs` (step 1 → `onboarding_step = 1`, step 2 → `onboarding_step = 2`). The slug upsert goes on `muas` (mirror the settings page's save: slug upsert → config update; handle the `23505` duplicate-slug error the same way). Resume = `onboarding_step + 1`, prefilled from the config row. Step 1's save must call `invalidateProfileCache(slug)` from `$lib/cache.ts` (the slug affects the public page).
- Steps 3–5 are OUT OF SCOPE for this ticket — they must not crash, but a "coming next" placeholder step is fine; do NOT build them (that's 05). Continue on step 2 still advances `onboarding_step = 2` and lands on the placeholder.
- Untouched: public routes, `/api/*`, `/login`, settings, shared form components, `(auth)` layout gate, `prototype/onboarding` (cleanup is ticket 06), travel/telegram/working-hours/buffer fields (step 4, ticket 05).
- DB: `mua_configs.onboarding_step` + `onboarded_at` are live (2 profiles: 1 backfilled onboarded, 1 gated at step 0). No schema work needed for this ticket.

Verification pattern (matches the spec's testing decisions — no test framework exists; use dev smoke + DB-row checks):
- `npm run check` — baseline is 0 errors, 13 pre-existing warnings in `src/routes/[mua_slug]/[token]/+page.svelte` (+ `(auth)/bookings/all`); your work must add no new errors.
- eslint on touched files only (`npm run lint` fails repo-wide on pre-existing prettier drift — don't fix unrelated files). If eslint flags write-only `$bindable` assignments in a NEW component, use the repo's existing `/* eslint-disable no-useless-assignment */` file-top convention (see `duitnow-qr-field.svelte`, `travel-fee-field.svelte`); give every `{#each}` a key.
- Dev smoke: FIRST kill any stale dev server on port 5177 (earlier sessions left one squatting — `Get-NetTCPConnection -LocalPort 5177 -State Listen` and kill the owning process), then start `npm run dev -- --port 5177 --strictPort` as a background process (cmd.exe wrapper, log to `$env:TEMP\opencode\muasuites-dev.log`); kill the process on port 5177 afterward — node holds .svelte-kit locks and breaks builds. Unauth route check: `/onboarding` → 303 `/login` (curl with `-MaximumRedirection 0 -SkipHttpErrorCheck`).
- Authed-path checks + DB-row checks need the user: log in as the gated MUA (currently at onboarding_step 0), run steps 1–2, and inspect the live cloud rows (`onboarding_step` advanced, fields written); close mid-wizard and re-open to verify resume + prefill; check the public page shows the new slug/studio after step 1. Ask the user to do this browser smoke, then continue.
- KNOWN DEPLOY BLOCKER (pre-existing, do NOT touch): `MAPBOX_ACCESS_TOKEN` in `.env` is a 4-char placeholder → Mapbox 401 → `/api/search-location` + `/api/estimate-travel` fail locally (the travel field's search won't work in dev until a real token is pasted). Not needed for ticket 04; note it and keep working with dev/svelte-check verification. Do NOT read .env values or print them.
- Do NOT modify anything outside this effort without asking (in particular the booking funnel, api/*, checkout, public pages). Known Windows quirks: the adapter's rimraf of `.svelte-kit/cloudflare` intermittently EPERMs (delete the dir, wait ~20s, rebuild).

Resolve only ONE ticket per session unless a research step needs a subagent. Give the user a concise final summary: which ticket was claimed/resolved, the answer you recorded, and the new frontier.
```
