# 01: Server-owned payment snapshot and private proof intake

**What to build:** Make every new Booking's payment facts authoritative and immutable from the server, and make both Deposit and Balance Proof of Transfer submissions enter an auditable, private Payment Attempt flow without confirming payment.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] New Bookings persist the effective Package, fees, Deposit rule, Total, Deposit, Balance, currency, and expected payment amounts as a server-calculated commercial snapshot.
- [ ] Hidden Client-submitted monetary fields cannot override the stored snapshot.
- [ ] Deposit and Balance submissions create distinct Payment Attempts linked to the Booking and payment kind.
- [ ] Each attempt stores the submitted amount context and private proof object reference without treating upload as payment confirmation.
- [ ] New proof objects are not publicly readable and existing booking/payment flows can still reach the upload result safely.
- [ ] Deposit upload leaves the Booking awaiting MUA review, and Balance upload leaves a confirmed Booking awaiting MUA review.
- [ ] Client-facing upload success explicitly says `Proof of Transfer submitted - awaiting MUA review` and exposes no confirmation link.
- [ ] Existing pre-snapshot Bookings are not recalculated or silently backfilled.
- [ ] Transactional and privacy tests cover tampered amounts, duplicate submissions, payment-kind separation, and denial of public proof reads.
- [ ] `npm run check` remains green apart from the existing warnings baseline.
