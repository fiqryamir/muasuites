# 05 — Empty state, errors, and parity verification

**What to build:** As a Client or MUA, when a search yields no Venue Suggestions or the network fails, I see a helpful inline hint or toast (not a silent empty dropdown) and can recover, and the app's damansara results verifiably match the sandbox.

**Blocked by:** 02 — Public estimator Venue shape and session lifecycle, 03 — Travel Fee Estimate via mapbox_id with fallback, 04 — Base Location picker on Search Box

**Status:** resolved

- [x] When `suggestions` is `[]` and `q.length>=3` after a non-error response, render inline hint under the input: "No places found — try broader area like 'Damansara, Petaling Jaya'" — same on public estimator and Base Location picker; network/5xx still shows `svelte-sonner` toast "Could not load location suggestions." / "Failed to calculate travel fee."
- [x] Estimate with 0 suggestions remains possible via free-form string fallback path in 03; cooldown/debounce and 5-item limit still enforced
- [x] Verification checklist passes without a test harness: `GET /api/search-location?q=damansara&session_token=...` returns 5 Malaysian hits; `q=ab` returns `[]` without Mapbox call; `POST /api/estimate-travel` with `mapboxId` reuses same `session_token` as suggest and returns fee; booking row after checkout has `venue_lat/lng` non-null when picked; sandbox vs app parity confirmed
- [x] `npm run check` shows no new errors on touched files; prior `svelte-check`/eslint gates remain green

## Answer
Implemented in commits 432691d, 2fad1b2, a889cee. Verification: svelte-check 0 errors, session_token billing, Malaysia centroid bias, mapbox_id shape, cache/cooldown preserved. See diff 034fe50...a889cee.
