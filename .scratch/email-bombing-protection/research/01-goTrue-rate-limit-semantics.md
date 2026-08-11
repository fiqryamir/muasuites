# 01 — GoTrue rate-limit semantics (hosted Supabase, project `mvycpifzcirfniiedsws`)

Research for wayfinder ticket 01 of the `email-bombing-protection` effort. Question: what do GoTrue's auth rate limits key on, and what happens to email sends once signup is disabled?

Method: primary sources only — GoTrue source pinned to the **exact running tag `v2.195.0`** (repo `supabase/gotrue`, module path renamed to `github.com/supabase/auth` in v2.x), supabase.com docs, and read-only live checks against the project. No live settings were modified; no secrets printed. Note the repo's module path in source imports is `github.com/supabase/auth/internal/...` — the same code lives in the `supabase/gotrue` repository.

## Recommendation

**Flip `disable_signup` to `true` on the live project (Management API `PATCH /config/auth`, or Dashboard → Authentication → Providers → Email → "Allow new users to sign up" off).** That alone closes the email-bombing / anonymous-user-creation vector:

- Unknown email via `signInWithOtp` → HTTP 422, no email, no user row (code `signup_disabled`, "Signups not allowed for this instance").
- Known + confirmed email → magic-link login works unchanged.
- Known + **unconfirmed** email → blocked too (422) — **migrate/confirm existing unconfirmed MUAs first** (see Q3 flag; this instance has `mailer_autoconfirm=false`, so every user starts unconfirmed).
- `rate_limit_email_sent=30` is already a hard ~30 emails/hour instance cap (Q1), so even before the flip the bomb is bounded; after the flip unknown-email sends are zero.
- Optional defense-in-depth: SDK `shouldCreateUser: false` (does not change behavior once signup is disabled — only the error code differs, `otp_disabled` vs `signup_disabled`), CAPTCHA on the login page (currently `security_captcha_enabled=false`), and keep `rate_limit_otp`/`rate_limit_verify` at 30.

Live facts the ticket's decision should bake in: `disable_signup=false`, `mailer_autoconfirm=false`, `external_email_enabled=true`, `rate_limit_*` all at dashboard defaults, custom SMTP (mailtrap), `external_anonymous_users_enabled=false`, `security_sb_forwarded_for_enabled=false`.

## Verified facts with sources

### Q1 — What the rate limits key on, their windows, and their endpoint coverage (v2.195.0)

**Architecture.** v2.195.0 replaced the old per-email/IP `maybeRateLimit` with two limiter families (`internal/api/apilimiter/apilimiter.go`):
1. **Interval limiter** (global, no per-key dimension): `ratelimit.New(gc.RateLimitEmailSent)` — used for email sends.
2. **Tollbooth v5 token buckets per client IP**: `newLimiterPer5mOver1h(rate)` → burst 30, refill `rate` per 300s, per-key TTL 1h — used for OTP-family, verify, token, MFA, anonymous routes.
— https://raw.githubusercontent.com/supabase/gotrue/v2.195.0/internal/api/apilimiter/apilimiter.go

**How the IP key is derived** (`internal/api/middleware.go`): `performRateLimiting` first uses `sbff.GetIPAddress` — populated only when `GOTRUE_SECURITY_SB_FORWARDED_FOR_ENABLED=true` (**false on this instance**) — otherwise it keys on the first comma-separated value of `config.RateLimitHeader` (`GOTRUE_RATE_LIMIT_HEADER`, expected `x-forwarded-for` on hosted; platform gateway sets it, client cannot spoof). If the header is absent entirely, the limiter is skipped with a warning log.
— https://raw.githubusercontent.com/supabase/gotrue/v2.195.0/internal/api/middleware.go
— live check: `security_sb_forwarded_for_enabled=false` via `GET /v1/projects/mvycpifzcirfniiedsws/config/auth`

