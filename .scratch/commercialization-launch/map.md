# Map: MUASuites commercialization launch

## Destination

A handoff-ready Malaysia-first commercialization launch plan for MUASuites: a controlled 10-MUA Founder beta followed by a paid public launch, with the legal/entity, privacy, banking/payment, customer relationship, and launch-gate decisions settled and ready for professional review and execution.

## Notes

- Domain: Malaysia-first SaaS commercialization for freelance makeup artists.
- This is a planning map. It does not file registrations, open bank accounts, obtain professional advice, or implement product changes.
- Skills every session should consult: `/grilling` + `/domain-modeling` for HITL tickets; `/research` for AFK tickets. Consult `CONTEXT.md` and `docs/agents/supabase-state.md` before touching product or schema concepts.
- Standing decisions: the route has a private beta for up to 10 Founding MUAs before paid public launch; each accepted participant receives the Founder Plan, which is free for life, PRO-equivalent, manually granted, and revocable only for documented serious reasons; written consent is required for public use of Founding MUA identities or outputs; the MUA is the SaaS customer and service owner; Malaysian professional legal/accounting review is required before paid launch.
- Intended payment boundary: the Client pays the MUA directly. MUASuites displays the MUA's DuitNow QR, accepts a `Proof of Transfer`, and exposes explicit `MUA Payment Confirmation`; MUASuites does not collect, hold, split, settle, guarantee, or verify Client service funds.
- Existing paid-plan decisions are carried from `.scratch/plan-tiering/`: PRO is RM 29 monthly or RM 290 yearly, renewal is manual via DuitNow and receipt verification, and the prior research recommends an SSM sole proprietorship as the initial route. This map validates what must be carried into commercialization rather than duplicating that plan-tiering work.
- The repository currently has stale pricing/capacity marketing and payment-state inconsistencies. These are launch-readiness facts to verify, not assumptions to silently fold into the plan.

## Decisions so far

<!-- one line per resolved child ticket: gist + link -->

- [02 - What banking and DuitNow QR setup fits the launch?](decisions/02-what-banking-and-qr-setup-fits.md): research baseline is an SSM-linked business account and provider-issued business QR; GXBank and CIMB remain the comparison shortlist, and personal-rail permission is not established. [Research](research/business-banking-and-qr.md)
- [01 - What Malaysian obligations apply to the commercialization launch?](decisions/01-what-malaysian-obligations-apply.md): keep the sole-proprietorship working route, add privacy/PDPA, contract, receipt-security, tax-monitoring, consumer-transparency, and direct-payment controls before live client use; preserve the professional-review questions listed in the findings. [Research](research/malaysian-launch-obligations.md)
- [03 - Which entity and liability posture governs the paid launch?](decisions/03-which-entity-and-liability-posture-governs-paid-launch.md): use an SSM sole proprietorship initially, register before real-client beta use, require privacy/security/terms before real data and professional, banking, and tax readiness before paid launch; reassess Sdn Bhd on material risk or growth events.
- [04 - What legal relationship and documents are needed?](decisions/04-what-legal-relationship-and-documents-are-needed.md): MUASuites is the SaaS provider and the MUA owns the Client service; carry a full terms/privacy/data-processing/notice/Founder bundle into Malaysian legal review, with split data roles and separate platform versus service responsibilities.
- [05 - How should direct client payment be described and governed?](decisions/05-how-should-direct-client-payment-be-described.md): call uploads Proof of Transfer; Client funds go directly to the MUA; both deposit and balance require explicit MUA Payment Confirmation, with the MUA owning disputes/refunds and corrected proofs retaining history.
- [06 - What are the Founder beta terms?](decisions/06-what-are-the-founder-beta-terms.md): invite up to 10 Founding MUAs by fit and reach; written acceptance grants free-for-life current PRO parity with lightweight feedback and priority best-effort WhatsApp support; publicity is separately opt-in, and launch grants use documented serious-reason revocation only.
- [07 - What evidence ends the Founder beta?](decisions/07-what-evidence-ends-the-founder-beta.md): require at least 12 weeks, 8/10 onboarding, 6/10 live-link use, 5/10 repeat use, 3 non-Founding MUA paid commitments, sustainable support, and no critical failures; legal and operational gates are hard, with one possible four-week corrective extension.
- [08 - What must be true before Founder invitations?](decisions/08-what-must-be-true-before-founder-invites.md): audit found P0 blockers in public data exposure, receipt security, balance confirmation, corrected-proof history, and the missing privacy/legal pack; stale pricing/Telegram claims and the fresh-build Mapbox secret are P1. [Audit](audits/founder-beta-launch-baseline.md)
- [11 - Can personal QR be used for public Client payments?](decisions/11-can-personal-qr-be-used-for-public-client-payments.md): research found no general provider permission for ongoing personal-rail commercial use; the banking decision therefore permits only a provider-confirmed invite-only exception, not a public-profile default. [Research](research/personal-qr-public-use.md)
- [09 - What paid banking operations are approved?](decisions/09-what-paid-banking-operations-are-approved.md): use GXBank as the working MUASuites renewal provider with a static business QR, per-payment ledger, monthly reconciliation, manual owner-specific approval, and an invite-only personal-QR exception subject to provider confirmation.
- [10 - What is the paid-launch go/no-go gate?](decisions/10-what-is-the-paid-launch-go-no-go-gate.md): use a three-step route: P0/privacy readiness before real-client beta, a minimum 12-week Founding MUA beta with cohort and paid-intent gates, then paid launch only after legal, tax, banking, product, security, and deployment signoff. The MUASuites owner/operator makes the final call.

## Not yet specified

<!-- The route is clear. Remaining details are execution and professional-review handoff items. -->

The route is clear; remaining work is execution and professional-review handoff.

## Out of scope

- Filing SSM, tax, privacy, or other registrations during this planning effort.
- Drafting, finalizing, or obtaining professional signoff on the selected legal documents; this map defines the bundle and review questions for that handoff.
- Opening or selecting a bank account as an executed operational task.
- Choosing the exact SSM business activity/name, insurance posture, provider terms, and professional signoff conclusions; these are handoff decisions for the licensed professionals and selected provider.
- Payment gateway integration, auto-billing, holding or settling client money, or marketplace commissions.
- International launch, non-Malaysia tax treatment, and marketplace responsibility for MUA services.
- Implementing product fixes, marketing campaigns, or Founder outreach; the destination hands those decisions off for execution.
