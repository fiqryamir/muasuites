# Spec - MUASuites commercialization launch

**Status:** ready-for-agent

## Problem Statement

MUASuites has a working booking product but is not yet ready for real-client Founder Beta use or paid public launch. The current product exposes more personal data than the public experience needs, stores proof-of-transfer images in a publicly addressable form, sends receipt URLs through Telegram, and treats a balance upload as fully paid without explicit MUA Payment Confirmation. The current flow cannot safely support corrected proof submissions with history.

The commercial promise is also inconsistent with the product: the landing page says Free allows 5 active bookings and PRO costs RM30/month, while the decided offer is Free at 2 active bookings and PRO at RM29/month or RM290/year. Product copy implies Telegram approval even though approval currently occurs in the dashboard. The repository also has a documented fresh-build dependency on a real Mapbox secret.

Outside the product, the launch needs a clear Malaysia-first operating model: an SSM sole proprietorship as the initial business structure, a dedicated business account, a manually verified SaaS renewal flow, privacy and contractual documents, a controlled Founding MUA cohort, and professional legal/accounting review before paid access.

## Solution

Deliver a phased commercialization readiness path with two end-to-end product seams.

### Phase 0: pre-beta readiness

- Register and operate through the SSM sole proprietorship route.
- Prepare the Founding MUA terms, MUASuites privacy notice, platform-role notice, data-processing terms, client-facing payment wording, retention/request process, and incident process for professional review.
- Remove Client identity from public availability and expose only an explicit safe public configuration allowlist.
- Make proof-of-transfer storage private or access-controlled, with controlled access, retention/deletion, notification minimization, and incident handling.
- Make deposit and balance payment states depend on explicit MUA Payment Confirmation.
- Support corrected proof submissions with retained history.
- Correct pricing, capacity, and approval claims.
- Verify production configuration and deployment.
- Create the privacy-safe manual beta scorecard and support/incident log.

### Phase 1: Founding MUA Beta

- Invite up to 10 Founding MUAs selected for fit, reach, active workflows, and willingness to test and provide feedback.
- Require written or click-through acceptance before granting the free-for-life current-PRO-parity Founder Plan.
- Provide lightweight feedback expectations and priority best-effort support through a dedicated WhatsApp channel without an SLA.
- Permit personal QR only inside an MUA-controlled one-time Booking Link, only after the MUA confirms provider permission; never place personal QR on public profiles or make it a MUASuites default.
- Run for at least 12 weeks using a privacy-safe manual scorecard.

### Phase 2: paid public launch

- Open PRO at RM29 monthly or RM290 yearly with manual DuitNow renewal and receipt verification.
- Use a dedicated business account and provider-issued static business QR for MUASuites SaaS-renewal payments. GXBank Biz Account is the working provider, with CIMB Basic Package as fallback after the same confirmation checklist.
- Keep MUASuites SaaS payments separate from MUA Client service payments.
- Open paid access only after the beta evidence, legal, tax, banking, privacy/security, payment, product, support, and deployment gates pass.

## User Stories

