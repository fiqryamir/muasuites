# 04 - What data does a confirmation carry?

Type: grilling
Status: resolved
Blocked by: 01 - What is the confirmed payment event model?; 02 - What pricing snapshot is authoritative?; 03 - How should confirmations be numbered and versioned?

## Question

Set the exact content contract for the protected MUA Payment Confirmation. Decide which MUA and Client identity fields, Service Package, event date/time, Venue, payment type, amount breakdown, currency, payment date, proof reference, verification date, booking reference, and platform-role notice appear on the document.

The content must remain an informational confirmation issued by the MUA, not a tax invoice or a statement that MUASuites verified or received Client funds.

## Comments

<!-- claim this ticket before the live discussion -->

## Answer

The protected Client-facing document is an informational **MUA Payment Confirmation** and carries the following contract:

- MUA studio name as the issuing party.
- Client name.
- Service Package name.
- Event date, event time, and Venue.
- An opaque short Booking reference, separate from the internal Booking UUID and the confirmation number.
- The MUA-scoped confirmation number from the numbering decision.
- Payment type (`Deposit` or `Balance`), expected amount, currency (`MYR`), Booking Total, and remaining Balance.
- Server-recorded `MUA confirmed at` timestamp, displayed as the confirmation/issue time and never described as the bank transfer date.
- A clear direct-payment notice: the Client paid the MUA directly, the MUA confirmed receipt, MUASuites did not receive, hold, or verify the funds, and the document is not a tax invoice.

The amounts and line items come from the immutable commercial snapshot decided in [02 - What pricing snapshot is authoritative?](02-what-pricing-snapshot-is-authoritative.md), and the identifier/version behavior comes from [03 - How should confirmations be numbered and versioned?](03-how-should-confirmations-be-numbered-and-versioned.md). A Deposit confirmation shows the remaining Balance after the Deposit; a Balance confirmation shows the remaining Balance as zero when fully paid.

Proof submission time, internal Proof of Transfer reference, attempt history, supersession lineage, and verification audit details remain available in the protected MUA audit view but are not Client-facing confirmation content. Never expose the uploaded proof image URL from this document. Do not add Client phone, MUA WhatsApp number, Package emoji/duration, bank transfer date, tax fields, or legal-invoice claims to the first version.
