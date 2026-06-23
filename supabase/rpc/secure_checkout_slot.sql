
DECLARE
  v_subscription_plan plan_type;
  v_active_bookings_count INT;
  v_date_conflict_count INT;
  v_new_booking_id UUID;
  v_is_used BOOLEAN;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Row-level locking to serialize concurrent checks for this specific MUA
  PERFORM 1 FROM public.mua_configs WHERE mua_id = p_mua_id FOR UPDATE;

  -- 1. Verify integrity of the invite link
  IF p_invite_id IS NOT NULL THEN
    SELECT is_used, expires_at INTO v_is_used, v_expires_at
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

  -- 2. Fetch MUA subscription status
  SELECT subscription_plan INTO v_subscription_plan
  FROM public.muas
  WHERE id = p_mua_id;

  -- 3. Calculate concurrent active bookings
  SELECT COUNT(*) INTO v_active_bookings_count
  FROM public.bookings
  WHERE mua_id = p_mua_id
    AND event_date >= CURRENT_DATE
    AND status IN ('CONFIRMED', 'PENDING_APPROVAL', 'CHECKING_OUT')
    AND NOT (status = 'CHECKING_OUT' AND locked_at < NOW() - INTERVAL '10 minutes');

  -- Enforce FREE plan capacity limits
  IF v_subscription_plan = 'FREE' AND v_active_bookings_count >= 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'MUA_CAPACITY_EXCEEDED');
  END IF;

  -- 4. Check for double-booking conflicts on the target date
  SELECT COUNT(*) INTO v_date_conflict_count
  FROM public.bookings
  WHERE mua_id = p_mua_id
    AND event_date = p_event_date
    AND status IN ('CONFIRMED', 'PENDING_APPROVAL', 'CHECKING_OUT')
    AND NOT (status = 'CHECKING_OUT' AND locked_at < NOW() - INTERVAL '10 minutes');

  IF v_date_conflict_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'DATE_ALREADY_TAKEN');
  END IF;

  -- 5. Insert checking-out block
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
