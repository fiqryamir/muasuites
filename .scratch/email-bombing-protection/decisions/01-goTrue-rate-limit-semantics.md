# 01 — GoTrue rate-limit semantics

**Type:** research (AFK)
**Status:** resolved

## Question

What do GoTrue's auth rate limits actually key on, and what happens to email sends once signup is disabled?

Sharp questions, resolved against primary docs (Supabase auth docs, GoTrue source/docs, live project facts):

1. What does `rate_limit_email_sent` (currently `30`) key on — per-IP, per-email, or per IP+email pair? Same for `rate_limit_otp` (30) and `rate_limit_verify` (30). What is the reset window, and which endpoints do they cover (OTP send, OTP resend, recovery, signup confirmation)?
2. With `disable_signup = true`, what does `signInWithOtp` do for an **unknown** email — is any email sent, and what error/code comes back? Does this remove the anonymous-user-creation vector?
3. Does the OTP flow for a **known** email still work unchanged with signup disabled (magic-link login for existing MUAs)?
4. What is the GoTrue version on this instance (project ref `mvycpifzcirfniiedsws`), and does it match the behavior documented for that version?

## Context

Research in progress on branch `research/goTrue-rate-limit-semantics`. Findings land at `.scratch/email-bombing-protection/research/01-goTrue-rate-limit-semantics.md`.

## Answer

Pinned to the live GoTrue tag **v2.195.0** (verified via `/auth/v1/health`); full findings with sources in [01-goTrue-rate-limit-semantics.md](../research/01-goTrue-rate-limit-semantics.md).

1. **Keying/windows** (this instance: all three limits = 30): `rate_limit_email_sent` is an **instance-global interval limiter — ~30 emails/hour**, applied in `sendEmail()` to *every* auth email (magic link, signup confirmation, recovery, invite, email change). NOT per-IP, NOT per-email. `rate_limit_otp` and `rate_limit_verify` are **per-client-IP token buckets** (30/5min burst, 360/hr sustained, key TTL 1h), covering `/otp`, `/magiclink`, `/recover`, `/resend`, `/signup`, `PUT /user`, and `GET`+`POST /verify`. A separate per-user 60s throttle (`SMTP.MaxFrequency`) also applies.
2. **Unknown email + `disable_signup=true`**: **no email, no user row** — HTTP 422, code `signup_disabled` ("Signups not allowed for this instance"). The anonymous-user-creation vector closes at the GoTrue layer; anonymous sign-ins were already off.
3. **Known email + signup disabled**: confirmed users get magic links **unchanged**; **known-but-unconfirmed users are blocked too** (routed into Signup) — with `mailer_autoconfirm=false` every MUA starts unconfirmed, so existing unconfirmed MUAs must be confirmed **before** the flip (feeds tickets 03 and 05).
4. **Version** v2.195.0; behavior verified against that exact tag. Note: docs/sources describing `rate_limit_email_sent` as per-email/60s describe pre-2024 behavior — stale.
5. Open flags: hosted rate-limit header not exposed (assumed `x-forwarded-for`); multi-replica email cap ~N×30/hr unverified; enumeration nuance remains (422 vs 200 reveals existence, bounded by the 30/hr cap); no live POST probing done (would send emails).

Implications for the map: distributed per-email bombing is bounded at **30 emails/hour instance-wide** — the residual risk is that an attacker can exhaust the entire hourly budget (auth-email DoS + Mailtrap burn), which ticket 03 should weigh when fixing the rate-limit values; no per-email keying exists at GoTrue, so an app-layer throttle can only be defense-in-depth, not a fix for direct-API abuse.
