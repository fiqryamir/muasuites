# 01 — Schema capture: which access path captures the full live state

Research for wayfinder ticket 01 "Reach the live schema with everything". Question: which access path (or combination) can capture the FULL live state (tables, columns, types, keys, enums, views, triggers, indexes, RLS policies, RPC signatures AND bodies, storage buckets, auth config) into an AI-context doc, and which credentials must be provisioned?

All URLs cited are primary docs: supabase.com/docs, supabase.com/docs/reference/api, and upstream project docs (PostgREST, PostgreSQL, supabase CLI) where supabase.com is silent. Where a doc is ambiguous, that is stated honestly.

## Recommendation

Use the **Supabase Management API with a Personal Access Token (PAT) as the single primary path**, plus the **database password (session pooler)** as the optional redundancy path for anything the SQL endpoint cannot reach. Do NOT rely on the anon-key PostgREST OpenAPI (too shallow), the CLI `db pull` (needs Docker + excludes auth/storage schemas by default), or psql (not installed).

Concretely, the sync script should:

1. **`POST /v1/projects/{ref}/database/query`** (Run a query, Beta) with the PAT — run catalog queries against `pg_catalog`/`information_schema`: tables/columns/types/keys (`pg_attribute`/`information_schema.columns`), enums (`pg_enum`/`pg_type`), views (`pg_views`), triggers (`pg_trigger`), indexes (`pg_indexes`, `pg_get_indexdef`), RLS policies (`pg_policy`/`pg_policies`), functions and their full bodies (`pg_proc`, `pg_get_functiondef`), grants, extensions. This is arbitrary SQL over HTTP — no psql, no CLI, no Docker.
2. **`GET /v1/projects/{ref}/database/openapi`** — the PostgREST OpenAPI spec (documented replacement for the anon-key `/rest/v1/` call) for the role-visible REST surface.
3. **`GET /v1/projects/{ref}/storage/buckets`** — bucket list (id, name, public, owner, timestamps).
4. **`GET /v1/projects/{ref}/config/auth`** — full auth service config (signup, providers, SMTP, templates, SAML flag, MFA, sessions, rate limits).
5. **`GET /v1/projects/{ref}/config/storage`** — storage service config (file size limit, image transformation, etc.).
6. **`GET /v1/projects/{ref}/config/database/pooler`** — pooler host/port/connection-string facts (so the doc can record connection topology).
7. Optionally cross-check bucket config rows via the pooler (`select * from storage.buckets` with the DB password) — see Open Questions; only provable against the live project.

### Credential list

| # | Env var candidate | Purpose | Required? |
|---|---|---|---|
| 1 | `SUPABASE_ACCESS_TOKEN` | PAT (`sbp_...`) created at dashboard account tokens page; sent as `Authorization: Bearer`. Carries the same privileges as the user account, satisfying the `database:write` / `database:read` / `storage:read` / `auth:read` scopes the endpoints list. | **Yes** (only credential needed for the primary path) |
| 2 | `SUPABASE_PROJECT_REF` | The project ref (the subdomain in PUBLIC_SUPABASE_URL, e.g. `abcdefghijklmnopqrst`); used in every Management API path `{ref}` and in pooler username `postgres.<ref>`. | **Yes** (can be derived from `PUBLIC_SUPABASE_URL`) |
| 3 | `SUPABASE_DB_PASSWORD` | Database password; only needed for the optional pooler/direct SQL fallback (session-mode Supavisor or direct connection). | Optional |
| 4 | `SUPABASE_PUBLIC_URL` + `SUPABASE_ANON_KEY` | Already in `.env`; only needed if you also call `/rest/v1/` directly to see the anon-role view of the OpenAPI spec. | Already present; optional |

Note: the ticket's hypotheses `GET /v1/projects/{ref}/storage-buckets` and `POST /v1/projects/{ref}/database/rpc` are wrong — the real paths are `/storage/buckets` and no RPC endpoint exists at all (see Verified facts).

## Path comparison table

