# 03 — Snapshot doc shape and script mechanics

**Type:** prototype (HITL)
**Status:** resolved
**Blocked by:** 01 — Reach the live schema with everything; 02 — Provision the capture credentials

## Question

What does the snapshot doc (`docs/agents/supabase-state.md`) look like, and how does `npm run sync:supabase` behave? Produce a prototype from **real captured data** so the human can react to the actual artifact:

- **Doc shape**: section order (schema → RPCs → storage → auth), SQL-pretty vs markdown-table rendering, full RPC bodies vs signatures only, verbatim policy text, timestamp/age header, token-size budget + warning when the doc grows.
- **Script mechanics**: where the script lives (`scripts/`), idempotency, how a failure on one capture leg (e.g. auth endpoint down) is handled without destroying the rest, and how the committed git diff makes each schema change reviewable migration-style.

## Comments

_Unblocked when ticket 01 resolves and ticket 02 provisions access._

## Prototype (2026-08-10) — react to these

Working prototype on this session's branch: **`scripts/sync-supabase.mjs`** (throwaway, marked PROTOTYPE) + **`docs/agents/supabase-state.md`** generated from live data. Run with `npm run sync:supabase`.

All 12 capture legs work against the live project: 7 tables, 16 enums, 7 RPCs (full bodies), 14 RLS policies, 26 indexes, 2 buckets, redacted auth config, 14 REST paths — ~5,000 tokens.

**Design choices made — each is open to reaction:**

1. **Tables as markdown tables** (column | type | nullable | default, PK marked, FK listed under the table) rather than SQL DDL — more compact, diff-reads better.
2. **RPCs as full SQL bodies** (pg_get_functiondef verbatim) — signatures only would lose the logic.
3. **Policies verbatim** in a table; indexes as indexdef lines.
4. **Auth config curated + redacted**: secret values → `[REDACTED]` (the API returns them unredacted — e.g. `smtp_pass` — so redaction is mandatory); email template contents truncated to 200 chars; null/empty dropped; per-provider `*_client_id` kept.
5. **Leak guard**: script aborts (exit 2) if any `.env` secret value appears in the rendered doc.
6. **Partial-failure handling**: each leg try/caught independently; failures listed in a "Capture failures" section; doc still written.
7. **Ref normalization**: URL-shaped `SUPABASE_PROJECT_REF` values are stripped to the bare id.
8. **Size report** at the end (words + rough token count) with a >15k-token warning.

**Open questions for you:**
- (a) Auth config: keep the curated JSON block, or drop to an essentials-only summary (enabled providers, JWT expiry, MFA/SAML flags, rate limits)?
- (b) RLS policies: verbatim table OK, or want them as full `CREATE POLICY` SQL?
- (c) Anything missing you'd expect in AI context — e.g. grants/roles, extensions, `auth.users` columns, storage per-bucket policies?
- (d) Script behavior: prefer writing to a timestamped file, or overwrite `supabase-state.md` in place (current — git diff shows the change)?

## Answer

**Human approved all prototype choices (2026-08-10):**

- **Doc shape**: markdown tables for tables (PK marked, FK listed below), full SQL bodies for RPCs, verbatim policy table, indexdef lines, buckets table, curated + redacted auth JSON (templates truncated to 200 chars), REST surface list, size report with >15k-token warning. Timestamp header retained.
- **Script mechanics**: `npm run sync:supabase` → `node scripts/sync-supabase.mjs`; per-leg try/catch with a "Capture failures" section; `.env` secret leak-guard (aborts exit 2); ref normalization; **overwrite in place** (git diff = migration-style change tracking).
- Prototype artifacts: `scripts/sync-supabase.mjs` + `docs/agents/supabase-state.md` (uncommitted, on the session branch) — to be productionized in the build hand-off (wayfinder plans, doesn't build).
- Graduated fog (see new tickets): drift report vs local `supabase/` SQL, staleness guard + auto-load wiring.
