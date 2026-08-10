# 01 — Extract shared form components

**What to build:** the settings form's field markup and helpers become reusable pieces, with settings behaviour unchanged. Extract field components for studio identity (studio name, booking page address, WhatsApp number), payment (deposit type + value, DuitNow QR upload), Telegram alerts (with test button), scheduling (working hours, break), and the package add/list form. Extract shared helpers: validation schemas, the DuitNow QR upload helper (same storage path as today), and the profile-cache invalidation helper. The settings page then consumes the extracted pieces instead of owning the markup.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [ ] Settings page still saves every field correctly after the refactor (identity, payment, scheduling, packages) — no behaviour change.
- [ ] Settings layout renders the extracted components without visual regression.
- [ ] No form markup or validation logic is duplicated between settings and the shared pieces.
- [ ] `npm run check` — no new errors; eslint clean on touched files.

Reference: decision 04 in `.scratch/onboarding-flow/decisions/`.

## Answer

Extraction complete — settings behaviour unchanged, all acceptance criteria met.

**New `$lib/components/forms/`** (8 field components, per decision 04's props table):
- `slug-field.svelte` (`bind:value`), `whatsapp-field.svelte` (`bind:value`) — the `muasuites.com/` / `+60` InputGroups.
- `deposit-fields.svelte` (`bind:mode`, `bind:value`) — type select + conditional RM/% addon.
- `duitnow-qr-field.svelte` (`bind:file`, `existingUrl`) — file input + current-QR display.
- `telegram-field.svelte` (`bind:chatId`, `testTelegram` callback) — owns the testing/disabled state; parent keeps the fetch + toasts.
- `working-hours-field.svelte` (`bind:start`, `bind:end`) — internal hour/min/period decomposition, props are HH:MM strings; `$effect` guards re-parse on external change (prefill) without clobbering edits.
- `buffer-field.svelte` (`bind:value` as string; number derived internally).
- `package-form.svelte` (`supabase`, `userId`, `bind:packages`, `removable = false`) — list + empty state + add form; owns the insert + validation (shared `packageSchema`) + toast, so the wizard can't drift. **Deviation from decision 04's table:** the component needs `supabase` + `userId` to own the add flow (table showed only `bind:packages`); a `removable` prop gates a remove action (default off — settings UI unchanged; wizard can enable for its step 3). New `PackageRow` interface added to `$lib/schemas.ts` so the bound list is typed without `any`.

**Shared helpers:** `configSchema` + `packageSchema` moved verbatim into `$lib/schemas.ts` (settings re-imports `configSchema`); new `$lib/duitnow.ts` (`uploadDuitNowQr` — same mime allowlist, same `${userId}/duitnow_qr.<ext>` path, upsert, same error messages, throws for caller to toast); new `$lib/cache.ts` (`invalidateProfileCache(slug)` — the inline `/api/cache/invalidate` fetch).

**Settings page** now consumes the components; kept per-page: one-shot save orchestration (slug upsert → config update), balance-due-days field, plan capacity display, prefill/load logic. QR upload + cache invalidation now go through the shared helpers.

**Verification:** `npm run check` — 0 errors, 13 warnings (unchanged baseline, none in touched files); eslint clean on all touched files (fixed pre-existing `any`/each-key findings in settings and new files); Vite dev on 5177 transformed every touched module without error; full settings save smoke done by the user (identity, payment incl. QR re-upload, scheduling, balance, package add) — all persisted, toasts correct.

No new decision ticket needed — the `package-form` props extension is recorded here only.
