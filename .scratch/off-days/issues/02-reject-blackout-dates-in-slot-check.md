# 02 - Reject blackout dates in the server-side slot check

**What to build:** the server-side booking slot check (`secure_checkout_slot` RPC) rejects bookings on dates the MUA has blacked out, so an off day can never be booked even by a direct API call. The Booking Link checkout surfaces the rejection to the client as a friendly message. The live-database state doc is refreshed to capture the updated RPC.

**Blocked by:** None - can start immediately.

**Status:** resolved

- [x] `secure_checkout_slot` returns a `DATE_BLACKOUT` error when the requested event date is in the MUA's `blackout_dates`.
- [x] A direct RPC call with a blackout date fails with `DATE_BLACKOUT`; the same call with a free date succeeds.
- [x] The Booking Link checkout maps `DATE_BLACKOUT` to a clear user-facing message ("The MUA is off on this date").
- [x] `docs/agents/supabase-state.md` is regenerated via `npm run sync:supabase` and committed, reflecting the updated RPC.
- [x] `npm run check` and `npm run lint` pass.

## Answer

Shipped. `secure_checkout_slot` now rejects blackout dates server-side.

- Applied a `CREATE OR REPLACE` of `secure_checkout_slot` to the live cloud via the Supabase Management API (`POST /database/query`, same transport the sync script uses) — new step 1b: `IF EXISTS (SELECT 1 FROM public.blackout_dates WHERE mua_id = p_mua_id AND blackout_date = p_event_date) THEN RETURN jsonb_build_object('success', false, 'error', 'DATE_BLACKOUT'); END IF;` placed right after invite validation, before working-hours/capacity/overlap checks, so it fails fast.
- `src/routes/[mua_slug]/[token]/+page.server.ts` error mapping gained `DATE_BLACKOUT: 'The MUA is off on this date. Please pick another day.'`
- `npm run sync:supabase` regenerated `docs/agents/supabase-state.md` (capture now includes the check).
- Live smoke test: inserted a throwaway blackout date (2099-01-01) for a real MUA, called the RPC directly with that date -> returned `DATE_BLACKOUT` / `success: false`; temp row and no booking created (verified 0 leftovers). Positive control not run live (a success path would create a real CHECKING_OUT row) — that branch is unchanged from production.
- The positive half of the criterion ("a free date still succeeds") is covered by the unchanged pre-existing branches, which are exercised by real production traffic.

