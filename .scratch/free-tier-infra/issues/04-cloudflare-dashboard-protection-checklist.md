# 04 — Cloudflare dashboard protection checklist

**What to build:** the operator applies the pinned free-zone protections in the Cloudflare dashboard and verifies they don't break real Clients, AI crawlers, or search engines.

**Blocked by:** Decision ticket — Pin the bot-protection defaults (`../decisions/05-pin-the-bot-protection-defaults.md`) — **RESOLVED**. None pending — can start immediately.

**Status:** resolved

Related decisions: [Mechanism split](../decisions/04-mechanism-split.md), [Pin the bot-protection defaults](../decisions/05-pin-the-bot-protection-defaults.md).

- [x] Browser Integrity Check confirmed ON (free, default-on — verify, don't re-enable); a real mobile in-app browser still loads the landing and public pages.
- [x] Bot Fight Mode is ON; no false positives on legit visits — especially verify an Instagram in-app WebView session loads unchallenged (free tier is non-configurable and docs warn it "may challenge API or mobile app traffic"; if IG WebView gets challenged, disable and revisit — moderate posture wins).
- [x] The single free rate-limit rule created: URI path == `/login`, **>10 requests in 10s → Block (10s)** (free tier only offers 10s period / Block action / 10s duration — deviation from the original `>20/60s → Managed Challenge` shape, resolved in the decision-05 addendum); real MUAs doing magic-link login are never throttled.
- [x] All enabled protections confirmed free-plan (no paid-tier features).
- [x] Results recorded: what was enabled, exact rule shapes, and any blocked lookups seen in analytics.

## Answer

Operator applied the pinned free-zone protections in the Cloudflare dashboard. Results recorded from the human's execution (this ticket is a human checklist; the agent can't click Cloudflare).

**Enacted:**
- **Browser Integrity Check — confirmed ON** (free, default-on; verified, not re-enabled). Real mobile/in-app-browser loads unaffected.
- **Bot Fight Mode — ON** (free, non-configurable). Verified an **Instagram in-app WebView session loads unchallenged** (no challenge page on landing/public pages) — the decision-05 acceptance gate passed, so BFM stays on.
- **Rate-limit rule — created, single free rule**: expression `(http.request.uri.path eq "/login")`, **>10 requests in 10s → Block (10s)**, IP-based.
- **Free-plan confirmation:** all three are free-tier features (BIC default-on, Bot Fight Mode free, 1 rate-limit rule free); nothing paid was enabled. Landing page gets no rule (prerendered static asset, zero Worker).

**Deviation from decision 05's original shape — resolved upstream:** the free-tier rate-limit UI only allows period 10s, action Block (no Managed Challenge), duration 10s, with an adjustable threshold and exactly one rule. The rule was therefore built at `>10 req/10s → Block (10s)` (threshold tuned down from the max 20 for actual protection). Spirit preserved: real magic-link login is 2–4 requests/burst, the block is a 10s self-healing blip, and browserless bots are covered by BIC + Bot Fight Mode + the ticket-03 hook triage. See the addendum in `../decisions/05-pin-the-bot-protection-defaults.md`.

**Any blocked lookups:** none reported by the operator in Security → Events at enable time (BIC + BFM were already sweeping; blocked-bot analytics recording lands in ticket 05).
