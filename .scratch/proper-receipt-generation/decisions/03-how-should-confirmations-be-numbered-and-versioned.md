# 03 - How should confirmations be numbered and versioned?

Type: grilling
Status: resolved
Blocked by: 09 - What live schema and storage constraints must the spec honor?

## Question

Define the durable identity and history rules for generated MUA Payment Confirmations. Decide the uniqueness scope and human-facing format of a confirmation number, whether one booking can have separate Deposit and Balance numbers, how a corrected proof or replacement confirmation links to prior records, and which records are immutable versus superseded.

The result must preserve payment-attempt history without presenting a rejected proof as a verified payment. It should also state whether and how legacy bookings are handled when this model is introduced.

## Comments

<!-- claim this ticket before the live discussion -->

## Answer

Each verified payment event gets its own human-facing confirmation number. A Booking therefore has separate numbers for its Deposit and Balance confirmations. The number identifies the MUA Payment Confirmation, not the Booking and not an individual Proof of Transfer attempt; rejected attempts do not receive confirmation numbers.

Use a MUA-scoped yearly sequence with a generic format such as `RCPT-YYYY-NNNN`. The durable uniqueness identity is `(mua_id, issue_year, sequence_number)`; do not put a mutable MUA slug, Client data, Booking identifier, or payment type in the number. Show Deposit or Balance as a separate field. Reset the displayed sequence each calendar year, and allow gaps caused by failed transactions or other database sequence behavior because this is an informational confirmation, not a legally gapless numbering system. Allocate the number only inside the atomic confirmation commit.

The confirmation's internal UUID remains its technical identity. If an already-issued confirmation needs correction, retain the original immutable record, create a new confirmation record with a new number in the same payment-event lineage, link the two, and mark the original `SUPERSEDED`. This replacement is not a second verified Deposit or Balance payment. The normal MUA view and Client access point to the current record; an old Client link shows a protected superseded notice and directs the Client to the current confirmation when authorized. The original remains available to the MUA for audit history and is not deleted.

The numbering model does not backfill legacy Bookings or invent historical confirmation numbers. Existing Bookings remain governed by the legacy policy already decided in the event and pricing tickets.
