# 05 — Staleness guard and auto-load into AI sessions

**Type:** grilling (HITL)
**Status:** resolved

## Question

How does an AI session know the snapshot it's reading is fresh, and should it be auto-loaded?

Context: the doc already carries a `Captured:` timestamp header. The effort's destination says every AI session reads the snapshot as ground truth — currently nothing guarantees a session notices it's stale.

Decide:

- **Staleness marker**: keep the timestamp header only, or add an explicit "STALE — last captured N days ago" warning (regenerate with `npm run sync:supabase`)? What threshold counts as stale (e.g. >7 days)?
- **Auto-load**: wire `docs/agents/supabase-state.md` into opencode config (instructions/read-on-start) or reference it from `CONTEXT.md`/`AGENTS.md`-style docs so sessions pick it up without being told — or keep it manual (the human pastes/mentions it)?
- **Ritual**: where the refresh sits in the workflow — run before any session touching the DB, or only when schema work is planned?

## Answer

Decided (2026-08-10):

- **Staleness mechanism**: freshness contract line generated into every snapshot — "if this capture is older than 7 days, run npm run sync:supabase before trusting it". Zero machinery; the AI enforces it once the doc is in context.
- **Auto-load**: docs/agents/supabase-state.md added to opencode.json \instructions\ — every session loads it automatically (~5k tokens). Requires opencode restart to take effect.
- **Threshold**: 7 days.
- Implemented in \scripts/sync-supabase.mjs\ (contract line emitted into the doc header) and \opencode.json\ (\instructions\ entry); snapshot regenerated with the contract line live.
