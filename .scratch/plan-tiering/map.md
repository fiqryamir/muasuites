# Map: Paid plan tiering

## Destination

A handoff spec for paid plan tiering at MUASuites: `FREE` (2 active bookings) / `PRO` (unlimited, manual monthly renewal via DuitNow QR + receipt upload) / `FOUNDER` (free lifetime, manually granted at launch, replaces `ELITE`) — including renewal/expiry mechanics, verification, and the founder's compliance checklist (SSM entity, business bank account, future gateway onboarding). Spec only — no implementation.

## Notes

- Domain: MUASuites billing. The plan enum (`plan_type`) already exists: `FREE`, `PRO`, `ELITE`; FREE's 2-booking cap is enforced in the `secure_checkout_slot` RPC and `src/routes/[mua_slug]/[token]/+page.server.ts` — anything non-FREE is already treated as unlimited.
- Skills every session should consult: `/grilling` + `/domain-modeling` for HITL tickets; `/research` for AFK tickets. Consult `CONTEXT.md` (booking lifecycle terms) and `docs/agents/supabase-state.md` before touching schema concepts.
- Standing preferences: manual DuitNow billing at launch — **no auto-billing, no gateway integration**; reuse the existing client deposit flow (QR + receipt upload + verification) as the renewal pattern; Malaysia-first (MYR, FPX/DuitNow, SSM/LHDN context); founder is a solo operator, no company registered yet.
- Tracker conventions: `.scratch/plan-tiering/` — map at `map.md`, decision tickets under `decisions/NN-<slug>.md`, `Type:`/`Status:`/`Blocked by:` lines, answers under `## Answer`.

## Decisions so far

<!-- one line per resolved ticket: gist + link -->

- [Which Malaysian gateway for future auto-billing?](decisions/03-which-malaysian-gateway-for-future-auto-billing.md) — Chip best for future PRO auto-billing (card-token recurring, RM1 FPX, zero fees) but needs SSM entity + business bank account; only BayarCash-Personal works pre-incorporation; ToyyibPay has no recurring rail. Findings: `research/gateway-comparison.md`.
- [What does the founder legally need to charge for subscriptions?](decisions/04-what-does-the-founder-legally-need-to-charge-for-subscriptions.md) — Ordered checklist: SSM sole prop (RM60/yr, ~1 day) → auto-issued TIN → business bank account → DuitNow QR → annual Form B. No SST/e-Invoice at launch (below RM500k / RM1M thresholds). ~1–2 weeks, ~RM60/yr to start selling. Findings: `research/compliance-checklist.md`.
- [What are the PRO and FOUNDER tiers?](decisions/01-what-are-the-pro-and-founder-tiers.md) — PRO = RM 29/mo or RM 290/yr, unlimited capacity. Lapse: 7-day grace (still PRO), then honor existing bookings but cap new checkouts at FREE's 2. FOUNDER = identical to PRO, free lifetime, 5–10 manual grants, revocable at founder's discretion. ELITE dropped from enum. Names stay FREE/PRO/FOUNDER.
- [How does the manual renewal loop work?](decisions/02-how-does-the-manual-renewal-loop-work.md) — Settings Plan card + dedicated `(auth)/plan` billing page; renew = pick period (monthly/yearly, free choice each renewal) → founder's DuitNow QR → receipt upload (reuses client deposit pattern) → founder admin page (email-gated) approves, extending expiry (early renewal stacks, never loses days). Auto Telegram reminders at T-7 / grace start / expiry via pg_cron. Spec must fix landing copy (RM 30 → 29, "5 active" → 2).
- [How is plan state stored and enforced?](decisions/05-how-is-plan-state-stored-and-enforced.md) — `muas.plan_expires_at` (NULL = FOUNDER/never) + `plan_renewals` ledger (one row per renewal incl. grants at RM 0); enum rebuilt to FREE/PRO/FOUNDER; grace derived (`expires_at + 7d`, not stored); shared `get_effective_plan(mua_id)` RPC used by `secure_checkout_slot` + booking-link route; lapsed PRO = exact FREE treatment. Note: `max_active_bookings` column is dead — spec should use or delete it.
- [Should plan state be surfaced publicly?](decisions/06-should-plan-state-be-surfaced-publicly.md) — Nothing public on studio/checkout pages. RLS tightened: anon loses SELECT on plan columns; `get_effective_plan` becomes SECURITY DEFINER and all plan reads (RPC + booking-link route) route through it. Plan badge moves to the dashboard nav, always visible.

**The frontier is exhausted — every decision is made. The way to the spec is clear: hand off to a spec-writing session.**

## Not yet specified

<!-- all graduates are ticketed; this section is empty until the frontier reveals more -->

## Out of scope

- Auto-billing and gateway integration at launch — manual DuitNow renewal is the launch model; the gateway research (03) only informs the compliance checklist. Returns only if the destination is redrawn.
- Commission on client deposits — existing direct-DuitNow client payment model unchanged.
- `ELITE` feature design — the tier is being retired in favour of `FOUNDER` (see 01).
- Refund/cancellation tooling for plan payments — handled manually by the founder.
