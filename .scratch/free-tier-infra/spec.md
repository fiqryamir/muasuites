# Spec — Keep the public + auth surface on Cloudflare free tier

Parent map: `.scratch/free-tier-infra/map.md`

## Problem Statement

The whole product is engineered to run on free infrastructure, but the public-facing entry points still burn the two scarcest free-tier resources. The landing page is rendered by the Cloudflare Worker on every request — even bot/scanner traffic — with the root layout running an auth session check first, so each hit costs Worker request quota and 10ms-class CPU and pays an auth check it never needed. Authentication gating is client-side only, so a logged-out hit to the dashboard still server-renders the shell. Known AI/spam crawlers hammer the landing page and scanner junk hits arbitrary paths, all of it consuming request quota and CPU. The infrastructure report already names Worker CPU time and the public profile/invite routes as the biggest free-tier risks; the landing page is the same problem for the entry route.

## Solution

Serve the public surface so the Worker never has to touch what shouldn't need it, and triage what does reach it at near-zero cost:

- The landing page is prerendered as a static Cloudflare asset at build time and served from the edge — zero Worker invocations, zero CPU, zero auth-check cost on the public layout.
- Authentication becomes server-side: the authenticated area (dashboard, settings) resolves the session in a gated subtree and redirects unauthenticated MUAs to the login page before any HTML renders; the login page redirects already-authenticated MUAs to the dashboard.
- Known bot/scanner traffic is intercepted cheaply before any app code runs — minimal responses for known AI/spam crawler user-agents, instant 404s for scanner junk paths — and robots.txt disallows AI-training crawlers while keeping search engines crawling.
- Free Cloudflare dashboard protections are enabled (by the operator) with the shared, reconciled posture that real Clients opening links from Instagram's in-app browser and Google/Bing crawling are never blocked.
- The result is measured, so the next report records reduces free-tier burn with actual numbers.

## User Stories

1. As an MUA, I want the landing page to be served from the CDN edge without invoking the Worker, so that bot traffic can never erode my free-tier request or CPU budget.
2. As an MUA, I want the landing page to load instantly and consistently, so that every visitor — and every bot that hits it — costs me nothing.
3. As a Client, I want to open my MUA's link inside Instagram's in-app browser and have it load normally, so that I'm never mistaken for a bot and blocked.
4. As a Client, I want to continue opening Booking Links, the balance page, and the MUA's public profile from any device, so that the protections never break the booking flow.
5. As a search engine, I want to crawl the landing page and MUA public profiles, so that MUAs remain findable on Google.
6. As an operator, I want known AI-training and spam crawlers to get a minimal response without any app or database work, so that they cost almost nothing.
7. As an operator, I want scanner junk paths to come back 404 instantly, so that vulnerability scanners and path-guessers consume near-zero CPU.
8. As an MUA, I want the dashboard and settings to be unreachable without a session at the server level, so that my bookings and configuration are never server-rendered to an unauthenticated visitor.
9. As an MUA, I want to be taken to the login page when I visit the dashboard logged out, so that I'm guided to authenticate.
10. As an MUA who is already logged in, I want visiting the login page to take me straight to the dashboard, so that I'm not asked to log in twice.
11. As an MUA, I want all existing dashboard flows — booking list, all bookings, settings, logout — to keep working after the gating moves server-side, so that the change is invisible to me.
12. As an operator, I want visibility into Worker requests, CPU, cache hits, and blocked bot traffic, so that I can confirm we stay within free-tier limits at a glance.
13. As an operator, I want to record before/after numbers across a deploy, so that the effectiveness of these protections is provable, not assumed.
14. As the product, I want no part of this to require a paid Cloudflare or Supabase plan, so that the free-tier goal holds.

## Implementation Decisions

- **Landing page as a static edge asset.** The landing page is prerendered into Cloudflare's static assets at build time and its route is excluded from Worker-run routing, so it is served with zero Worker invocation. This is only safe once the public layout carries no auth work.
- **Auth moves into a gated subtree.** Session resolution and the server-side redirect live only in the authenticated subtree; the login page lives outside it. The public layout no longer reads session state at all. Cookie-less (pre-render / public) requests never run auth.
- **Bot triage at the top of the request hook.** A short-circuit matched against a blocklist of known AI-training and spam-crawler user-agents returns a minimal response before any Supabase client or page rendering; a path filter returns instant 404s for scanner junk. The exact list/thresholds are pinned by the open decision before the build slice runs. Moderate posture: never blanket-block, never challenge real browsers.
- **robots.txt crawler policy.** Disallow AI-training crawler families; keep Google/Bing and other search engines allowed, so MUA public profiles stay indexed.
- **Dashboard protections (operator-operated).** Browser Integrity Check, Bot Fight Mode, and one rate-limit rule covering the login (magic-link) endpoint, shaped so real MUAs logging in and Instagram in-app browsers are never rate-limited. All free-zone features, verified to exist on the free plan before enabling.
- **Measurement.** Workers observability and dashboard analytics give per-route requests/CPU/cache-hits; blocked-bot counts surface through analytics. Verification follows the report's manual test style against the deployed edge.
- **No schema changes.** This effort touches no database schema, no Booking lifecycle, and no payment logic.

## Testing Decisions

The repo has no unit-test framework; the established verification pattern is behavioral testing against the deployed Cloudflare edge (see the infrastructure report's manual test plan). Continue that pattern rather than introducing a framework for this slice.

- **Good test = external behavior on the deployed edge**: a request's status, headers, redirects, and whether it reached the Worker (observability) — not the implementation details inside the hooks.
- **Modules verified**: the request hooks (cache headers + bot triage), the auth redirect behaviour, the prerendered landing output and route exclusions, the robot's policy, and the dashboard rule effects.
- **Prior art**: the report's manual test plan (Tests 1–12) and its curl-based header checks; extend it with bot-UA and scanner-path probes and a before/after metrics table.
- **Test matrix**:
  - Landing page: prerendered output matches production rendering, correct edge-friendly Cache-Control, zero Worker invocations in observability, works in a mobile WebView.
  - Auth: logged-out visit to dashboard/settings redirects (303) to login with no dashboard HTML; logged-in visit to login redirects to dashboard; normal login flow still works.
  - Bot triage: spoofed blocklisted user-agent gets the minimal response without app/DB work; scanner path gets fast 404; Google/Bing-style user agents still get full pages.
  - Dashboard rules: real magic-link login not rate-limited; Instagram in-app browser page loads not challenged.
  - Regression: public profile, booking funnel, balance page, dashboard, settings all functional after the change.

## Out of Scope

- Supabase connection-pool mitigations beyond the existing KV caching (report Phase 3 lazy-load).
- Mapbox geocode/directions KV caching (report Phase 3).
- Database index migration (report §7).
- Any paid upgrade paths.
- Anti-fraud beyond bot traffic for the checkout and payment flows (Slot Hold, Deposit, Balance verification).

## Further Notes

- Baseline for before/after numbers: verified metrics in the infrastructure report (cache hit 14ms CPU, cache miss 50ms CPU; ~11K/day Workers requests projected).
- This spec is the synthesis of the wayfinder decisions in `map.md`; the open decision "Pin the bot-protection defaults" gates the bot-triage and dashboard-rule slices.
- The operator-owned dashboard steps are part of the build — they cannot be done from the codebase alone.
