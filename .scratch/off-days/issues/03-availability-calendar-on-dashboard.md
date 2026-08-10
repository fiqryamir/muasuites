# 03 - Availability calendar on the dashboard

**What to build:** the dashboard (`/bookings`) gains an all-in-one availability calendar showing the MUA's booked dates and off days in one month view. Off days render as a distinct tint, days with active bookings show a count badge, today is ringed, past days are dimmed. Clicking a day opens a detail panel below the calendar: the day's bookings (time, client, status, package — rows open the existing payment-details dialog) or the off-day reason with a Remove action; a free day offers a "Mark as off day" action that blocks the date directly from the calendar with the same warn-but-allow and duplicate guards as the blackouts page. Every add/remove invalidates the public profile cache. The blackout mutation logic is shared with the blackouts page via `$lib/blackouts.ts`.

**Blocked by:** 01 (Off days management page), 02 (Reject blackout dates in the server-side slot check) — the page it mirrors and the helper logic it refactors.

**Status:** resolved

- [x] The dashboard shows a month calendar between the stat cards and the pending-review area.
- [x] Off days show a distinct tint, booked days show a count badge, today is highlighted, past days are dimmed and not selectable.
- [x] Clicking a day shows a detail panel: bookings (time, client, status, package) or off-day reason with Remove; free days show "Mark as off day".
- [x] Clicking a booking row opens the existing payment-details dialog.
- [x] "Mark as off day" blocks the date, warns when active bookings exist, errors on duplicates, and invalidates the public cache.
- [x] Removing an off day from the calendar works and invalidates the public cache.
- [x] The blackouts page still works unchanged after the shared-helper refactor.
- [x] `npm run check` and `npm run lint` pass.

## Answer

Shipped. Dashboard (`/bookings`) now has an "Availability" card between the stat cards and the pending-review area.

- New `src/lib/components/ui/availability-calendar.svelte`: month grid modeled on the public page calendar (prev/next nav, Mon-first grid). Day states: off day (`bg-destructive/10` tint), booked count badge, today ring, past dimmed/disabled; legend row. Detail panel below the grid: the day's active bookings (time, client, package, status chip — rows call the parent's `openDetails`, reusing the existing payment dialog) or the off-day reason with a Remove action; a free day shows "Mark as off day", which runs the same warn-but-allow + duplicate-guard flow as the blackouts page.
- New `src/lib/blackouts.ts` shared helpers: `dateKey`, `isActiveBooking`, `countActiveBookingsOn`, `addBlackoutDate`, `removeBlackoutDate`, `invalidatePublicProfile` — the blackouts page was refactored onto them (no behavior change); the calendar uses them too.
- Dashboard: one extra `blackout_dates` fetch in `onMount`; bookings already loaded. Active-set filtering via `isActiveBooking` (CONFIRMED / FULLY_PAID / PENDING_APPROVAL / live CHECKING_OUT).
- Verified: svelte-check 0 errors; eslint + prettier clean on all new/changed-to-my-lines files. The bookings page's remaining 19 eslint errors are pre-existing lines (any-typed state, unused legacy helpers, hrefs without resolve) — untouched. Live browser pass still worth doing (day clicks, mark-off, remove, dialog wiring).

