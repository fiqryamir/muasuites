# 03 — Bot & scanner triage in the request hook

**What to build:** cheap triage at the top of the request hook. Requests from **rude/non-compliant scrapers** (those that ignore robots.txt / hammer-scan) get a minimal response before any Supabase init; **core scanner junk paths** get instant 404s; robots.txt blocks **only Google-Extended** while keeping every other AI crawler and all search engines crawling (policy: keep all AI crawlers — see decision 05).

**Blocked by:** Decision ticket — Pin the bot-protection defaults (`../decisions/05-pin-the-bot-protection-defaults.md`) — **RESOLVED**. None pending — can start immediately.

**Status:** ready-for-agent

Related decisions: [Bot protection posture](../decisions/02-bot-protection-posture.md), [Pin the bot-protection defaults](../decisions/05-pin-the-bot-protection-defaults.md).

- [ ] A request from a configured rude/non-compliant scraper user-agent returns the minimal response immediately, without Supabase client init or page rendering.
- [ ] Core scanner paths (`.php`, `.asp`, `.aspx`, `.env`, `.git`, `/wp-*`, `/xmlrpc.php`, `/config.*`) return 404 fast across all routes, without running loads.
- [ ] robots.txt blocks `Google-Extended` only; GPTBot/ClaudeBot/CCBot/Bytespider/PerplexityBot/OAI-SearchBot and googlebot/bingbot all remain allowed, so landing and MUA public profiles keep AI + search visibility.
- [ ] Real browser traffic — including mobile and common in-app WebView user-agents — is never matched by the triage; public pages still render.
- [ ] Stays within the moderate posture: no blanket blocking, no challenges on real browsers.
