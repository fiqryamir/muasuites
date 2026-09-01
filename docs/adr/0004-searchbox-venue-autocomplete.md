# Search Box v1 for Venue Suggestions

MUA profile and Base Location autocomplete returned empty or off-target results for Malaysian queries like `damansara` because `GET /api/search-location` used legacy `geocoding/v5` with no proximity bias and no session handling; Mapbox's Search Box sandbox (`search/searchbox/v1/suggest`) returned correct results even with a NYC proximity, proving the mismatch was API drift. We migrate the suggest proxy to `search/searchbox/v1/suggest` plus `retrieve`, using a per-page-load `session_token` shared across suggest→retrieve/estimate for correct billing, `country=my`, `limit=5`, `language=en`, `proximity=101.9758,4.2105` (Malaysia centroid) for both Venue and Base Location pickers, and `mapbox_id`-based retrieve for Travel Fee Estimates.

Considered Options:
- Keep `geocoding/v5` and just add `proximity` — rejected: legacy endpoint, weaker Malaysian POI ranking, no `session_token` cost saving, still diverged from sandbox.
- Bias public estimator to MUA `base_lat/lng` — rejected for now per product decision to keep neutral Malaysia bias; re-evaluate if Clients report distant results for generic queries like `Aeon`.
- Send `center` directly from client — rejected: unverified coordinates; `retrieve` validates the canonical place and gives `full_address` + `distance` consistently.

Consequences:
- `/api/search-location` changes shape from `{text, place_name, center}` to `{mapbox_id, name, full_address, place_formatted}`; both `TravelFeeField` and `[mua_slug]/+page.svelte` must update. `estimate-travel` accepts `{mapboxId}` (preferred, calls `retrieve`) with string geocode fallback for free-form input, persists `venue_lat/lng` from retrieve. `proximity` is now centroid-only; future per-MUA bias is a one-param change. Static `session_token=mua-suites` is replaced by a UUID rotation.
