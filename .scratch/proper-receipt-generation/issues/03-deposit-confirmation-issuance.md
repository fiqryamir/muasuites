# 03: Deposit verification and confirmation issuance

**What to build:** Let the owning MUA explicitly verify a Deposit and atomically create the first immutable MUA Payment Confirmation, with a yearly MUA-scoped number and protected Client access credentials.

**Blocked by:** 02: MUA review, rejection, and corrected Proof of Transfer

**Status:** ready-for-agent

- [ ] The owning MUA can verify a pending Deposit attempt only after reviewing it.
- [ ] Deposit verification atomically marks the attempt verified, creates an immutable Deposit confirmation, and moves the Booking to `CONFIRMED`.
- [ ] A failed transaction cannot leave a confirmation without the Booking transition or the attempt verification.
- [ ] Repeated or concurrent verification requests are idempotent and cannot create duplicate Deposit confirmations.
- [ ] The confirmation receives a MUA-scoped yearly `RCPT-YYYY-NNNN` number allocated only at successful confirmation commit.
- [ ] The confirmation stores the frozen Booking snapshot and records the MUA confirmation time separately from any transfer time.
- [ ] A dedicated high-entropy Client token is generated per confirmation version, stored only as a hash, and bound to the Booking, MUA, and confirmation.
- [ ] The server distinguishes current, revoked, expired, and not-yet-issued confirmation access without exposing internal Booking UUIDs as credentials.
- [ ] The owning MUA can retrieve the issued confirmation through authenticated ownership even without the Client token.
- [ ] Transactional tests cover authorization, Deposit ordering, sequence allocation, idempotency, and immutable snapshot content.
