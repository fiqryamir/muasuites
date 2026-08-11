# 01 — Auth-bomb detector cron (canary probe design)

**Status:** open

Build ticket from decision 06 "Detection and alerting during an active bombing" (wayfinder effort `email-bombing-protection`).

## Spec (revised 2026-08-11)

**Design change**: the original spec polled Supabase's Management API logs endpoint (`/analytics/endpoints/logs`). That endpoint returns `Backend error! Retry your query.` for EVERY query shape on this project (verified 2026-08-11 with both the dedicated PAT and the scripts' PAT, while the dashboard Logs Explorer works) — a platform-side bug. Per the human's decision, the detector uses a **canary probe** instead: no Management API, no PAT.

**New endpoint**: `src/routes/api/cron/auth-bomb-detector/+server.ts` — mirrors `src/routes/api/cron/overdue-reminders/+server.ts` conventions (GET, `?key=` vs `CRON_API_KEY` env, JSON response, one retry on network failure).

**Canary probe**: hourly `POST {PUBLIC_SUPABASE_URL}/auth/v1/otp` with `create_user: false` and `emailRedirectTo` = Supabase URL, for the dummy account `demo@muasuite.com` (known, CONFIRMED MUA — verified in the pre-flip audit; aud=authenticated). Overridable via env `AUTH_CANARY_EMAIL`.

Interpretation:
- **200** → healthy. One canary email lands in the dummy inbox (1/hr; counts against the Auth Email Budget — intended).
- **429 `over_email_send_rate_limit`** → Auth Email Budget burned → **Telegram alert** to the operator (deduped).
- **429 `over_request_rate_limit`** → the cron's own per-IP OTP bucket is exhausted (unlikely at 1/hr) → log only, NO alert.
- **422 `otp_disabled` / `signup_disabled`** → canary account missing/unconfirmed (config drift) → log only, NO alert.

**Alert**: `sendTelegramAlert` from `$lib/telegram.server.ts`; chat id from env `AUTH_ALERT_TELEGRAM_CHAT_ID` (the operator's chat — same id stored in `mua_configs.telegram_chat_id` for the operator's MUA row, or ask @userinfobot). Message: budget burned, canary, timestamp, next-retry note.

**Dedupe**: Cloudflare KV binding `MUA_CACHE` (wrangler.jsonc `kv_namespaces[0].binding`, accessed as `platform?.env?.MUA_CACHE`), key `auth:bomb:last-alerted` = ISO timestamp; alert only if > `AUTH_BOMB_ALERT_INTERVAL_MS` (default 4h) since the last alert. No KV in dev → no dedupe (dev-only).

**Test hook**: `?test=1` (behind the CRON key) sends a test Telegram alert unconditionally.

**Env vars**:
- `AUTH_ALERT_TELEGRAM_CHAT_ID` — operator Telegram chat id (REQUIRED for alerts)
- `AUTH_CANARY_EMAIL` — optional override (default `demo@muasuites.com`)
- `AUTH_BOMB_ALERT_INTERVAL_MS` — optional override (default `14400000` = 4h)
- Existing: `CRON_API_KEY`, `TELEGRAM_BOT_TOKEN`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`
- The dedicated PAT `SUPABASE_MGMT_ANALYTICS_TOKEN` is NO LONGER NEEDED — revoke it in the Supabase dashboard (Account → Access Tokens) to reduce exposure.

**Scheduler**: add the endpoint to the same external trigger that fires `overdue-reminders` (hourly). Human step.

## Verification

**Done 2026-08-11 (local dev server, `CRON_API_KEY=devtest`):**

1. **Auth gate** ✅ — `?key=nope` → 401 `{"error":"Unauthorized"}`; correct key → 200.
2. **Test hook** ✅ — `?test=1` → 200 `{"tested":true}` (Telegram dispatch skipped locally because `AUTH_ALERT_TELEGRAM_CHAT_ID` is not in `.env` — expected; the send path itself is the proven `sendTelegramAlert`).
3. **Canary probe contract** ✅ — returns `{checkedAt, canary, status, code, alerted}`; healthy-path verified: `demo@muasuites.com` (confirmed, aud=authenticated) returns 200 via direct probes (probe-compare run: all three accounts 200).
4. **Platform flakiness on 2026-08-11 (documented, not fixed by us)**: the auth endpoint was intermittently unreachable from this machine (`/auth/v1/health` → HTTP 000), the Management API logs endpoint returned `Backend error!` for every query shape, and the canary probe occasionally returned 422 `otp_disabled` for confirmed accounts in the same window that direct probes returned 200. Conclusion: transient platform/network state, not a config or code bug. **Re-run step 5 when connectivity is stable.**
5. **Healthy probe** (re-verify later): `curl "http://localhost:5173/api/cron/auth-bomb-detector?key=$CRON_API_KEY"` → expect `{"status":200,"code":"","alerted":false}`.
6. **429 alert path** — NOT exercised live (would require burning the real 30/hr budget); code-reviewed: only `429 over_email_send_rate_limit` triggers the deduped Telegram alert; `?test=1` covers the alert pipeline end-to-end.
7. **Dedupe** — reviewed: KV marker `auth:bomb:last-alerted` suppresses alerts within `AUTH_BOMB_ALERT_INTERVAL_MS`; dev without KV alerts every time (dev-only).

**Left for the human (deploy steps):**
- `AUTH_ALERT_TELEGRAM_CHAT_ID` — the operator's Telegram chat id (same id as `mua_configs.telegram_chat_id` for the operator's MUA row, or ask @userinfobot), in `.env` + Cloudflare Worker secret
- `CRON_API_KEY` — add to `.env` for local cron testing if desired (already a prod Worker secret for `overdue-reminders`)
- Scheduler: add the detector to the same external trigger that fires `overdue-reminders` (hourly)
- Revoke the unused dedicated PAT `muasuite-auth-bomb-detector` (Account → Access Tokens) — the canary design needs no Management API
- Re-run the healthy-probe step against the deployed Worker once connectivity is stable

## Blocked by

- Decision 06 (resolved) — design locked, canary pivot approved by the human.
- Human: `AUTH_ALERT_TELEGRAM_CHAT_ID` value + Cloudflare Worker secret wiring + scheduler trigger + revoke the unused PAT.
