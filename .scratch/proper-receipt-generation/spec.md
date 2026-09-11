# Spec - Proper MUA Payment Confirmation generation

**Status:** ready-for-agent

## Problem Statement

MUASuites currently calls Client-uploaded Proof of Transfer images “receipts,” but does not generate an informational MUA Payment Confirmation. Deposit upload moves a Booking to `PENDING_APPROVAL`, while Balance upload currently moves a Booking directly to `FULLY_PAID` without explicit MUA review. The current model stores only one mutable proof URL for each payment kind, accepts Client-submitted monetary totals, has no payment-attempt history, and cannot represent corrected or duplicate proofs safely.

The current proof images are public bearer URLs in a public Storage bucket. They are rendered directly in the MUA dashboard and included in deposit Telegram alerts. There is no protected confirmation route, confirmation number, immutable commercial snapshot, confirmation-specific token, replacement lineage, or retention policy.

The result is confusing for Clients, unsafe for proof confidentiality, and inconsistent with the domain decision that the Client pays the MUA directly and only the MUA can confirm whether the money was received.

## Solution

Build a protected, server-rendered MUA Payment Confirmation flow for Client booking payments.

The flow treats each Client payment as two separate layers:

- A Payment Attempt is created by each Proof of Transfer submission and retains its review history.
- An MUA Payment Confirmation is an immutable record created only by an explicit, server-authorized MUA confirmation action.

The system creates one confirmation lineage for a verified Deposit and one for a verified Balance per Booking. Deposit confirmation advances `PENDING_APPROVAL` to `CONFIRMED`; Balance confirmation advances `CONFIRMED` to `FULLY_PAID` only after a verified Deposit exists. Rejected proofs remain resubmittable and do not reject or cancel the Booking.

The server creates and freezes a complete commercial snapshot at Booking creation. It ignores hidden Client-submitted totals, preserves the effective Package, fees, Deposit rule, totals, Balance, currency, and expected payment amounts, and uses that snapshot for all later confirmations.

Each confirmation receives a MUA-scoped yearly `RCPT-YYYY-NNNN` number at atomic confirmation commit. Corrections create linked superseding records; the original remains immutable MUA audit history.

Clients access a protected server-rendered confirmation with a dedicated high-entropy per-version token stored only as a hash. MUAs access the same confirmation through authenticated dashboard authorization. New Proof of Transfer objects are private and are never exposed through confirmation pages, Telegram, or public URLs.

The Client-facing page follows the selected Quiet paper direction: restrained document hierarchy, prominent confirmed amount, clear booking context, remaining Balance, direct-payment notice, print/save, and protected-link sharing. The authenticated MUA audit view may use a denser payment timeline and attempt history.

## User Stories

