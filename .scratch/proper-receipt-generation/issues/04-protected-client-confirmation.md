# 04: Protected Client confirmation document

**What to build:** Give a Client a protected, server-rendered Deposit confirmation that accurately presents the MUA-confirmed payment without exposing proof evidence or implying that MUASuites received the money.

**Blocked by:** 03: Deposit verification and confirmation issuance

**Status:** ready-for-agent

- [ ] A valid current confirmation token renders only the confirmation bound to that token and confirmation version.
- [ ] Expired, revoked, malformed, unrelated, and internal-UUID access attempts are denied or shown a safe error state.
- [ ] The document shows MUA studio, Client name, Service Package, event details, Venue, opaque Booking reference, confirmation number, payment kind, confirmed amount, MYR, Booking Total, remaining Balance, and MUA confirmation time.
- [ ] The document states that the Client paid the MUA directly, MUASuites did not receive, hold, or verify the funds, and the document is not a tax invoice.
- [ ] The document does not expose Client phone, MUA notification numbers, Proof of Transfer images or URLs, bank transfer date, tax fields, or internal tokens.
- [ ] The selected Quiet paper layout is responsive on mobile and desktop, with the confirmed amount and payment kind prominent.
- [ ] Print/save and protected-link sharing actions are available without copying proof evidence or internal identifiers.
- [ ] The authorized payment surface points a confirmed Deposit to the current confirmation and never describes upload alone as confirmation.
- [ ] Route and access tests cover token binding, expiry, revocation, content allowlisting, and responsive confirmation states.
