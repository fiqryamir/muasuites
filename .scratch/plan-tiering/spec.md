# Spec — Paid plan tiering

**Status:** ready-for-agent

## Problem Statement

MUAs on the FREE plan hit a wall at 2 active bookings with no way to pay for more. The `FREE/PRO/ELITE` tiers exist in the database but only FREE is real — there is no pricing, no billing, no upgrade path (the "Upgrade" span in Settings is dead UI), and the landing page advertises "RM 30/month" and "5 active bookings" that match nothing. The founder also has no admin surface to see or verify any payment, and has not yet done the legal groundwork (company registration, business bank account) needed to charge for the product at all.

## Solution

An MUA on the FREE plan can upgrade to PRO — RM 29 for 30 days or RM 290 for 12 months — by scanning the founder's DuitNow QR and uploading their payment receipt. The founder verifies the receipt on a founder-only admin page and approves it, which extends the MUA's plan expiry. PRO (and FOUNDER) get unlimited active bookings. A 7-day grace period cushions expiry: existing CONFIRMED bookings are always honored, and only new checkouts fall back to the FREE capacity of 2. The FOUNDER plan gives ~5–10 launch MUAs the same unlimited capacity free for life, manually granted and revocable by the founder. Renewal is fully manual — there is no auto-billing at launch. The spec also hands the founder the compliance checklist (SSM sole proprietorship, business bank account, auto-issued TIN, DuitNow QR, annual Form B) to legally start charging.

## User Stories

1. As an MUA on the FREE plan, I want to see my plan and a working upgrade path in Settings, so that I know how to unlock unlimited bookings.
2. As an MUA, I want my plan badge visible in the dashboard nav at all times, so that I always know which plan I hold.
3. As an MUA, I want a dedicated plan page showing both pricing options (RM 29/30 days, RM 290/12 months), so that I can choose how to pay.
4. As an MUA, I want to renew by scanning the founder's DuitNow QR and uploading my payment receipt, so that I can upgrade without a credit card.
5. As an MUA, I want to choose monthly or yearly at every renewal, so that I can switch periods freely.
6. As an MUA who renews early, I want the new period to extend from my current expiry, so that I never lose paid days.
7. As an MUA, I want to see my plan status (active, expiring soon, in grace, expired) and paid-until date, so that I know when to renew.
8. As an MUA, I want Telegram reminders 7 days before expiry, at grace start, and at expiry, so that I do not lapse by accident.
9. As a PRO MUA, I want my active-booking capacity to be unlimited, so that my calendar is the only limit.
10. As a lapsed PRO MUA, I want my existing CONFIRMED bookings honored, so that my clients are never affected by my plan.
11. As a lapsed PRO MUA, I want new checkouts capped at the FREE limit after my grace period, so that I am nudged to renew.
12. As a FOUNDER-tier MUA, I want unlimited bookings without ever paying, so that I can support the launch.
13. As the founder, I want a founder-only page listing pending renewals with MUA, amount, period, and receipt, so that I can verify and approve payments.
14. As the founder, I want an approval action that extends the MUA's plan expiry, so that capacity changes take effect immediately.
15. As the founder, I want to grant the FOUNDER plan to launch MUAs, so that I can thank early adopters.
16. As the founder, I want to revoke a FOUNDER grant, so that I can manage abuse or abandonment.
17. As the founder, I want every renewal kept as a permanent ledger record, so that I have an audit trail.
18. As the founder, I want the compliance checklist documented, so that I know the exact steps to legally charge for PRO.
19. As a client, I want the booking flow unchanged, so that I can book and pay deposits exactly as before.
20. As the founder, I want plan state kept private — no public plan markers and no plan columns readable via the public API — so that plan expiry is never exposed.

## Implementation Decisions

