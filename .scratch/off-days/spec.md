# Spec - Off days (blackout dates) management

## Problem Statement

MUAs cannot tell clients when they are unavailable. The platform already stores blackout dates in the `blackout_dates` table and both public booking surfaces (MUA public page and Booking Link checkout) grey those dates out, but the MUA has no way to create or remove them - the data can only be managed by hand in the database. On top of that, the server-side slot check (`secure_checkout_slot`) never looks at blackout dates, so the calendar UI is the only thing stopping a booking on an off day.

## Solution

A dedicated dashboard page where the MUA manages their off days: add one by picking a date from a calendar (with an optional reason), see all upcoming off days, and delete them. Changes propagate to the public booking page and checkout immediately via the existing cache-invalidation endpoint. The server-side slot check also rejects blackout dates, so a blocked date can never be booked even by a direct API call.

## User Stories

1. As an MUA, I want a dedicated Off days page in the dashboard, so that I can manage my unavailability in one place.
2. As an MUA, I want to add an off day by picking a date from a calendar picker, so that I do not have to type a date.
3. As an MUA, I want to attach an optional reason to each off day, so that I can remember why I took the day off.
4. As an MUA, I want past dates disabled in the date picker, so that I cannot accidentally blackout a date that has already passed.
5. As an MUA, I want a clear error when I try to add a date I have already blacked out, so that I know it is already covered.
6. As an MUA, I want a warning when I blackout a date that already has active bookings, so that I know existing clients are not affected.
7. As an MUA, I want to see all my upcoming off days listed with date, weekday, and reason, so that I can review my availability.
8. As an MUA, I want to delete an off day, so that I can become available again.
9. As an MUA, I want my changes to appear on my public booking page immediately, so that clients never see stale availability.
10. As a client, I want blacked-out dates disabled in the booking calendar, so that I never try to book a day the MUA is off. (existing behaviour, preserved)
11. As a client, I want checkout to reject a blacked-out date even if I try to book it directly, so that the system never creates a booking on an off day.

## Implementation Decisions

- New dashboard page at `/blackouts` with a nav entry labelled "Off days", mirroring the Settings page conventions: client-side Supabase via `page.data.supabase`, Svelte 5 runes, shadcn-svelte components (Card, Field, Button, Input, date-picker), svelte-sonner toasts.
- Data access is direct table CRUD - no new RPC. The existing RLS policy (MUA manages own rows) and unique `(mua_id, blackout_date)` index handle security and duplicates; a `23505` insert error maps to a "date already blacked out" toast.
- Adding a date first checks for active bookings on that date (CONFIRMED, FULLY_PAID, PENDING_APPROVAL, or live CHECKING_OUT); if any exist, warn via toast but allow the insert. Existing bookings are never affected.
- Every mutation calls `POST /api/cache/invalidate` with the MUA's slug, the same call Settings uses, so the public page cache refreshes immediately.
- Server-side hardening: `secure_checkout_slot` gains a blackout check returning a `DATE_BLACKOUT` error. The SQL is applied directly to the live cloud database (this repo has no migration files; the cloud is the source of truth), then `npm run sync:supabase` regenerates `docs/agents/supabase-state.md`. The Booking Link checkout maps `DATE_BLACKOUT` to a user-facing message.
- No schema or RLS changes.

## Testing Decisions

- This repo has no automated test runner (no test script in `package.json`); verification is `npm run check` (svelte-check) and `npm run lint`, plus a manual checklist.
- Server-side seam: call `secure_checkout_slot` directly against the live project with a blackout date and assert the `DATE_BLACKOUT` error; confirm a free date still succeeds.
- UI seam: manual flows on the new page - add, duplicate, warn-with-bookings, delete - and observe the public page grey out the date after cache invalidation.

## Out of Scope

- Recurring off days (weekly/monthly patterns) - single dates only.
- Notifying existing clients when a new off day is added (Telegram push).
- Editing an existing off day's reason - delete and re-add instead.
- Versioned schema migrations - the live cloud is the source of truth.
- Blocking MUAs from blacking out dates with active bookings - warn only.

## Further Notes

- Domain term: user-facing "Off day"; the schema and codebase term is "blackout date".
- The public page and Booking Link checkout already render blackouts client-side - no changes needed there beyond the `DATE_BLACKOUT` error mapping.
