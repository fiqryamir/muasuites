# 05 — Pin the bot-protection defaults

**Type:** grilling (HITL)
**Status:** resolved

## Question

Given the locked moderate posture, what exactly goes into the code-side blocklist and the /login rate-limit rule? Resolve, concretely:

1. **Blocklist composition for the hooks triage** — which user-agents (AI-training crawlers vs spam/scanner bots), which scanner path patterns, and the balance: aggressive enough to protect quota, lenient enough to never clip a real Client or search engine.
2. **robots.txt policy** — the exact AI-training crawler `Disallow`/`Allow` structure that keeps Google/Bing crawling public profiles.
3. **Dashboard rule shapes** — the rate-limit rule for `/login` (threshold/period and Challenge-vs-Block) that protects the magic-link endpoint without tripping real MUAs logging in, plus whether the landing page needs its own rule. Verify what the Cloudflare free plan actually includes (Bot Fight Mode, Browser Integrity Check, number of rate-limit rules) so nothing lands in a paid tier.

## Answer

All four sub-parts were resolved by grilling the human (with Cloudflare free-plan facts verified via research):

1. **AI crawler policy — keep them all.** AI crawlers give the landing page and MUA public profiles visibility in AI suggestions, and the pages they crawl are the system's cheapest (landing becomes a static edge asset; public profiles are KV-cached — cache hit ≈ 14ms CPU, 0 DB queries). Worst-case full re-crawl by ~10 polite crawlers ≈ 3K req/day against a 100K/day quota (~3%). So: **robots.txt blocks only `Google-Extended`** (training-only; blocking it costs zero search/AI-Overview visibility because Google's search/AI-answer crawler is `googlebot`). All other AI crawlers (GPTBot, ClaudeBot, CCBot, Bytespider, PerplexityBot, OAI-SearchBot, …) and search engines stay allowed.
2. **Code-side UA triage — rude/non-compliant scrapers only.** No curated AI blocklist in hooks. The triage catches only abusive scrapers that ignore robots.txt / spoof-crawl aggressively; matched by cheap substring UA check before any Supabase init. Must never match googlebot/bingbot or common mobile/WebView UAs.
3. **Scanner path filter — core list.** `.php`, `.asp`, `.aspx`, `.env`, `.git`, `/wp-*`, `/xmlrpc.php`, `/config.*` → instant 404.
4. **Dashboard rules.** **Browser Integrity Check** — free, on by default (so it already runs in production today — verify, don't re-enable). **Bot Fight Mode** — free, ON; caveat from docs: free tier is not configurable and "may challenge API or mobile app traffic" — so verify an Instagram in-app WebView session still loads pages; if it gets challenged, that's evidence to disable / revisit (moderate posture wins). **Rate limiting** — free plan allows exactly 1 rule: `URI path == /login`, **>20 requests in 60s → Managed Challenge** (IP-based; real magic-link use submits 1–2× plus redirect GETs, so 20/60s is generous). Landing page needs **no** rule — once prerendered it's a static edge asset outside the Worker.
5. **Free-plan facts (verified):** Bot Fight Mode free & non-configurable; BIC free & default-on; rate limiting free = 1 rule / 10s period / IP characteristic, action Managed Challenge; free WAF = high-impact rules only. Cloudflare is shipping automatic "AI bot policies" (block Training/Agent, keep Search) defaulting Sept 2026 — currently opt-out; revisit this policy as a dashboard toggle when it lands.

## Addendum (2026-08, applied in ticket 04)

The free-tier rate-limit UI is more restrictive than the research assumed above. On the **free plan the `/login` rule is constrained to: period = 10s fixed, action = Block only (no Managed Challenge), duration = 10s after a match; only the request threshold is adjustable, and exactly one rule is allowed**. So the pinned shape in point 4 ("20 requests in 60s → Managed Challenge") cannot be built as-is.

**Resolution:** the `/login` rule was created as **`(http.request.uri.path eq "/login")` → >10 requests in 10s → Block (10s)**, IP-based, single free rule. This preserves decision 05's spirit (never clip real MUAs):

- A real magic-link login is only ~2–4 requests to `/login` in a burst (open + submit POST + email-link GET, maybe a refresh), so >10 in 10s gives 3–5× headroom — real MUAs never trip it.
- 1 req/s sustained still catches scripted hammering (a retry loop exceeds 10 in seconds).
- The block lasts only 10s and self-heals, so even a shared-IP false positive is a 10-second blip, not a ban.
- Browserless bots are already handled by BIC + Bot Fight Mode + the request-hook triage (ticket 03); this rule only needs to catch browser-fingerprint-passing hammerers.

Landing page needs no rule (prerendered static asset, zero Worker) — unchanged.
