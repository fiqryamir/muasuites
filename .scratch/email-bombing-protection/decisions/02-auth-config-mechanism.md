# 02 — Auth config mechanism

**Type:** grilling (HITL)
**Status:** resolved

## Question

How do the GoTrue config changes (signup toggle, rate-limit values) get made — and how are they recorded?

Two precedents conflict: `free-tier-infra` split mechanisms as "code in repo, human operates the dashboard", but `supabase-sync` proved a Management API PAT works from scripts (`npm run sync:supabase`; `apply-*.mjs` scripts exist in other efforts), and `POST /v1/projects/{ref}/config/auth` can set GoTrue settings programmatically.

Decide:

- Scripted `apply-auth-config.mjs` in-repo (auditable, repeatable, PAT already proven) vs human dashboard toggles (zero code, matches `free-tier-infra` precedent) vs hybrid (script drafts, human clicks in dashboard).
- Where the chosen settings are recorded (a `config` file next to the script, a migration-style file, or only in `supabase-state.md` after `npm run sync:supabase` refresh).
- Who holds the PAT / where it lives (env), if scripted.

## Answer

**Scripted.** The changes ship as a committed `scripts/apply-auth-config.mjs` + `scripts/auth-config.json` manifest, modeled on `scripts/sync-supabase.mjs` (same `.env` parsing for `SUPABASE_ACCESS_TOKEN` / `SUPABASE_PROJECT_REF`) and the idempotent `apply-*.mjs` pattern from the onboarding effort. `PATCH /v1/projects/{ref}/config/auth` is confirmed to accept `disable_signup`, `rate_limit_email_sent`, `rate_limit_otp`, `rate_limit_verify` (supabase.com/docs/reference/api/v1-update-auth-service-config).

- **Source of truth**: the manifest (`scripts/auth-config.json`) holds the locked values; nothing is applied unless it matches the manifest. Manifest carries only non-secret fields.
- **Loop closure**: after apply, `npm run sync:supabase` refreshes `docs/agents/supabase-state.md` — the git diff shows old → new.
- **Execution**: the agent applies in ticket 05, after the human reviews the manifest values; a `--dry-run` mode prints current-vs-target before applying; idempotent re-runs.
- **Contingency**: the existing PAT was provisioned for `sync:supabase` (read paths) and may lack `auth:write`. If PATCH returns 403, the human creates a PAT scoped `auth:write` into `.env`, or falls back to the dashboard for that change — surfaced at apply time, not preempted.