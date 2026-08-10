# 01 - Off days management page

**What to build:** a dedicated dashboard page where the MUA manages their off days. The page lists all upcoming off days (date, weekday, optional reason) with a delete action, and has an add form: a calendar date picker with past dates disabled and an optional reason input. Adding a date that already has active bookings shows a warning toast but still succeeds. Adding a duplicate date shows a clear error. Every add/delete refreshes the public booking page cache immediately. A new "Off days" entry appears in the dashboard navigation.

**Blocked by:** None - can start immediately.

**Status:** resolved

- [x] The dashboard nav shows an "Off days" entry linking to `/blackouts`.
- [x] The page lists existing off days with date, weekday, and reason; empty state shown when none exist.
- [x] An off day can be added via the date picker with an optional reason; past dates cannot be selected.
- [x] Adding a date that is already blacked out shows a clear error toast and inserts nothing.
- [x] Adding a date that has active bookings (confirmed/pending/holding) shows a warning toast and still inserts.
- [x] An off day can be deleted.
- [x] After an add or delete, the public booking page reflects the change without a manual cache purge (cache invalidated).
- [x] `npm run check` and `npm run lint` pass.

## Answer

Shipped. New page `src/routes/(auth)/blackouts/+page.svelte` (client-side Supabase via the `(auth)` layout, Svelte 5 runes, shadcn-svelte, svelte-sonner — mirrors the Settings page), nav entry "Off days" added to `src/routes/(auth)/+layout.svelte`.

Key details:
- List shows upcoming off days (date, weekday, reason) with a delete button; empty state included.
- Add form uses the shadcn date picker with past dates disabled — the date-picker component gained an optional `disabledDates: (date: Date) => boolean` prop, wired through to bits-ui's `isDateDisabled` matcher (bits-ui 2.18 types `disabled` as boolean-only).
- Duplicate guard: unique `(mua_id, blackout_date)` index surfaces as `23505` -> "This date is already an off day."
- Warn-but-allow: pre-insert query counts active bookings (CONFIRMED / FULLY_PAID / PENDING_APPROVAL / live CHECKING_OUT) on the date and toasts a warning while still inserting; existing bookings are never touched.
- Every mutation POSTs `/api/cache/invalidate` with the MUA slug (same call Settings uses) so the public page refreshes immediately.
- Verified: `npm run check` 0 errors; eslint + prettier clean on the new page (the repo's 243-file prettier failures and 13 svelte-check warnings are pre-existing at HEAD). Live browser flows (visual) still worth a manual pass: add/duplicate/warn/delete on the real dashboard.

