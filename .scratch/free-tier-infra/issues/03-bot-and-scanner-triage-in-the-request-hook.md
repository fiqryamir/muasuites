# 03 — Bot & scanner triage in the request hook

**What to build:** cheap triage at the top of the request hook. Requests from **rude/non-compliant scrapers** (those that ignore robots.txt / hammer-scan) get a minimal response before any Supabase init; **core scanner junk paths** get instant 404s; robots.txt blocks **only Google-Extended** while keeping every other AI crawler and all search engines crawling (policy: keep all AI crawlers — see decision 05).

**Blocked by:** Decision ticket — Pin the bot-protection defaults (`../decisions/05-pin-the-bot-protection-defaults.md`) — **RESOLVED**. None pending — can start immediately.

**Status:** resolved

Related decisions: [Bot protection posture](../decisions/02-bot-protection-posture.md), [Pin the bot-protection defaults](../decisions/05-pin-the-bot-protection-defaults.md).

- [x] A request from a configured rude/non-compliant scraper user-agent returns the minimal response immediately, without Supabase client init or page rendering.
- [x] Core scanner paths (`.php`, `.asp`, `.aspx`, `.env`, `.git`, `/wp-*`, `/xmlrpc.php`, `/config.*`) return 404 fast across all routes, without running loads.
- [x] robots.txt blocks `Google-Extended` only; GPTBot/ClaudeBot/CCBot/Bytespider/PerplexityBot/OAI-SearchBot and googlebot/bingbot all remain allowed, so landing and MUA public profiles keep AI + search visibility.
- [x] Real browser traffic — including mobile and common in-app WebView user-agents — is never matched by the triage; public pages still render.
- [x] Stays within the moderate posture: no blanket blocking, no challenges on real browsers.

## Answer

Cheap bot/scanner triage now runs at the very top of `handle()` in `src/hooks.server.ts` — before Supabase init and page rendering — with robots.txt blocking only Google-Extended.

**What changed:**
- New `src/lib/bot-triage.server.ts` — `isRudeScraper(ua)` and `isScannerPath(pathname)` with the pinned token lists.
- `src/hooks.server.ts` — triage short-circuit at the top of `handle()` (before `createServerClient`): rude-scraper UA → `Response('Forbidden', 403)`; scanner path → `Response(null, 404)`; everything else falls through to the existing Supabase init + bottom route-based Cache-Control rules unchanged (the previously-duplicated `url`/`pathname` at the bottom now reuses the top-level `pathname`).
- `static/robots.txt` — appended `User-agent: Google-Extended` / `Disallow: /`; `User-agent: *` / `Disallow:` (allow-all) kept for every other crawler. Ships via static assets; no route work.

**Pinned lists (per decision 05, "automation toolkits only"):**
- Rude-scraper UA substrings (case-insensitive): `python-requests`, `python-urllib`, `libwww-perl`, `scrapy`, `go-http-client`, `wget`. Deliberately excludes GPTBot/ClaudeBot/CCBot/Bytespider/PerplexityBot/OAI-SearchBot, googlebot, bingbot, mobile browsers and in-app WebViews.
- Scanner path patterns (pathname-only, anchored — query strings stripped by `URL.pathname`, `/api/...` segments can't false-positive):
  `.php`/`.asp`/`.aspx`, `(^|/)\.env($|[./?])`, `(^|/)\.git([/?]|$)`, `(^|/)wp-`, `(^|/)xmlrpc\.php`, `(^|/)config\.(php|json|js|xml|yml|yaml|ini|env|bak|old|txt)`.

**Verification:**
- `npm run check`: 0 errors (13 pre-existing warnings, none in touched files). eslint clean on `hooks.server.ts` + `bot-triage.server.ts` (exit 0; repo-wide `npm run lint` still fails on pre-existing prettier drift).
- Dev smoke test (5177, vite dev): python-requests/python-urllib/libwww-perl/scrapy/go-http-client/wget UAs → **403** `Forbidden` on `/` and `/login`; chrome/mobile/Googlebot/bingbot/Instagram-WebView UAs → **200** full pages on `/`; `/login` → 200; `/bookings`,`/settings` → 303→`/login` with `Cache-Control: private, no-cache` intact; `/login?next=/foo.env` → 200 (query false-positive guard); `/api/cache/invalidate` → 405 (not triaged); scanner paths `.env.local`, `/wp-login.php`, `/wp-admin`, `/xmlrpc.php`, `/config.json`, `/index.php`, `/x.asp`, `/x.aspx` → **fast 404**; robots.txt served with Google-Extended block.
- Production build + `vite preview` (5178; `MAPBOX_ACCESS_TOKEN` dummy injected in shell env only, `.env` untouched): `/.env`, `/.git/config`, `/.git/HEAD`, `/.env.local`, `/wp-login.php`, `/xmlrpc.php`, `/config.json`, `/index.php` → **404 content-len=0** (triage, not a rendered 404 page); rude UA on `/login` and `/bookings` → 403; googlebot/chrome on `/login` → 200. `/` → 200 static for all UAs (prerendered zero-Worker asset — triage correctly never runs there). Triage source confirmed compiled into `.svelte-kit/output/server/entries/hooks.server.js`.
- Build: exit 0.

**Notes:**
- In vite **dev**, `/.env` and `/.git/*` return Vite's own 403 (dev `fs.deny`) before SvelteKit — a dev-only artifact; the production build/preview proves the hook returns 404 for them.
- No new decision ticket was needed (decision 05 pin covers this slice), so `map.md` Decisions-so-far is unchanged.
- Committed: **not** committed, per session preference; changes are in the working tree.
