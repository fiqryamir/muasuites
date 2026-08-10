# 05 — Existing-user backfill

**Type:** task
**Status:** resolved
**Blocked by:** 01

## Question

How are existing accounts handled so the gate doesn't trap them?

## Context

- Backfill rule (locked by charting): any profile already holding all mandatory fields — studio name, WhatsApp number, DuitNow QR, deposit value, ≥1 active package — is marked onboarded; incomplete profiles get sent through the wizard once.
- The DB is managed live (no local `supabase/migrations/` folder; source of truth is the cloud project per `docs/agents/supabase-state.md`) — the change is applied directly to the cloud project, then `npm run sync:supabase` recaptures state.
- `handle_new_user` trigger may need the state-model defaults so new signups start at step 0.
- Record what was done + row counts in the answer (this is the one ticket type that does rather than decides).

## Answer

Applied live to the cloud project (`mvycpifzcirfniiedsws`) via the Management API `POST /database/query` endpoint (PAT from `.env` — same auth as `scripts/sync-supabase.mjs`).

**What was done** (idempotent, re-runnable):
1. `ALTER TABLE public.mua_configs` — added `onboarding_step smallint NOT NULL DEFAULT 0` + `onboarded_at timestamptz` (decision 01's state model).
2. Backfill `UPDATE` — profiles holding all mandatory fields (studio name, WhatsApp, DuitNow QR, deposit value > 0, ≥1 active package) got `onboarded_at = now(), onboarding_step = 4`.
3. `handle_new_user` — **no change** (verified: column defaults 0/NULL put new signups at step 0).

**Row counts (before → after):**
- 2 `mua_configs` total, 1 complete → **1 backfilled onboarded**, 1 incomplete left at step 0 (enters the wizard once).

**Artifacts:** migration at `migrations/2026-08-10-add-onboarding-state.sql`, apply script at `apply-backfill.mjs` (in this effort folder). `npm run sync:supabase` re-ran afterwards — `docs/agents/supabase-state.md` now captures the two new columns.
