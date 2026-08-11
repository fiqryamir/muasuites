# 04 — What does the founder legally need to charge for subscriptions?

Type: research
Status: resolved
Blocked by:

## Question

Produce the compliance checklist the spec hands off: the human steps to legally sell PRO subscriptions in Malaysia. Starting point: solo founder, **no company registered**. Concretely:

- **Entity**: SSM sole proprietorship vs Sdn Bhd — which is required to (a) collect DuitNow business payments and (b) apply to a payment gateway (feed 03's onboarding requirements in); cost, timeline, documents
- **Banking**: business bank account requirements (does DuitNow QR for a business need one?)
- **Tax**: LHDN obligations — income tax registration, SST (software subscription subject?), invoicing
- **Gateway prerequisites**: the KYC/company-material the gateways in 03 demand, so the founder registers the right entity the first time
- **Sequence**: the ordered step-by-step checklist with rough costs and lead times

Resolve via a `/research` subagent against primary sources (SSM, LHDN, bank, gateway docs), findings as a Markdown file linked below.

## Comments

<!-- research findings file: research/compliance-checklist.md -->
<!-- resolution: mark Status: resolved, gist on the map -->

## Answer

Full findings: [research/compliance-checklist.md](../research/compliance-checklist.md) (all claims cited to SSM / LHDN / MySST / PayNet / gateway primary sources, verified 11 Aug 2026).

**Ordered checklist (sole prop route — recommended for launch):**
1. **SSM sole proprietorship registration** — RM 60/yr (trade name) or RM 30/yr (personal name); ~1 day online. Blocking: no business account, gateway, or business DuitNow QR without it.
2. **TIN** — auto-issued to Malaysian citizens ≥ 18; verify on mytax.hasil.gov.my. Free.
3. **Business bank account** (sole prop current account, SSM cert + NRIC; deposit ~RM 250–1,000) — days. Blocking: every gateway pays out only to an account under the registered business name; business DuitNow QR needs it.
4. **DuitNow QR** — personal QR suffices as a low-volume launch stopgap; business QR once the account is open. Free.
5. **File Form B annually** (YA2025: 30 Jun 2026, e-Filing grace to 15 Jul 2026); keep records 7 years.
6. **Service tax: no registration at launch** — SaaS = Group G IT services, 8% if taxable, but threshold is RM 500k/12mo taxable supplies and B2B exemption covers registered-person supplies; the July 2025 SST expansion (healthcare/education/construction/rental/financial) did not touch IT services. Monitor at ~RM 500k.
7. **e-Invoice: not required** while turnover < RM 1,000,000 (exemption updated 7 Dec 2025).
8. **Gateway later** — Chip / BayarCash / ToyyibPay / Billplz all accept sole props (SSM number + business bank account + e-KYC; Billplz also asks TIN + SST status). Only Chip does card-token subscription billing (renewal logic merchant-side). No Sdn Bhd required by any of them.

**Total to start selling: ~RM 60/yr + bank deposit; 1–2 weeks.** Sdn Bhd (RM 1,000 + secretary, audit-exempt under PD 10/2024) is optional — defer until liability/investor needs.
