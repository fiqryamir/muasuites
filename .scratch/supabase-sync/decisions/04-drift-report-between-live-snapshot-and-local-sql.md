# 04 — Drift report between live snapshot and local SQL

**Type:** grilling (HITL)
**Status:** resolved

## Question

Should the sync script (or a companion) surface drift between the **live snapshot** and the local `supabase/` SQL files (`migrations/`, `rpc/`, `schema.sql`), and what should that surface look like?

Context: the live DB already contains things the repo lacks — `cleanup_stale_bookings`, `finalize_balance_payment`, `get_mua_public_page` are remote-only (verified in ticket 02), and local `db/migrations/20260526065747_baseline_schema.sql` may also have drifted.

Decide:

- What gets compared (tables, columns, RPCs, policies, indexes, enums?) and how — e.g. parse local migration/rpc files for `CREATE FUNCTION`/`CREATE TABLE` names and diff against the snapshot's captured lists.
- Output shape: a "Drift" section appended to `supabase-state.md`, a separate report file, or console output only?
- Behavior when remote-only items exist (list them? warn?) and when local-only items exist.
- Exit-code behavior: should drift make `sync:supabase` fail, or is it informational?

## Answer

**No drift report. Delete the local SQL folders. The snapshot is the single source of truth.**

Grilling surfaced: supabase/ and db/ are all manual copy-paste remnants, not a maintained source of truth — db/migrations/20260526065747_baseline_schema.sql is an empty stub, 3 of 4 supabase/rpc/ files are body fragments (start at DECLARE), and src/ barely touches the DB directly (no RPC calls at all). Drift against any of that has no value.

Decided (2026-08-10):

- **Delete** supabase/ and db/ — executed via git rm (recoverable in git history). The snapshot doc replaces the copy-paste ritual entirely.
- **No drift section** in supabase-state.md — earlier votes on compare-depth/output-shape/exit-behavior/fragment-handling are moot.
- **Freshness** is owned by ticket 05 (staleness guard + auto-load) — the only remaining frontier ticket.
