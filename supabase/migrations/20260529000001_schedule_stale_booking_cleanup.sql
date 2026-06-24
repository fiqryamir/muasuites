-- Enable pg_cron extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup job to run daily at 3:00 AM Malaysia time (UTC+8)
-- cron expression: minute hour day-of-month month day-of-week
SELECT cron.schedule(
  'cleanup-stale-bookings',  -- job name
  '0 3 * * *',               -- every day at 03:00 UTC (11:00 MYT)
  'SELECT cleanup_stale_bookings()'
);