1. As a Client, I want to understand that I pay the MUA directly, so that I do not mistake MUASuites for the payment recipient.
2. As a Client, I want to upload a Proof of Transfer for my Deposit, so that the MUA can review whether the transfer reached the MUA.
3. As a Client, I want to upload a Proof of Transfer for my Balance, so that the MUA can review the final payment separately from the Deposit.
4. As a Client, I want upload success to say that my proof is awaiting MUA review, so that I do not assume upload alone confirms payment.
5. As a Client, I want to see a controlled rejection reason, so that I know why my submitted proof needs correction.
6. As a Client, I want to submit a replacement proof through a protected resubmission action, so that an unreadable or incorrect proof does not strand my Booking.
7. As a Client, I want previous proof submissions to remain private, so that a replacement does not expose or erase my payment history.
8. As a Client, I want a confirmation page only after the MUA confirms payment, so that the document represents an actual MUA decision.
9. As a Client, I want to see whether a confirmation is for Deposit or Balance, so that I understand which payment the document records.
10. As a Client, I want to see the confirmed payment amount, currency, Booking total, and remaining Balance, so that the financial state is clear.
11. As a Client, I want the confirmation to show the MUA studio, my name, Service Package, event details, Venue, confirmation number, and Booking reference, so that I can identify the appointment.
12. As a Client, I want the confirmation to show when the MUA confirmed it, so that the confirmation time is distinguishable from the bank transfer time.
13. As a Client, I want the confirmation to explain that MUASuites did not receive, hold, or verify my money, so that the platform role is clear.
14. As a Client, I want the confirmation to be explicitly informational rather than a tax invoice, so that I do not misunderstand its legal or accounting status.
15. As a Client, I want to access my confirmation through a protected link, so that a random person cannot read my booking or payment details.
16. As a Client, I want a superseded link to explain that a newer confirmation exists, so that I do not rely on an outdated document.
17. As a Client, I want a cancelled Booking to retain its historical confirmation when authorized, so that payment history is not silently erased.
18. As a Client, I want to print or save the confirmation, so that I can keep a personal copy.
19. As a Client, I want to share the protected confirmation link, so that I can provide the current confirmation without sharing my Proof of Transfer image.
20. As a MUA, I want every Proof of Transfer submission to create a distinct Payment Attempt, so that corrected and duplicate proofs remain auditable.
21. As a MUA, I want the latest pending attempt highlighted, so that I can review the active proof without losing older history.
22. As a MUA, I want to reject an attempt with a controlled reason and optional Client-facing note, so that the Client receives useful correction guidance.
23. As a MUA, I want to confirm a Deposit explicitly, so that the Booking becomes `CONFIRMED` only after I verify the transfer.
24. As a MUA, I want to confirm a Balance explicitly, so that the Booking becomes `FULLY_PAID` only after I verify the final transfer.
25. As a MUA, I want confirmation and Booking state changes to be atomic, so that a failed write cannot create a document without the corresponding payment state.
26. As a MUA, I want repeated confirmation actions to be idempotent, so that double clicks or retries cannot create duplicate confirmations.
27. As a MUA, I want Deposit confirmation to precede Balance confirmation, so that the payment lifecycle cannot be completed out of order.
28. As a MUA, I want each verified Deposit and Balance to have its own confirmation number, so that each payment event is independently identifiable.
29. As a MUA, I want the confirmation number to be scoped to my own yearly sequence, so that my records are easy to reconcile without exposing Client or Booking data.
30. As a MUA, I want corrected issued confirmations to supersede rather than overwrite history, so that the original document and correction lineage remain auditable.
31. As a MUA, I want to view the current confirmation from my dashboard, so that I can inspect exactly what the Client will see.
32. As a MUA, I want to copy a protected confirmation link, so that I can share it through my own communication channel.
33. As a MUA, I want a prefilled manual WhatsApp share action, so that I can send a short, accurate confirmation message without an automated WhatsApp integration.
34. As a MUA, I want Telegram to notify me about pending proofs and confirmations without including public proof URLs, so that operational alerts do not create additional confidentiality exposure.
35. As a MUA, I want private authorized access to Proof of Transfer images, so that only my audit view can inspect submitted evidence.
36. As a MUA, I want legacy proof objects to remain available through a protected replacement path, so that privacy remediation does not remove my operational records unexpectedly.
37. As a MUA, I want legacy proof objects treated consistently across `CANCELLED`, `COMPLETED`, and `FULLY_PAID` Bookings, so that status is not used as an unsafe deletion shortcut.
38. As a MUA, I want advance notice before old public proof links stop working, so that I can adopt the protected audit path before the seven-day cutoff.
39. As a MUA, I want the unreferenced legacy object quarantined rather than guessed into a Booking, so that unrelated Client data is not attached incorrectly.
40. As the implementation owner, I want the commercial snapshot calculated on the server at Booking creation, so that Client-tampered hidden fields cannot define a confirmation.
41. As the implementation owner, I want the full Package and fee snapshot retained, so that later Package or Booking Link changes cannot rewrite historical confirmations.
42. As the implementation owner, I want new schema and Storage policies delivered through versioned migrations, so that database changes are reviewable and repeatable.
43. As the implementation owner, I want migrations tested in staging and manually promoted to production, so that application deployment cannot silently alter payment data.
44. As the implementation owner, I want expand/verify/contract rollout, so that new confirmation behavior can coexist with legacy behavior during migration.
45. As the implementation owner, I want failed rollouts handled with feature disablement and forward fixes, so that confirmed payment history is not destructively rolled back.
46. As the deployment operator, I want a fresh Supabase state recapture after production changes, so that the applied schema, RPC, RLS, Storage, and migration state are recorded.
47. As the product owner, I want legacy private proofs retained for two years after the event with MUA-approved cleanup, so that operational retention is explicit without claiming legal or tax compliance.

