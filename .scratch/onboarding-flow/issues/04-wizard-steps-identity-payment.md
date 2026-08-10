# 04 — Wizard steps 1–2 (identity + payment)

**What to build:** the linear wizard shell (prototype variant A) with its first two steps, wired to real saves. Step 1 — identity: studio name, booking page address (`muasuites.com/{slug}`, prefilled from email), WhatsApp number, each with its plain-language explainer. Step 2 — payment: deposit type (fixed RM / percentage), deposit value, DuitNow QR upload with preview. Continue stays disabled until the step's required fields are valid. Each step's save writes its fields and advances `onboarding_step` (1, then 2) in the same update; returning to the wizard resumes at the last finished step with data prefilled. Identity saves invalidate the public-profile cache (the slug affects the public page).

**Blocked by:** 01 — extract shared form components; 02 — onboarding gate + route shell.

**Status:** resolved

- [ ] Step 1 save writes identity fields and `onboarding_step = 1`; step 2 save writes payment fields and `onboarding_step = 2` — each atomically.
- [ ] Continue is disabled until the step's required fields are valid; Back/Continue navigation works.
- [ ] Re-visiting `/onboarding` resumes at the last finished step with prefilled data (verified against DB rows).
- [ ] Step 1 save calls the profile-cache invalidation; the public page reflects the new slug/studio name.
- [ ] DuitNow QR upload persists to the same storage path settings uses, and the URL is saved on the config.
- [ ] Teaching copy matches the locked content from decision 02; `npm run check` — no new errors.

Reference: decisions 02 + 04 in `.scratch/onboarding-flow/decisions/`; locked copy in the prototype asset.

## Answer

Wizard shell + steps 1–2 built on top of ticket 02's route shell; all static gates green (see Verification).

**1. New `src/routes/onboarding/steps.ts`** — locked teaching copy (decision 02 content, all 5 steps) *copied* from the prototype asset, not imported, so ticket 06's prototype cleanup can't break the wizard. The wizard's `Field`/`Step` types come from here.

**2. `+page.svelte` — placeholder replaced with the wizard (variant A shell):**
- Resume: `current = prefill.config.onboarding_step` (0–4 maps 1:1 to step index, per decision 01); all fields initialize straight from the server load's prefill — no client fetch, no re-typing.
- Stepper dots (1–4) navigate **backwards only** — forward goes through Continue where saves happen (the prototype's free dot-clicking would skip saves; recorded as a decision-02 implementation detail).
- **Step 1 — identity:** `Input` (studio name) + `SlugField` + `WhatsappField`, each with its locked `why` copy. Continue gated by `configSchema.pick({ slug, studioName, whatsappNumber })` against `'60' + whatsappLocal` — real-time, no submit wall (decision 02).
- **Step 2 — payment:** `DepositFields` + `DuitnowQrField` (bound `file`, `existingUrl` from prefill). Continue gated by `depositValue > 0` and QR present — `qrFile !== null || duitnowQrUrl !== ''` so a resume doesn't force re-upload.
- Steps 3–4 + reveal: placeholder card ("coming in the next update") with Continue disabled — route always renders; ticket 05 replaces them.
- **Saves (Continue = save-then-advance), all partial updates that never clobber unrelated columns:**
  - Step 1: slug upsert on `muas` **first** (23505 → "This booking link is already taken." toast, abort — same order as settings), then one `mua_configs` update `{ studio_name, whatsapp_number, onboarding_step: 1 }`, then `invalidateProfileCache(slug)` (slug affects the public page).
  - Step 2: `uploadDuitNowQr` only if a new file (throws → toast, abort), then one update `{ deposit_mode, deposit_value, duitnow_qr_url, onboarding_step: 2 }`.
  - Atomicity note: step fields + `onboarding_step` land in a single DB-atomic update; the slug is a separate table so it stays sequential (settings parity). If the config update fails after a successful slug write, the step doesn't advance and resume shows the new slug prefilled — accepted.

**Verification:** `npm run check` — 0 errors, 13 warnings (pre-existing baseline in `(auth)/bookings/all` + `[mua_slug]/[token]`, none in touched files). Eslint clean on both files; prettier clean after formatting. Dev smoke on 5177 (server killed after): unauth `GET /onboarding` → **303 `/login`**, `Cache-Control: private, no-cache` ✓; unauth `/bookings` → 303 `/login` (regression ✓).

**Remaining — user browser smoke (needs login + live DB):** log in as the gated (not-onboarded) MUA → forced to `/onboarding` at step 1 with prefill; Continue stays disabled until identity fields are valid; save step 1 → toast, step 2 renders; pick deposit + upload QR, save step 2 → step 3 placeholder; reload `/onboarding` → resumes at step 3; DB check `mua_configs` = `onboarding_step` 2 + fields persisted (`studio_name`, `whatsapp_number`, `deposit_mode`, `deposit_value`, `duitnow_qr_url`); `/bookings`/`/settings` still 303 → `/onboarding` mid-wizard; backfilled MUA `/onboarding` → `/bookings`.

No new decision ticket — copy location (wizard-owned `steps.ts`) and back-only stepper dots are build-level details recorded here; map.md unchanged.
