# 03 — Founder admin

**What to build:** the founder's verification side of the renewal loop. A founder-only page, gated by the founder's email (configurable), lists every pending renewal — MUA, amount, chosen period, receipt image — with Approve and Reject. Approving writes the verification on the ledger row and extends the MUA's plan expiry; early renewals stack onto the remaining days so no paid day is ever lost. The page also hosts the FOUNDER plan: grant a launch MUA the free-lifetime tier (recorded as a RM 0 lifetime ledger row) and revoke a grant.

**Blocked by:** 02 — MUA renewal loop

**Status:** ready-for-agent

- [ ] Founder-only page, email-gated via configuration; no MUA can reach it
- [ ] Pending renewals listed with MUA, amount, period, and receipt image
- [ ] Approve marks the ledger row verified and extends `plan_expires_at` — early renewal extends from current expiry, never losing days
- [ ] Reject marks the renewal rejected; MUA's plan unchanged, MUA sees the rejected state
- [ ] Grant FOUNDER action — creates a RM 0 lifetime ledger row with NULL expiry; the MUA's plan becomes unlimited immediately
- [ ] Revoke FOUNDER action — grant ends; the MUA falls back to FREE (or their own paid plan if any)
