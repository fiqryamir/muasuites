# 04 — Cloudflare dashboard protection checklist

**What to build:** the operator applies the pinned free-zone protections in the Cloudflare dashboard and verifies they don't break real Clients, AI crawlers, or search engines.

**Blocked by:** Decision ticket — Pin the bot-protection defaults (`../decisions/05-pin-the-bot-protection-defaults.md`) — **RESOLVED**. None pending — can start immediately.

**Status:** ready-for-agent

Related decisions: [Mechanism split](../decisions/04-mechanism-split.md), [Pin the bot-protection defaults](../decisions/05-pin-the-bot-protection-defaults.md).

- [ ] Browser Integrity Check confirmed ON (free, default-on — verify, don't re-enable); a real mobile in-app browser still loads the landing and public pages.
- [ ] Bot Fight Mode is ON; no false positives on legit visits — especially verify an Instagram in-app WebView session loads unchallenged (free tier is non-configurable and docs warn it "may challenge API or mobile app traffic"; if IG WebView gets challenged, disable and revisit — moderate posture wins).
- [ ] The single free rate-limit rule created: URI path == `/login`, **>20 requests in 60s → Managed Challenge**; real MUAs doing magic-link login are never throttled.
- [ ] All enabled protections confirmed free-plan (no paid-tier features).
- [ ] Results recorded: what was enabled, exact rule shapes, and any blocked lookups seen in analytics.
