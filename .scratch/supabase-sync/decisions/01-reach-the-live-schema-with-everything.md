# 01 — Reach the live schema with everything

**Type:** research (AFK)
**Status:** resolved

## Question

What access path (or combination) can capture the full "everything" scope — tables, columns, types, keys, enums, views, triggers, indexes, RLS policies, RPC signatures + bodies, storage buckets, and auth configuration — given the repo currently holds only the anon key in `.env`?

Compare at least:

- **(a) PostgREST OpenAPI** at `/rest/v1/` using the anon key (no new credentials; but scope is limited — no policies, triggers, storage config, or auth config).
- **(b) Supabase Management API** with a personal access token + project ref (SQL query endpoint for pg_catalog introspection, storage-buckets endpoint, auth config endpoint — verify which of these actually exist and what they return).
- **(c) supabase CLI** `db pull` (requires installing the CLI and a database password; what does it capture, and does it cover storage/auth?).
- **(d) Direct pooler connection** with the database password (pg_catalog gives everything DB-side).

For each: what it can capture, what credentials it needs, free-tier availability, and caveats (RLS visibility of policies, anon-key exposure limits, whether the Management API's SQL endpoint can read `pg_policy`/`pg_trigger`/`pg_views`, RPC bodies via `pg_proc`). Recommend the path(s) the sync script should use, and list exactly which credentials must be provisioned (this answer feeds ticket 02).

## Comments

_Research in progress on branch `research/schema-capture` — findings will be linked here._

## Answer

**Supabase Management API + PAT is the single primary path** — no CLI, no psql, no Docker. Full findings: [01-schema-capture.md](../research/01-schema-capture.md) (on branch `research/schema-capture`).

- `POST /v1/projects/{ref}/database/query` (Beta) runs arbitrary SQL over pg_catalog — tables/columns/types/keys, enums, views, triggers, indexes, RLS policies, and RPC bodies via `pg_get_functiondef`. Plus `GET /v1/projects/{ref}/database/openapi` (PostgREST spec), `GET .../storage/buckets`, `GET .../config/auth` (full GoTrue config), `GET .../config/storage`, `GET .../config/database/pooler`.
- Credentials needed (feeds ticket 02): `SUPABASE_ACCESS_TOKEN` (PAT, **required**), `SUPABASE_PROJECT_REF` (**required**, derivable from `PUBLIC_SUPABASE_URL`), `SUPABASE_DB_PASSWORD` (optional pooler fallback only).
- Ticket hypotheses corrected: buckets path is `/storage/buckets` not `/storage-buckets`; no `database/rpc` endpoint exists.
- Open questions to verify live (ticket 03 prototype will hit them): whether `config/auth` redacts secrets, `database/query` role privileges, and whether the buckets endpoint returns per-bucket limits.
