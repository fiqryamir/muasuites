# 01 - What is the confirmed payment event model?

Type: grilling
Status: resolved
Blocked by: 09 - What live schema and storage constraints must the spec honor?

## Question

Define the domain event that creates a MUA Payment Confirmation for a Client booking payment. Decide how a verified Deposit and a verified Balance are represented, what exact MUA action advances each booking state, when the immutable confirmation is created, and how the current Balance upload behavior must differ from the target lifecycle.

The existing commercialization decision already settles that proof upload alone is not confirmation and that both Deposit and Balance require explicit MUA confirmation. This ticket should settle the receipt-specific event boundary and booking-state consequences without reopening that commercial decision.

## Comments

<!-- claim this ticket before the live discussion -->

## Answer

Treat a Client payment as two separate domain layers: a `Payment Attempt` created by Proof of Transfer submission, and an immutable `MUA Payment Confirmation` created only by an explicit MUA confirmation action. Each Booking can have at most one verified Deposit event and one verified Balance event; repeated confirmation actions are idempotent and return the existing event rather than creating a duplicate. Proof uploads, including corrected or duplicate uploads, never create a confirmation or advance the Booking.

The MUA confirmation action must be server-authorized and atomic: validate the selected payment attempt and Booking state, mark the attempt verified, create the MUA Payment Confirmation, and advance the Booking in one transaction. The target Booking transitions are:

- Verified Deposit: `PENDING_APPROVAL` -> `CONFIRMED`.
- Verified Balance: `CONFIRMED` -> `FULLY_PAID`, only after a verified Deposit exists.
- Balance Proof of Transfer upload: leave the Booking `CONFIRMED` until the MUA confirms it; the current upload-driven `CONFIRMED` -> `FULLY_PAID` RPC behavior is incorrect.

Rejected proof is a rejected Payment Attempt, not a rejected Booking. A rejected Deposit leaves the Booking in `PENDING_APPROVAL`; a rejected Balance leaves it in `CONFIRMED` with the balance still due. The Client may submit a replacement proof, while the MUA may separately cancel the Booking when appropriate. The existing `REJECTED` Booking enum is not the target representation for a rejected proof.

Balance confirmation is ordered after Deposit confirmation. Existing `CONFIRMED` or `FULLY_PAID` Bookings without recorded payment events receive no automatic historical confirmation, and a legacy Booking cannot produce a new Balance confirmation without a recorded verified Deposit event. An issued confirmation remains an immutable historical record if the Booking is later cancelled; reversals and refunds are outside this map.
