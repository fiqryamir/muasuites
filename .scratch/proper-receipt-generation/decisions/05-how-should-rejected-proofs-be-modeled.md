# 05 - How should rejected proofs be modeled?

Type: grilling
Status: resolved
Blocked by: 01 - What is the confirmed payment event model?; 03 - How should confirmations be numbered and versioned?

## Question

Define the rejection and resubmission behavior around Proof of Transfer. Decide which payment-attempt states and rejection reasons are needed, who can record them, what happens to the Booking after a Deposit or Balance proof is rejected, how a Client submits a replacement, and how the dashboard distinguishes a pending proof, rejected proof, verified payment, and generated confirmation.

The existing commercialization decision requires history retention and keeps disputes/refunds with the MUA. This ticket should make those rules precise enough for the confirmation model without expanding into refund accounting.

## Comments

<!-- claim this ticket before the live discussion -->

## Answer

Model every Proof of Transfer submission as an append-only Payment Attempt tied to one Booking and one payment kind (`Deposit` or `Balance`). Its actionable states are `PENDING_REVIEW`, `REJECTED`, and `VERIFIED`; an earlier pending attempt can also become `SUPERSEDED` and non-actionable when a newer proof is submitted. Keep all attempts for audit history and highlight only the latest active attempt for MUA review. A rejected attempt never receives a confirmation number or changes the Booking to `REJECTED`.

The owning authenticated MUA changes an attempt only through a server-authorized action that validates Booking ownership, payment kind, current state, ordering, and idempotency. The Client upload can create a new pending attempt but cannot reject or verify one. The MUA must choose a controlled rejection reason, such as `UNREADABLE_PROOF`, `AMOUNT_MISMATCH`, `TRANSFER_NOT_FOUND`, `WRONG_RECIPIENT`, `DUPLICATE`, or `OTHER`; `OTHER` requires an explanation. The MUA may explicitly mark an optional note as Client-facing. The controlled reason is always shown to the Client.

After rejection, the protected payment surface offers a resubmission action. A replacement creates a new attempt and retains the rejected attempt. If a new proof arrives while another is pending, the new attempt becomes active and the older pending attempt is retained as superseded history. The exact secret/link mechanism for this action belongs to [06 - How should protected confirmation access work?](06-how-should-protected-confirmation-access-work.md).

The Booking remains `PENDING_APPROVAL` after a rejected Deposit and remains `CONFIRMED` with Balance due after a rejected Balance. The dashboard shows the current payment-attempt state, selected reason/note, and expandable history separately from the Booking status and any MUA Payment Confirmation. A verified attempt and its confirmation are immutable; correcting them uses the superseding-confirmation flow, never normal rejection or overwrite. A MUA may cancel the Booking separately, but proof rejection itself does not free the slot.
