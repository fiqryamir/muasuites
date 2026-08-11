# 06 — Should plan state be surfaced publicly?

Type: grilling
Status: resolved
Blocked by:

## Question

The last open decision before the spec: how much plan state is visible to the public and to MUAs' peers. Concretely:

- **Public page**: does the public studio page (`[mua_slug]`) or the booking-link checkout surface the MUA's plan, capacity, or any PRO/FOUNDER marker?
- **RLS exposure**: `muas` is publicly SELECTable (policy "Clients can view baseline MUA profiles", `USING true`) — `subscription_plan` is already exposed, and the new `plan_expires_at` (decided in 05) would leak too. Tighten the public policy to a baseline projection, or accept the leak?
- **Dashboard**: should the plan badge move into the nav (always visible) or stay in Settings/bookings only?

This is the last frontier ticket — once resolved, the way to the spec is clear and the effort hands off.

## Comments

<!-- claim: set Status: claimed before working -->
<!-- answer goes under ## Answer, then mark Status: resolved and gist it on the map -->

## Answer

Grilled live with the founder, 2026-08-11. Public exposure:

- **Nothing public**: the studio page and booking-link checkout stay plan-blind — no capacity numbers, no PRO/FOUNDER markers.
- **Tighten RLS**: anon loses direct SELECT on plan columns (`subscription_plan`, new `plan_expires_at`) on `muas`. All plan reads move behind `get_effective_plan`, which becomes **SECURITY DEFINER** (like the other RPCs). Concretely: `secure_checkout_slot` and the booking-link route (`select('id, slug, subscription_plan')` at `[mua_slug]/[token]/+page.server.ts`) stop reading plan fields directly and call the shared RPC instead. `get_mua_public_page` is already SECURITY DEFINER — unaffected.
- **Nav badge always**: the plan badge moves into the dashboard nav — constant upgrade awareness for FREE MUAs, plan identity for everyone. (Settings card + bookings-page reads stay.)

The last decision is resolved — the way to the spec is clear. The effort hands off: the next step is a spec-writing session (this map holds every decision it needs).
