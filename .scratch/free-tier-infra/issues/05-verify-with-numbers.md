# 05 — Verify with numbers

**What to build:** end-to-end verification that the public + auth surface stays within free-tier limits after all changes, with before/after metrics recorded against the infrastructure report's baseline.

**Blocked by:** 01 — Move auth gating server-side; 02 — Prerender the landing page; 03 — Bot & scanner triage in the request hook; 04 — Cloudflare dashboard protection checklist.

**Status:** claimed

Related: report re-verification (`INFRASTRUCTURE_CAPACITY_REPORT.md` §10–12), [Measurement](../map.md).

- [ ] Landing page requests show zero Worker invocations / zero CPU in observability.
- [ ] Auth redirect flows verified in a regular browser and a mobile WebView.
- [ ] Bot triage verified: a rude/scanner-spoofed user-agent gets a minimal response; a Google-style user-agent still gets full pages.
- [ ] AI-crawler policy verified: a GPTBot-style user-agent still reaches the landing/public profiles; googlebot allowed; Google-Extended disallowed (robots.txt check).
- [ ] Dashboard rules verified: real magic-link login works and Instagram in-app browser loads unchallenged.
- [ ] Before/after numbers recorded (Worker requests/day, CPU, cache hits, blocked-bot counts) and compared to free-tier thresholds (100K requests/day, 10ms CPU).
- [ ] Regression pass: public profile, booking funnel, balance page, dashboard, and settings all functional.