| | (a) PostgREST OpenAPI via anon key `/rest/v1/` | (b) Management API + PAT | (c) supabase CLI `db pull` | (d) Pooler/direct connection + DB password |
|---|---|---|---|---|
| **Captures tables + columns + types + keys** | Yes — tables and views of exposed schema as endpoints; columns/types in definitions | Yes — full control via `database/query` SQL over catalogs; also `database/openapi` | Yes — full `pg_dump`-style schema (auth/storage schemas excluded by default; re-run with `--schema auth,storage`) | Yes — full `pg_catalog` introspection |
| **Views** | Yes, exposed as table-like endpoints (read; updatable only if auto-updatable) | Yes — SQL (definitions via `pg_views`) and OpenAPI | Yes (pg_dump emits view DDL); `db diff` known-fails on `security_invoker` views | Yes — definitions and options |
| **Enums** | Appear as string-valued columns in payloads; docs do not state whether OpenAPI enumerates values | Yes — `pg_enum` + `pg_type` SQL | Yes (pg_dump emits `CREATE TYPE ... AS ENUM`) | Yes |
| **RPCs (signatures + bodies)** | Signatures only (functions appear as `/rpc/...` endpoints); **bodies never exposed** | Signatures + **full bodies** via `pg_get_functiondef` in SQL; signatures in OpenAPI | Yes — bodies in dump (function DDL) | Yes — bodies via `pg_get_functiondef` |
| **Triggers** | No | Yes — `pg_trigger` SQL | Yes (pg_dump emits trigger DDL) | Yes |
| **Indexes** | No | Yes — `pg_indexes` + `pg_get_indexdef` | Yes (pg_dump emits index DDL) | Yes |
| **RLS policies** | No (RLS is enforced, not described) | Yes — `pg_policy`/`pg_policies` SQL | Yes (pg_dump emits `CREATE POLICY`) | Yes |
| **Storage buckets** | No (buckets live in the Storage service at `/storage/v1/`, not in `/rest/v1/`) | Yes — `GET /v1/projects/{ref}/storage/buckets` (documented fields: id, name, owner, created_at, updated_at, public) | No as config — buckets are data rows; `db diff` even has a known failure on storage bucket changes; `supabase seed buckets` writes buckets *from* config.toml, not the reverse | Possibly — buckets are rows in `storage.buckets`; readability not documented (open question) |
| **Auth config (providers, SMTP, SAML, templates)** | No | Yes — `GET /v1/projects/{ref}/config/auth` returns the full GoTrue config surface (external providers, hooks, mailer templates, smtp, saml_enabled, captcha, sessions, rate limits, MFA) | No — GoTrue runtime config is not in Postgres; CLI auth tooling is SSO-management only (`supabase sso`) | No — GoTrue runtime config is external to Postgres (only the `auth` schema *tables* are in the DB) |
| **Credentials/tools needed** | anon key (already in `.env`) | PAT + project ref; plain HTTPS calls | CLI install + Docker Desktop + PAT (login) + database password + `supabase link` | Database password; any Postgres driver/psql (none installed) |
| **Free-tier caveats** | Unlimited API requests on free plan; output is role-dependent (anon role only sees objects granted to anon) | Rate limit 120 req/min per user per project; some endpoints Beta; free projects pause after 1 week of inactivity; no plan restriction for Management API itself is documented | Docker requirement is heavy; free tier fine otherwise; excludes auth/storage unless re-run with `--schema` | Direct connection is IPv6-only on free tier (use shared pooler session mode on IPv4); free projects pause after 1 week inactivity |

## Verified facts with sources

### (a) PostgREST OpenAPI with the anon key

- The REST API lives at `https://<project_ref>.supabase.co/rest/v1/` and is auto-generated from the database schema, "self documenting", and works with Postgres views, materialized views, foreign tables, functions, RLS, roles and grants.
  — https://supabase.com/docs/guides/api
- The Management API endpoint `GET /v1/projects/{ref}/database/openapi` "Returns the PostgREST OpenAPI specification for the project. This is the replacement for querying `/rest/v1/` directly with the anon key." → confirms (i) the spec exists at `/rest/v1/`, (ii) the anon key is sufficient to fetch it, and (iii) the Management API offers an equivalent call with a PAT instead.
  — https://supabase.com/docs/reference/api/v1-get-database-openapi