1. As a Client, I want public availability to show booked times without exposing another Client's name, so that my personal data is not disclosed to strangers.
2. As a Client, I want the booking page to identify the MUA as the service provider and direct payee, so that I know who receives my money and owns service outcomes.
3. As a Client, I want to see clear proof-of-transfer instructions, so that I know MUASuites does not receive or hold my service payment.
4. As a Client, I want to upload Proof of Transfer, so that the MUA can review whether the payment reached the MUA's account.
5. As a Client, I want my Proof of Transfer protected from public access, so that payment references and personal details are not exposed.
6. As a Client, I want to submit corrected Proof of Transfer while a payment is awaiting confirmation, so that a mistaken or unreadable upload does not strand the booking.
7. As a Client, I want the product to tell me that upload is not confirmation, so that I do not assume my booking is confirmed before the MUA checks the bank account.
8. As a MUA, I want deposit and balance uploads to await my explicit MUA Payment Confirmation, so that the booking state reflects money I have actually verified.
9. As a MUA, I want to accept, reject, or request corrected proof with an audit history, so that payment disputes can be understood later.
10. As a MUA, I want the balance workflow to notify me when a proof is submitted and when I must confirm it, so that a Client is not incorrectly shown as fully paid.
11. As a MUA, I want the public booking page to contain only my safe public profile, package, availability, and payment details, so that private account and notification data stay private.
12. As a MUA, I want Free capacity and PRO pricing to be accurately explained, so that I can decide whether the product fits my business.
13. As a MUA, I want an invite-only Booking Link to control who can access my booking flow, so that I can choose which Clients receive my payment details.
14. As a MUA, I want to use my own provider-approved payment destination for Client service payments, so that Client money settles directly to me.
15. As a MUA, I want any personal QR exception to be limited to my controlled Booking Link and confirmed with my provider, so that I understand my own account and provider responsibilities.
16. As a Founding MUA, I want written terms before accepting the Founder Plan, so that the free-for-life benefit, feedback expectations, support, privacy, publicity consent, and revocation rules are clear.
17. As a Founding MUA, I want current PRO parity without retroactive fees, so that I can use the product confidently during and after beta.
18. As a Founding MUA, I want priority best-effort WhatsApp support without a misleading SLA, so that I know how to ask for help.
19. As a Founding MUA, I want publicity to require separate written consent, so that participating in beta does not force me to provide a testimonial or public identity.
20. As a Founding MUA, I want low usage or honest criticism not to revoke my grant, so that feedback remains trustworthy.
21. As a Founding MUA, I want equivalent replacement where a materially retired PRO capability can be replaced, so that the Founder Plan remains meaningful while MUASuites operates.
22. As the MUASuites owner/operator, I want to invite up to 10 Founding MUAs, so that the beta remains manageable and evidence can be reviewed manually.
23. As the MUASuites owner/operator, I want a manual beta scorecard, so that I can measure onboarding, live links, repeat use, bookings, incidents, support, feedback, and paid intent without adding behavior tracking before privacy review.
24. As the MUASuites owner/operator, I want to verify PRO renewal payments against a dedicated business account, submitted proof, and a ledger, so that plan activation has an audit trail.
25. As the MUASuites owner/operator, I want mismatched or duplicate renewal payments held for manual reconciliation, so that plan access is not activated from an ambiguous transfer.
26. As the MUASuites owner/operator, I want MUASuites SaaS renewal payments kept separate from Client service payments, so that bookkeeping and payment responsibility remain clear.
27. As the MUASuites owner/operator, I want explicit beta graduation gates, so that strong enthusiasm does not override unresolved privacy, security, payment, legal, or banking risk.
28. As the MUASuites owner/operator, I want one four-week corrective extension for mixed evidence, so that the beta can learn without drifting indefinitely.
29. As the MUASuites owner/operator, I want the final commercial go/no-go authority, so that Founding MUAs provide evidence without being misrepresented as company owners.
30. As a Malaysian lawyer, I want the legal relationship, data roles, payment boundary, terms bundle, and unresolved classifications presented clearly, so that I can review the actual operating model.
31. As a Malaysian accountant, I want the entity, renewal ledger, invoice process, turnover monitoring, SST/e-Invoice questions, and recordkeeping plan, so that I can review tax treatment.
32. As an implementation owner, I want product, security, deployment, and acceptance criteria in one handoff, so that I can fix the P0 blockers without guessing at the commercial promise.

## Implementation Decisions

