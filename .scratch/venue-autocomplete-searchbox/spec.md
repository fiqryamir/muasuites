# Spec — Venue autocomplete parity with Mapbox Search Box sandbox

Status: ready-for-agent

## Problem Statement

A Client visiting an MUA profile page uses the Travel Fee Estimate card to preview the road cost from the MUA's Base Location to their Venue. The card's Venue Suggestion dropdown (and the MUA's own Base Location picker in onboarding/settings) does not match the Mapbox Search Box sandbox. For Malaysian queries like `damansara`, the sandbox at `search/searchbox/v1/suggest` returns 4–5 relevant hits (e.g., Damansara City Mall) even with an irrelevant `proximity=-73.99,40.74` (Manhattan), while the app's `GET /api/search-location?q=damansara` returns nothing. Both the public estimator (`/[mua_slug]/+page.svelte`) and the dashboard picker (`TravelFeeField`) call the same legacy proxy, so MUAs also struggle to set a Base Location and Clients cannot get a Travel Fee Estimate or a pre-filled WhatsApp inquiry.

Underneath, the proxy at `GET /api/search-location` calls legacy `geocoding/v5/mapbox.places` with only `autocomplete=true&country=my&limit=5`, no `proximity` or `session_token`, and strips everything to `{text, place_name, center}`. `POST /api/estimate-travel` then re-geocodes the raw Venue string (`limit=1`) instead of reusing the picked suggestion's coordinates, wasting a call and drifting (e.g., "Damansara Heights" → toll plaza). `GET /api/retrieve-location` already speaks Search Box `retrieve` but uses a hardcoded `session_token=mua-suites` and is never called. The result is inconsistent Venue Suggestions, no geographic bias to Malaysia, and no billing-efficient suggest→retrieve flow.

## Solution

Replace the legacy geocoding path with Mapbox Search Box v1 `suggest` + `retrieve` behind the same internal proxy surface. `GET /api/search-location` becomes a suggest proxy that sends `q`, `session_token` (per-page UUID), `proximity=101.9758,4.2105` (Malaysia centroid), `country=my`, `language=en`, `limit=5`, and a `types` filter branched by caller (Venue = all types; Base Location = place/locality/postcode/district). It returns `mapbox_id`-keyed Venue Suggestions shaped for the UI (`mapbox_id`, `name`, `full_address`, `place_formatted`). Selecting a Venue Suggestion drives `POST /api/estimate-travel` via `mapboxId` → server-side `retrieve` → Directions, skipping the string geocode; free-form input without a pick falls back to geocoding `limit=1`. The server-side retrieve validates the place, yields canonical coordinates and `full_address`, feeds Directions, and (when booked) persists `venue_lat/lng` from retrieve. A per-page-load `session_token` shared across suggest→retrieve/estimate makes the pair bill as one. Debounce, 3-char minimum, limit, cooldown, and empty-state messaging are preserved but keyed to `mapbox_id`.

## User Stories

1. As a Client, I want Venue Suggestions to appear for "damansara" and match the sandbox, so that I can find my area.
2. As a Client, I want Venue Suggestions biased to Malaysia, so that Damansara ranks above Manhattan when my IP is foreign/VPN.
3. As a Client, I want Venue Suggestions for "KLCC" to include KLCC POIs/addresses, not distant US places, so that I trust the estimator.
4. As a Client, I want Venue Suggestions for "Aeon" to be Malaysian Aeons (neutral centroid), so that I see relevant malls.
5. As a Client typing fewer than 3 characters, I want no search fired, so that I am not spammed with partial matches.
6. As a Client typing, I want debounced search (≈300ms public, ≈400ms picker), so that fast typing does not flood the API.
7. As a Client, I want at most 5 Venue Suggestions, so that the dropdown stays scannable.
8. As a Client who selected a Venue Suggestion, I want the Travel Fee Estimate to compute via that exact place's coordinates (not a re-geocoded guess), so that the fee matches my pick.
9. As a Client who typed free-form "Hotel Grand Horizon JB, Level 3" and hit Estimate without picking, I want the estimator to still geocode the string and return a distance, so that I am not forced to pick.
10. As a Client who sees 0 Venue Suggestions, I want an inline hint "No places found — try broader area like 'Damansara, Petaling Jaya'", so that I know how to recover.
11. As a Client who hits a network error, I want a toast error, so that I know retry is possible.
12. As a Client, I want the estimated distance/fee and resolved venue name shown inline after a successful estimate, so that I can decide to inquire.
13. As a Client, I want the resolved venue name/fee appended to the WhatsApp inquiry link, so that the MUA sees where I am.
14. As a Client, I want repeated estimates for the same place to be cached (by mapbox_id) and not re-hit Directions, so that the UI feels instant.
15. As a Client, I want a 3s cooldown on Estimate to prevent accidental double taps, so that I do not create duplicate calls.
16. As an MUA setting Base Location in onboarding, I want Base Location picker to suggest Malaysian places/localities (not individual shops) with the same MY centroid bias, so that I can set my studio base quickly without picking a POI as my origin.
17. As an MUA in Settings, I want the same Base Location picker behavior as onboarding (shared component), so that edits feel consistent.
18. As an MUA with no Base Location yet, I want the picker to still bias to Malaysia centroid, so that my first search is not empty due to no origin.
19. As an MUA viewing the public page, I want my Leaflet base marker unchanged, so that travel UI changes do not break the map.
20. As an MUA with a set Base Location and rate, I want Clients' Travel Fee Estimates computed from my base via Directions, so that fees reflect my advertised rate.
21. As a Client whose MUA has no Base Location or rate=0, I want the estimator card hidden, so that I am not shown a broken calculator.
22. As a system, I want suggest→retrieve/estimate pairs billed as one via a shared session_token per page load (rotated after retrieve/10min idle), so that Mapbox costs stay predictable.
23. As a system, I want language=en and country=my on every suggest call, so that results are English Malaysian places.
24. As a system, I want the proxy to keep the Mapbox access token private (never exposed to the client), so that secrets are not leaked.
25. As a MUA, I want the Booking's venue_address stored as the canonical full_address from retrieve and venue_lat/lng persisted from retrieve coordinates, so that confirmations/directions are precise.
26. As a Client booking through a Booking Link with an explicit Venue, I want that Venue also validated via the same retrieve path when it came from a suggestion, so that venue coordinates are correct at checkout.

## Implementation Decisions

- **ADR-0004 is binding:** Migrate from `geocoding/v5` to `search/searchbox/v1/suggest` + `retrieve`. Keep `geocoding/v5` only as internal fallback for free-form string when no mapbox_id is present (estimate-travel). This is hard-to-reverse (contract change) and explains why the app now matches the sandbox.
- **Proxy contract — suggest:** `GET /api/search-location` becomes a Search Box suggest proxy. Query params sent to Mapbox: `q` (encoded), `session_token` (per-page UUID, required), `proximity=101.9758,4.2105` (Malaysia centroid, fixed for both Venue and Base Location per product decision Q8), `country=my`, `language=en`, `limit=5`, `types` branched by caller. Branching is done via an extra proxy param `types=venue|base` or via referer header inference; the proxy maps `venue`→no `types` restriction (allow poi/address/street/place) and `base`→`types=place,locality,postcode,district`. The response maps Mapbox's `suggestions[]` to a stable internal shape:
  ```ts
  type VenueSuggestion = {
    mapbox_id: string // dXJuOm1ieHBvaTo...
    name: string // name
    full_address: string // full_address
    place_formatted: string // place_formatted
    feature_type: string // feature_type
    // center not sent; coordinates come via retrieve
  }
  ```
  The old `{text, place_name, center}` shape is retired. Clients store `mapbox_id` on selection.
- **Proxy contract — retrieve:** `GET /api/retrieve-location` keeps path `search/searchbox/v1/retrieve/{mapboxId}?session_token=...&access_token=...`. It now requires `session_token` forwarded from the caller (per-page UUID), no longer hardcoded `mua-suites`. It returns `{success, lng, lat, name, full_address, place_formatted}` derived from `features[0].geometry.coordinates` and address fields. It shares the session_token with the preceding suggest call.
- **Estimate contract:** `POST /api/estimate-travel` accepts a union:
  ```ts
  { venue?: string; mapboxId?: string; session_token?: string; baseLat: number; baseLng: number; ratePerKm: number }
  ```
  Preferred path: `mapboxId` present → server calls `retrieve` (with forwarded `session_token`) → `destLng/destLat` + `venueName=full_address.split(',')[0] | name`. Fallback path: only `venue` string → server geocodes `geocoding/v5/.../ {venue}.json?country=my&limit=1`. Then both paths call `directions/v5/.../{baseLng,baseLat};{destLng,destLat}?overview=false` as today. Return shape unchanged `{success, distanceKm, computedFee, venueName, venueLat?, venueLng?}` but `venueLat/lng` added when retrieve succeeded. `venueName` prefers `full_address`'s first segment for POIs.
- **Session lifecycle:** Client generates `session_token = crypto.randomUUID()` onMount per page (public page and TravelFeeField each own one). The token is sent on every `suggest` call and on the subsequent `retrieve`/`estimate-travel` that consumes the pick. After a successful `retrieve`/`estimate` the client rotates the token (`crypto.randomUUID()`) and after 10 minutes of idle (no input) — matching Mapbox's session billing window. This replaces the static token and makes suggest→retrieve bill as one.
- **Bias decision (deliberate deviation):** Both pickers use MY centroid `101.9758,4.2105`, not MUA `base_lat/lng`, even though MUA bias would rank nearby Aeons first for a JB-based MUA. Product chose neutral centroid so that a generic "Aeon" query does not hide far-away-but-exact Damansara matches. Revisit if Clients report distant-first for generic terms — it is a one-param change in the proxy.
- **Types branching:** Public Venue search needs POIs (malls, hotels) so no restrictive types; Base Location search restricts to administrative types to prevent picking a single shop as the studio origin. The restriction lives server-side so clients cannot bypass it.
- **Debounce/cache/cooldown (preserve):** Public `DEBOUNCE_MS=300`, picker `400`, min 3 chars, limit 5, estimate cooldown `COOLDOWN_MS=3000`. Cache changes: suggest responses are not cached server-side; client caches `Map<mapbox_id → {distanceKm,computedFee,venueName}>` for estimates and `Map<query → VenueSuggestion[]>` for suggests keyed by `q+types+session_token` in memory only. Old `publicMapboxCache` keyed by `queryClean` is replaced by `mapbox_id` key.
- **Empty/error UX:** When `suggestions` is `[]` and `q.length>=3` after a non-error response, render inline hint under the input: "No places found — try broader area like 'Damansara, Petaling Jaya'". Network/5xx still toasts "Could not load location suggestions." / "Failed to calculate travel fee." via `svelte-sonner` as today. Estimate with 0 suggestions does not block typing; free-form fallback still available.
- **Persistence:** When a booking is secured with a Venue that came from a suggestion, `bookings.venue_address` is written as the retrieve `full_address` (canonical) and `venue_lat/lng` as the retrieve coordinates. The checkout flow (`secure_checkout_slot` RPC) today takes `p_venue_address text` only; the SvelteKit action that calls it should include `venue_lat/lng` in the `bookings` insert after the RPC or extend the RPC's optional params. No schema migration needed — columns already exist (`bookings.venue_lat double precision`, `venue_lng`).
- **Modules modified (no file paths in spec, logical modules):** The search-location proxy, the retrieve-location proxy, the estimate-travel proxy, the public MUA profile venue estimator UI, the shared Base Location field component (used in onboarding and settings), the session_token lifecycle helper, and the booking creation path that persists venue coordinates. No new database tables; no change to `secure_checkout_slot` row locking or capacity checks.
- **Configs:** No new env vars; reuse `MAPBOX_ACCESS_TOKEN` private. Cloudflare Workers adapter unchanged.

## Testing Decisions

- **What makes a good test:** Assert externally observable behavior (HTTP contract, UI state, DB row) — not implementation details. Mock the Mapbox fetch boundary, not internal helper names. A test that would survive a rename of an internal function but break on a changed request param or displayed string is a good test. Implementation-detail tests (e.g., "called helper X with args Y") are rejected.
- **No existing test framework:** The repo has no vitest/playwright/jest harness (`package.json` scripts are dev/build/check/lint only; `vite.config.ts` has no test section). Prior specs (onboarding-flow, free-tier-infra) verified at two seams without a harness:
  - Route-level SSR smoke: `curl`/dev-server checks that gated routes redirect and API routes return shapes.
  - DB-row inspection: run `scripts/sync-supabase.mjs` or direct Supabase query to confirm rows after mutations.
  Follow the same seams — do not introduce a new test framework in this effort. If a harness is added later, the same seams upgrade to `vitest` request-handler tests with an injected fetch mock.
- **Seam chosen — single highest seam: the SvelteKit API layer (`/api/search-location`, `/api/retrieve-location`, `/api/estimate-travel`) plus the client estimator UI as a thin consumer.** This single seam covers proxy param construction, session_token forwarding, types branching, retrieve→directions chaining, and fallback. All behavior visible to Client/MUA passes through it. The ideal number is one — we keep it at one.
  - **API seam (preferred, test without browser):** With `fetch` mocked, `GET /api/search-location?q=damansara&session_token=<uuid>` asserts Mapbox was called with `search/searchbox/v1/suggest?q=damansara&session_token=<same-uuid>&proximity=101.9758,4.2105&country=my&language=en&limit=5` and that the response maps to `{mapbox_id, name, full_address, place_formatted}`. `GET /api/retrieve-location?id=<mapbox_id>&session_token=<uuid>` asserts `retrieve/<mapbox_id>?session_token=<same-uuid>`. `POST /api/estimate-travel {mapboxId, session_token, baseLat, baseLng, ratePerKm}` asserts retrieve was called before directions and that the fallback path calls `geocoding/v5/...?country=my&limit=1` when no mapboxId is present. Error paths assert 5xx/toasts shapes.
  - **UI seam (thin, manual/dev smoke when API seam is not harnessed):** Type "damansara" → 5 suggestions appear matching sandbox; pick one → estimate shows fee; clear → inline hint for 0 results; free-form without pick → estimate still succeeds via fallback. Matched to prior art for `svelte-check` + manual route verification.
- **Prior art to copy:** `onboarding-flow/spec.md` Testing Decisions (gate route-level checks + DB-row inspection), `free-tier-infra` auth-gating verification style. Use `svelte-check` and `eslint` as static gates on touched files (`npm run check`).
- **Out-of-harness verification checklist (runs without framework):** `GET /api/search-location?q=damansara&session_token=...` returns 5 Malaysian hits; `GET` with `q=ab` returns `{features:[]}` / `{suggestions:[]}`; `POST /api/estimate-travel` with `mapboxId` returns `distanceKm/computedFee/venueName` and same `session_token` reused; free-form without pick returns fee via geocode fallback; 0-result query shows inline hint; booking row after checkout has `venue_lat/lng` non-null when picked.

## Out of Scope

- Switching the bias from MY centroid to per-MUA `base_lat/lng` weighting — decided against in Q8; deferred until Client feedback shows distant-first for generic terms like "Aeon".
- Changing the Mapbox access token management, Cloudflare Workers adapter, or Supabase auth.
- Altering `secure_checkout_slot` locking, capacity checks, blackout dates, or plan limits.
- Reworking the Leaflet studio map, calendar availability logic, or pricing display.
- Introducing a new automated test framework (vitest/playwright) — tracked separately; this effort verifies at existing route + DB-row seams.
- New UI chrome for the estimator card beyond the inline empty hint and existing toasts.
- Storing route polylines, ETA, or multi-leg travel.

## Further Notes

- The reference sandbox request that motivated the fix is `GET https://api.mapbox.com/search/searchbox/v1/suggest?q=damansara&session_token=<uuid>&proximity=-73.990593,40.740121&access_token=...` which returned 5 Malaysian Damansara hits in the sandbox but `[]` in the app's legacy proxy, confirming API drift. The chosen `proximity` is the Malaysia centroid `101.9758,4.2105`, not the sandbox's NYC value.
- The existing `GET /api/retrieve-location` used a static `session_token=mua-suites`; the new lifecycle rotates a UUID per page load and forwards it, so suggest→retrieve is billed as one per Mapbox docs.
- The `bookings.venue_lat/venue_lng` columns already exist (`supabase-state.md` captured 2026-08-16); no migration is needed to persist coordinates from retrieve.
- If Mapbox returns feature_type values the UI does not expect, the proxy passes them through and the UI treats any suggestion uniformly (name + full_address).
- Follow-up ticket to consider per-MUA bias weighting for generic queries, if needed.

