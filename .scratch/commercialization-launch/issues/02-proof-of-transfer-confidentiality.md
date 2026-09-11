# 02: Proof-of-Transfer confidentiality

**What to build:** Protect Proof of Transfer images throughout upload, review, notification, and retention. The Client and MUA must be able to complete review without publicly addressable financial screenshots.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Proof-of-Transfer storage is private or access-controlled and review links expire or require the correct authenticated context.
- [ ] Server-side file type and size limits match the Client-facing limit.
- [ ] Telegram notifications do not create uncontrolled public image URLs or include more data than required for review.
- [ ] Retention and deletion behavior is documented for deposit proofs, balance proofs, corrected proofs, rejected bookings, and stale holds.
- [ ] Tests verify unauthorized access fails and the MUA can still review an authorized proof.
- [ ] An incident path exists for an exposed or misdirected proof.
