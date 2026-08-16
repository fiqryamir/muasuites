# 01 — Plan state and enforcement

**What to build:** the database foundation and the single effective-plan rule that every other ticket builds on. A MUA's plan is stored on their profile as FREE, PRO, or FOUNDER with an expiry date (NULL = never); every renewal creates a permanent ledger record. Capacity gating — which today hardcodes FREE at 2 active bookings — now consults the effective plan: FOUNDER is unlimited, PRO is unlimited until its expiry plus a 7-day derived grace period, and anything lapsed is treated exactly like FREE (existing bookings honored, new checkouts capped at 2 active). Plan columns become unreadable by anonymous clients — all plan reads happen through the shared RPC. A pgTAP suite (the repo's first) proves the matrix.

**Blocked by:** None — can start immediately

**Status:** resolved — implemented + deployed + verified live (2026-08-16)

- [x] `plan_type` enum migrated FREE/PRO/ELITE → FREE/PRO/FOUNDER via a safe type rebuild; no ELITE rows anywhere
- [x] `muas.plan_expires_at` added, NULL = never expires (FOUNDER)
- [x] `plan_renewals` ledger table created (mua_id, amount, period, receipt_url, verified_at, new_expiry); MUAs can read their own rows, anonymous access denied
- [x] Dead `mua_configs.max_active_bookings` column dropped
- [x] `get_effective_plan` SECURITY DEFINER RPC implements: FOUNDER → unlimited; PRO with expiry + 7 days in the future → unlimited; else FREE (2 active)
- [x] `secure_checkout_slot` and the booking-link checkout route both call the shared RPC instead of reading plan fields directly — a lapsed PRO with 3+ active bookings is hard-blocked on new checkouts; nothing existing is touched
- [x] Anonymous role loses direct SELECT on plan columns; public pages still render (via the existing definer RPC)
- [x] pgTAP suite added covering the effective-plan matrix and checkout gating (capacity, overlap, stale holds), green against a local Supabase instance

## Implementation notes (2026-08-16)

- Live migration applied in two phases: `migrations/01a-schema.sql` (+ `functions/`) via `apply-plan-tiering-01a.mjs` (backward-compatible: enum rebuild, `plan_expires_at`, ledger, dead column, RPCs), then `migrations/01b-rls-tightening.sql` via `apply-plan-tiering-01b.mjs` AFTER the app deploy (anon loses `SELECT` on plan columns; authenticated `UPDATE` on `muas` restricted to `slug` — closes the pre-existing self-grant-PRO hole).
- pgTAP suite: `pgtap/` (fixtures + 3 test files + `run-tests.mjs`), 37 assertions, green on local Supabase. Note: fixtures avoid data-modifying CTEs — PG 17 does not execute unreferenced DML CTEs (production is PG 15).
- Live verification: anon `SELECT id,slug` → 200; `SELECT subscription_plan`/`plan_expires_at` → 401 (42501); `rpc/get_effective_plan` → 200; studio page + booking-link 404s render; live effective plans match stored tiers (PRO w/ NULL expiry stays unlimited).
- Manual smoke pending (no live booking links exist): generate a test booking link from the dashboard and walk a checkout end-to-end.
- Code review (`/code-review`, 4e57b8a..HEAD): Spec axis clean (all 8 items, no creep); Standards flagged one introduced behavior bug — the route's advisory gate failed OPEN on RPC error — fixed (fail closed to FREE, commit `1ae725f`). Deferred per user: "Pro or Elite" dashboard copy at `bookings/+page.svelte:451` (ticket 02/04 surface).
