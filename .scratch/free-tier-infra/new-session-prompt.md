# New-session prompt — MUAsuites free-tier infra build

Paste the block below into a fresh agent session to continue this effort. It orients the session, tells it where the work lives, and assigns the recommended first ticket.

---

```
You are continuing the `free-tier-infra` effort in the MUAsuites repo (git repo at repo root).

Orientation — read these first (in order):
1. docs/agents/issue-tracker.md — this repo uses the LOCAL-MARKDOWN issue tracker: issues/models live as files under `.scratch/<effort>/`. There is NO `gh` CLI; don't try to create GitHub issues.
2. CONTEXT.md — the MUAsuites domain glossary (MUA / Client / Booking Link, etc.). Use this vocabulary in everything you write.
3. .scratch/free-tier-infra/map.md — the wayfinder MAP: Destination, locked decisions, Decisions-so-far, fog, out-of-scope.
4. .scratch/free-tier-infra/spec.md — the SPEC (problem, solution, user stories, implementation + testing decisions).
5. .scratch/free-tier-infra/issues/ — the BUILD TICKETS. Each file has "What to build", "Blocked by", and acceptance criteria.

Goal: the public + auth surface of MUAsuites stays inside Cloudflare Workers + Supabase free-tier limits. Tickets 01 (auth moved server-side into the `(auth)` group) and 02 (landing page prerendered as a static edge asset with a `_headers` cache rule) are DONE and committed. Remaining: bot/scanner triage in the request hook (code), the Cloudflare dashboard checklist (human), and measuring the results.

The wayfinder map is fully charted and every decision is resolved, so this is now a BUILD session, not a planning session.

Do this now:
1. Load the map (.scratch/free-tier-infra/map.md) and the ticket list under .scratch/free-tier-infra/issues/.
2. The frontier (open, unblocked, unclaimed) is currently: 03 — Bot & scanner triage in the request hook, 04 — Cloudflare dashboard protection checklist (a HUMAN checklist — hand it to the user, you can't click Cloudflare).
3. CLAIM the first frontier ticket in order — set `Status: claimed` in that ticket file NOW, before any work.
4. Resolve it fully: implement, verify with `npm run check` and eslint on touched files (dev `npm run dev` smoke-test with curl is the verification pattern — spoof user-agents and probe scanner paths), then append `## Answer` to the ticket, set `Status: resolved`, and update map.md's Decisions-so-far if any new decision ticket was needed.
5. When a ticket is done, move to the next frontier ticket.

Technical facts for ticket 03 (Bot & scanner triage in the request hook):
- The triage goes at the TOP of `src/hooks.server.ts` `handle()` — BEFORE the Supabase client init (`createServerClient` currently at line 7) and before page rendering. A matched rude-scraper request returns a minimal Response immediately (no HTML, no app work). The existing route-based Cache-Control rules at the bottom of handle() must keep working for everything else — the triage is a short-circuit in front of them.
- Per decision 05 (decisions/05-pin-the-bot-protection-defaults.md), the UA triage matches ONLY rude/non-compliant scrapers (abusive scrapers that ignore robots.txt / hammer-scan) via cheap substring checks. There is NO curated AI blocklist — GPTBot, ClaudeBot, CCBot, Bytespider, PerplexityBot, OAI-SearchBot and googlebot/bingbot must ALL stay allowed (AI visibility is a feature; landing is a static asset, public profiles are KV-cached).
- The scanner path filter is a fixed core list: `.php`, `.asp`, `.aspx`, `.env`, `.git`, `/wp-*`, `/xmlrpc.php`, `/config.*` → instant 404. Watch for false positives on legitimate paths (e.g. query strings, `/api/...` with `.env`-like segments) — match on pathname only, anchored sensibly.
- robots.txt lives at `static/robots.txt` (already exists, 63 bytes — read it first, then edit): must block ONLY `Google-Extended` (Disallow: / under `User-agent: Google-Extended`) and keep every other crawler (search engines + AI crawlers) allowed, so the landing page and MUA public profiles keep Google + AI visibility. It ships in the static assets — no route work needed.
- Acceptance is behavioral: spoofed rude-scraper UA gets the minimal response; scanner paths get fast 404s; googlebot/bingbot/mobile/Instagram WebView UAs still get full pages (probe /, /login, a [mua_slug] path); robots.txt shows Google-Extended blocked and everything else allowed.
- Hooks smoke-test pattern from prior tickets: start `npm run dev -- --port 5177 --strictPort` as a background process (use cmd.exe wrapper; kill node processes afterward — they hold .svelte-kit locks and break builds), probe with Invoke-WebRequest/curl, then clean up.

Do NOT read .env or commit secrets. Do NOT modify anything outside this effort without asking (in particular the auth/payment logic in the booking funnel, api/*, and supabase/*). If you hit the known deploy blocker (MAPBOX_ACCESS_TOKEN missing from .env breaks `npm run build`), note it and keep working with dev/svelte-check verification — don't try to fix unrelated API files. Known Windows quirks: the adapter's rimraf of `.svelte-kit/cloudflare` intermittently EPERMs (delete the dir, wait ~20s, rebuild); `npm run lint` fails repo-wide on a pre-existing prettier drift — run eslint on touched files only.

Resolve only ONE ticket per session unless a research step needs a subagent. Give the user a concise final summary: which ticket was claimed/resolved, the answer you recorded, and the new frontier.
```
