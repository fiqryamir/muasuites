-- secure_checkout_slot — atomically reserve a booking slot during checkout.
-- Capacity gating now delegates to get_effective_plan (issue 01): FOUNDER and
-- PRO (incl. 7-day grace) are unlimited; anything lapsed is FREE (2 active).
-- Everything else (row lock, invite, blackout, working hours, overlap) unchanged.

CREATE OR REPLACE FUNCTION public.secure_checkout_slot(p_mua_id uuid, p_invite_id uuid DEFAULT NULL::uuid, p_package_id bigint DEFAULT NULL::bigint, p_event_date date DEFAULT NULL::date, p_event_time time without time zone DEFAULT NULL::time without time zone, p_client_name text DEFAULT NULL::text, p_client_phone text DEFAULT NULL::text, p_venue_address text DEFAULT NULL::text, p_total_amount numeric DEFAULT 0, p_deposit_amount numeric DEFAULT 0, p_balance_amount numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_effective_plan text;
  v_active_bookings_count INT;
  v_overlap_count INT;
  v_new_booking_id UUID;
  v_is_used BOOLEAN;
  v_expires_at TIMESTAMPTZ;

  -- Package details
  v_duration_hours NUMERIC;

  -- Config details
  v_working_hours_start TIME;
  v_working_hours_end TIME;
  v_default_buffer_minutes SMALLINT;

  -- Effective buffer for this booking
  v_buffer_minutes SMALLINT;

  -- Computed slot boundaries
  v_req_start TIME;
  v_req_end TIME;
BEGIN
  -- Row-level locking to serialize concurrent checks for this specific MUA
  PERFORM 1 FROM public.mua_configs WHERE mua_id = p_mua_id FOR UPDATE;

  -- 1. Verify integrity of the invite link
  IF p_invite_id IS NOT NULL THEN
    SELECT is_used, expires_at, buffer_minutes_override
    INTO v_is_used, v_expires_at, v_buffer_minutes
    FROM public.invites
    WHERE id = p_invite_id AND mua_id = p_mua_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'INVITE_NOT_FOUND');
    END IF;

    IF v_is_used THEN
      RETURN jsonb_build_object('success', false, 'error', 'INVITE_ALREADY_USED');
    END IF;

    IF NOW() > v_expires_at THEN
      RETURN jsonb_build_object('success', false, 'error', 'INVITE_EXPIRED');
    END IF;
  END IF;

  -- 1b. Reject blackout dates (MUA off days)
  IF EXISTS (
    SELECT 1 FROM public.blackout_dates
    WHERE mua_id = p_mua_id AND blackout_date = p_event_date
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'DATE_BLACKOUT');
  END IF;

  -- 2. Resolve the MUA's effective plan + fetch config
  v_effective_plan := get_effective_plan(p_mua_id) ->> 'plan';

  SELECT
    working_hours_start,
    working_hours_end,
    default_buffer_minutes
  INTO
    v_working_hours_start,
    v_working_hours_end,
    v_default_buffer_minutes
  FROM public.mua_configs
  WHERE mua_id = p_mua_id;

  -- 3. Fetch package duration
  SELECT duration_hours INTO v_duration_hours
  FROM public.packages
  WHERE id = p_package_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PACKAGE_NOT_FOUND');
  END IF;

  -- 4. Determine effective buffer: invite override → config default → 0
  IF p_invite_id IS NOT NULL THEN
    -- v_buffer_minutes already loaded from invites query above
    IF v_buffer_minutes IS NULL THEN
      v_buffer_minutes := v_default_buffer_minutes;
    END IF;
  ELSE
    v_buffer_minutes := v_default_buffer_minutes;
  END IF;

  -- 5. Compute requested time slot window
  v_req_start := p_event_time;
  v_req_end := p_event_time + (v_duration_hours || ' hours')::INTERVAL + (v_buffer_minutes || ' minutes')::INTERVAL;

  -- 6. Validate working hours
  IF p_event_time < v_working_hours_start THEN
    RETURN jsonb_build_object('success', false, 'error', 'BEFORE_WORKING_HOURS',
      'message', 'Event time is before the MUA''s working hours (' || v_working_hours_start || ').');
  END IF;

  IF v_req_end > v_working_hours_end THEN
    RETURN jsonb_build_object('success', false, 'error', 'AFTER_WORKING_HOURS',
      'message', 'Booking would extend past the MUA''s working hours (' || v_working_hours_end || ').');
  END IF;

  -- 7. Count active bookings for capacity check
  SELECT COUNT(*) INTO v_active_bookings_count
  FROM public.bookings
  WHERE mua_id = p_mua_id
    AND event_date >= CURRENT_DATE
    AND status IN ('CONFIRMED', 'FULLY_PAID', 'PENDING_APPROVAL', 'CHECKING_OUT')
    AND NOT (status = 'CHECKING_OUT' AND locked_at < NOW() - INTERVAL '10 minutes');

  -- 8. Enforce capacity limits based on the effective plan
  --    FREE: max 2 active bookings. PRO/FOUNDER (incl. grace): unlimited.
  IF v_effective_plan = 'FREE' AND v_active_bookings_count >= 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'MUA_CAPACITY_EXCEEDED');
  END IF;

  -- 9. Time-slot overlap detection
  -- An existing booking conflicts if its occupied window overlaps with the requested window.
  -- Each existing booking's occupied window = [event_time, event_time + package.duration_hours + effective_buffer]
  WITH existing_slots AS (
    SELECT
      b.event_time,
      b.event_time + (p.duration_hours || ' hours')::INTERVAL +
        COALESCE(
          (SELECT i.buffer_minutes_override FROM public.invites i WHERE i.id = b.invite_id),
          v_default_buffer_minutes,
          0
        )::INT * INTERVAL '1 minute' AS slot_end
    FROM public.bookings b
    JOIN public.packages p ON p.id = b.package_id
    WHERE b.mua_id = p_mua_id
      AND b.event_date = p_event_date
      AND b.status IN ('CONFIRMED', 'FULLY_PAID', 'PENDING_APPROVAL', 'CHECKING_OUT')
      AND NOT (b.status = 'CHECKING_OUT' AND b.locked_at < NOW() - INTERVAL '10 minutes')
  )
  SELECT COUNT(*) INTO v_overlap_count
  FROM existing_slots
  WHERE v_req_start < slot_end AND v_req_end > event_time;

  IF v_overlap_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'TIME_SLOT_CONFLICT');
  END IF;

  -- 10. Insert checking-out block
  INSERT INTO public.bookings (
    mua_id,
    invite_id,
    package_id,
    event_date,
    event_time,
    client_name,
    client_phone,
    venue_address,
    total_amount,
    deposit_amount,
    balance_amount,
    status,
    locked_at
  )
  VALUES (
    p_mua_id,
    p_invite_id,
    p_package_id,
    p_event_date,
    p_event_time,
    p_client_name,
    p_client_phone,
    p_venue_address,
    p_total_amount,
    p_deposit_amount,
    p_balance_amount,
    'CHECKING_OUT',
    NOW()
  )
  RETURNING id INTO v_new_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_new_booking_id,
    'locked_until', NOW() + INTERVAL '10 minutes'
  );
END;
$function$;
