# 02: MUA review, rejection, and corrected Proof of Transfer

**What to build:** Give the owning MUA an authorized review flow for Payment Attempts and give Clients a protected way to correct rejected proof while retaining the full attempt history.

**Blocked by:** 01: Server-owned payment snapshot and private proof intake

**Status:** ready-for-agent

- [ ] The owning MUA can see Deposit and Balance attempts for a Booking, with the latest pending attempt clearly identified.
- [ ] MUA proof access is authorized through MUA ownership and does not expose a public object URL.
- [ ] The MUA can reject a pending attempt with unreadable proof, amount mismatch, transfer not found, wrong recipient, duplicate, or other.
- [ ] Selecting `other` requires an explanation, and the MUA can choose whether an optional note is shown to the Client.
- [ ] Rejection records the reviewer, time, reason, and note without changing the Booking to `REJECTED` or cancelling it.
- [ ] The Client sees the rejection state and permitted correction guidance through the protected payment surface.
- [ ] The Client can submit a replacement Proof of Transfer for the same payment kind.
- [ ] A replacement becomes the active pending attempt while previous attempts remain immutable history.
- [ ] Deposit and Balance rejection/resubmission behavior is covered by integration or route-level tests.
