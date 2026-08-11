# 02 — MUA renewal loop

**What to build:** the MUA-facing side of paying for PRO. The dead "Upgrade" span in Settings becomes a real Plan card — current plan, paid-until date, status (Active / Expiring soon / In grace / Expired), and a renew button — linked to a dedicated plan page with both pricing options (RM 29 for 30 days, RM 290 for 12 months). Renewing: the MUA picks a period (free choice at every renewal), scans the founder's DuitNow QR, transfers, and uploads a receipt screenshot. The receipt lands as a pending renewal record, and the MUA sees "renewal pending" until the founder approves.

**Blocked by:** 01 — Plan state and enforcement

**Status:** ready-for-agent

- [ ] Settings Plan card replaces the dead Upgrade span: plan, paid-until, status badge, renew CTA
- [ ] Dedicated plan page (auth-gated) shows both pricing options and the full renew flow
- [ ] Period choice at every renewal — monthly (30 days) or yearly (12 months), free to switch
- [ ] Founder's DuitNow QR (sourced from configuration, not the MUA's own) displayed during renewal
- [ ] Receipt upload reuses the existing client deposit pattern; a pending `plan_renewals` row is created with amount, period, and receipt
- [ ] MUA sees "renewal pending" state on the Plan card; no capacity change until the founder approves
- [ ] Landing pricing copy corrected: RM 30 → RM 29/month + RM 290/year, "5 active bookings" → 2
