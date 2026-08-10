# 01 — Onboarding state model

**Type:** grilling
**Status:** resolved
**Blocked by:** None

## Question

How is onboarding progress + completion persisted so the hard gate (decision 03), resume-from-last-finished-step, and existing-user backfill (decision 05) all hang off one source of truth?

## Context

- `handle_new_user` trigger already auto-creates `muas` (id, email, slug) + empty `mua_configs` at signup.
- The wizard is ~5 steps; the MUA can close the tab mid-wizard and must resume at the last finished step on next login — so progress granularity matters, not just a done flag.
- Completion is written once, at the final step, via an explicit action; afterwards the gate stays off permanently — even if the MUA later deletes required data in Settings (confirm this as part of the resolution).
- Options to weigh: new columns on `mua_configs` (`onboarded_at`, a step counter) vs a JSONB progress blob vs deriving step from which required fields are already populated. "A step is finished" = its required fields saved + validated, not merely visited.
- Watch out for: RLS (MUA owns their config row), the `get_mua_public_page` RPC shape, and keeping the gate query cheap (server layout runs it per authenticated request).

## Answer

Onboarding state lives as two columns on `mua_configs`, and the gate is a pure one-time flag.

**Schema:**
```sql
ALTER TABLE public.mua_configs
  ADD COLUMN onboarding_step smallint NOT NULL DEFAULT 0,
  ADD COLUMN onboarded_at timestamptz; -- NULL = not onboarded
```

**The model (all three consumers hang off this):**
- **Gate** — `onboarded_at IS NULL` → redirect to `/onboarding`. One indexed PK lookup (`mua_id`) per authenticated request; no join, no RPC change, no `get_mua_public_page` impact. RLS already grants the MUA full access to their config row.
- **Resume** — `onboarding_step` is 0–4 (0 = not started; 1 identity; 2 payment; 3 packages; 4 optional extras). A step is finished when its required fields are saved and validated (not merely visited) — that same update writes the step number, so closing the tab mid-wizard loses nothing. Resume opens step `onboarding_step + 1`.
- **Completion** — written at the end of the last input step (step 4, optional): the same update sets `onboarded_at = now(), onboarding_step = 4`. Skipping the optional step counts as finishing it. The link-reveal screen is purely informational — no persisted state, closing the tab there is harmless because the gate is already off.
- **Permanence** — the gate never re-triggers. Deleting mandatory data later in Settings (packages, QR, WhatsApp) does not push an onboarded MUA back through the wizard. The gate checks the flag, never the data.
- **Backfill (feeds ticket 05)** — one-time migration: profiles already holding all mandatory fields get `onboarded_at = now(), onboarding_step = 4`; incomplete profiles stay `NULL`/0 and enter the wizard once from step 0 with their partial data pre-filled.
- **New signups** — no `handle_new_user` trigger change needed; column defaults (`0`/NULL) put them at step 0.
- **Edge cases resolved:** an onboarded MUA visiting `/onboarding` redirects to `/bookings` (gate off); resume past step 4 is impossible because completion and step 4 are written together.
