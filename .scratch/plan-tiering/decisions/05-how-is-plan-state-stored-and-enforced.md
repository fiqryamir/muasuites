# 05 — How is plan state stored and enforced?

Type: grilling
Status: resolved
Blocked by: 02-how-does-the-manual-renewal-loop-work

## Question

Design the schema and enforcement logic for plan state that the spec hands off. The tier matrix (01) and renewal loop (02) decide the semantics; this ticket pins where they physically live. Concretely:

- **Storage**: where does plan expiry live — a `paid_until`/`plan_expires_at` column on `muas` or `mua_configs`? Does FOUNDER mean a NULL expiry (never) or a sentinel? Renewal receipt URLs — new columns on `muas`, or a ledger table?
- **Renewal ledger + admin surface**: the founder admin page (decided in 02) needs rows to list — does each renewal create a record (MUA, amount, period, receipt URL, verified_at, expiry after)? Are FOUNDER grants recorded the same way (amount 0 / period lifetime)? What status flow: pending → approved/rejected?
- **Enum migration**: `plan_type` currently `FREE, PRO, ELITE` — the migration to `FREE, PRO, FOUNDER` (drop ELITE). Postgres enum values are additive-safe; dropping needs a type rebuild — acceptable, or keep ELITE dormant? Any staging/production data to protect?
- **Grace**: 7 days is decided — where is the grace boundary computed (a function of `paid_until`, or an explicit `grace_until` column)? One place to compute it, or every enforcement point?
- **Enforcement points**: `secure_checkout_slot` RPC (capacity + plan read) and the booking-link route (`[mua_slug]/[token]/+page.server.ts` reads `subscription_plan` for the FREE cap) — both must treat "PRO expired + grace over" as FREE. Existing `CHECKING_OUT` bookings when a plan lapses — untouched?
- **Capacity semantics**: the FREE cap counts active bookings (CONFIRMED/FULLY_PAID/PENDING_APPROVAL/CHECKING_OUT minus stale) — confirm a lapsed PRO with 5 CONFIRMED bookings simply can't open NEW ones; the count stays above 2, but nothing existing is touched.

Blocked by 02 — the storage shape must serve the loop that writes it (verification updates expiry, grants recorded by the founder).

## Comments

<!-- claim: set Status: claimed before working -->
<!-- answer goes under ## Answer, then mark Status: resolved and gist it on the map -->

## Answer

Grilled live with the founder, 2026-08-11. Storage and enforcement design:

- **Storage**: `muas` gains `plan_expires_at` (nullable) beside `subscription_plan`. **NULL = never expires** — FOUNDER grants are NULL-expiry PRO rows. NOT `mua_configs` (publicly readable via RLS; clients shouldn't see expiry).
- **Renewal ledger**: new `plan_renewals` table — one row per renewal: `mua_id`, `amount`, `period` (30 days / 12 months), `receipt_url`, `verified_at`, `new_expiry` (post-approval). FOUNDER grants are ledger rows too (amount 0, period lifetime, NULL new_expiry). The founder admin page reads it; audit trail for free. RLS: MUAs read own rows; anon nothing; founder admin page uses the service-key client (server route), with email gating in the route itself.
- **Enum migration**: `plan_type` FREE/PRO/ELITE → FREE/PRO/FOUNDER. Postgres can't drop enum values inline — migration rebuilds the type (rename → create → swap columns → drop). Safe: no production MUA holds ELITE.
- **Grace**: **derived, not stored** — effective plan = FOUNDER, or PRO with `plan_expires_at + INTERVAL '7 days' > now()`, else FREE. One constant, one rule.
- **Enforcement**: a shared SECURITY INVOKER RPC `get_effective_plan(mua_id)` — called by both `secure_checkout_slot` (replaces its `v_subscription_plan = 'FREE'` check) and the SvelteKit booking-link route. The rule lives in exactly one place.
- **Lapsed PRO = exact FREE treatment**: active-bookings count (CONFIRMED/FULLY_PAID/PENDING_APPROVAL/CHECKING_OUT minus stale) includes existing bookings — a lapsed PRO with 3+ active bookings is hard-blocked on NEW checkouts until renewal; nothing existing is touched.
- **Spec note**: `mua_configs.max_active_bookings` (default 2) is read by the RPC but the FREE check hardcodes `>= 2` — the spec should either use the column or delete it; flag for 06/implementation.
