-- secure_checkout_slot — capacity gating, overlap, stale holds (issue 01)
-- Each case uses a fresh MUA (unique slug), so no cross-test contamination.
-- Fixtures are created with standalone statements (psql \gset) rather than
-- data-modifying CTEs — CTE execution semantics differ across PG versions.

-- --- Capacity gating by effective plan ---

-- FREE + 2 active (CONFIRMED) → hard-blocked
SELECT public.fixture_mua('FREE', NULL, 'cap_free_full') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid)) AS v_pkg \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 30, '10:00', 'CONFIRMED') AS v_b1 \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 31, '10:00', 'CONFIRMED') AS v_b2 \gset
SELECT ok(
  (public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 32, '10:00', CAST(:'v_pkg' AS bigint)) ->> 'error') = 'MUA_CAPACITY_EXCEEDED',
  'FREE with 2 active bookings → MUA_CAPACITY_EXCEEDED'
);

-- FREE + 1 active + 1 fresh CHECKING_OUT → blocked (fresh holds count)
SELECT public.fixture_mua('FREE', NULL, 'cap_free_holding') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid)) AS v_pkg \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 30, '10:00', 'CONFIRMED') AS v_b1 \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 31, '10:00', 'CHECKING_OUT') AS v_b2 \gset
SELECT ok(
  (public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 32, '10:00', CAST(:'v_pkg' AS bigint)) ->> 'error') = 'MUA_CAPACITY_EXCEEDED',
  'FREE with 1 active + 1 fresh CHECKING_OUT → blocked (fresh hold counts)'
);

-- FREE + 1 active + 1 stale CHECKING_OUT (>10 min) → allowed (stale holds ignored)
SELECT public.fixture_mua('FREE', NULL, 'cap_free_stale') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid)) AS v_pkg \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 30, '10:00', 'CONFIRMED') AS v_b1 \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 31, '10:00', 'CHECKING_OUT', now() - interval '15 minutes') AS v_b2 \gset
SELECT ok(
  (public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 32, '10:00', CAST(:'v_pkg' AS bigint)) ->> 'success') = 'true',
  'FREE with 1 active + 1 stale CHECKING_OUT → allowed (stale hold ignored)'
);

-- PRO active + 3 active → allowed (unlimited)
SELECT public.fixture_mua('PRO', interval '30 days', 'cap_pro_active') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid)) AS v_pkg \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 30, '10:00', 'CONFIRMED') AS v_b1 \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 31, '10:00', 'CONFIRMED') AS v_b2 \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 32, '10:00', 'CONFIRMED') AS v_b3 \gset
SELECT ok(
  (public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 40, '10:00', CAST(:'v_pkg' AS bigint)) ->> 'success') = 'true',
  'PRO active with 3 active bookings → allowed (unlimited)'
);

-- PRO in grace + 3 active → allowed
SELECT public.fixture_mua('PRO', interval '-3 days', 'cap_pro_grace') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid)) AS v_pkg \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 30, '10:00', 'CONFIRMED') AS v_b1 \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 31, '10:00', 'CONFIRMED') AS v_b2 \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 32, '10:00', 'CONFIRMED') AS v_b3 \gset
SELECT ok(
  (public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 40, '10:00', CAST(:'v_pkg' AS bigint)) ->> 'success') = 'true',
  'PRO in grace with 3 active bookings → allowed'
);

-- PRO lapsed + 3 active → hard-blocked (exact FREE treatment)
SELECT public.fixture_mua('PRO', interval '-10 days', 'cap_pro_lapsed_full') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid)) AS v_pkg \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 30, '10:00', 'CONFIRMED') AS v_b1 \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 31, '10:00', 'CONFIRMED') AS v_b2 \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 32, '10:00', 'CONFIRMED') AS v_b3 \gset
SELECT ok(
  (public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 40, '10:00', CAST(:'v_pkg' AS bigint)) ->> 'error') = 'MUA_CAPACITY_EXCEEDED',
  'lapsed PRO with 3 active bookings → MUA_CAPACITY_EXCEEDED'
);

-- PRO lapsed + 1 active → allowed (under the FREE cap)
SELECT public.fixture_mua('PRO', interval '-10 days', 'cap_pro_lapsed_room') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid)) AS v_pkg \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 30, '10:00', 'CONFIRMED') AS v_b1 \gset
SELECT ok(
  (public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 40, '10:00', CAST(:'v_pkg' AS bigint)) ->> 'success') = 'true',
  'lapsed PRO with 1 active booking → allowed'
);

-- FOUNDER + 3 active → allowed
SELECT public.fixture_mua('FOUNDER', NULL, 'cap_founder') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid)) AS v_pkg \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 30, '10:00', 'CONFIRMED') AS v_b1 \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 31, '10:00', 'CONFIRMED') AS v_b2 \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 32, '10:00', 'CONFIRMED') AS v_b3 \gset
SELECT ok(
  (public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 40, '10:00', CAST(:'v_pkg' AS bigint)) ->> 'success') = 'true',
  'FOUNDER with 3 active bookings → allowed'
);

