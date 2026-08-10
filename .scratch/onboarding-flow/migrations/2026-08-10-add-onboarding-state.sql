-- 2026-08-10 — Onboarding state (decision 01) + existing-user backfill (decision 05)
-- Applied directly to the live cloud project via the Management API (see apply-backfill.mjs).
-- Idempotent: safe to re-run.

-- 1. State columns on mua_configs — gate + resume signals.
--    onboarding_step 0-4 (0 = not started, 4 = last input step finished)
--    onboarded_at    NULL = not onboarded (the gate reads this only)
ALTER TABLE public.mua_configs
	ADD COLUMN IF NOT EXISTS onboarding_step smallint NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

-- 2. Backfill: profiles already holding every mandatory field are marked onboarded.
--    Mandatory = studio name, WhatsApp number, DuitNow QR, deposit value, >=1 active package.
UPDATE public.mua_configs mc
SET onboarded_at = now(),
	onboarding_step = 4
WHERE mc.onboarded_at IS NULL
	AND mc.studio_name IS NOT NULL AND length(trim(mc.studio_name)) > 0
	AND mc.whatsapp_number IS NOT NULL AND length(trim(mc.whatsapp_number)) > 0
	AND mc.duitnow_qr_url IS NOT NULL AND length(trim(mc.duitnow_qr_url)) > 0
	AND mc.deposit_value > 0
	AND EXISTS (
		SELECT 1 FROM public.packages p
		WHERE p.mua_id = mc.mua_id AND p.is_active = true
	);

-- handle_new_user needs no change: column defaults (0 / NULL) put new signups at step 0.
