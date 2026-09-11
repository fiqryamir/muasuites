# 06: Confirmation correction lineage and MUA audit history

**What to build:** Let the MUA correct an issued confirmation without overwriting history, and give the MUA a complete payment timeline while giving Clients a safe response when they open a superseded confirmation link.

**Blocked by:** 04: Protected Client confirmation document; 05: Balance verification and full-payment confirmation

**Status:** ready-for-agent

- [ ] The owning MUA can initiate a correction for an issued Deposit or Balance confirmation with a required correction explanation.
- [ ] A correction creates a new immutable confirmation with a new number and links it to the superseded confirmation.
- [ ] The original confirmation remains immutable, marked `SUPERSEDED`, and is not treated as a second verified payment.
- [ ] The current confirmation is the only Client document rendered as active.
- [ ] A superseded Client token renders a protected notice directing the Client to the current confirmation without revealing a bearer token or private history.
- [ ] The authenticated MUA audit view shows attempts, rejection reasons and notes, verification actors and times, confirmation versions, correction reason, and current status.
- [ ] Corrections preserve the original frozen snapshot unless the correction explicitly creates a replacement snapshot according to the approved domain rules.
- [ ] Correction actions are authorized, atomic, idempotent, and covered by integration tests.
