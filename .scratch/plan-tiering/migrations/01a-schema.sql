-- 2026-08-16 — Plan state + enforcement (issue 01, part A).
-- Schema + RPCs only. Backward-compatible with the pre-issue app code:
-- anon still holds full table-level SELECT on muas at this point (tightened in 01b).
-- Applied live via apply-plan-tiering-01a.mjs.

-- 1. Enum rebuild: plan_type FREE/PRO/ELITE → FREE/PRO/FOUNDER.
--    Postgres can't drop enum values inline, so the type is rebuilt
--    (rename → create → swap columns → drop). Safe: no ELITE rows exist.
--    NOTE: sent to the DB as ONE query by the apply script so the column
--    default is never left dangling between statements.
ALTER TABLE public.muas ALTER COLUMN subscription_plan DROP DEFAULT;
ALTER TYPE public.plan_type RENAME TO plan_type_legacy;
CREATE TYPE public.plan_type AS ENUM ('FREE', 'PRO', 'FOUNDER');
ALTER TABLE public.muas ALTER COLUMN subscription_plan TYPE public.plan_type USING subscription_plan::text::plan_type;
DROP TYPE public.plan_type_legacy;
ALTER TABLE public.muas ALTER COLUMN subscription_plan SET DEFAULT 'FREE'::public.plan_type;

-- 2. Plan expiry on muas. NULL = never expires (FOUNDER grants / lifetime).
ALTER TABLE public.muas ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

-- 3. Renewal ledger — one row per renewal; FOUNDER grants are rows too
--    (amount 0, period LIFETIME, NULL new_expiry). verified_at IS NULL = pending.
CREATE TABLE IF NOT EXISTS public.plan_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mua_id uuid NOT NULL REFERENCES public.muas(id),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  period text NOT NULL CHECK (period IN ('30_DAYS', '12_MONTHS', 'LIFETIME')),
  receipt_url text,
  verified_at timestamptz,
  new_expiry timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_renewals_mua_created ON public.plan_renewals (mua_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_renewals_pending ON public.plan_renewals (verified_at) WHERE verified_at IS NULL;

ALTER TABLE public.plan_renewals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MUAs can read own renewals" ON public.plan_renewals;
CREATE POLICY "MUAs can read own renewals" ON public.plan_renewals
  FOR SELECT USING (auth.uid() = mua_id);

REVOKE ALL ON public.plan_renewals FROM anon;

-- 4. Drop the dead capacity column — the FREE cap is the hardcoded constant 2.
ALTER TABLE public.mua_configs DROP COLUMN IF EXISTS max_active_bookings;