- The MUA is the SaaS customer and the makeup-service provider. MUASuites is not the marketplace, makeup-service provider, payment processor, payment holder, guarantor, or Client-service refund owner.
- The Client pays the MUA directly. MUASuites displays the MUA's payment details, receives Proof of Transfer, and exposes MUA Payment Confirmation; MUASuites does not receive, hold, split, settle, guarantee, or verify Client service funds.
- A public profile and an Invite-Only Payment Surface are different. A personal QR may appear only inside an MUA-controlled one-time Booking Link after provider confirmation. Public payment surfaces require a provider-approved business QR or BRN-linked business identity.
- Public availability must not expose Client names. Public responses must use explicit field allowlists and must not return private configuration, notification, connection, or token fields.
- Proof-of-transfer images must not be publicly addressable by default. Access must be controlled, time-limited or authenticated where appropriate, logged where required, and governed by a retention/deletion policy. Telegram notifications must not create an uncontrolled copy of sensitive proof data.
- The deposit and balance flows share the same payment truth: upload records evidence only; MUA Payment Confirmation changes the relevant booking state. Balance upload must not directly produce `FULLY_PAID`.
- Corrected proof submissions are allowed while awaiting confirmation and retain submission history. The audit history records what was submitted, when, who confirmed or rejected it, and any correction or refund action.
- Free capacity is 2 active bookings. PRO is RM29 monthly or RM290 yearly, manually renewed. Founder Plan is free for life with current PRO parity, manually granted to up to 10 Founding MUAs after written acceptance, and revocable only for documented serious reasons.
- Pricing, capacity, payment terminology, and approval-channel claims must match the actual product. Telegram may notify; dashboard workflow remains the source of approval unless a separate implementation decision adds authenticated Telegram actions.
- The MUASuites SaaS-renewal flow uses a dedicated business account, a static provider-issued business QR, manual Founder/operator approval, a per-payment ledger, and monthly bank-statement reconciliation. GXBank Biz Account is the working provider; CIMB Basic Package is the fallback if GXBank confirmation fails.
- MUASuites SaaS renewal payments and MUA Client service payments use separate accounts, QR ownership, ledgers, approval owners, refund responsibilities, and terms.
- Renewal mismatches, duplicate payments, overpayments, and mistaken transfers are held for manual reconciliation. No plan extension or automatic refund occurs until the relevant owner verifies and records the action.
- The initial business structure is an SSM sole proprietorship. A later Sdn Bhd reassessment is triggered by material liability, cofounder/investor involvement, employees, contract requirements, material revenue, or professional advice.
- Legal and accounting review is required before paid public launch. The review bundle includes MUA SaaS terms, MUASuites privacy notice, Client-facing platform/payment notice, data-processing schedule, Founding MUA terms, separate publicity consent, and an MUA-owned Client service-terms template.
- The beta uses a privacy-safe manual scorecard rather than behavior analytics. It tracks cohort status, onboarding, live links, bookings, repeat use, payment issues, support issues, incidents, feedback, and Paid-Intent Commitments.
- Phase 0 requires SSM route readiness, privacy/security/payment P0 fixes, Founding MUA materials, a manual scorecard, a support/incident log, and verified deployment before real-client beta use.
- Phase 1 runs for at least 12 weeks. Graduation requires 8/10 onboarding, 6/10 live-link use, 5/10 repeat use across separate weeks, 3 non-Founding MUA Paid-Intent Commitments, sustainable support, and no unresolved critical failure.
- Phase 2 requires all beta gates plus legal/accounting/tax review, dedicated banking and provider confirmation, privacy/security/vendor/incident controls, corrected claims, and clean production deployment. Non-critical improvements may follow; hard gates may not.
- The MUASuites owner/operator makes the final commercial decision. The lawyer signs legal/data classification, the accountant signs tax/invoice treatment, the implementation owner signs product/security/deployment readiness, and each MUA accepts their own service/payment/refund responsibilities.

## Testing Decisions

- Tests should assert external behavior at the highest available seam. The primary product verification uses two end-to-end seams rather than isolated implementation details.
- **Client booking/payment seam:** public availability contains no Client identity; a Client uses a Booking Link; the Client pays the MUA; Proof of Transfer is uploaded securely; deposit and balance wait for explicit MUA Payment Confirmation; corrected proof retains history; the MUA can reject or confirm; public and private data remain correctly scoped.
- **MUA SaaS-renewal seam:** an MUA chooses RM29 or RM290; the MUASuites static business QR is displayed; the MUA submits proof; the owner/operator reconciles it to the business account and renewal ledger; mismatches remain held; approval extends the correct plan period; the ledger and monthly reconciliation record are complete.
- Security tests must cover anonymous public profile access, direct public RPC responses, public availability, receipt URLs, Booking Link scoping, balance tokens, MUA ownership, and accidental disclosure through Telegram notifications.
- Payment-state tests must cover successful deposit confirmation, rejected proof, corrected proof, duplicate proof, successful balance confirmation, mismatched renewal, duplicate renewal, manual refund record, and no automatic activation from upload alone.
- Commercial acceptance is manual for SSM, banking, provider permission, legal documents, tax/invoice classification, professional signoff, support burden, Founding MUA consent, and the 12-week scorecard.
- The existing validation baseline is `npm run check` with 0 errors and 13 warnings at audit time. A clean production deployment also requires the real Mapbox configuration; secrets must not be committed or read during repository work.

## Out of Scope

- Filing SSM, tax, privacy, or other registrations in this spec.
- Drafting or providing final Malaysian legal/accounting advice.
- Opening the bank account or obtaining provider confirmation as an automated product behavior.
- Payment gateway integration, card capture, auto-billing, payment custody, settlement, splitting, or marketplace commission.
- International customers, cross-border tax, or non-Malaysia payment rails.
- Public marketing campaigns, Founder/Founding MUA outreach, and sales execution.
- Analytics or behavior tracking before privacy/legal review.
- Non-critical polish that does not affect privacy, security, payment correctness, legal gates, or core booking reliability.

## Further Notes

- This spec is the execution handoff produced from the commercialization wayfinding map. The map and decision tickets remain the canonical record of why the route was chosen.
- The implementation handoff must begin with the P0 findings in the Founder beta launch baseline audit: public personal-data exposure, public receipt access, incorrect balance confirmation, missing corrected-proof history, and the privacy/legal operating pack.
- The exact SSM business activity/name, insurance posture, provider terms, and professional signoff conclusions are intentionally handed to the licensed professionals and selected provider.