- **Enum**: `plan_type` migrates `FREE/PRO/ELITE` → `FREE/PRO/FOUNDER`. Postgres cannot drop enum values inline, so the migration rebuilds the type (rename → create → swap columns → drop). Safe because no production MUA holds ELITE.
- **Schema**: `muas` gains `plan_expires_at` (nullable timestamptz). **NULL means "never expires"** — that is how FOUNDER grants are represented. Plan state lives on `muas`, never on the publicly readable `mua_configs`.
- **Renewal ledger**: new `plan_renewals` table — one row per renewal: `mua_id`, `amount`, `period` (30 days / 12 months), `receipt_url`, `verified_at`, `new_expiry` (the expiry after approval). FOUNDER grants are ledger rows too (amount 0, period lifetime, NULL new_expiry). MUAs can read their own rows; anonymous access is denied.
- **Effective plan rule** (single source of truth): FOUNDER → unlimited; PRO with `plan_expires_at + 7 days > now()` → unlimited; otherwise FREE (2 active bookings). The 7-day grace is **derived, never stored**.
- **Shared RPC**: a `get_effective_plan(mua_id)` SECURITY DEFINER function implements the rule. `secure_checkout_slot` and the booking-link checkout route stop reading plan fields directly and call this RPC instead. Lapsed PRO is treated exactly like FREE — the active-bookings count (CONFIRMED/FULLY_PAID/PENDING_APPROVAL/CHECKING_OUT minus stale holds) includes existing bookings, so a lapsed PRO with 3+ active bookings is hard-blocked on new checkouts until renewal; nothing existing is touched.
- **RLS tightening**: anonymous role loses direct SELECT on plan columns (`subscription_plan`, `plan_expires_at`) on `muas`; all plan reads happen behind the SECURITY DEFINER RPC. `get_mua_public_page` is unaffected.
- **Cleanup**: `mua_configs.max_active_bookings` is dead (the FREE cap is the hardcoded constant 2) — drop the column rather than let it mislead.
- **Renewal flow (MUA side)**: Settings' dead "Upgrade" span becomes a real Plan card (plan, paid-until, status Active/Expiring soon/In grace/Expired, renew CTA), linked to a dedicated auth-gated plan page with both pricing options. Renewing: pick period (free choice at every renewal) → founder's DuitNow QR displayed (the founder's QR, sourced from an env var) → MUA transfers → uploads a receipt screenshot to the existing receipt storage → a pending renewal row is created.
- **Founder admin**: a founder-only page, gated by founder email (env var), listing pending renewals (MUA, amount, period, receipt image) with Approve/Reject. Approving writes `verified_at` + `new_expiry` on the ledger row and updates `muas.plan_expires_at`. Early renewal **extends from current expiry** — the new period stacks onto remaining days. The page also hosts grant/revoke actions for the FOUNDER plan. Served through the privileged server-side client; email gating enforced in the route.
- **Reminders**: a scheduled job in the same pattern as the existing stale-booking cleanup sends Telegram nudges: 7 days before expiry, at grace start, and at expiry (capped at 2 active bookings until renewal).
- **Landing copy**: the pricing section is corrected to RM 29/month, RM 290/year, and "2 active bookings at a time"; the existing free-tier note ("existing bookings carry on as normal… can't generate new links until you upgrade") already matches the lapse semantics and stays.
- **Testing seam**: pgTAP suite added as the test runner, asserting the RPC layer — `get_effective_plan` across the full matrix (FREE, PRO active, PRO in grace, PRO lapsed, FOUNDER, NULL expiry) and `secure_checkout_slot` gating (capacity, overlap, stale holds) unchanged.

## Testing Decisions

- **What makes a good test**: assert external behavior of the seam, not implementation details — given a MUA in state X, the RPC returns plan Y and checkout permits/denies a new booking accordingly. No assertions on function internals or UI layout.
- **Modules tested**: the Postgres RPC layer (`get_effective_plan`, `secure_checkout_slot`) via pgTAP against a local Supabase instance; the effective-plan matrix and the capacity gate are the highest-value tests in this feature. SvelteKit routes get a documented manual walkthrough (renew → approve → capacity flips; reminders fire) run against `npm run dev` + local Supabase, since no JS test runner exists.
- **Prior art**: none — this is the repo's first test suite; pgTAP is introduced with this effort and the SQL scripts live beside the migrations.

## Out of Scope

- Auto-billing and payment gateway integration (Chip/BayarCash) — the gateway research (`research/gateway-comparison.md`) informs the future, not this build. No credit-card capture, no subscription rails.
- Commission or fees on client deposits — the client pays the MUA directly via DuitNow as today.
- Public plan markers — studio pages and checkout stay plan-blind (a "Founding MUA" badge is a future marketing idea, deliberately not built).
- Refund/cancellation tooling for plan payments — handled manually by the founder.
- SST registration and e-Invoice — not required below RM 500k / RM 1M turnover; the spec monitors the thresholds, it does not build for them.

## Further Notes

- **Compliance checklist for the founder** (from `research/compliance-checklist.md`): register an SSM sole proprietorship (~RM 60/yr, ~1 day) → confirm the auto-issued TIN → open a sole-prop business bank account (days) → issue a DuitNow QR (personal QR is a fine launch stopgap; business QR once the account opens) → sell. File Form B annually. ~1–2 weeks total before the first paid PRO can be collected cleanly. A company is also the prerequisite for any future gateway.
- **Gateway forward path** (from `research/gateway-comparison.md`): Chip is the best future fit for auto-billing (card-token recurring, RM 1 FPX, zero fees) but requires the SSM entity + business bank account; BayarCash's FPX direct debit is the cheapest recurring rail; ToyyibPay has no recurring billing today.
- Domain vocabulary lives in `CONTEXT.md` (## Plans): Plan, Plan Renewal, Plan Expiry, Founder Plan.
- The map for this effort (`map.md`) holds every decision this spec rests on, each with its gist.
