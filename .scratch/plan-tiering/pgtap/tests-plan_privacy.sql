-- Plan privacy (RLS/privileges, part-B state) + schema sanity (issue 01)

-- --- Schema ---

-- Enum rebuilt: FREE/PRO/FOUNDER, no ELITE
SELECT ok(
  (SELECT array_agg(e.enumlabel::text ORDER BY e.enumsortorder) FROM pg_enum e
   JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'plan_type') = ARRAY['FREE', 'PRO', 'FOUNDER']::text[],
  'plan_type enum is FREE/PRO/FOUNDER (ELITE dropped)'
);

-- muas.plan_expires_at exists
SELECT ok(
  EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'muas' AND column_name = 'plan_expires_at'),
  'muas.plan_expires_at column exists'
);

-- mua_configs.max_active_bookings dropped
SELECT ok(
  NOT EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'mua_configs' AND column_name = 'max_active_bookings'),
  'mua_configs.max_active_bookings is gone'
);

-- get_effective_plan is SECURITY DEFINER
SELECT ok(
  (SELECT prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_effective_plan'),
  'get_effective_plan is SECURITY DEFINER'
);

-- secure_checkout_slot stays SECURITY INVOKER
SELECT ok(
  NOT (SELECT prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'secure_checkout_slot'),
  'secure_checkout_slot is SECURITY INVOKER'
);

-- --- Anonymous can no longer read plan columns ---

-- Fixture created as postgres first (anon cannot INSERT into RLS'd muas)
SELECT public.fixture_mua('PRO', interval '30 days', 'anon_rpc') AS v_anon_mua \gset

SET ROLE anon;

SELECT ok(
  NOT public.can_read_muas_col('subscription_plan'),
  'anon cannot SELECT subscription_plan on muas'
);

SELECT ok(
  NOT public.can_read_muas_col('plan_expires_at'),
  'anon cannot SELECT plan_expires_at on muas'
);

SELECT ok(
  public.can_read_muas_col('id') AND public.can_read_muas_col('slug'),
  'anon can still SELECT id and slug on muas'
);

-- The sanctioned surface: anon may call get_effective_plan
SELECT ok(
  (public.get_effective_plan(:'v_anon_mua') ->> 'plan') = 'PRO',
  'anon can call get_effective_plan (sanctioned plan read)'
);

RESET ROLE;

-- --- Authenticated can no longer self-grant ---

SET ROLE authenticated;

SELECT ok(
  NOT public.can_update_muas_col('subscription_plan'),
  'authenticated cannot UPDATE subscription_plan on muas'
);

SELECT ok(
  NOT public.can_update_muas_col('plan_expires_at'),
  'authenticated cannot UPDATE plan_expires_at on muas'
);

SELECT ok(
  public.can_update_muas_col('slug'),
  'authenticated can still UPDATE slug on muas'
);

RESET ROLE;
