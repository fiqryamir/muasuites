-- Add EXPIRED to booking_status enum for CHECKING_OUT timeouts (>10 min)
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'EXPIRED';