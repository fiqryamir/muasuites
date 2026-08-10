# 07 — One-tap Telegram connect

**What to build:** replace the copy-a-Chat-ID flow with the standard deep-link connect. The app already owns the bot (`TELEGRAM_BOT_TOKEN` in `$lib/telegram.server.ts`), so the wizard's optional step and Settings show a "Connect Telegram" button that opens `https://t.me/<bot>?start=<one-time-token>`; the MUA taps Start, the bot's webhook writes `telegram_chat_id` (via a SECURITY DEFINER RPC), the UI flips to Connected + Test. Manual Chat-ID entry stays as an advanced option (group chats). Copy updated in `steps.ts`; decision 02 amended.

**Blocked by:** 03 — settings travel-fee section (component-convention precedent); 04 — wizard steps 1–2 (wizard hosts the field).

**Status:** resolved

- [ ] `mua_configs` gains `telegram_connect_token` + `telegram_connect_expires_at`; `link_telegram_chat(p_token, p_chat_id)` RPC (SECURITY DEFINER) validates token + expiry and writes `telegram_chat_id` — applied live, `supabase-state.md` recaptured.
- [ ] `POST /api/telegram/connect` (authed) mints a one-time token with a 15-min expiry and returns the `t.me` deep link; bot username resolved via `getMe` (no new secret).
- [ ] `GET /api/telegram/status` (authed) returns `{ connected, chatId }`.
- [ ] `POST /api/telegram/webhook` verifies the `secret_token` header and only processes `/start <token>`; successful connect sends a confirmation message; invalid/expired links get a polite retry hint.
- [ ] `telegram-field.svelte` shows Connect → waiting (auto-poll + check-now + reopen link + cancel) → Connected chip + Test; manual entry behind an "advanced (for groups)" toggle; `bind:chatId` + `testTelegram` contract unchanged (settings and wizard both keep working).
- [ ] `steps.ts` telegram copy updated to one-tap wording; decision 02 amendment note appended.
- [ ] `npm run check` — no new errors; eslint clean on touched files.
- [ ] Ticket 06's `Blocked by` gains 07; 06's verification covers the connect flow.

Reference: `$lib/telegram.server.ts`, `api/test-telegram`, `src/routes/(auth)/settings/+page.svelte` (field consumer), `src/routes/onboarding/steps.ts` (locked copy).

## Answer

One-tap Telegram connect built end-to-end; the Chat-ID copy-paste is gone from the wizard and Settings. All static gates green (see Verification).

**1. Schema (applied live, idempotent `apply-telegram-connect.mjs` — ticket-03 pattern):** `mua_configs` gains `telegram_connect_token text NULL` + `telegram_connect_expires_at timestamptz NULL`; new `link_telegram_chat(p_token, p_chat_id)` RPC (SECURITY DEFINER, `search_path public`, row-locked lookup with `expires_at > now()`, writes `telegram_chat_id`, clears the token). ACL verified identical to `finalize_receipt_submission` (`anon=X` — the token is the auth). `npm run sync:supabase` re-ran; doc recaptured (7 tables, new columns + RPC present, no secrets).

**2. API routes:**
- `POST /api/telegram/connect` (authed 401-guard via `safeGetSession`) — mints a random 32-byte hex token with 15-min expiry on the MUA's own config row; resolves the bot `@username` via `getMe` (per-isolate cache); returns `{ url: t.me/<bot>?start=<token> }`.
- `GET /api/telegram/status` (authed) — returns `{ connected, chatId }` from the config row.
- `POST /api/telegram/webhook` (public) — 401 unless `X-Telegram-Bot-Api-Secret-Token` matches the new **`TELEGRAM_WEBHOOK_SECRET`** env (generated into `.env`, 64-hex, not displayed; also needs adding to Cloudflare secrets); ignores everything except `/start <token>`; calls the RPC via the anon client; replies "You're connected ✓" or a polite retry hint on invalid/expired links.

**3. Shared `telegram-field.svelte` rework** (settings + wizard step 4 get it free; `bind:chatId` + `testTelegram` contract unchanged):
- Not connected → full-width **Connect Telegram** button → opens the deep link → waiting card (spinner, "Waiting for you to press Start in Telegram…", auto-poll every 3 s up to 15 tries, Open again / Check again / Cancel).
- Connected (chip + check icon + Test) whenever `chatId` is set — prefill on resume shows connected immediately.
- **Advanced toggle** ("Use a Chat ID manually (for groups)") reveals the original input + Test — group-chat IDs preserved.
- Connect success writes the bound `chatId` so the wizard's step-4 Save persists it; the webhook already wrote it to the DB, so Skip also leaves the connection live.

**4. Copy:** `steps.ts` telegram `why` → one-tap wording ("no codes to copy"); decision 02 amended (one-line note); ticket 06's `Blocked by` gains 07.

**5. Housekeeping (within-effort incident):** while adding the env var, my first append joined `TELEGRAM_WEBHOOK_SECRET` onto the newline-less `SUPABASE_PROJECT_REF` line, corrupting the ref → the recapture ran with a broken API URL (Tables (0) + joined header). Fixed the `.env` (split back into clean key=value lines, values intact, verified key-by-key), then regenerated. Also hardened `scripts/sync-supabase.mjs`'s leak check to include `TELEGRAM_WEBHOOK_SECRET` (it was missing from the list). Post-fix recapture verified: clean header, 7 tables, zero secret hits.

**Verification:** `npm run check` — 0 errors, 13 warnings (pre-existing baseline, none in touched files). Eslint + prettier clean on all 6 touched files. Dev smoke on 5177 (server killed after): `/api/telegram/webhook` (no + wrong secret) → **401**; `/api/telegram/status` unauth → **401**; `/api/telegram/connect` unauth → **401**; `/onboarding` unauth → 303 `/login` (regression ✓). RPC ACL check: `link_telegram_chat` anon-execute + SECURITY DEFINER, same as `finalize_receipt_submission`.

**Remaining — user smoke (needs prod + bot):**
1. Add `TELEGRAM_WEBHOOK_SECRET` (same value as `.env`) to Cloudflare Worker secrets, deploy.
2. One-time webhook registration: `curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://muasuites.com/api/telegram/webhook&secret_token=<SECRET>&drop_pending_updates=true"`.
3. Log in as the gated MUA → wizard step 4 → **Connect Telegram** → Telegram opens → press Start → bot replies "You're connected!" → wizard flips to Connected; save the step.
4. Settings → travel/telegram section shows connected chip + Test works; advanced manual entry still functional; group-chat ID via advanced.
5. DB: `mua_configs.telegram_chat_id` populated, connect token cleared; repeat connect after expiry gives the polite retry hint; unauth/bad-secret webhook calls rejected.

No new decision ticket — the decision-02 amendment (recorded in the decision file) covers the copy change; map.md unchanged.
