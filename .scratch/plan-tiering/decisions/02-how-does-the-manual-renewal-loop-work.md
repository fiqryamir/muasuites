# 02 — How does the manual renewal loop work?

Type: grilling
Status: resolved
Blocked by: 01-what-are-the-pro-and-founder-tiers

## Question

Design the manual renewal loop for PRO that the spec hands off. Reuse the existing client deposit pattern (DuitNow QR + receipt upload) where it fits. Concretely:

- **MUA side**: where does the MUA renew (settings page? a dedicated billing page?) — the QR shown is the *founder's* DuitNow QR, not the MUA's. What does the MUA see about their plan state (paid until date, overdue, grace)?
- **Verification**: how does the founder see renewal receipts and flip the plan — is there an admin surface today, or does the spec invent one? Manual review per renewal, or something lighter?
- **Enforcement**: where does expiry bite — the `secure_checkout_slot` RPC, the checkout route, or both? Does a lapsed PRO block new checkouts only, or existing ones too?
- **Notifications**: what reminders exist (Telegram is the platform's channel today) — renew-in-advance, overdue, expiry?

**Decided context from 01 (design against this, don't reopen):**
- PRO = RM 29/month or RM 290/year — the loop must handle **both monthly (30-day) and yearly (12-month) periods**.
- 7-day grace after expiry, during which the MUA is still treated as PRO; after grace, existing CONFIRMED bookings are honored but new checkouts fall to the FREE capacity (2 active).
- FOUNDER = identical to PRO, free lifetime, manual grants — the loop is PRO-only (grants are recorded separately, see 05).
- ELITE is dropped; names are FREE / PRO / FOUNDER.

Blocked by 01 — resolved; the tier matrix above is final.

## Comments

<!-- claim: set Status: claimed before working -->
<!-- answer goes under ## Answer, then mark Status: resolved and gist it on the map -->

## Answer

Grilled live with the founder, 2026-08-11. The renewal loop the spec hands off:

- **Two surfaces**: Settings gets a real Plan card (replacing the dead "Upgrade" span — current plan, paid-until date, status Active/Expiring soon/In grace/Expired, renew CTA), and a dedicated auth-gated billing page (tentatively `(auth)/plan`) with the full pricing (RM 29/30 days, RM 290/12 months) + the renew flow. Both link to each other.
- **Renew flow** (reuses the client deposit pattern — DuitNow QR + receipt screenshot → `receipt-uploads` bucket): pick period — **free choice between monthly and yearly at every renewal** → founder's DuitNow QR displayed (the *founder's* QR, stored centrally — env URL or `qr-codes` bucket — the same QR every renewer scans) → MUA transfers → uploads receipt → booking's plan state shows "renewal pending".
- **Verification**: a **founder admin page** gated by founder email (env var, default the `muasuite.com` admin email) lists pending renewals — MUA, amount, chosen period, receipt image — with an Approve action. Approving extends `plan_expires_at`. It also hosts the FOUNDER grant action (schema in 05).
- **Early renewal extends from current expiry** — renewing 5 days early stacks the new period onto the remaining days; no day is ever lost.
- **Reminders via Telegram** (the platform's channel): T-7 "renews in 7 days", grace-start "grace period — renew to keep unlimited", expiry "capped at 2 active bookings until renewal". Driven by a scheduled job — same pg_cron pattern as `cleanup_stale_bookings`.
- **Spec fix-ups found in code**: the landing `PricingSection.svelte` currently says "RM 30/month" and "5 active bookings at a time" — the spec must correct to RM 29/mo, RM 290/yr, and 2 active bookings. Its free-tier note ("existing bookings carry on as normal… can't generate new links until you upgrade") already matches the decided lapse semantics.

Enforcement mechanics (where expiry bites in the RPC/route, grace computation) remain in 05.
