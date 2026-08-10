# 05 — Wizard steps 3–5 (packages, optional extras, reveal) + completion

**What to build:** the rest of the wizard and the moment it completes. Step 3 — packages: add/list/remove packages with ≥1 required. Step 4 — optional extras: Telegram alerts (with test), travel fee (reusing the travel field from ticket 03), working hours, break — skippable, and skipping counts as completing. Step 5 — the reveal screen: the booking page link (`muasuites.com/{slug}`) with copy button, labelled "Your booking page", plus the corrected what-happens-next copy (clients check availability → WhatsApp the MUA → MUA sends a booking link for the deposit → MUA approves receipts). Finishing or skipping step 4 writes `onboarding_step = 4` and `onboarded_at` together, permanently turning the gate off; the reveal screen is informational only, and finishing lands on the dashboard.

**Blocked by:** 03 — settings travel-fee section; 04 — wizard steps 1–2.

**Status:** resolved

- [ ] Package step requires ≥1 package; save writes packages and `onboarding_step = 3`.
- [ ] Optional step: both "Save" and "Skip for now" complete it; travel fee field comes from the shared travel component (ticket 03).
- [ ] Completing or skipping the optional step writes `onboarding_step = 4` and `onboarded_at` in a single update (verified in DB rows).
- [ ] Reveal screen shows the booking page link + copy button and the corrected what-happens-next copy; no checkout-link wording.
- [ ] After finishing: the gate is off — dashboard reachable; the public page renders the final saved data.
- [ ] An onboarded MUA visiting `/onboarding` is redirected to the dashboard (gate off stays off).
- [ ] Teaching copy matches the locked content from decision 02; `npm run check` — no new errors.

Reference: decisions 01 + 02 in `.scratch/onboarding-flow/decisions/`; locked copy in the prototype asset.

## Answer

Steps 3–5 + completion built; all static gates green (see Verification).

**Step 3 — packages (`+page.svelte`):** `<PackageForm {supabase} {userId} bind:packages removable />` — the shared component writes package rows immediately on add/remove (its own DB calls, same as settings) and pre-fills from the server load; the step's Continue is gated on `packages.length >= 1` and its save is a single `mua_configs` update `{ onboarding_step: 3 }` plus `invalidateProfileCache(slug)` (packages drive the public page).

**Step 4 — optional extras (skippable, and skipping counts as completing — decision 01):**
- Fields: `TelegramField` (with the same `/api/test-telegram` callback as settings), `TravelFeeField` (the ticket-03 shared component, bound to `base_place_name`/`base_lat`/`base_lng`/`rate_per_km`), `WorkingHoursField` (defaults 08:00–18:00), `BufferField` (chips none/15/30/45/60). All prefill from the config row.
- **Save** → one update: extras + `transport_formula: 'PER_KM'` + `onboarding_step: 4` + `onboarded_at: now` — completion written atomically with the step (never a separate call), then cache invalidation.
- **Skip for now** → one update: `{ onboarding_step: 4, onboarded_at: now }` only — never writes the extras, so pre-existing values survive (partial-update principle from ticket 04).
- Footer on this step: [Back] [Skip for now] [Save]; Save is always enabled (optional step).

**Step 5 — reveal (informational only, no persisted state — decision 01):** checkmark, "You're all set!", link box labelled **"Your booking page"** showing `muasuites.com/{slug}` + Copy (copies `https://muasuites.com/{slug}` — the box is the booking *page*, never a checkout link, per the decision-02 corrected copy), the locked "What happens next" copy (clients check availability → WhatsApp the MUA → MUA sends a booking link from the dashboard for the deposit → MUA approves receipts), and Finish → `goto(resolve('/bookings'))` — the gate is already off, so the dashboard loads.

**Eslint note (within-effort):** `svelte/no-navigation-without-resolve` requires the navigation argument to be `resolve()` from `$app/paths` — used that import; pre-existing violations remain in `login/+page.svelte` and `(auth)/bookings/all` (untouched, per instructions).

**Verification:** `npm run check` — 0 errors, 13 warnings (pre-existing baseline, none in touched files). Eslint + prettier clean on the touched file. Dev smoke on 5177 (server killed after): unauth `/onboarding` → **303 `/login`** with `private, no-cache` ✓; `/bookings` and `/settings` regressions ✓.

**Remaining — user browser smoke (needs login + live DB):** gated MUA through steps 3–5 — add ≥1 package (removable list), Continue; on step 4 test Save *and* Skip paths (skip must still complete); reveal shows the booking page link + copy works; Finish → dashboard reachable (gate off, stays off on reload); DB check `mua_configs` = `onboarding_step` 4 + `onboarded_at` set, packages rows present; public page reflects final data; backfilled MUA `/onboarding` → `/bookings`.

No new decision ticket — the `resolve()` import is the eslint rule's requirement, recorded here; map.md unchanged.
