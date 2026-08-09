# Map — Keep MUASuites on Cloudflare & Supabase free tier

> Effort: `free-tier-infra`

## Destination

The public + auth surface of MUASuites stays inside Cloudflare Workers and Supabase free-tier limits: the landing page is served as a static edge asset with zero Worker cost, authentication is gated server-side, bot/abuse traffic is triaged at near-zero CPU without harming real Clients (Instagram in-app browser) or SEO (Google/Bing). Reaching the end of the map = every decision below is locked and handed off to the build (spec + tickets in this effort).

## Notes

- Domain: MUASuites booking SaaS. Use the glossary in `CONTEXT.md` — MUA, Client, Booking Link, Slot Hold, Deposit, Balance. Avoid: vendor, bride, customer, user.
- Source of truth for limits & verified metrics: the downstream infrastructure report (`INFRASTRUCTURE_CAPACITY_REPORT.md`) — 100K Worker requests/day, 10ms CPU, KV caching verified (14ms CPU on hit, 0 DB queries).
- Skills: `/grilling` and `/domain-modeling` on HITL tickets; `/research` for knowledge gaps; `/to-spec` and `/to-tickets` for handoff.
- Posture (locked): **moderate** — preserve Google/Bing crawling, all AI crawlers (AI-suggestion visibility; cheap on cached/static pages), and Instagram in-app WebView click-throughs; triage only rude scrapers + scanner junk; no blanket blocking.
- Mechanism (locked): code changes live in the repo; the human operates the free Cloudflare dashboard toggles.
- Standing preference: verify against the deployed Cloudflare edge (curl headers, dashboard observability, manual browser/WebView flows), echoed by the report's manual test style (Tests 1–12).

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then zoom the link for the detail -->

- [Serve the landing page without the Worker](decisions/01-serve-the-landing-page-without-the-worker.md) — prerender `/` to a static edge asset (zero Worker invocation); requires the public layout to stop running auth.
- [Bot protection posture](decisions/02-bot-protection-posture.md) — moderate: keep SEO + Instagram in-app browser working; no Under-Attack, no blanket block.
- [Auth hardening boundary](decisions/03-auth-hardening-boundary.md) — session resolution + server-side redirect move into the authenticated subtree; login stays ungated but redirects already-authed MUAs.
- [Mechanism split](decisions/04-mechanism-split.md) — code (prerender, cache headers, UA/scanner triage, robots.txt) in repo; human toggles Browser Integrity Check, Bot Fight Mode, one rate-limit rule.
- [Pin the bot-protection defaults](decisions/05-pin-the-bot-protection-defaults.md) — keep all AI crawlers (visibility for pennies; landing static, profiles KV-cached), robots.txt blocks only Google-Extended; code triage = rude scrapers only; core scanner filter; one free rate-limit rule on `/login` (built as >10 req/10s → Block 10s after the free-tier UI forced 10s period / Block action / 10s duration — see the decision-05 addendum); BIC on, Bot Fight Mode on with IG-WebView verification.

## Not yet specified

<!-- in-scope fog you can't ticket yet; graduates as the frontier advances -->

- **Downstream savings on the other public routes**: once the root layout stops running an auth check, how much headroom the KV-cached public routes (`[mua_slug]`, booking, balance) gain — measured, not assumed; folds into build verification.
- **Cloudflare AI-bot policy defaults**: an automatic "block Training/Agent, keep Search" policy is due to default Sept 2026 (opt-out today) — decide whether to adopt it as a dashboard toggle and retire part of the robots.txt stance.

## Out of scope

<!-- work ruled beyond the destination; closed, never graduates -->

- Supabase connection-pool mitigations beyond the existing KV caching (report Phase 3 lazy-load) — separate effort.
- Mapbox geocode/directions KV caching (report Phase 3) — separate effort.
- Database index migration (report §7) — separation of concern; migration already written, tracked elsewhere.
- Any paid upgrade paths (Supabase Pro, paid Cloudflare plans).
- Anti-fraud for checkout / payment flows (Slot Hold, Deposit, Balance) — this effort covers the public landing + auth surface only.
