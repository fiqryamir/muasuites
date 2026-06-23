
DECLARE
  v_booking_record RECORD;
  v_package_record RECORD;
  v_config_record RECORD;
BEGIN
  -- 1. Securely update the booking status (only if it is currently locked in CHECKING_OUT)
  UPDATE public.bookings
  SET status = 'PENDING_APPROVAL',
      receipt_url = p_receipt_url
  WHERE id = p_booking_id AND status = 'CHECKING_OUT'
  RETURNING * INTO v_booking_record;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'BOOKING_NOT_FOUND_OR_EXPIRED');
  END IF;

  -- 2. Permanently deactivate the invitation link
  UPDATE public.invites
  SET is_used = TRUE
  WHERE id = p_invite_id;

  -- 3. Fetch package and config metadata for the notification payload
  SELECT * INTO v_package_record FROM public.packages WHERE id = v_booking_record.package_id;
  SELECT studio_name, telegram_chat_id, whatsapp_number INTO v_config_record FROM public.mua_configs WHERE mua_id = v_booking_record.mua_id;

  -- 4. Return unified JSON configuration payload to SvelteKit
  RETURN jsonb_build_object(
    'success', true,
    'booking', jsonb_build_object(
      'client_name', v_booking_record.client_name,
      'client_phone', v_booking_record.client_phone,
      'event_date', v_booking_record.event_date,
      'event_time', v_booking_record.event_time,
      'venue_address', v_booking_record.venue_address,
      'total_amount', v_booking_record.total_amount,
      'deposit_amount', v_booking_record.deposit_amount,
      'balance_amount', v_booking_record.balance_amount,
      'mua_id', v_booking_record.mua_id
    ),
    'package', jsonb_build_object(
      'name', COALESCE(v_package_record.name, 'Makeup Package'),
      'emoji', COALESCE(v_package_record.emoji, '💄')
    ),
    'config', jsonb_build_object(
      'studio_name', COALESCE(v_config_record.studio_name, 'Makeup Studio'),
      'telegram_chat_id', v_config_record.telegram_chat_id,
      'whatsapp_number', v_config_record.whatsapp_number
    )
  );
END;
