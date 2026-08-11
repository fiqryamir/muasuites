# 06 — Detection and alerting during an active bombing

**Type:** grilling (HITL)
**Status:** resolved

## Question

Ticket 03 accepted the residual: a targeted (known) MUA can be spammed up to 30 magic links in an hour, exhausting the Auth Email Budget and denying magic links to all MUAs for the rest of the hour. The map's fog promised this question would graduate once the residual was fixed. How much of that do we instrument?

- Is an alert worth building at all, or is the accepted residual (bounded, recovers next hour) fine to leave unmonitored?
- If alerted: what is the cheapest trustworthy signal — GoTrue 429s (`over_email_send_rate_limit`) in Supabase auth logs, Mailtrap send-volume spikes, or a periodic check of the `/auth/v1/health`-adjacent budget state? Where would the alert go (existing Telegram connect infra exists in the app)?
- SMTP/Mailtrap quota burn visibility (fog item): after the flip, sends are ≤30/hr and mostly legitimate — is any observability warranted, or explicitly parked?

Resolve the scope here; implementation, if any, lands in the build handoff after the map closes.

## Answer

**Build the Telegram cron detector.** The residual is not left unmonitored: a new `/api/cron/auth-bomb-detector` endpoint (existing `CRON_API_KEY` pattern) polls Supabase auth logs and alerts the operator on Telegram when the Auth Email Budget is being burned. SMTP/Mailtrap quota observability is **explicitly parked** (post-flip sends ≤30/hr, mostly legitimate; Mailtrap dashboard activity is the manual check point).

Locked design (details in the build ticket `issues/01-auth-bomb-detector.md`):

- **Signal**: `GET /v1/projects/{ref}/analytics/endpoints/logs` (Management API, ClickHouse SQL, source `auth_logs`) — count rate-limit hits (`status_code = 429`, `error_code` in `over_email_send_rate_limit` / `over_request_rate_limit`) over the last 60 min. Threshold: **≥ 20 in an hour** (budget ≈ gone), tunable.
- **Credential**: a NEW, separately-named PAT dedicated to this detector (PATs carry full account privileges — Supabase offers no token scopes; the mitigation is token separation + independent revocation, so a leaked Worker secret never touches the scripts' PAT).
- **Alert path**: existing `sendTelegramAlert` (telegram.server.ts) to an operator chat id from env (`AUTH_ALERT_TELEGRAM_CHAT_ID`).
- **Dedupe**: CF KV (`MUA_CACHE` binding) key `auth:bomb:last-alerted` — alert at most once per 4h while the attack persists; no new DB table.
- **Scheduler**: same external trigger as `overdue-reminders` cron (hourly).
- **Verification**: local run with `?key=CRON_API_KEY` returns `{checked, count, alerted}`; smoke test with threshold temporarily at 0.

Manual "where to look" (documented for the no-build case): Supabase dashboard → Logs Explorer (auth source, filter `status_code = 429` or `error_code = over_email_send_rate_limit`); Mailtrap → Sending → Activity for quota burn.