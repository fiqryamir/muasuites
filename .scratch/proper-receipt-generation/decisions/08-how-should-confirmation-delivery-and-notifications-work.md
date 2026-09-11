# 08 - How should confirmation delivery and notifications work?

Type: grilling
Status: resolved
Blocked by: 06 - How should protected confirmation access work?; 07 - What should the protected web confirmation do?

## Question

Define what happens after the MUA confirms a Deposit or Balance. Decide when the Client can first access the protected confirmation, what the success-page and dashboard show, how manual WhatsApp sharing uses the protected link, and whether Telegram remains an MUA-only notification or carries any confirmation content.

The first destination excludes automated WhatsApp and email delivery. Keep notification wording consistent with the direct-payment boundary and do not imply that MUASuites received or verified the money.

## Comments

<!-- claim this ticket before the live discussion -->

## Answer

Create the protected confirmation token only after the owning MUA atomically confirms a Deposit or Balance. Before that action, the Client sees `Proof of Transfer submitted - awaiting MUA review`; never call the payment paid and never expose a confirmation link from the upload-success state. Rejected proofs use the resubmission behavior from [05 - How should rejected proofs be modeled?](05-how-should-rejected-proofs-be-modeled.md).

After confirmation, the authenticated MUA dashboard shows the current confirmation and provides `View confirmation`, `Copy protected link`, and `Share on WhatsApp` actions for that specific Deposit or Balance. The WhatsApp action is a manually reviewed `wa.me` share with a short message such as: `Your Deposit payment for [event date] has been confirmed by [studio]. View your protected MUA Payment Confirmation: [link]`. It contains the protected link and context only; it never includes a Proof of Transfer image or implies that MUASuites received or verified the money. Automated WhatsApp, email, and other Client delivery channels remain out of scope.

When a Client revisits the authorized payment surface after confirmation, it shows the confirmed state and an action to open the protected confirmation route. The Balance surface uses the same behavior after `FULLY_PAID`; the Client is not left at a generic `Already fully paid` terminal screen with no confirmation path. The protected confirmation route remains the canonical document surface.

Telegram remains an MUA-only operational channel. Pending-proof alerts may include concise Client, event, payment-kind, and amount facts plus an authenticated dashboard link. Confirmation alerts may likewise state that the MUA confirmed the payment and link to the dashboard. Telegram must not expose public proof URLs, forwardable Client confirmation bearer tokens, or Client-facing language that says MUASuites verified or received the funds. The existing balance-link alert can remain an MUA operational message for sending the payment link, while the current balance-paid alert must no longer link to a public proof image.
