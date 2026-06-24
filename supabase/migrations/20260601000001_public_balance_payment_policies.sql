-- Allow public (unauthenticated) read access to bookings via balance_token
CREATE POLICY "Public can read bookings by balance_token"
ON public.bookings
FOR SELECT
TO anon
USING (balance_token IS NOT NULL AND status = 'CONFIRMED');

-- Allow public (unauthenticated) read access to mua_configs for payment pages
-- Only exposes duitnow_qr_url and studio_name
CREATE POLICY "Public can read mua_configs for payment pages"
ON public.mua_configs
FOR SELECT
TO anon
USING (true);