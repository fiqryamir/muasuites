# 05: Balance verification and full-payment confirmation

**What to build:** Extend the verified payment flow to Balance payments so that a Balance Proof of Transfer remains pending until explicit MUA verification and only then produces a separate confirmation and `FULLY_PAID` Booking state.

**Blocked by:** 03: Deposit verification and confirmation issuance; 04: Protected Client confirmation document

**Status:** ready-for-agent

- [ ] A Client can submit a Balance Proof of Transfer from a confirmed Booking and sees an awaiting-review state.
- [ ] The owning MUA can review and explicitly verify the pending Balance attempt.
- [ ] Balance verification is rejected when no verified Deposit exists or the Booking is not eligible for Balance confirmation.
- [ ] Successful Balance verification atomically marks the attempt verified, creates a separate Balance confirmation, and moves the Booking to `FULLY_PAID`.
- [ ] Uploading or rejecting Balance proof never moves the Booking directly to `FULLY_PAID`.
- [ ] Balance confirmation is idempotent and cannot create multiple current confirmations for the same payment lineage.
- [ ] The Balance confirmation uses the frozen commercial snapshot, shows the confirmed Balance amount, and shows zero remaining Balance where applicable.
- [ ] The confirmed Balance payment surface provides the current protected confirmation action rather than a generic fully-paid terminal screen.
- [ ] Deposit and Balance confirmation route tests verify separate payment kinds, numbers, tokens, and Booking transitions.
