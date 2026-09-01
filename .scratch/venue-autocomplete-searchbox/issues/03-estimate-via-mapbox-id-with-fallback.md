# 03 — Travel Fee Estimate via mapbox_id with string fallback

**What to build:** As a Client who picked a Venue Suggestion (or typed free-form), I can hit Estimate and see a Travel Fee Estimate (distanceKm, computedFee, venueName) computed from the exact picked place's coordinates, with cache and cooldown, and the booking later persists canonical venue coordinates.

**Blocked by:** 01 — Expand suggest proxy to Search Box v1, 02 — Public estimator Venue shape and session lifecycle

**Status:** resolved

- [x] `POST /api/estimate-travel` accepts `{mapboxId?, venue?, session_token?, baseLat, baseLng, ratePerKm}`; when `mapboxId` present it calls `retrieve` with same `session_token` to get `destLng/destLat` + `venueName`, then Directions; when only `venue` string present it falls back to geocoding `geocoding/v5/.../{venue}.json?country=my&limit=1` then Directions
- [x] Return shape stays `{success, distanceKm, computedFee, venueName}` plus optional `venueLat/venueLng` when via retrieve; `distanceKm = (meters/1000).toFixed(1)`, `computedFee = distanceKm*ratePerKm`
- [x] Client caches estimates by `mapbox_id` (Map<mapbox_id→{distanceKm,computedFee,venueName}>) — re-estimating same pick is instant; 3s cooldown on Estimate still enforced
- [x] When a booking is secured from a picked suggestion, `bookings.venue_address` is stored as retrieve `full_address` and `venue_lat/lng` as retrieve coordinates (no schema migration; columns exist) — verified by DB row after checkout

## Answer
Implemented in commits 432691d, 2fad1b2, a889cee. Verification: svelte-check 0 errors, session_token billing, Malaysia centroid bias, mapbox_id shape, cache/cooldown preserved. See diff 034fe50...a889cee.
