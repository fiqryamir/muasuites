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

Goal: the public + auth surface of MUAsuites stays inside Cloudflare Workers + Supabase free-tier limits. Landing page becomes a static edge asset (zero Worker cost), auth moves to server-side gating, bot/scanner traffic is triaged cheaply, all decisions locked — resolve the build one ticket at a time.

The wayfinder map is fully charted and every decision is resolved, so this is now a BUILD session, not a planning session.

Do this now:
1. Load the map (.scratch/free-tier-infra/map.md) and the ticket list under .scratch/free-tier-infra/issues/.
2. The frontier (open, unblocked, unclaimed) is currently: 01 — Move auth gating server-side, 03 — Bot & scanner triage in the request hook, 04 — Cloudflare dashboard protection checklist (a HUMAN checklist — hand it to the user, you can't click Cloudflare).
3. CLAIM the first frontier ticket in order — set `Status: claimed` in that ticket file NOW, before any work.
4. Resolve it fully: implement, verify with `npm run check` and `npm run lint` (dev `npm run dev` smoke-test is fine), then append `## Answer` to the ticket, set `Status: resolved`, and update map.md's Decisions-so-far if any new decision ticket was needed.
5. When a ticket is done, move to the next frontier ticket.

Technical facts for ticket 01 (Move auth gating server-side):
- Today src/routes/+layout.server.ts runs safeGetSession() for EVERY page, including the fully-static landing page (src/routes/+page.svelte) and all public routes — that's the per-request auth cost this effort eliminates.
- (dashboard)/+layout.svelte gates CLIENT-side only (goto('/login') after render); (dashboard)/bookings/all/+page.server.ts returns empty data when unauthenticated.
- Target shape (per decisions, spec, and the auth-hardening decision in decisions/03-...md): move session resolution into an `(auth)` subtree with a server layout that 303-redirects unauthenticated requests to /login BEFORE rendering; /login stays outside that subtree but server-redirects already-authed MUAs to the dashboard; the public tree (/, [mua_slug], [mua_slug]/[token], pay/balance/[token]) no longer runs auth in server loads.
- Preserve all page consumers of page.data.supabase / page.data.session — check every usage before and after the move (root +layout.svelte's auth-state subscription likely moves into the auth subtree).

Do NOT read .env or commit secrets. Do NOT modify anything outside this effort without asking (in particular the auth/payment logic in the booking funnel, api/*, and supabase/*). If you hit the known deploy blocker (MAPBOX_ACCESS_TOKEN missing from .env breaks `npm run build`), note it and keep working with dev/svelte-check verification — don't try to fix unrelated API files.

Resolve only ONE ticket per session unless a research step needs a subagent. Give the user a concise final summary: which ticket was claimed/resolved, the answer you recorded, and the new frontier.
```
