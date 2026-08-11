# 05 — Verify against the live instance

**Type:** task
**Blocked by:** 02-auth-config-mechanism, 03-rate-limit-and-signup-posture
**Status:** resolved

## Question

Apply the locked changes and verify the outcome against the live project.

When tickets 02, 03 and 04 resolve, do:

1. **Pre-flip audit** (from ticket 03): query `auth.users` for unconfirmed rows; confirm (`email_confirm`) only rows with a matching `muas` row; delete unconfirmed rows without one (pre-flip OTP-abuse spam). Human review of the audit list before any mutation.
2. Apply the GoTrue config via the mechanism chosen in 02 (script + manifest; `--dry-run` first, then apply). Only `disable_signup` is expected to change.
3. Apply the login-page code from tickets 03/04: `shouldCreateUser: false` in `signInWithOtp`, plus the normalized error UX.
4. Refresh `supabase-state.md` (`npm run sync:supabase`) and confirm the captured auth config shows the new values.
5. Verify magic-link login for an existing MUA still works end-to-end (email arrives, link signs in, redirect to `/bookings`).
6. Verify an unknown email: no email sent, UI shows the normalized message from 04, and no user row is created.
7. Hammer `/auth/v1/otp` (and `/recovery`, `/signup`) with `curl` from a few IPs and confirm throttling kicks in per the limits from 03.
8. Record what was done + any resulting facts (new values, audit counts, observed throttle behavior, log/audit observations) as the answer.

## Answer

All locked changes applied and verified against the live project (ref `mvycpifzcirfniiedsws`):

1. **Pre-flip audit**: 3 `auth.users` rows total — all confirmed, all with a matching `muas` row; **zero unconfirmed, zero spam rows** (no OTP-abuse residue existed). Nothing to confirm or delete — the mutation step was a no-op. (`audit-users.mjs` kept in the effort dir for re-runs.)
2. **Config applied**: `scripts/apply-auth-config.mjs` (new; manifest `scripts/auth-config.json`, `npm run apply:auth-config`) — PATCH succeeded with the existing PAT (no 403, so it had `auth:write`). Dry-run matched the locked posture exactly; **only `disable_signup` changed** (`false → true`); rate limits already at 30 and pinned in the manifest. Re-run is idempotent (now a no-op).
3. **Code applied**: `src/routes/login/+page.svelte` — `shouldCreateUser: false` in `signInWithOtp`; errors normalized to success-always ("Check your inbox — we sent you a magic login link.") with a 429 special-case ("Too many login attempts right now — please wait a few minutes."); raw `error.message` no longer displayed. Prettier-formatted; no new lint errors (3 pre-existing errors in untouched code). Browser check of the UI copy pending the human's next login.
4. **State doc refreshed**: `npm run sync:supabase` → `docs/agents/supabase-state.md` now captures `"disable_signup": true`.
5. **Known email**: `POST /otp` for `mfiqry9907@gmail.com` → **200, email delivered** (human confirmed receipt twice). Click-through to `/bookings` deferred by the human to a post-deploy test — **outstanding**.
6. **Unknown email**: 422 `otp_disabled`, **no email, no user row** (audit re-run: still 3 users). `/signup` junk → 422 `signup_disabled`.
7. **Throttling**: 40-request `/otp` burst → **28 passes, 12× HTTP 429** — per-IP bucket cut in at ~30/5min as designed. `/recover` with a junk email returned 200 but **no email is sent for unknown users** (confirmed from v2.195.0 `recover.go` source: not-found → empty 200).
8. **Observations for later (out of scope)**: magic-link click-through redirected to `http://localhost:5173` even when `emailRedirectTo` = `https://muasuite.com/login` — GoTrue fell back to `site_url` (auth config `site_url` is still `localhost:5173`; pre-existing, untouched by this effort). Worth a future effort to set `site_url`/`uri_allow_list` for production before relying on production magic-link logins.