- PostgREST (the engine Supabase uses, linked from the guide above) serves "a full OpenAPI description on the root path ... a list of all endpoints (tables, foreign tables, views, functions), along with supported HTTP verbs and example payloads." It is role-dependent: "the output depends on the permissions of the role that is contained in the JWT role claim" (the anon role when no JWT is sent), unless `openapi-mode=ignore-privileges` is set. SQL comments become description fields. Triggers, RLS policies, and indexes are not part of this list.
  — https://github.com/PostgREST/postgrest/blob/main/docs/references/api/openapi.rst (rendered: https://postgrest.org/en/stable/references/api.html#open-api)
- Tables and views: "All tables and views of the exposed schema and accessible by the active database role are available for querying ... exposed in one-level deep routes", each route providing verbs "depending entirely on database permissions"; inserts work on tables and auto-updatable views.
  — https://github.com/PostgREST/postgrest/blob/main/docs/references/api/tables_views.rst (rendered: https://postgrest.org/en/stable/references/api.html#tables-views)
- Functions: "Every function in the exposed schema and accessible by the active database role is executable under the `/rpc` prefix." Stored procedures are not supported. This is the callable surface only — the SQL body is never served.
  — https://github.com/PostgREST/postgrest/blob/main/docs/references/api/functions.rst (rendered: https://postgrest.org/en/stable/references/api.html#functions-as-rpc)
- Conclusion for (a): OpenAPI exposes tables, views, functions (signatures) and columns; NOT RLS policies, triggers, indexes, storage buckets or auth config. Enum handling in the OpenAPI output is not clearly documented (honest flag — see Open Questions). Views appear as ordinary table-like endpoints; there is no documented marker distinguishing a view from a table in the spec.

### (b) Management API with a PAT

- Authentication: all requests require `Authorization: Bearer <access_token>`; PATs are "long-lived tokens that you manually generate", and "PATs carry the same privileges as your user account". OAuth2 is the alternative.
  — https://supabase.com/docs/reference/api/introduction
- Rate limits: 120 requests/minute per user per project/organization; stricter limits on a few analytics/database-context endpoints; fair-use policy applies. No plan restriction for the Management API itself was found in the docs (honest flag).
  — https://supabase.com/docs/reference/api/introduction
- **`POST /v1/projects/{ref}/database/query`** ("Run a query", Beta, scope `database:write`) EXISTS. Body: `query` (required, string), optional `parameters`, optional `read_only`. It runs arbitrary SQL, so pg_catalog introspection (pg_policy, pg_trigger, pg_views, pg_indexes, pg_enum, pg_proc + `pg_get_functiondef`) is possible; the docs do not list any restriction on which catalogs are readable (honest flag).
  — https://supabase.com/docs/reference/api/v1-run-a-query
- **`POST /v1/projects/{ref}/database/query/read-only`** ("Run a sql query as supabase_read_only_user", Beta, scope `database:read`) EXISTS. Note: "All entity references must be schema qualified."
  — https://supabase.com/docs/reference/api/v1-read-only-query
- **`GET /v1/projects/{ref}/storage/buckets`** EXISTS, but the documented path is `/v1/projects/{ref}/storage/buckets` (scope `storage:read`), not `/storage-buckets`. Response example fields: `id`, `name`, `owner`, `created_at`, `updated_at`, `public`.
  — https://supabase.com/docs/reference/api/v1-list-all-buckets
- **`GET /v1/projects/{ref}/config/auth`** EXISTS (scope `auth:read`). The documented response schema covers: `disable_signup`, per-provider `external_*_enabled`/client id/secret (apple, azure, bitbucket, discord, email, facebook, figma, github, gitlab, google, kakao, keycloak, linkedin_oidc, notion, phone, slack, spotify, twitch, twitter, x, workos, web3, zoom, ...), `hook_*` (custom access token, mfa, password, send_sms, send_email, before/after user created), `jwt_exp`, mailer templates and subjects, `smtp_*`, `saml_enabled`, `security_captcha_*`, sessions, rate limits, MFA/webauthn/passkeys, `password_min_length`/`password_hibp_enabled`, etc. So yes — this is the GoTrue-level config, not just dashboard settings.
  — https://supabase.com/docs/reference/api/v1-get-auth-service-config