-- Success case really creates a CHECKING_OUT booking
SELECT public.fixture_mua('PRO', interval '30 days', 'cap_pro_created') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid)) AS v_pkg \gset
SELECT public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 50, '10:00', CAST(:'v_pkg' AS bigint)) AS v_r \gset
SELECT ok(
  ((:'v_r')::jsonb ->> 'success') = 'true'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.mua_id = CAST(:'v_mua' AS uuid) AND b.status = 'CHECKING_OUT'
  ),
  'successful slot creates a CHECKING_OUT booking row'
);

-- --- Overlap detection (unchanged behavior) ---

-- Existing CONFIRMED 10:00–13:00 (3h); request 12:00 → conflict
SELECT public.fixture_mua('PRO', interval '30 days', 'ovl_overlap') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid), 3.0) AS v_pkg \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 30, '10:00') AS v_b1 \gset
SELECT ok(
  (public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 30, '12:00', CAST(:'v_pkg' AS bigint)) ->> 'error') = 'TIME_SLOT_CONFLICT',
  'request overlapping an existing booking → TIME_SLOT_CONFLICT'
);

-- Existing 10:00–13:00; request 14:00 → allowed
SELECT public.fixture_mua('PRO', interval '30 days', 'ovl_clear') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid), 3.0) AS v_pkg \gset
SELECT public.fixture_booking(CAST(:'v_mua' AS uuid), CAST(:'v_pkg' AS bigint), CURRENT_DATE + 30, '10:00') AS v_b1 \gset
SELECT ok(
  (public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 30, '14:00', CAST(:'v_pkg' AS bigint)) ->> 'success') = 'true',
  'request clear of existing booking → allowed'
);

-- --- Blackout dates (unchanged) ---
SELECT public.fixture_mua('PRO', interval '30 days', 'blk_off') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid), 3.0) AS v_pkg \gset

INSERT INTO public.blackout_dates (mua_id, blackout_date)
VALUES (CAST(:'v_mua' AS uuid), CURRENT_DATE + 30);

SELECT ok(
  (public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 30, '10:00', CAST(:'v_pkg' AS bigint)) ->> 'error') = 'DATE_BLACKOUT',
  'blackout date → DATE_BLACKOUT'
);

-- --- Working hours (unchanged) ---

-- Before 08:00
SELECT public.fixture_mua('PRO', interval '30 days', 'whr_before') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid)) AS v_pkg \gset
SELECT ok(
  (public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 30, '07:00', CAST(:'v_pkg' AS bigint)) ->> 'error') = 'BEFORE_WORKING_HOURS',
  'event before working hours → BEFORE_WORKING_HOURS'
);

-- 17:00 + 3h package ends 20:00, past 18:00
SELECT public.fixture_mua('PRO', interval '30 days', 'whr_after') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid), 3.0) AS v_pkg \gset
SELECT ok(
  (public.call_slot(CAST(:'v_mua' AS uuid), CURRENT_DATE + 30, '17:00', CAST(:'v_pkg' AS bigint)) ->> 'error') = 'AFTER_WORKING_HOURS',
  'booking extending past working hours → AFTER_WORKING_HOURS'
);

-- --- Invite validation (unchanged) ---

-- Used invite
SELECT public.fixture_mua('PRO', interval '30 days', 'inv_used') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid)) AS v_pkg \gset
SELECT public.fixture_invite(CAST(:'v_mua' AS uuid), true) AS v_inv \gset
SELECT ok(
  (public.call_slot_invite(CAST(:'v_mua' AS uuid), CAST(:'v_inv' AS uuid), CURRENT_DATE + 30, '10:00') ->> 'error') = 'INVITE_ALREADY_USED',
  'used invite → INVITE_ALREADY_USED'
);

-- Expired invite
SELECT public.fixture_mua('PRO', interval '30 days', 'inv_expired') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid)) AS v_pkg \gset
SELECT public.fixture_invite(CAST(:'v_mua' AS uuid), false, now() - interval '1 hour') AS v_inv \gset
SELECT ok(
  (public.call_slot_invite(CAST(:'v_mua' AS uuid), CAST(:'v_inv' AS uuid), CURRENT_DATE + 30, '10:00') ->> 'error') = 'INVITE_EXPIRED',
  'expired invite → INVITE_EXPIRED'
);

-- Valid invite → allowed
SELECT public.fixture_mua('PRO', interval '30 days', 'inv_valid') AS v_mua \gset
SELECT public.fixture_package(CAST(:'v_mua' AS uuid)) AS v_pkg \gset
SELECT public.fixture_invite(CAST(:'v_mua' AS uuid), false) AS v_inv \gset
SELECT ok(
  (public.call_slot_invite(CAST(:'v_mua' AS uuid), CAST(:'v_inv' AS uuid), CURRENT_DATE + 30, '10:00') ->> 'success') = 'true',
  'valid invite → allowed'
);
