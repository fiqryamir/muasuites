-- Migration: Time-Slot Aware Booking System
-- Adds duration_hours to packages, working hours + buffer + nullable capacity to mua_configs, buffer override to invites
-- 2026-05-27

-- 1. packages.duration_hours
ALTER TABLE public.packages ADD COLUMN duration_hours numeric NOT NULL DEFAULT 3.0
CHECK (duration_hours >= 0.5 AND duration_hours <= 12 AND (duration_hours * 2)::int % 1 = 0);

-- 2. mua_configs: working hours, buffer, nullable capacity
ALTER TABLE public.mua_configs
ADD COLUMN working_hours_start time NOT NULL DEFAULT '08:00',
ADD COLUMN working_hours_end   time NOT NULL DEFAULT '18:00',
ADD COLUMN default_buffer_minutes smallint NOT NULL DEFAULT 0
CHECK (default_buffer_minutes >= 0 AND default_buffer_minutes <= 120),
ADD COLUMN max_active_bookings smallint DEFAULT 2
CHECK (max_active_bookings IS NULL OR (max_active_bookings >= 1 AND max_active_bookings <= 100));

COMMENT ON COLUMN public.mua_configs.working_hours_start IS 'MUA daily availability start time';
COMMENT ON COLUMN public.mua_configs.working_hours_end IS 'MUA daily availability end time';
COMMENT ON COLUMN public.mua_configs.default_buffer_minutes IS 'Default travel/padding buffer in minutes between bookings (0-120)';
COMMENT ON COLUMN public.mua_configs.max_active_bookings IS 'Max concurrent active bookings. NULL = unlimited (paid plans). FREE plan default: 2.';

-- Comment on packages.duration_hours
COMMENT ON COLUMN public.packages.duration_hours IS 'Duration in hours (30-min increments, 0.5-12). Used for time-slot overlap detection.';

-- 3. invites.buffer_minutes_override
ALTER TABLE public.invites ADD COLUMN buffer_minutes_override smallint
CHECK (buffer_minutes_override IS NULL OR (buffer_minutes_override >= 0 AND buffer_minutes_override <= 120));

COMMENT ON COLUMN public.invites.buffer_minutes_override IS 'Per-invite override for travel buffer minutes. Falls back to mua_configs.default_buffer_minutes if null.';