## Implementation Decisions

### Domain and state

- Use `Proof of Transfer` for Client-supplied evidence and `MUA Payment Confirmation` for the MUA's explicit confirmation. Do not call an uploaded proof a payment confirmation.
- Model Payment Attempts separately from Booking lifecycle state and MUA Payment Confirmation records.
- Each Payment Attempt belongs to one Booking and one payment kind: `Deposit` or `Balance`.
- Use append-only attempt history with `PENDING_REVIEW`, `REJECTED`, `VERIFIED`, and non-actionable superseded history for earlier pending attempts.
- A newer proof becomes the active pending attempt; older pending attempts remain audit history.
- Only the authenticated owning MUA can reject or verify an attempt through a server-authorized action. Client uploads create attempts but cannot verify them.
- Use controlled rejection reasons: unreadable proof, amount mismatch, transfer not found, wrong recipient, duplicate, or other. `Other` requires an explanation. The MUA explicitly chooses whether an optional note is Client-facing.
- Deposit confirmation moves `PENDING_APPROVAL` to `CONFIRMED`.
- Balance proof upload leaves the Booking `CONFIRMED`; Balance confirmation moves `CONFIRMED` to `FULLY_PAID` only after a verified Deposit exists.
- Rejected Deposit attempts leave the Booking `PENDING_APPROVAL`; rejected Balance attempts leave it `CONFIRMED` with Balance due. Proof rejection does not set Booking status to `REJECTED` or cancel the Booking.
- A MUA may cancel a Booking separately. Cancellation does not erase issued confirmation history.
- The confirmation write, attempt verification, and Booking transition are one atomic, server-authorized operation and are idempotent.

### Server-authoritative commercial snapshot

- Calculate commercial values on the server when the Booking is created during checkout, before Proof of Transfer submission.
- Ignore hidden Client-submitted total, Deposit, and Balance fields as authority.
- Freeze Service Package identity and price, Travel Fee, custom surcharge and remark, effective Deposit mode and value, Total, Deposit, Balance, currency, and expected Deposit/Balance payment amounts.
- Use MYR for the current Malaysia-first product.
- Use two-decimal server-side money arithmetic. Percentage Deposit is calculated from the full Total including Travel Fee and custom surcharge. Balance is Total minus Deposit.
- Future confirmations use the frozen snapshot even when Package, Booking Link, or MUA configuration rows change or are deleted.
- Partial payments, overpayments, and payment-amount variances are not part of the first model and may be handled as rejected proofs or MUA-owned exceptions.
- Existing Bookings created before the snapshot exists are not automatically recalculated, backfilled, or issued historical confirmations.

### Confirmation identity and versioning

- Each Booking may have one verified Deposit confirmation lineage and one verified Balance confirmation lineage.
- Each confirmed payment receives a separate MUA-scoped yearly number in the form `RCPT-YYYY-NNNN`. The durable identity is the MUA, issue year, and sequence number; do not include mutable slugs, Client data, Booking IDs, or payment type in the number.
- Allocate the confirmation number only during the atomic confirmation commit. Rejected attempts do not consume confirmation numbers. Sequence gaps are acceptable.
- Keep an internal UUID as the technical record identity.
- A correction creates a new confirmation record with a new number and links it to the prior record. The prior record is immutable and `SUPERSEDED`; a correction is not a second verified payment event.
- The MUA audit view retains superseded history. Client access shows only the current record or a protected superseded notice.

### Confirmation content and UI

