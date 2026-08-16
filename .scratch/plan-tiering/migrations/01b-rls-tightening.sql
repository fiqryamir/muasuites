-- 2026-08-16 — Plan privacy (issue 01, part B). Apply AFTER the app code is live.
-- anon loses direct SELECT on muas plan columns; all plan reads route through
-- the SECURITY DEFINER get_effective_plan RPC. Authenticated UPDATE is restricted
-- to slug — the only column the app writes on muas — closing the self-grant hole.
-- Applied live via apply-plan-tiering-01b.mjs.

REVOKE SELECT ON public.muas FROM anon;
GRANT SELECT (id, slug) ON public.muas TO anon;

REVOKE UPDATE ON public.muas FROM authenticated;
GRANT UPDATE (slug) ON public.muas TO authenticated;