- **`POST /v1/projects/{ref}/database/rpc` DOES NOT EXIST.** The full Management API endpoint index (Introduction page) contains no `rpc` endpoint under Database (or anywhere). The RPC surface is instead covered by `database/query` (arbitrary SQL) and `database/openapi` (PostgREST spec).
  — https://supabase.com/docs/reference/api/introduction (complete endpoint list, verified by fetching)
- Supporting endpoints verified to exist: `GET /v1/projects/{ref}/database/openapi` (spec, scope `database:read`, optional `schema` query param) — https://supabase.com/docs/reference/api/v1-get-database-openapi; `GET /v1/projects/{ref}/config/database/pooler` (Supavisor config incl. connection string, pool_mode, db_user, db_host, db_port) — https://supabase.com/docs/reference/api/v1-get-pooler-config; `GET /v1/projects/{ref}/config/storage` (fileSizeLimit, imageTransformation, s3Protocol, purgeCache, ...) — https://supabase.com/docs/reference/api/v1-get-storage-config; `GET /v1/projects/{ref}/database/context` exists but is deprecated/experimental and only returns database/schema names (not useful for full capture) — https://supabase.com/docs/reference/api/v1-get-database-metadata.

### (c) supabase CLI `db pull`

- `supabase db pull` "Pulls schema changes from a remote database. A new migration file will be created under `supabase/migrations`." It requires a linked project (`supabase link`) or `--db-url` for self-hosted, and **requires Docker Desktop / a running Docker daemon** ("it starts a local Postgres container to diff your remote schema").
  — https://supabase.com/docs/reference/cli/supabase-db-pull
- "If no entries exist in the migration history table, `pg_dump` will be used to capture all contents of the remote schemas you have created. Otherwise, this command will only diff schema changes against the remote database." → full-dump behavior depends on migration history state.
  — https://supabase.com/docs/reference/cli/supabase-db-pull
- Default behavior **excludes the auth and storage schemas**: the example output states "The auth and storage schemas are excluded. Run supabase db pull --schema auth,storage again to diff them."
  — https://supabase.com/docs/reference/cli/supabase-db-pull
- `supabase link` requires the database password (prompt, `-p` flag, or `SUPABASE_DB_PASSWORD` env var; use `--skip-pooler` for direct connection instead of the pooler), and `supabase login` uses the PAT (stored natively, or `SUPABASE_ACCESS_TOKEN` env var for CI).
  — https://supabase.com/docs/reference/cli/supabase-link ; https://supabase.com/docs/reference/cli/supabase-login
- `supabase db dump` "Runs `pg_dump` in a container with additional flags to exclude Supabase managed schemas. The ignored schemas include auth, storage, and those created by extensions." → even the dump path excludes managed schemas by design.
  — https://supabase.com/docs/reference/cli/supabase-db-dump
- `supabase db diff` has documented known failures for "Changes to publication", "Changes to storage buckets", and "Views with `security_invoker` attributes" → the CLI toolchain is unreliable for storage-bucket state.
  — https://supabase.com/docs/reference/cli/supabase-db-diff
- Storage buckets are handled as config, not schema: `supabase seed buckets` "Seeds the linked project" from the local config file (i.e., write direction: local → remote).
  — https://supabase.com/docs/reference/cli/supabase-seed-buckets
- Auth config: the CLI's auth surface is SSO provider management (`supabase sso add|list|show|update|remove`) — there is no CLI command that dumps the GoTrue auth config (providers, SMTP, templates).
  — https://supabase.com/docs/reference/cli/supabase-sso-add (and siblings in the CLI reference index)
