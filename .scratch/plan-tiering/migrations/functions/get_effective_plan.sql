-- get_effective_plan — the single source of truth for a MUA's effective plan tier.
-- Rule: FOUNDER → unlimited; PRO with NULL expiry (lifetime grant) or expiry plus
-- the 7-day grace in the future → unlimited; anything else (FREE, lapsed PRO) → FREE.
-- The 7-day grace is derived here, never stored.
-- SECURITY DEFINER: reads muas as the owner so anon callers never touch plan columns.
-- Returns ONLY the effective tier — expiry is never exposed.

CREATE OR REPLACE FUNCTION public.get_effective_plan(p_mua_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan public.plan_type;
  v_expires_at timestamptz;
BEGIN
  SELECT subscription_plan, plan_expires_at INTO v_plan, v_expires_at
  FROM public.muas
  WHERE id = p_mua_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('plan', 'FREE');
  END IF;

  IF v_plan = 'FOUNDER'
     OR (v_plan = 'PRO' AND (v_expires_at IS NULL OR v_expires_at + INTERVAL '7 days' > now())) THEN
    RETURN jsonb_build_object('plan', v_plan::text);
  END IF;

  RETURN jsonb_build_object('plan', 'FREE');
END;
$function$;
