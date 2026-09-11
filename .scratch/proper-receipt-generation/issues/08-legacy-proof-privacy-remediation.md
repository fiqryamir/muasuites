# 08: Legacy Proof of Transfer privacy remediation

**What to build:** Move the known legacy Proof of Transfer objects behind protected MUA access, update every consumer, notify affected MUAs, and safely handle the unreferenced object before public reads are revoked.

**Blocked by:** 02: MUA review, rejection, and corrected Proof of Transfer; 07: Dashboard sharing and notification privacy

**Status:** ready-for-agent

- [ ] The 15 mapped legacy proof objects are linked to the correct Booking and payment context without guessing across Clients.
- [ ] Legacy proofs for `CANCELLED`, `COMPLETED`, and `FULLY_PAID` Bookings receive the same protected access treatment.
- [ ] The MUA audit workflow can access migrated legacy proof objects through authorization rather than public bearer URLs.
- [ ] Dashboard and Telegram consumers no longer require public legacy proof URLs.
- [ ] Affected MUAs receive the protected replacement path and a stated public-read cutoff.
- [ ] Public reads remain available only for the approved seven-day grace period after protected access is verified.
- [ ] The one unreferenced/nonconforming object is privately quarantined for 30 days and is not attached to a Booking by inference.
- [ ] New uploads and new notifications continue using the private model throughout the migration.
- [ ] Migrated objects have an explicit two-year-after-event retention and MUA-approved cleanup process.
- [ ] Staging verification records object counts, references, access behavior, grace timing, quarantine, and cleanup without destructive production actions.
