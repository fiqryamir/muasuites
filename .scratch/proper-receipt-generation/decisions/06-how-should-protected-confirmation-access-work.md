# 06 - How should protected confirmation access work?

Type: grilling
Status: resolved
Blocked by: 03 - How should confirmations be numbered and versioned?; 09 - What live schema and storage constraints must the spec honor?

## Question

Choose the access model for a generated web confirmation. Define how the Client receives a secret link, how the authenticated MUA views the same confirmation, whether access is tied to a Booking Link Token or a separate payment-confirmation token, token lifetime and revocation, behavior after cancellation or correction, and how public storage URLs are avoided.

The target is protected Client and MUA access with no public receipt image or document URL. Include the minimum privacy and retention behavior the implementation-ready specification must state.

## Comments

<!-- claim this ticket before the live discussion -->

## Answer

Serve the MUA Payment Confirmation from a protected server-rendered web route. Do not generate a public document URL or rely on public Storage for the confirmation. The route must authorize the requested immutable confirmation record and return only the content allowed by its audience.

Anonymous Client access uses a dedicated high-entropy confirmation token, separate from the Booking Link Token and Balance Token. Create one token per confirmation version, bind it to the Booking/MUA/confirmation record, store only a hash, and never use the internal Booking UUID as the credential. The raw token is delivered only through the protected confirmation-link flow; exact page and notification timing belongs to [08 - How should confirmation delivery and notifications work?](08-how-should-confirmation-delivery-and-notifications-work.md). The authenticated MUA uses dashboard authorization through the MUA-owned Booking boundary and does not need the Client bearer token.

Tokens expire two years after the Booking event date. The owning MUA can revoke a token earlier from the dashboard, and server policy can revoke it for supersession or a security incident; revocation and expiry remain auditable. A replacement confirmation receives a new token. An old token resolves only to a protected superseded notice and never displays the old confirmation as current. A cancelled Booking does not by itself revoke an already-issued confirmation; the historical confirmation remains available until expiry or explicit revocation and clearly reflects the Booking's later cancellation state.

New Proof of Transfer images must be stored as private objects and exposed only through authorized MUA audit access. They must not be included as image URLs in the Client confirmation. Existing `receipt-uploads` public bearer URLs are a separate legacy privacy-remediation effort: the new model creates no additional public proof URLs, while migration, revocation, or deletion of existing objects is decided separately.