- The Client-facing confirmation shows MUA studio name, Client name, Service Package, event date/time, Venue, opaque Booking reference, confirmation number, payment type, expected amount, MYR, Booking Total, remaining Balance, and server-recorded `MUA confirmed at` time.
- Label the confirmation time as MUA confirmation/issue time. Do not describe it as bank transfer time.
- Include the direct-payment notice: the Client paid the MUA directly, the MUA confirmed receipt, MUASuites did not receive, hold, or verify the funds, and the document is not a tax invoice.
- Do not expose Client phone, MUA WhatsApp number, proof images, proof URLs, bank transfer date, tax fields, legal-invoice claims, Package emoji, or Package duration in the first Client-facing version.
- Use the selected Quiet paper layout as the Client-facing visual direction. Keep the verified amount prominent, booking context scannable, remaining Balance visible, and the direct-payment notice present without making the page look like a tax invoice.
- Keep Deposit and Balance as separate confirmation pages. Any Deposit/Balance switch in the prototype is a comparison control, not a production requirement.
- Carry the prototype's compact mobile `Print / save` and `Share protected link` actions into the production UI.
- Use the prototype's denser timeline and attempt-history treatment in the authenticated MUA audit view, not in the primary Client document.
- A current confirmation displays `Confirmed`. A superseded confirmation displays a protected superseded notice and directs the authorized Client to the current record.

### Access and privacy

- Serve the confirmation through a protected server-rendered route. Do not create public confirmation files or rely on public Storage.
- Create a dedicated high-entropy Client confirmation token per confirmation version. Keep it separate from Booking Link Token and Balance Token, bind it to the Booking, MUA, and confirmation, and store only its hash.
- Never use the internal Booking UUID as a Client credential.
- Token access expires two years after the event date. The owning MUA can revoke earlier, and server policy can revoke for supersession or security incidents. Revocation and expiry remain auditable.
- Authenticated MUA access uses the MUA-owned Booking boundary and does not require the Client bearer token.
- Cancellation does not revoke historical confirmation access by itself. The confirmation remains available until expiry or explicit revocation and reflects later Booking cancellation.
- Store new Proof of Transfer images privately. Expose them only through authorized MUA audit access and never from the Client confirmation.
- The existing public proof bucket and URLs are legacy exposure, not an acceptable model for new confirmations or new proofs.

### Delivery and notifications

- Create Client confirmation access only after atomic MUA confirmation.
- Immediately after upload, show `Proof of Transfer submitted - awaiting MUA review`; never call the payment paid or show a confirmation link.
- After confirmation, the authenticated MUA dashboard provides View confirmation, Copy protected link, and Share on WhatsApp for the specific Deposit or Balance.
- Manual WhatsApp sharing uses a short message identifying the payment kind, event date, MUA confirmation, and protected link. It does not include proof images or platform-verification claims.
- When a Client revisits an authorized payment surface after confirmation, show the confirmed state and a protected confirmation action. The Balance surface must not end at a generic fully-paid screen without a confirmation path.
- Telegram is MUA-operational only. Pending-proof and confirmation alerts may contain concise facts and an authenticated dashboard link. They must not include public proof URLs, Client confirmation bearer tokens, or claims that MUASuites received or verified funds.
- Automated WhatsApp, email, and other automatic Client delivery channels are out of scope.

### Legacy proof remediation

- Stop generating new public Proof of Transfer URLs.
- Before revoking public reads, provide and verify authorized MUA audit access, migrate the 15 mapped legacy objects to private storage, update Booking references to authorized object identifiers/access metadata, and update dashboard/Telegram consumers.
- Notify affected MUAs with the replacement path and cutoff date. Keep public reads for a seven-day grace period after private access is verified, then revoke public reads.
- Apply the same policy to all mapped objects across `CANCELLED`, `COMPLETED`, and `FULLY_PAID` Bookings.
- Retain migrated private proofs for two years after the event, then remove them through an explicit MUA-approved cleanup process. This is not a legal or tax retention claim.
- Quarantine the one unreferenced/nonconforming object privately for 30 days. Delete it after quarantine unless an explicit Booking or owner linkage is established.
- Do not attempt to recall external copies or forwarded links. Handle external copies through the separate privacy/incident process.
- Do not execute migration, deletion, revocation, or policy changes as part of spec publication.

### Deployment path