**`rate_limit_email_sent` (live: 30) — instance-global, NOT per-IP, NOT per-email; 30 per hour.**
- `conf.Rate` decodes plain `"30"` as an *interval* rate with `defaultOverTime = time.Hour` → Events 30, window 1 hour (`internal/conf/rate.go`). The limiter is a single shared `IntervalLimiter` (`o.Email = ratelimit.New(...)`) — one counter for the whole process.
- Applied in `sendEmail()` (`internal/api/mail.go`) before *every* auth email send — signup confirmation, magic link, recovery, invite, email change, reauthentication, and notification emails. Skipped only when `Mailer.Autoconfirm=true` (deprecated behavior); **this instance has `mailer_autoconfirm=false`, so it applies**. Exceeded → HTTP 429, code `over_email_send_rate_limit`, "email rate limit exceeded".
- Separate per-user, per-type throttle: `validateSentWithinFrequencyLimit(sentAt, SMTP.MaxFrequency)` — max 1 email per 60s per user per type (confirmation / recovery / magic-link-shared / email-change are independent timers). Live `smtp_max_frequency=60`.
— https://raw.githubusercontent.com/supabase/gotrue/v2.195.0/internal/api/mail.go
— https://raw.githubusercontent.com/supabase/gotrue/v2.195.0/internal/conf/rate.go

**`rate_limit_otp` (live: 30) — per client IP; 30-per-5-min token bucket (360/hour sustained), burst 30, key TTL 1h.**
- Same limiter shape shared (as **separate per-route buckets**) by: `POST /otp`, `POST /magiclink`, `POST /recover`, `POST /resend`, `POST /signup` (email/phone branch; the anonymous branch uses `rate_limit_anonymous_users` instead), `PUT /user` — wiring in `internal/api/api.go` router, limits in `internal/api/apilimiter/apilimiter.go`.
- Hit → HTTP 429, code `over_request_rate_limit`, "Request rate limit reached".

**`rate_limit_verify` (live: 30) — per client IP; same bucket shape (360/hour sustained, burst 30, TTL 1h).**
- Wraps both `GET /verify` and `POST /verify` — i.e. signup link click, magic-link click, recovery link, email-OTP verify, email-change confirm.
— https://raw.githubusercontent.com/supabase/gotrue/v2.195.0/internal/api/api.go

**Other limits (same code, for context):** `rate_limit_token_refresh` (live 150) → per-IP 150/5min burst 30 on `/token` (password + refresh_token grants); `rate_limit_anonymous_users` (live 30) → per-IP 30/hour burst 30; MFA challenge/verify → 15/min burst 30.
— https://raw.githubusercontent.com/supabase/gotrue/v2.195.0/internal/api/apilimiter/apilimiter.go

**Docs corroboration.** The platform's auth rate-limit table (updated 3 Sep 2024) matches the new code shapes: OTP-sending endpoints 360 OTPs/hour ("sum of combined requests", customizable); verify 360/hour per IP; token 1800/hour per IP; anonymous 30/hour per IP; MFA 15/min per IP; email sends **2 emails/hour** with the built-in provider, "only changeable with your own custom SMTP" (this project uses custom SMTP → the dashboard `rate_limit_email_sent` value governs). The "60 second window before a new request is allowed" rows correspond to the per-user `SMTP.MaxFrequency` throttle.
— https://supabase.com/docs/guides/platform/going-into-prod#auth-rate-limits

### Q2 — `disable_signup=true` + `signInWithOtp` with an UNKNOWN email

No email is sent and no user is created. Code path, pinned to v2.195.0:

1. `POST /otp` → `Otp` handler → `shouldCreateUser` (GoTrue defaults `CreateUser: true`; supabase-js sends `create_user: options?.shouldCreateUser ?? true` — verified in `supabase/gotrue-js` `GoTrueClient.ts`) → delegates to `MagicLink`.
2. `MagicLink` looks up the user; not found → `isNewUser=true` → re-enters the `Signup` handler internally → **`Signup`'s first check is `if config.DisableSignup { return 422 signup_disabled, "Signups not allowed for this instance" }`** → aborts before any mail send or DB insert.
— https://raw.githubusercontent.com/supabase/gotrue/v2.195.0/internal/api/otp.go
— https://raw.githubusercontent.com/supabase/gotrue/v2.195.0/internal/api/magic_link.go
— https://raw.githubusercontent.com/supabase/gotrue/v2.195.0/internal/api/signup.go
— https://raw.githubusercontent.com/supabase/gotrue/v2.195.0/internal/api/apierrors/errorcode.go (`signup_disabled`, `otp_disabled`, `over_email_send_rate_limit` are the exact code strings)

