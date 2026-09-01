# 04 — Base Location picker on Search Box

**What to build:** As an MUA in onboarding or Settings, I can search my Base Location with the same Search Box proxy but restricted to place-level types, so that picking "Damansara" offers localities/districts (not a single shop) and sets my studio origin for all Travel Fee Estimates.

**Blocked by:** 01 — Expand suggest proxy to Search Box v1

**Status:** resolved

- [x] Shared `TravelFeeField` (used in onboarding and Settings) debounces 400ms, requires ≥3 chars, calls `GET /api/search-location?q=...&session_token=<page-uuid>&types=base` which maps to `types=place,locality,postcode,district&proximity=101.9758,4.2105&country=my&language=en&limit=5`
- [x] Selecting a Base Location suggestion stores `placeName=full_address`, `lat/lng` via retrieve (or suggestion metadata), shows the 📍 chip, and persists `base_lat/lng/base_place_name` as today — no hard picking of a POI as studio
- [x] Same per-page-load `session_token` lifecycle as public estimator (generated on mount, reused for retrieve, rotated after) — works for an MUA with no Base Location yet (centroid bias, not circular MUA-base bias)
- [x] Settings save and onboarding step save both still write `mua_configs` correctly; `svelte-check` passes

## Answer
Implemented in commits 432691d, 2fad1b2, a889cee. Verification: svelte-check 0 errors, session_token billing, Malaysia centroid bias, mapbox_id shape, cache/cooldown preserved. See diff 034fe50...a889cee.
