# 03 — Settings travel-fee section

**What to build:** the first UI for the travel fee. Settings gains a travel section where the MUA picks their base location (address search through the existing Mapbox search proxy, resolved to coordinates) and sets the rate per km. Saving persists the base coordinates, transport formula and rate on the MUA config. The section is built as a reusable field component so the wizard's optional step can use the same piece.

**Blocked by:** 01 — extract shared form components.

**Status:** resolved

- [ ] Settings shows a travel section; saving persists base location coordinates and rate per km.
- [ ] Base location is chosen via address search (reusing the existing location-search API), not free-typed coordinates.
- [ ] The public booking page's travel estimator reflects the saved base and rate.
- [ ] The travel field is a shared component (per ticket 01 conventions) the wizard can reuse.
- [ ] `npm run check` — no new errors; eslint clean on touched files.

Reference: decision 04 (travel-fee gap finding) in `.scratch/onboarding-flow/decisions/`.

## Answer

Travel fee is now settable from Settings — the first UI for `base_lat` / `base_lng` / `rate_per_km` (and now `base_place_name`).

**1. New shared component — `$lib/components/forms/travel-fee-field.svelte`** (per ticket 01 conventions: `$bindable` props, `Field`/`FieldLabel`, InputGroup styling):
- Props: `bind:placeName` (string), `bind:lat` / `bind:lng` (`number | null`), `bind:ratePerKm` (number).
- Base location is chosen via the existing `/api/search-location` Mapbox proxy — debounced autocomplete (400 ms), suggestions dropdown (same markup as the public page's venue search), selection stores `place_name` + `center` coords; saved location renders as a removable chip; remove resets all three to null/''.
- Rate per km: number input, `min 0`, `step 0.5`, RM addon; string-internal state with `$effect` guards (never emits NaN, re-parses external prefill like `working-hours-field`).
- **Schema addition (within-effort, decision-04 gap):** `mua_configs.base_place_name text NULL` added live via the Management API (`.scratch/onboarding-flow/apply-travel-fields.mjs`, idempotent, same auth pattern as `sync-supabase.mjs`) so the chosen location name persists and pre-fills — required by spec user story 12 (wizard step 4 resume) and the settings section itself. `npm run sync:supabase` re-ran; `docs/agents/supabase-state.md` recaptured (7 tables, `base_place_name` row present).

**2. Settings page** — new Travel section between Payment and Scheduling in the same save form: `<TravelFeeField>` bound to new state; `loadSettings()` pre-fills from the config row; `handleSaveConfig` persists `base_lat`, `base_lng`, `base_place_name` (null when cleared), `transport_formula: 'PER_KM'`, `rate_per_km`. Formula is hard-coded PER_KM because the estimator (`/api/estimate-travel`, public page) only implements distance × rate — no FLAT/ZONES UI introduced. Public-page propagation rides the existing `invalidateProfileCache(slug)` on save — the estimator reads these exact columns via the KV-cached RPC.

**Verification:** `npm run check` — 0 errors, 13 warnings (pre-existing baseline, none in touched files). Eslint clean on both files (used the repo's existing `/* eslint-disable no-useless-assignment */` precedent from `duitnow-qr-field.svelte` for write-only bindables). Dev smoke on 5177: settings + onboarding still 303 to `/login` unauth (routes compile clean).

**Known deploy blocker (pre-existing, not introduced):** `MAPBOX_ACCESS_TOKEN` in `.env` is a 4-char placeholder → Mapbox 401 → `/api/search-location` and `/api/estimate-travel` fail locally (`TypeError ... reading 'map'` on the error body). The component consumes this pre-existing API unchanged; works in production where the real token lives. Not touched per instructions.

**Remaining — user browser smoke (needs login + real Mapbox token):** save the travel section (search a base location, set a rate), confirm the row persists (`mua_configs` gains `base_lat`/`base_lng`/`base_place_name`/`rate_per_km='PER_KM'`), reload → section pre-fills, and the public booking page shows the travel estimator + map for that slug.

No new decision ticket — the `base_place_name` column is a build-level necessity recorded here; map.md unchanged (already lists the travel gap under "Not yet specified").