- Use versioned Supabase migrations as the source of truth for tables, constraints, RPCs, RLS, Storage privacy, and indexes.
- Treat the current live `schema_migrations` version and generated state capture as the adoption baseline. Document baseline adoption before applying the first new migration.
- Test migrations against a separate Supabase staging project, then manually promote them to production through a protected operator environment or manually approved CI job using protected credentials.
- Keep database/Storage deployment separate from Wrangler application deployment.
- Use expand, verify, contract rollout. Add compatible structures and policies, deploy the new path, perform only explicitly approved backfill, verify, and remove legacy behavior in a later reviewed migration.
- Preserve payment history. On failure, disable the affected route or feature and apply a reviewed forward fix rather than destructively rolling back confirmed records.
- A production rollout is not complete until `npm run sync:supabase` produces a fresh capture attached to the deployment record.

## Testing Decisions

- Assert externally observable behavior at the highest available seam. Do not make implementation details, table names, helper functions, or component structure the primary test contract.
- The primary transactional seam is the server/database boundary for checkout snapshot creation, Payment Attempt creation, rejection, verification, confirmation creation, sequence allocation, token creation, idempotency, and Booking transitions.
- Test that Client-provided hidden amounts cannot define the stored commercial snapshot, that package/configuration changes do not rewrite historical confirmations, and that Deposit confirmation is required before Balance confirmation.
- Test concurrent or repeated MUA confirmation actions to ensure one confirmation lineage per payment kind and no duplicate confirmation numbers.
- Test rejected Deposit and Balance attempts, controlled rejection reasons, Client-facing notes, replacement proof submissions, latest-attempt highlighting, retained history, and verified-attempt immutability.
- The protected read seam covers Client confirmation tokens, token hashing, token-to-version binding, expiry, revocation, superseded notices, cancellation display, MUA ownership, and denial of UUID-based access.
- The Storage seam verifies new proof objects are private, Client confirmation pages contain no proof URLs, MUA audit access is authorized, and public reads are revoked only after replacement access is available.
- The Client route seam covers pending upload copy, rejection/resubmission states, confirmed Deposit and Balance views, print/save action availability, protected-link sharing, and the return path from the payment surface.
- The MUA dashboard/notification seam covers confirmation view/copy/share controls, manual WhatsApp message content, Telegram MUA-only messages, absence of public proof links, and absence of platform-verification claims.
- The legacy migration seam verifies all 15 mapped objects, all affected Booking statuses, the single quarantined orphan, authorized reference replacement, seven-day grace behavior, and the two-year cleanup boundary without executing destructive operations in tests.
- The deployment seam requires staging migration evidence and a fresh live Supabase state recapture after production apply. The repository has no existing unit or browser test runner, so implementation tickets should choose the smallest appropriate integration/smoke harness at these seams rather than inventing broad isolated test suites.
- Existing baseline validation is `npm run check`, which currently passes with zero errors and pre-existing warnings. Production build/deployment checks must use real configured secrets without committing them.

## Out of Scope

- MUA Plan Renewal receipts or MUASuites commercial invoices.
- Legal or tax invoice/receipt compliance, tax fields, e-Invoice treatment, or professional retention advice.
- Payment gateway integration, Client money collection, holding, routing, settlement, verification, or marketplace commission.
- Refund, reversal, overpayment, partial-payment, or payment-variance accounting beyond MUA-owned rejection/exception handling.
- Automated WhatsApp, email, or other Client notification integrations.
- Implementing database migrations, Storage migrations, policy changes, product routes, or cleanup during spec publication.
- Automatic backfill or confirmation generation for legacy Bookings.
- Recall of proof images or URLs copied outside MUASuites.
- International currencies, non-Malaysia payment rails, or international retention requirements.

## Further Notes

- The wayfinding map and its decision tickets remain the canonical record of why these choices were made. This spec is the execution handoff synthesized from them.
- The prototype produced three confirmation UI variants. Variant A, Quiet paper, is the chosen Client direction; Variant C contributes mobile share actions; Variant B contributes MUA audit timeline density. The prototype remains a visual reference and is not production UI.
- The current live inventory includes 13 Bookings with 15 public proof references and 16 receipt objects, including one unreferenced/nonconforming object. The current dashboard and deposit Telegram path still depend on public URLs until the staged remediation is implemented.
- The next handoff is `/to-tickets`, which should break this spec into implementation tickets in dependency order. No ticket should silently expand the scope into legal/tax invoicing or payment processing.
