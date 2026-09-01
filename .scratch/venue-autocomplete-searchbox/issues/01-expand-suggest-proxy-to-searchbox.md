# 01 — Expand suggest proxy to Search Box v1

**What to build:** As a Client or MUA, when I query the location search (Venue or Base Location) with `damansara`, I get Malaysian Venue Suggestions matching the Mapbox Search Box sandbox instead of an empty list, because the internal proxy now speaks `search/searchbox/v1/suggest` + `retrieve` with correct bias and billing.

**Blocked by:** None — can start immediately

**Status:** resolved

- [x] `GET /api/search-location?q=damansara&session_token=<uuid>&types=venue|base` proxies to `https://api.mapbox.com/search/searchbox/v1/suggest?q=damansara&session_token=<same uuid>&proximity=101.9758,4.2105&country=my&language=en&limit=5` with `types` branched (Venue = no restriction, Base = `place,locality,postcode,district`) and maps `suggestions[]` to `{mapbox_id,name,full_address,place_formatted,feature_type}` — `q=damansara` returns 5 Malaysian hits like Damansara City Mall matching sandbox
- [x] `GET /api/retrieve-location?id=<mapbox_id>&session_token=<same uuid>` forwards `session_token` to `retrieve/<mapbox_id>?session_token=<uuid>&access_token=...` and returns `{lng,lat,name,full_address,place_formatted}` — no longer hardcoded `mua-suites`
- [x] Short queries `q` < 3 chars still return `{suggestions:[]}` without calling Mapbox; token stays private server-side
- [x] Backward compatible during expand: old callers without `mapbox_id` shape do not break (proxy still returns success); `svelte-check` passes on touched files

## Answer
Implemented in commits 432691d, 2fad1b2, a889cee. Verification: svelte-check 0 errors, session_token billing, Malaysia centroid bias, mapbox_id shape, cache/cooldown preserved. See diff 034fe50...a889cee.
