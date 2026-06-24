-- Performance Indexes for Public Profile & Booking Caching Strategy
-- Created: 2026-06-24
-- Rationale: All queries on public MUA profile and invite booking pages
-- need partial composite indexes to avoid sequential scans at scale (300+ MUAs).

-- 1. Active bookings lookup (used by secure_checkout_slot RPC + both public pages)
-- Filters: mua_id, event_date >= today, status IN (CONFIRMED, PENDING_APPROVAL, CHECKING_OUT)
CREATE INDEX IF NOT EXISTS idx_bookings_mua_date_status
ON public.bookings (mua_id, event_date, status)
WHERE status IN ('CONFIRMED', 'PENDING_APPROVAL', 'CHECKING_OUT');

-- 2. Invite token lookup (every invite link click — must be fast)
CREATE UNIQUE INDEX IF NOT EXISTS idx_invites_token
ON public.invites (token);

-- 3. Booking invite_id join (used in dashboard + finalize RPC)
CREATE INDEX IF NOT EXISTS idx_bookings_invite_id
ON public.bookings (invite_id);

-- 4. Packages list (public profile + settings — filtered by active + ordered by price)
CREATE INDEX IF NOT EXISTS idx_packages_mua_active_price
ON public.packages (mua_id, is_active, price);

-- 5. Blackout dates (public profile + invite page)
CREATE INDEX IF NOT EXISTS idx_blackout_dates_mua_date
ON public.blackout_dates (mua_id, blackout_date);

-- 6. Invite MUA + expiry check (used during checkout validation)
CREATE INDEX IF NOT EXISTS idx_invites_mua_expires
ON public.invites (mua_id, expires_at);

-- 7. Balance token lookup (balance payment page)
CREATE INDEX IF NOT EXISTS idx_bookings_balance_token
ON public.bookings (balance_token);

-- 8. Overdue reminders cron query (status=CONFIRMED, balance>0, past due date)
CREATE INDEX IF NOT EXISTS idx_bookings_overdue_reminder
ON public.bookings (status, balance_amount, balance_due_date)
WHERE status = 'CONFIRMED' AND balance_amount > 0;

COMMENT ON INDEX idx_bookings_mua_date_status IS 'Speeds up public profile day-slot queries and secure_checkout_slot capacity/conflict checks';
COMMENT ON INDEX idx_invites_token IS 'Enables O(1) invite token lookup for every booking link click';
COMMENT ON INDEX idx_bookings_invite_id IS 'Speeds up dashboard booking list joins and receipt finalization';
COMMENT ON INDEX idx_packages_mua_active_price IS 'Speeds up public profile package listing sorted by price';
COMMENT ON INDEX idx_blackout_dates_mua_date IS 'Speeds up blackout date intersection on calendar widget';
COMMENT ON INDEX idx_invites_mua_expires IS 'Speeds up invite expiry validation during checkout';
COMMENT ON INDEX idx_bookings_balance_token IS 'Speeds up balance payment page loading';
COMMENT ON INDEX idx_bookings_overdue_reminder IS 'Speeds up daily overdue balance reminder cron query';