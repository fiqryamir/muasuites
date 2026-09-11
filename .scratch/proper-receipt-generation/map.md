# Map: Proper MUA Payment Confirmation generation

## Destination

An implementation-ready decision set for secure, immutable MUA Payment Confirmations for Client booking payments: one confirmation per MUA-verified Deposit or Balance, with authoritative booking/payment facts, protected web access, rejected-proof history, and manual WhatsApp sharing. The settled decisions will be handed to `/to-spec` and then `/to-tickets`.

## Notes

- Domain: Client booking payments for a Malaysia-first SaaS used by freelance makeup artists.
- This is a planning map. It does not implement receipt generation, migrate data, or make the artifact a legal/tax invoice.
- Skills every session should consult: `/grilling` + `/domain-modeling` for HITL tickets, `/research` for AFK tickets, and `CONTEXT.md` before changing domain language.
- Existing standing decision: `.scratch/commercialization-launch/decisions/05-how-should-direct-client-payment-be-described.md` defines the Client upload as `Proof of Transfer`, requires explicit MUA Payment Confirmation for both Deposit and Balance, preserves corrected/duplicate proof history, and keeps disputes/refunds with the MUA. MUASuites does not receive, hold, settle, guarantee, or verify Client service funds.
- Scope is limited to Client booking payments. MUA Plan Renewal payments to MUASuites remain a separate flow.
- Known implementation gaps to resolve in the route include client-submitted amount fields, public receipt image URLs, and Balance upload advancing directly to `FULLY_PAID`. The live Supabase snapshot was stale at charting time and was refreshed by the research ticket.

## Decisions so far

<!-- the index: one line per closed ticket, enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [09 - What live schema and storage constraints must the spec honor?](decisions/09-what-live-schema-and-storage-constraints-must-the-spec-honor.md): live state has no confirmation model, stores caller-supplied amounts and mutable proof URLs, exposes receipt storage publicly, and has no current migration/apply path; downstream decisions must specify new records, protected access, and deployment constraints. [Research](research/live-schema-and-storage.md)
- [01 - What is the confirmed payment event model?](decisions/01-what-is-the-confirmed-payment-event-model.md): separate unverified Payment Attempts from immutable MUA Payment Confirmations; explicit atomic MUA confirmation moves Deposit to `CONFIRMED` and Balance to `FULLY_PAID`, while rejected proofs remain resubmittable and legacy bookings are not backfilled.
- [02 - What pricing snapshot is authoritative?](decisions/02-what-pricing-snapshot-is-authoritative.md): calculate and freeze the full server-side commercial snapshot at Booking creation, ignore Client-submitted amounts, preserve the effective Deposit rule and MYR values, and do not backfill legacy bookings automatically.
- [03 - How should confirmations be numbered and versioned?](decisions/03-how-should-confirmations-be-numbered-and-versioned.md): use separate MUA-scoped yearly `RCPT-YYYY-NNNN` numbers per payment confirmation, allocated at commit; corrections create linked superseding records while original history remains MUA-audit-only.
- [04 - What data does a confirmation carry?](decisions/04-what-data-does-a-confirmation-carry.md): show privacy-minimal MUA, Client, booking, payment, opaque-reference, and MUA-confirmed-at facts with a direct-payment notice; keep proof metadata MUA-audit-only and never expose proof URLs.
- [05 - How should rejected proofs be modeled?](decisions/05-how-should-rejected-proofs-be-modeled.md): retain append-only Deposit/Balance attempts with controlled rejection reasons, protected resubmission, latest-attempt highlighting, and MUA-only state changes; rejection never rejects the Booking or creates a confirmation.
- [06 - How should protected confirmation access work?](decisions/06-how-should-protected-confirmation-access-work.md): serve confirmations through a protected route with per-version hashed Client tokens, authenticated MUA access, two-year expiry and revocation; new proofs are private, while existing public proof URLs remain a separate remediation effort.
- [07 - What should the protected web confirmation do?](decisions/07-what-should-the-protected-web-confirmation-do.md): choose the Quiet paper client document, borrow compact mobile sharing from the Pocket pass, and reserve the Ledger timeline for MUA audit history; superseded links show a protected notice.
- [08 - How should confirmation delivery and notifications work?](decisions/08-how-should-confirmation-delivery-and-notifications-work.md): create access only after MUA confirmation; expose dashboard copy/manual WhatsApp sharing, show confirmed links on returning Client surfaces, and keep Telegram MUA-operational without public proof URLs or Client bearer tokens.
- [11 - What legacy public proof exposure must be remediated?](decisions/11-what-legacy-public-proof-exposure-must-be-remediated.md): inventory found 13 Bookings with 15 public proof references, all mappable to Booking IDs, plus one unreferenced object; dashboard and deposit Telegram still depend on the URLs, with no retention policy identified. [Research](research/legacy-public-proof-exposure.md)
- [10 - What deployment path will apply confirmation schema and storage changes?](decisions/10-what-deployment-path-will-apply-confirmation-schema-and-storage-changes.md): use versioned Supabase migrations tested in staging and manually promoted to production through a protected operator path, with expand/verify/contract rollout, forward fixes, and fresh state recapture.
- [12 - How should legacy public proof URLs be remediated?](decisions/12-how-should-legacy-public-proof-urls-be-remediated.md): migrate all mapped proofs to private authorized access before a seven-day public-read grace cutoff, retain privately for two years after the event, quarantine the orphan for 30 days, and apply the same policy across Booking statuses.

## Not yet specified

<!-- The decision route is clear. Further implementation slicing is handed to /to-spec and /to-tickets. -->

## Out of scope

- MUA Plan Renewal receipts or MUASuites commercial invoices.
- Legal or tax invoice/receipt compliance; the destination is an informational MUA-issued payment confirmation.
- Payment gateway integration, collection, holding, routing, settlement, or verification of Client funds by MUASuites.
- Automated WhatsApp or email delivery; the first destination covers a protected link and manual WhatsApp sharing.
- Refund, reversal, or overpayment accounting beyond preserving the MUA-owned booking/payment history.
- Implementing the product change; implementation is handed to `/to-spec` and `/to-tickets` after this route is clear.