Response codes:
- Default `create_user:true` → **422, code `signup_disabled`, message "Signups not allowed for this instance"**.
- `create_user:false` (SDK `shouldCreateUser:false`) → **422, code `otp_disabled`, message "Signups not allowed for otp"** (`shouldCreateUser` returns false for a missing user).
- Direct `POST /signup` → same 422 `signup_disabled`.
- Anonymous sign-ins (empty email/phone on `/signup`) are a separate feature gated by `external.anonymous_users.enabled` — **already `false` on this instance** (live `config/auth` and `GET /auth/v1/settings`).

**So yes — with `disable_signup=true`, the anonymous-user-creation vector (unknown email → new unconfirmed user row + confirmation email) is closed at the GoTrue layer.** The 422-vs-200 distinction also means known-confirmed emails remain distinguishable from unknown ones (enumeration nuance — see Open questions).

### Q3 — Known email with `disable_signup=true`: still works?

- **Confirmed user → yes, unchanged.** `MagicLink` finds the user, `isNewUser=false`, proceeds to `sendMagicLink`; `DisableSignup` is never consulted on this path.
- **Known but unconfirmed user → NO, blocked.** `isNewUser = user == nil || !user.IsConfirmed()`; an unconfirmed (but existing) user is routed through `Signup` and gets the same 422 `signup_disabled`, no email.
— https://raw.githubusercontent.com/supabase/gotrue/v2.195.0/internal/api/magic_link.go

Operational consequence for this project: `mailer_autoconfirm=false` means **every MUA is unconfirmed until they first click a signup confirmation link**. Flipping `disable_signup` on locks OTP login for any MUA who registered but never confirmed. Plan: confirm those users first (e.g. `PATCH /admin/users/{id}` with `email_confirm: true`, or have them sign up/confirm before the flip).

### Q4 — GoTrue version and behavior match

- **Live version: `v2.195.0`** — `GET https://mvycpifzcirfniiedsws.supabase.co/auth/v1/health` (anon key) → `{"version":"v2.195.0","name":"GoTrue","description":"GoTrue is a user registration and authentication API"}` (the `/health` endpoint returns `a.version` — `internal/api/api.go`).
- All behavior claims above were verified against the **exact tag** `supabase/gotrue@v2.195.0`, so documented behavior matches the running version by construction.
- Docs match: the current supabase.com rate-limit table (Sep 2024 update) reflects these v2.195.0 semantics. **Mismatch to flag:** older doc entries and most third-party write-ups still describe the pre-2024 implementation (`rate_limit_email_sent` as a per-email, 60-second-window limit, keyed per email+IP). On v2.195.0 the email limit is a global 30/hour interval and the OTP limit is per-IP 30/5min.

## Open questions / honest flags

1. **Hosted `GOTRUE_RATE_LIMIT_HEADER` value is not exposed** via the Management API `config/auth` response; I assumed `x-forwarded-for` from the docs' "Limited by: IP Address" column and the sbff-disabled fallback path. If the platform ever stopped setting it, the tollbooth limits would silently no-op (code warns in logs) — the email interval limiter is unaffected.
2. **Multi-replica semantics of `rate_limit_email_sent`**: the interval limiter is in-memory per process; with N replicas the effective cap is ~N×30 emails/hour. Not documented by Supabase; cannot be measured read-only.
3. **No live probing was performed** (any `POST /otp` would send an email / create rows). Q2/Q3 conclusions are by code reading of the exact running tag, not by firing requests at the live instance.
4. **Platform-side (gateway) limits** beyond GoTrue's own may exist; they are not documented for auth endpoints and not visible from this project.
5. **Enumeration nuance**: with signup disabled, `signInWithOtp` returns 422 for unknown emails but 200 (email sent) for known confirmed ones — the response code reveals account existence. Unavoidable while magic-link login stays public; the 30/hour email cap bounds exploitation.
6. **Docs drift**: any source claiming `rate_limit_email_sent` is per-email with a 60s window is describing pre-2024 behavior; the Sep 2024 going-into-prod table and v2.195.0 code are the current truth.
7. **`mailer_autoconfirm` interaction**: the `rate_limit_email_sent` interval limiter is bypassed when autoconfirm is on (deprecated in code). This instance has it off, so the cap is active — but keep that in mind if autoconfirm is ever enabled.
