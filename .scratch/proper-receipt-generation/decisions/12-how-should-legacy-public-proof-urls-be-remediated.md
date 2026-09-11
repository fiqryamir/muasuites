# 12 - How should legacy public proof URLs be remediated?

Type: grilling
Status: resolved
Blocked by: 11 - What legacy public proof exposure must be remediated?

## Question

Using the legacy exposure inventory, decide the remediation for existing public Proof of Transfer URLs and objects: revoke public reads, migrate objects to private storage, delete objects, preserve or replace historical references, define any Client/MUA communication or grace period, and set the retention boundary. Ensure the policy does not weaken the new protected confirmation model and does not silently claim legal/tax retention compliance.

This is a policy decision only. Do not execute deletion, migration, or Storage policy changes in this ticket.

## Comments

<!-- claim this ticket before the live discussion -->

## Answer

Remediate the 15 mapped legacy Proof of Transfer objects in a staged privacy cutover:

1. Stop generating any new public proof URLs.
2. Deploy and verify authorized MUA audit access to private proof objects, migrate the 15 mapped objects to private storage, and replace Booking URL references with authorized object identifiers/access metadata. Update the dashboard and Telegram consumers before revocation; preserve each object's Booking linkage and history where known.
3. Notify affected MUAs with the replacement access path and a cutoff date. Keep the old public read path for a seven-day grace period after private access is verified, then revoke public reads. Old links or copies outside MUASuites cannot be recalled; the privacy/incident process handles any separate external copies.

Apply the same policy to all 15 mapped objects regardless of Booking status, including `CANCELLED`, `COMPLETED`, and `FULLY_PAID`; status is not a deletion proxy. Retain migrated private proofs until two years after the Booking event date, then remove them through an explicit MUA-approved cleanup process. This is an operational privacy rule, not a legal or tax retention claim.

Quarantine the one unreferenced/nonconforming object privately for 30 days while its origin is investigated. Delete it after the quarantine window unless an explicit Booking or owner linkage is established. Do not attach it to a Booking based only on filename or timing. Existing public URL values, public Telegram links, and direct dashboard links are legacy artifacts to retire after replacement access is live; this ticket executes none of those changes.
