# Map — Sync the repo with live Supabase state for AI context

> Effort: `supabase-sync`

## Destination

A manual `npm run sync:supabase` script that captures the **full live Supabase state** — complete schema (tables, columns, types, keys, enums, views, triggers, indexes, RLS policies), all RPC functions with bodies, storage buckets, and auth configuration — into a generated snapshot doc (`docs/agents/supabase-state.md`) that every AI session reads as ground truth. The snapshot is **committed**, so database changes are tracked migration-style: each refresh produces a reviewable git diff instead of a manual copy-paste from the dashboard. Remote is truth; pull-only. Reaching the end of the map = every decision below is locked and the script + doc shape are handed off to the build.

## Notes

- Domain: MUASuites booking SaaS. Use the glossary in `CONTEXT.md` — MUA, Client, Booking Link, Slot Hold, Deposit, Balance. Avoid: vendor, bride, customer, user.
- Motivation: the human currently copy-pastes schema/RPCs from the Supabase dashboard into context by hand — not scalable, and easy to go stale. This effort replaces that ritual with a one-command refresh whose history is the git log.
- Current local SQL lives in `supabase/` (migrations 2026-05-26 → 06-02, `rpc/` with 4 functions, `schema.sql`) plus a `db/` baseline; the remote has likely drifted since June — remote state is the source of truth, not these files.
- Environment: SvelteKit + Cloudflare Workers, `@supabase/supabase-js`; `.env` holds only `PUBLIC_SUPABASE_URL` + anon key (plus Telegram/Mapbox). No `supabase` CLI, `psql`, or `pg_dump` installed; node v24.
- Tracker: local markdown — `.scratch/supabase-sync/` per `docs/agents/issue-tracker.md`.
- Skills: `/research` for ticket 01; `/prototype` for ticket 03; `/grilling` + `/domain-modeling` on HITL tickets.
- Standing preference: the generated snapshot is committed (git diff = change tracking); credentials never committed, live in `.env` only.

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then zoom the link for the detail -->

- [Reach the live schema with everything](decisions/01-reach-the-live-schema-with-everything.md) — Supabase Management API + PAT is the single primary path (`database/query` SQL over pg_catalog + `database/openapi`, `storage/buckets`, `config/auth`, `config/storage`); no CLI/psql/Docker. Needs `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF`; DB password only as optional pooler fallback.
- [Provision the capture credentials](decisions/02-provision-the-capture-credentials.md) — PAT + ref live in `.env` (never committed); all four endpoints verified live against `mvycpifzcirfniiedsws`. `config/auth` returns secrets unredacted → snapshot must redact. Drift confirmed: 3 remote RPCs missing locally. Ref must be the bare id, not the URL.
- [Snapshot doc shape and script mechanics](decisions/03-snapshot-doc-shape-and-script-mechanics.md) — approved prototype: `npm run sync:supabase` → `scripts/sync-supabase.mjs` → `docs/agents/supabase-state.md` (~5k tokens: tables w/ PK/FK, full RPC bodies, verbatim policies, indexes, buckets, redacted+curated auth JSON, REST surface). Overwrite in place (git diff = change tracking); per-leg failure isolation; leak-guard; >15k-token warning.
- [Drift report between live snapshot and local SQL](decisions/04-drift-report-between-live-snapshot-and-local-sql.md) — **no drift report**: `supabase/` + `db/` were stale copy-paste remnants (empty stub baseline, body-fragment RPCs, no code references) — deleted via `git rm`. The snapshot is the single source of truth; freshness is ticket 05's job.
- [Staleness guard and auto-load into AI sessions](decisions/05-staleness-guard-and-auto-load-into-ai-sessions.md) — freshness contract line generated into the doc ("older than 7 days → run npm run sync:supabase"); doc auto-loaded via `opencode.json` `instructions` (opencode restart needed). All decisions locked — **map complete, hand off to build**.

## Not yet specified

<!-- in-scope fog you can't ticket yet; graduates as the frontier advances -->

- **Token-budget tuning**: the >15k-token size warning shipped in the prototype; revisit only if the "everything" snapshot outgrows the budget as the schema grows.

## Out of scope

<!-- work ruled beyond the destination; closed, never graduates -->

- TypeScript type generation from the snapshot — the deliverable is the AI context doc only.
- Bidirectional sync / pushing local migrations to remote — pull-only by design.
- Scheduled or CI auto-refresh — the chosen trigger is a manual npm script.
- Migration-tooling replacement — the local `supabase/`/`db/` folders are deleted (see decision 04); the snapshot is state capture, not a migration runner.
- Drift reporting between the live snapshot and local SQL — ruled out in [Drift report between live snapshot and local SQL](decisions/04-drift-report-between-live-snapshot-and-local-sql.md): the local `supabase/`/`db/` folders were obsolete copy-paste remnants and were deleted; the snapshot is the single source of truth.
