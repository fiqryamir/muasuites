# 01 — Plan state and enforcement

**What to build:** the database foundation and the single effective-plan rule that every other ticket builds on. A MUA's plan is stored on their profile as FREE, PRO, or FOUNDER with an expiry date (NULL = never); every renewal creates a permanent ledger record. Capacity gating — which today hardcodes FREE at 2 active bookings — now consults the effective plan: FOUNDER is unlimited, PRO is unlimited until its expiry plus a 7-day derived grace period, and anything lapsed is treated exactly like FREE (existing bookings honored, new checkouts capped at 2 active). Plan columns become unreadable by anonymous clients — all plan reads happen through the shared RPC. A pgTAP suite (the repo's first) proves the matrix.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] `plan_type` enum migrated FREE/PRO/ELITE → FREE/PRO/FOUNDER via a safe type rebuild; no ELITE rows anywhere
- [ ] `muas.plan_expires_at` added, NULL = never expires (FOUNDER)
- [ ] `plan_renewals` ledger table created (mua_id, amount, period, receipt_url, verified_at, new_expiry); MUAs can read their own rows, anonymous access denied
- [ ] Dead `mua_configs.max_active_bookings` column dropped
- [ ] `get_effective_plan` SECURITY DEFINER RPC implements: FOUNDER → unlimited; PRO with expiry + 7 days in the future → unlimited; else FREE (2 active)
- [ ] `secure_checkout_slot` and the booking-link checkout route both call the shared RPC instead of reading plan fields directly — a lapsed PRO with 3+ active bookings is hard-blocked on new checkouts; nothing existing is touched
- [ ] Anonymous role loses direct SELECT on plan columns; public pages still render (via the existing definer RPC)
- [ ] pgTAP suite added covering the effective-plan matrix and checkout gating (capacity, overlap, stale holds), green against a local Supabase instance
