# 05 - How should direct client payment be described and governed?

Type: grilling
Status: resolved
Blocked by: 01 - What Malaysian obligations apply to the commercialization launch?; 04 - What legal relationship and documents are needed?

## Question

Set the canonical product and legal description of the payment flow: MUASuites shows the MUA's DuitNow QR, the client transfers money directly to the MUA, the client submits proof in the app, and the MUA reviews and approves the receipt. Decide the exact terms for "payment receipt," "approval," failed or disputed transfers, refunds, duplicate submissions, and whether any wording could imply that MUASuites processed, guaranteed, or held the payment.

## Comments

<!-- claim this ticket before the live discussion -->

## Answer

Call the Client-uploaded image **proof of transfer**. The Client pays the MUA directly using the MUA's displayed payment details. MUASuites only displays those details, accepts and stores the submitted proof, and exposes the workflow state; it does not receive, hold, route, split, settle, guarantee, or verify the Client's service payment.

Both deposit and balance payments require explicit **MUA Payment Confirmation** after the MUA reviews the proof. Uploading proof alone never confirms settlement or changes the payment to paid. The MUA owns failed or disputed transfers, requests for corrected proof, cancellations, refunds, and service outcomes. MUASuites provides platform support only. Corrected or duplicate proofs are allowed while awaiting confirmation, with submission history retained and the latest proof shown prominently.

Use this Client-facing baseline copy for deposit and balance pages:

> Pay the MUA directly using the payment details shown. MUASuites does not receive or hold this payment. Upload your proof of transfer after paying. The MUA reviews the proof and confirms whether the money was received; your booking/payment status is not confirmed by upload alone.

MUA SaaS renewal payments remain a separate flow: the MUA pays MUASuites through MUASuites' business account and QR, and MUASuites verifies that proof separately. The current balance implementation, which marks a booking `FULLY_PAID` immediately after upload, is a downstream launch-baseline gap and must not define the commercial promise.
