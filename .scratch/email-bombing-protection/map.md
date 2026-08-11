# Map — Protect the GoTrue email surface from login email bombing

> Effort: `email-bombing-protection`

## Destination

The auth email-trigger surface (magic-link OTP, signup confirmation, password recovery) resists email bombing: `disable_signup = true`, tightened GoTrue rate limits, and a login page that does not leak user existence — while magic-link login stays invisible and working for provisioned MUAs. Reaching the end of the map = every decision below is locked, the changes are applied to the live instance, and verified (magic link works for an existing MUA; unknown emails receive no email and see a clean UI message; direct API hammering of the OTP/recovery/signup endpoints is throttled).

## Notes

- Domain: MUASuites booking SaaS. Glossary in `CONTEXT.md` — MUA, Client, Booking Link. Login is the only auth surface: a magic-link form (`signInWithOtp`, `src/routes/login/+page.svelte`). No signup UI exists anywhere in `src/` — MUAs are operator-provisioned (Supabase `handle_new_user` trigger creates the `muas` row).
- Posture (locked by the human): **invisible only** — no captcha, no user-visible friction, no blanket blocking. Matches the moderate posture from the `free-tier-infra` effort.
- Vectors: bots hit GoTrue endpoints directly (`/auth/v1/otp`, `/recovery`, `/signup`) with the public anon key, bypassing the app and the Cloudflare `/login` rate-limit rule from `free-tier-infra` — protection must live at the GoTrue/config layer, not just the UI route.
- Precedent: `free-tier-infra` mechanism split = code in repo, human operates dashboard toggles. But `supabase-sync` proved a Management API PAT works from scripts (`sync:supabase`, `apply-*.mjs`) — including `POST /v1/projects/{ref}/config/auth` for GoTrue settings, so scripted config changes are on the table (ticket 02).
- SMTP is Mailtrap (`live.smtp.mailtrap.io`) — emails are quota-billed; a bombing burns both the victim's inbox and the quota.
- Skills: `/grilling` + `/domain-modeling` on HITL tickets; `/research` subagents for knowledge gaps.
- Standing preference: verify against the live instance; refresh `supabase-state.md` (`npm run sync:supabase`) after any auth config change.

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then zoom the link for the detail -->

- [GoTrue rate-limit semantics](decisions/01-goTrue-rate-limit-semantics.md) — pinned to live tag v2.195.0: `rate_limit_email_sent` is an instance-global ~30 emails/hour cap (not per-IP/email); `rate_limit_otp`/`verify` are per-IP token buckets (30/5min, 360/hr); with `disable_signup=true` unknown emails get 422 `signup_disabled`, no email, no user row, while known-confirmed MUAs log in unchanged — but known-unconfirmed MUAs are blocked too, so confirm existing MUAs before the flip.
- [Auth config mechanism](decisions/02-auth-config-mechanism.md) — scripted: committed `scripts/apply-auth-config.mjs` + `scripts/auth-config.json` manifest (non-secret values, `--dry-run`, idempotent), modeled on `sync-supabase.mjs`; agent applies in ticket 05 after the human reviews the manifest; `npm run sync:supabase` closes the loop; PAT `auth:write` gap (403) falls back to a scoped PAT or dashboard.
- [Rate-limit and signup posture](decisions/03-rate-limit-and-signup-posture.md) — `disable_signup=true` final (only actual manifest change; `rate_limit_email_sent`/`otp`/`verify` pinned at current defaults 30); pre-flip audit = confirm unconfirmed `auth.users` rows with a `muas` row, delete rows without one; adopt `shouldCreateUser:false` in `signInWithOtp`; residual accepted (≤30 junk/hr to a known MUA + budget denial) — detection/alerting graduated into ticket 06; SMTP quota burn bounded and acceptable.
- [Login UX under signup-disabled](decisions/04-login-ux-under-signup-disabled.md) — success-always copy: every submit shows "Check your inbox", with a 429 special-case ("Too many login attempts right now…"); raw `error.message` never displayed; server-side unchanged; implementation lands in ticket 05.
- [Verify against the live instance](decisions/05-verify-against-live-instance.md) — applied + verified: `disable_signup=true` live (only change; state doc refreshed), login-page code in place, audit clean (3 users, all confirmed, no mutations), known-email magic link 200 + delivered, unknown email 422 no-send no-row, `/otp` per-IP throttle confirmed (12× 429 in a 40-request burst), `/recover` 200-without-send for unknown users (source-verified). Outstanding: production click-through test post-deploy; observation: `site_url` still `localhost:5173` (pre-existing, future effort).
- [Detection and alerting during an active bombing](decisions/06-detection-and-alerting.md) — build the Telegram cron detector: `/api/cron/auth-bomb-detector` polls Supabase auth logs (Management API, dedicated separately-revocable PAT — PATs have no scopes) for rate-limit hits ≥20/hr → `sendTelegramAlert` to operator, deduped via CF KV (≤1 per 4h); SMTP/Mailtrap observability parked. Build spec: `issues/01-auth-bomb-detector.md`.

All decision tickets resolved — the way is clear. Build handoff: `issues/01-auth-bomb-detector.md` (+ the outstanding production click-through test).

## Not yet specified

<!-- in-scope fog you can't ticket yet; graduates as the frontier advances -->

- Nothing left in fog: the residual-risk posture is decided (ticket 03), detection/alerting and SMTP observability graduated into [Detection and alerting during an active bombing](decisions/06-detection-and-alerting.md), and every remaining question is a live ticket (04 login UX, 05 verify).

## Out of scope

<!-- work ruled beyond the destination; closed, never graduates -->

- Captcha (hCaptcha / Turnstile) on login — ruled out by the locked invisible posture; returns only if residual distributed-bombing risk proves unacceptable, and then as a fresh effort.
- Password / phone / OAuth auth flows — the app is magic-link only; GoTrue settings for unused providers stay untouched.
- Broader bot protection, scanner triage, Cloudflare rules — owned by `free-tier-infra`.
- Audit-log dashboards beyond a quick check.
