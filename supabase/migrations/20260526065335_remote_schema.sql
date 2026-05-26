-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.blackout_dates (
  id bigint NOT NULL DEFAULT nextval('blackout_dates_id_seq'::regclass),
  mua_id uuid NOT NULL,
  blackout_date date NOT NULL,
  reason text,
  CONSTRAINT blackout_dates_pkey PRIMARY KEY (id),
  CONSTRAINT blackout_dates_mua_id_fkey FOREIGN KEY (mua_id) REFERENCES public.muas(id)
);
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mua_id uuid NOT NULL,
  invite_id uuid,
  package_id bigint,
  client_name text,
  client_phone text,
  event_date date NOT NULL,
  event_time time without time zone NOT NULL,
  venue_address text,
  venue_lat double precision,
  venue_lng double precision,
  total_amount numeric NOT NULL,
  deposit_amount numeric NOT NULL,
  balance_amount numeric NOT NULL,
  receipt_url text,
  status USER-DEFINED NOT NULL DEFAULT 'CHECKING_OUT'::booking_status,
  approval_token text UNIQUE,
  calendar_uid text UNIQUE,
  locked_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_mua_id_fkey FOREIGN KEY (mua_id) REFERENCES public.muas(id),
  CONSTRAINT bookings_invite_id_fkey FOREIGN KEY (invite_id) REFERENCES public.invites(id),
  CONSTRAINT bookings_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id)
);
CREATE TABLE public.invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mua_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  package_id bigint,
  event_date date,
  transport_fee_override numeric NOT NULL DEFAULT 0.00,
  custom_surcharge numeric NOT NULL DEFAULT 0.00,
  surcharge_remark text,
  deposit_mode_override USER-DEFINED,
  deposit_value_override numeric,
  is_used boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT invites_pkey PRIMARY KEY (id),
  CONSTRAINT invites_mua_id_fkey FOREIGN KEY (mua_id) REFERENCES public.muas(id),
  CONSTRAINT invites_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id)
);
CREATE TABLE public.mua_configs (
  mua_id uuid NOT NULL,
  studio_name text,
  whatsapp_number text,
  telegram_chat_id text,
  duitnow_qr_url text,
  base_lat double precision,
  base_lng double precision,
  transport_formula USER-DEFINED NOT NULL DEFAULT 'FLAT'::transport_type,
  rate_per_km numeric NOT NULL DEFAULT 0.00,
  deposit_mode USER-DEFINED NOT NULL DEFAULT 'FIXED'::deposit_mode,
  deposit_value numeric NOT NULL DEFAULT 0.00,
  CONSTRAINT mua_configs_pkey PRIMARY KEY (mua_id),
  CONSTRAINT mua_configs_mua_id_fkey FOREIGN KEY (mua_id) REFERENCES public.muas(id)
);
CREATE TABLE public.muas (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  subscription_plan USER-DEFINED NOT NULL DEFAULT 'FREE'::plan_type,
  slug text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT muas_pkey PRIMARY KEY (id),
  CONSTRAINT muas_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.packages (
  id bigint NOT NULL DEFAULT nextval('packages_id_seq'::regclass),
  mua_id uuid NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL,
  emoji text NOT NULL DEFAULT '💄'::text,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT packages_pkey PRIMARY KEY (id),
  CONSTRAINT packages_mua_id_fkey FOREIGN KEY (mua_id) REFERENCES public.muas(id)
);
CREATE TABLE public.schema_migrations (
  version character varying NOT NULL,
  CONSTRAINT schema_migrations_pkey PRIMARY KEY (version)
);