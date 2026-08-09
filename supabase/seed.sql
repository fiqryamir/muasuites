-- MUAsuites demo studio seed — "Aina Beauty Studio" (/aina-beauty)
-- Safe to re-run: removes its own previous seed first.
-- The handle_new_user trigger auto-creates muas + mua_configs rows on auth signup.

-- 1. Clean up any previous demo seed (cascades to muas → configs/packages/blackouts)
delete from auth.users where email = 'demo@muasuites.com';

-- 2. Create the demo auth user (trigger auto-creates muas + mua_configs rows)
insert into auth.users (
	instance_id, id, aud, role, email, encrypted_password,
	email_confirmed_at, created_at, updated_at,
	confirmation_token, email_change, email_change_token_new, recovery_token
) values (
	'00000000-0000-0000-0000-000000000000',
	'11111111-2222-3333-4444-555555555555',
	'authenticated', 'authenticated',
	'demo@muasuites.com',
	crypt('demo-password-change-me', gen_salt('bf')),
	now(), now(), now(), '', '', '', ''
);

-- 3. Point the auto-created MUA row at the demo slug
update public.muas
set slug = 'aina-beauty'
where id = '11111111-2222-3333-4444-555555555555';

-- 4. Studio configuration
update public.mua_configs
set
	studio_name           = 'Aina Beauty Studio',
	whatsapp_number       = '60123456789',   -- digits only, wa.me format (fake demo number)
	base_lat              = 3.1570,          -- KLCC, Kuala Lumpur
	base_lng              = 101.7110,
	transport_formula     = 'PER_KM',
	rate_per_km           = 1.50,
	deposit_mode          = 'PERCENTAGE',
	deposit_value         = 50,              -- 50% deposit — matches the landing page mockups
	working_hours_start   = '08:00',
	working_hours_end     = '18:00',
	max_active_bookings   = 5                -- matches the advertised free-tier limit
where mua_id = '11111111-2222-3333-4444-555555555555';

-- 5. Packages
insert into public.packages (mua_id, name, price, emoji, duration_hours) values
	('11111111-2222-3333-4444-555555555555', 'Bridal Makeup',  888,  '💄', 3.0),
	('11111111-2222-3333-4444-555555555555', 'Bridal + Trial', 1288, '👰', 4.0),
	('11111111-2222-3333-4444-555555555555', 'Mother & Bride', 1488, '👩‍👧', 4.5),
	('11111111-2222-3333-4444-555555555555', 'Premium Suite',  2188, '🌟', 5.0);

-- 6. Blackout dates so the calendar looks lived-in (optional)
insert into public.blackout_dates (mua_id, blackout_date, reason) values
	('11111111-2222-3333-4444-555555555555', current_date + 20, 'Out of town'),
	('11111111-2222-3333-4444-555555555555', current_date + 21, 'Out of town');
