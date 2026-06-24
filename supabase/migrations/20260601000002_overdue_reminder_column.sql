-- Column to track when we last notified MUA about an overdue balance
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS last_overdue_notified_at timestamp with time zone;