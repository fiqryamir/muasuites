# 03 — Rate-limit and signup posture

**Type:** grilling (HITL)
**Blocked by:** 01-goTrue-rate-limit-semantics
**Status:** resolved

## Question

Given the exact semantics from ticket 01, what values do the GoTrue settings take, and what is the final signup disposition?

- Exact values for `rate_limit_email_sent`, `rate_limit_otp`, `rate_limit_verify` given legitimate MUA behavior (a few magic-link logins per day, from phones/laptops behind NAT) and the locked invisible posture.
- Confirm `disable_signup = true` as final (human already leaned yes — no signup UI, operator-provisioned MUAs).
- Any GoTrue-side gotchas the research surfaced (e.g. per-email vs per-IP gaps, resend-window abuse, recovery endpoint exposure) that need a decision here.
- SMTP/quota note: whether the tightened numbers adequately cap Mailtrap burn, or whether quota observability graduates from the fog into a ticket.

## Answer

- **`disable_signup = true`** — final. Post-flip, sends go only to known-confirmed MUA addresses; unknown emails get 422 `signup_disabled`, zero emails, no user row. The arbitrary-address bombing vector is dead.
- **`rate_limit_email_sent = 30`** — keep the default. Legit usage is a handful of magic links/day; a targeted MUA can still receive up to 30 junk links in one hour and the budget dies with them, but that residual is accepted (bounded, invisible).
- **`rate_limit_otp = 30`, `rate_limit_verify = 30`** — keep per-IP defaults; tightening risks real MUAs on shared NAT/CGNAT colliding.
- **Manifest net effect**: of the four fields, only `disable_signup` actually changes — the rate limits are pinned explicitly in the manifest (auditable) at their current values.
- **Pre-flip audit (executed in ticket 05)**: confirm (email_confirm) only unconfirmed `auth.users` rows with a matching `muas` row — real MUAs; delete unconfirmed rows without one — pre-flip OTP-abuse spam. Never confirm attacker-created rows.
- **Login-page hardening**: adopt `options: { shouldCreateUser: false }` in `signInWithOtp` (login/+page.svelte) — defense-in-depth; with signup disabled it only changes the error code to `otp_disabled`, but keeps anonymous creation impossible if signup is ever re-enabled.
- **SMTP/quota**: post-flip sends are ≤30/hr (≤720/day), overwhelmingly legitimate → Mailtrap burn is bounded and acceptable; no quota-observability ticket now, folded into the detection/alerting question (new ticket 06).
- **Enumeration nuance** (feeds ticket 04): 422 vs 200 reveals whether an address exists; bounded by the 30/hr cap — acceptable, but the login page must not display raw error codes.