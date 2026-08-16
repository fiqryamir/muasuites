-- get_effective_plan — effective-tier matrix (issue 01)

-- FREE + NULL expiry → FREE
SELECT ok(
  (public.get_effective_plan(public.fixture_mua('FREE', NULL, 'mua_free')) ->> 'plan') = 'FREE',
  'FREE with NULL expiry → FREE'
);

-- PRO + expiry 30 days out → PRO
SELECT ok(
  (public.get_effective_plan(public.fixture_mua('PRO', interval '30 days', 'mua_pro_active')) ->> 'plan') = 'PRO',
  'PRO with expiry in 30 days → PRO'
);

-- PRO + expired 3 days ago → still PRO (7-day grace)
SELECT ok(
  (public.get_effective_plan(public.fixture_mua('PRO', interval '-3 days', 'mua_pro_grace')) ->> 'plan') = 'PRO',
  'PRO expired 3 days ago (in 7-day grace) → PRO'
);

-- PRO + expired 10 days ago → FREE (grace over)
SELECT ok(
  (public.get_effective_plan(public.fixture_mua('PRO', interval '-10 days', 'mua_pro_lapsed')) ->> 'plan') = 'FREE',
  'PRO expired 10 days ago (grace over) → FREE'
);

-- PRO + NULL expiry → PRO (lifetime grant representation)
SELECT ok(
  (public.get_effective_plan(public.fixture_mua('PRO', NULL, 'mua_pro_lifetime')) ->> 'plan') = 'PRO',
  'PRO with NULL expiry → PRO'
);

-- FOUNDER + NULL expiry → FOUNDER
SELECT ok(
  (public.get_effective_plan(public.fixture_mua('FOUNDER', NULL, 'mua_founder')) ->> 'plan') = 'FOUNDER',
  'FOUNDER with NULL expiry → FOUNDER'
);

-- FOUNDER + past expiry → still FOUNDER (grants never lapse)
SELECT ok(
  (public.get_effective_plan(public.fixture_mua('FOUNDER', interval '-100 days', 'mua_founder_past')) ->> 'plan') = 'FOUNDER',
  'FOUNDER with past expiry → FOUNDER'
);

-- Unknown MUA → FREE (most restrictive)
SELECT ok(
  (public.get_effective_plan('00000000-0000-0000-0000-000000000000') ->> 'plan') = 'FREE',
  'unknown MUA id → FREE'
);
