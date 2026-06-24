-- Balance payment columns
-- MUA sets default cutoff in config, can override per invite

-- 1. mua_configs: default balance due window
ALTER TABLE mua_configs ADD COLUMN IF NOT EXISTS balance_due_days_before smallint NOT NULL DEFAULT 3 CHECK (balance_due_days_before >= 0 AND balance_due_days_before <= 30);

-- 2. invites: per-invite override
ALTER TABLE invites ADD COLUMN IF NOT EXISTS balance_due_days_before_override smallint CHECK (balance_due_days_before_override IS NULL OR (balance_due_days_before_override >= 0 AND balance_due_days_before_override <= 30));

-- 3. bookings: computed balance due date + balance payment token + second receipt
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS balance_due_date date;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS balance_token uuid UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS balance_receipt_url text;