- Conclusion for (c): captures the full Postgres schema via pg_dump (tables, columns, types, enums, views, triggers, indexes, functions+bodies, RLS policies) but excludes auth/storage schemas by default, does not capture storage bucket config, does not capture auth (GoTrue) config, and drags in CLI + Docker + PAT + database password as prerequisites. This repo already has a `supabase/migrations/20260526065335_remote_schema.sql`, which implies remote migration history exists → a fresh `db pull` would diff rather than full-dump (repo-specific observation; confirm at runtime).

### (d) Direct pooler connection with the database password

- Direct connection (`db.<ref>.supabase.co:5432`) is recommended for "migrations, `pg_dump`, backup and management tools" but is IPv6-only on the free tier; the Shared Pooler (Supavisor) is IPv4 and available on every tier: session mode `aws-[region].pooler.supabase.com:5432`, transaction mode `...:6543`. Pooler username format `postgres.<project-ref>`. Dedicated pooler (PgBouncer) is paid-tier only, transaction mode only.
  — https://supabase.com/docs/guides/database/connecting-to-postgres
- Transaction-mode caveat: "Transaction mode does not support prepared statements" (relevant if a Postgres driver with prepared statements is used; session mode is the safer choice for a script).
  — https://supabase.com/docs/guides/database/connecting-to-postgres
- Free-tier facts: direct connections on free are IPv6-only; free projects pause after 1 week of inactivity; compute pooler-connection limits apply to paid tiers (free tier uses the shared pooler). No plan restriction is documented for connecting with the DB password itself.
  — https://supabase.com/docs/guides/database/connecting-to-postgres ; https://supabase.com/pricing
- What the pooler path CANNOT capture: auth configuration — GoTrue's runtime settings (providers, SMTP, templates) are not Postgres objects; only the `auth` schema tables (users, identities, ...) live in the database (the CLI's separate auth/SAML tooling and the Management API's `config/auth` endpoint corroborate that the config lives outside Postgres). Storage buckets are rows in `storage.buckets` inside Postgres, so a privileged DB user may be able to read them, but supabase.com does not document this access (honest flag — see Open Questions). Storage service config (file size limit, image transformation) and API keys are platform-side and not reachable via SQL.

## Open questions (only confirmable against the live project)

1. **`storage.buckets` readability over the pooler**: whether the `postgres.<ref>` role can `SELECT` from `storage.buckets` (bucket config rows) is not documented on supabase.com; the CLI's exclusion of the storage schema suggests Supabase treats it as managed. The Management API `storage/buckets` endpoint is the documented alternative, but its documented response fields (id, name, owner, created_at, updated_at, public) may omit per-bucket limits (file_size_limit, allowed_mime_types) — verify what the live response actually contains.
2. **`database/query` privilege level**: the docs do not state which DB role the Beta "Run a query" endpoint executes as, nor whether it can read all system catalogs (e.g. `pg_enum`, `pg_policy`) or whether long RPC bodies via `pg_get_functiondef` are returned in full. The read-only variant explicitly runs as `supabase_read_only_user`; the full variant's role is undocumented.
3. **Free-tier Management API availability**: no plan restriction is documented in the Management API reference or pricing pages; confirm the PAT works on the actual (presumably free) project, and that the project is not paused (free projects auto-pause after 1 week of inactivity).
4. **Migration history state**: the repo contains `supabase/migrations/20260526065335_remote_schema.sql` (a prior pull). If the remote `supabase_migrations.schema_migrations` table has entries, `db pull` will diff instead of full-dump — a live `supabase migration list` would settle this, but the Management API SQL path is unaffected either way.
5. **Enum rendering in the PostgREST OpenAPI spec**: PostgREST docs state enum columns are exposed as strings but do not clearly document whether the OpenAPI output enumerates the allowed values in the schema; check the actual `/rest/v1/` (or `database/openapi`) output.
6. **Does the anon-role OpenAPI hide tables?** The spec is role-dependent; tables without grants to `anon` would be omitted. Whether any MUASuites tables are hidden from anon can only be checked live.
7. **`config/auth` secrets**: the documented response schema includes provider secrets and SMTP passwords; in practice the live API may redact them — confirm what the response actually contains before deciding to include it in the AI-context doc.
