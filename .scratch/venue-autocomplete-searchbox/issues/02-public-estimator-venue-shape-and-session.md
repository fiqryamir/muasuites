# 02 — Public estimator Venue shape and session lifecycle

**What to build:** As a Client on the MUA profile page, I can type a Venue ("damansara") with 300ms debounce and pick a Venue Suggestion that shows canonical name + full address, and the app's session_token for that pick is managed per page load for correct Search Box billing.

**Blocked by:** 01 — Expand suggest proxy to Search Box v1

**Status:** resolved

- [x] Public MUA profile estimator (`/[mua_slug]` venue input) debounces 300ms, requires ≥3 chars, calls `GET /api/search-location?q=...&session_token=<page-uuid>&types=venue` and renders suggestions as `name` + `place_formatted/full_address` (not `text/place_name`)
- [x] Selecting a Venue Suggestion stores `mapbox_id`, fills input with `full_address`, and triggers Travel Fee Estimate via `mapboxId` path (no re-geocode of the string)
- [x] Per-page-load `session_token = crypto.randomUUID()` generated on mount, sent on every suggest, reused for the subsequent estimate's retrieve, rotated after a successful retrieve and after 10min idle; manual smoke: NYC `proximity` no longer hides Damansara
- [x] `limit=5` dropdown still scannable; no token exposed to client network beyond the internal proxy query param

## Answer
Implemented in commits 432691d, 2fad1b2, a889cee. Verification: svelte-check 0 errors, session_token billing, Malaysia centroid bias, mapbox_id shape, cache/cooldown preserved. See diff 034fe50...a889cee.
