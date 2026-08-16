-- pgTAP fixtures — minimal, production-shaped schema for the issue-01 RPC tests.
-- Re-runnable: drops and recreates everything. Idempotent.
-- Note: NO max_active_bookings on mua_configs — its absence is asserted in tests.

-- Roles (defensive — supabase local image usually provides them)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
END
$$;

-- Enums (production shapes)
DROP TYPE IF EXISTS public.plan_type CASCADE;
CREATE TYPE public.plan_type AS ENUM ('FREE', 'PRO', 'FOUNDER');

DROP TYPE IF EXISTS public.booking_status CASCADE;
CREATE TYPE public.booking_status AS ENUM
  ('CHECKING_OUT', 'PENDING_APPROVAL', 'CONFIRMED', 'REJECTED', 'FULLY_PAID', 'EXPIRED', 'CANCELLED', 'COMPLETED');

DROP TYPE IF EXISTS public.deposit_mode CASCADE;
CREATE TYPE public.deposit_mode AS ENUM ('FIXED', 'PERCENT');

DROP TYPE IF EXISTS public.transport_type CASCADE;
CREATE TYPE public.transport_type AS ENUM ('PER_KM', 'FLAT', 'ZONES');

-- Tables
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.invites CASCADE;
DROP TABLE IF EXISTS public.packages CASCADE;
DROP TABLE IF EXISTS public.blackout_dates CASCADE;
DROP TABLE IF EXISTS public.mua_configs CASCADE;
DROP TABLE IF EXISTS public.muas CASCADE;

CREATE TABLE public.muas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  subscription_plan public.plan_type NOT NULL DEFAULT 'FREE',
  plan_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.mua_configs (
  mua_id uuid PRIMARY KEY,
  working_hours_start time NOT NULL DEFAULT '08:00:00',
  working_hours_end time NOT NULL DEFAULT '18:00:00',
  default_buffer_minutes smallint NOT NULL DEFAULT 0
);

CREATE TABLE public.packages (
  id bigserial PRIMARY KEY,
  mua_id uuid NOT NULL,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  emoji text NOT NULL DEFAULT '💄',
  is_active boolean NOT NULL DEFAULT true,
  duration_hours numeric NOT NULL DEFAULT 3.0
);

CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mua_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  is_used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  buffer_minutes_override smallint
);

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mua_id uuid NOT NULL,
  invite_id uuid,
  package_id bigint,
  event_date date NOT NULL,
  event_time time NOT NULL,
  client_name text,
  client_phone text,
  venue_address text,
  status public.booking_status NOT NULL DEFAULT 'CHECKING_OUT',
  locked_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  deposit_amount numeric(10,2) NOT NULL DEFAULT 0,
  balance_amount numeric(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE public.blackout_dates (
  id bigserial PRIMARY KEY,
  mua_id uuid NOT NULL,
  blackout_date date NOT NULL
);

-- Privileges — post-issue-01 production state (part B applied):
-- anon may only SELECT (id, slug) on muas; authenticated may only UPDATE slug.
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
REVOKE SELECT ON public.muas FROM anon;
GRANT SELECT (id, slug) ON public.muas TO anon;
REVOKE UPDATE ON public.muas FROM authenticated;
GRANT UPDATE (slug) ON public.muas TO authenticated;

-- RLS: mirror the production muas policy so anon reads are realistic.
ALTER TABLE public.muas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients can view baseline MUA profiles" ON public.muas;
CREATE POLICY "Clients can view baseline MUA profiles" ON public.muas FOR SELECT TO public USING (true);

-- Fixture helpers
CREATE OR REPLACE FUNCTION public.fixture_mua(
  p_plan text DEFAULT 'FREE',
  p_expires_in interval DEFAULT NULL,
  p_slug text DEFAULT 'mua'
) RETURNS uuid AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.muas (email, slug, subscription_plan, plan_expires_at)
  VALUES (
    p_slug || '@' || md5(random()::text) || '.test',
    p_slug || '-' || substr(md5(random()::text), 1, 8),
    p_plan::public.plan_type,
    CASE WHEN p_expires_in IS NULL THEN NULL ELSE now() + p_expires_in END
  )
  RETURNING id INTO v_id;
  INSERT INTO public.mua_configs (mua_id) VALUES (v_id);
  RETURN v_id;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.fixture_package(p_mua uuid, p_duration numeric DEFAULT 3.0)
RETURNS bigint AS $$
  INSERT INTO public.packages (mua_id, name, price, duration_hours)
  VALUES (p_mua, 'Test Package', 100, p_duration)
  RETURNING id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.fixture_booking(
  p_mua uuid, p_pkg bigint, p_date date, p_time time,
  p_status text DEFAULT 'CONFIRMED', p_locked_at timestamptz DEFAULT now()
) RETURNS uuid AS $$
  INSERT INTO public.bookings (mua_id, package_id, event_date, event_time, status, locked_at, client_name)
  VALUES (p_mua, p_pkg, p_date, p_time, p_status::public.booking_status, p_locked_at, 'Client')
  RETURNING id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.fixture_invite(
  p_mua uuid, p_used boolean DEFAULT false,
  p_expires_at timestamptz DEFAULT now() + interval '7 days'
) RETURNS uuid AS $$
  INSERT INTO public.invites (mua_id, token, is_used, expires_at)
  VALUES (p_mua, md5(random()::text), p_used, p_expires_at)
  RETURNING id;
$$ LANGUAGE sql;

-- Convenience: call secure_checkout_slot with sensible defaults.
CREATE OR REPLACE FUNCTION public.call_slot(
  p_mua uuid, p_date date, p_time time, p_pkg bigint DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE v_pkg bigint;
BEGIN
  v_pkg := COALESCE(p_pkg, (SELECT id FROM public.packages WHERE mua_id = p_mua ORDER BY id LIMIT 1));
  RETURN public.secure_checkout_slot(
    p_mua, NULL, v_pkg, p_date, p_time,
    'Test Client', '60123456789', 'Test Venue', 100, 50, 50
  );
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.call_slot_invite(
  p_mua uuid, p_invite uuid, p_date date, p_time time
) RETURNS jsonb AS $$
DECLARE v_pkg bigint;
BEGIN
  v_pkg := (SELECT id FROM public.packages WHERE mua_id = p_mua ORDER BY id LIMIT 1);
  RETURN public.secure_checkout_slot(
    p_mua, p_invite, v_pkg, p_date, p_time,
    'Test Client', '60123456789', 'Test Venue', 100, 50, 50
  );
END
$$ LANGUAGE plpgsql;

-- Privilege probe helpers (SECURITY INVOKER — run under SET ROLE).
CREATE OR REPLACE FUNCTION public.can_read_muas_col(p_col text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  EXECUTE format('SELECT %I FROM public.muas LIMIT 1', p_col);
  RETURN true;
EXCEPTION WHEN insufficient_privilege THEN
  RETURN false;
END
$$;

CREATE OR REPLACE FUNCTION public.can_update_muas_col(p_col text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  EXECUTE format('UPDATE public.muas SET %I = %I WHERE false', p_col, p_col);
  RETURN true;
EXCEPTION WHEN insufficient_privilege THEN
  RETURN false;
END
$$;
