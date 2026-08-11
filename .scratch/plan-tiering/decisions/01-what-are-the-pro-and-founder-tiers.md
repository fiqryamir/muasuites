# 01 — What are the PRO and FOUNDER tiers?

Type: grilling
Status: resolved
Blocked by:

## Question

Pin the tier matrix the spec hands off. Concretely:

- **PRO price**: monthly fee in RM? What sets the number (cost basis, competitor pricing, perceived value of unlimited capacity)?
- **PRO expiry semantics**: what happens when a paid month lapses — grace period? Are active bookings preserved or does the MUA get cut off mid-event? Downgrade to FREE instantly or at month end?
- **FOUNDER**: who gets it, how many, is it truly lifetime, and how is a grant recorded so it survives anything? Does a FOUNDER grant ever end?
- **ELITE retirement**: delete the enum value, or keep it dormant in the DB? Any existing ELITE MUAs in production data?
- **Naming**: does "PRO" stay, or is there a better name for a Malaysian MUA audience (e.g. "Pro", "Studio")?

Resolve this before 02 (renewal loop) — it blocks the expiry/downgrade mechanics.

## Comments

<!-- claim: set Status: claimed before working -->
<!-- answer goes under ## Answer, then mark Status: resolved and gist it on the map -->

## Answer

Grilled live with the founder, 2026-08-11. The tier matrix:

- **PRO price**: RM 29/month or RM 290/year (two months free). Manual renewal via DuitNow QR + receipt upload (loop designed in 02).
- **PRO expiry**: 7-day grace period after expiry, during which the MUA is still treated as PRO. After grace: **honor existing bookings, cap new** — existing CONFIRMED bookings stay on the calendar (they're client contracts), but new checkouts count against the FREE capacity of 2 active bookings until renewed.
- **FOUNDER**: identical to PRO (unlimited capacity), free lifetime. ~5–10 grants at launch, manually granted by the founder. Revocable at the founder's discretion (abuse, abandonment, strategy). No public badge differentiation planned.
- **ELITE**: dropped from the `plan_type` enum — no production MUA has it. `FREE`, `PRO`, `FOUNDER` remain.
- **Naming**: "PRO" stays. FREE / PRO / FOUNDER is the final set.

Not decided here (blocking/flow territory): renewal mechanics, yearly-period handling (RM 290 = 12-month period), where grants are recorded — those graduate to 02 and 05.
