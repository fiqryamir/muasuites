# 11 - What legacy public proof exposure must be remediated?

Type: research
Status: resolved
Blocked by: none

## Question

Inventory the live legacy Proof of Transfer exposure before choosing a remediation. Establish how many bookings and Storage objects use public `receipt_url` or `balance_receipt_url`, whether object paths can be mapped back to bookings, whether the links are used in Client or MUA workflows, current bucket/object policy constraints, and what retention or deletion facts the later policy decision must respect.

Do not delete, revoke, migrate, or change public Storage policies. Capture facts and safe remediation options only.

## Comments

<!-- claim this ticket before the research run -->

## Answer

Verified live on 2026-09-07: 13 bookings contain 15 current proof URL references (12 deposit, 3 balance), all targeting public `receipt-uploads` objects and all mapping to current booking IDs. The bucket contains 16 objects; one is unreferenced and does not match the booking filename convention. Public bucket/read/upload policies remain active, and MUA dashboard plus deposit Telegram flows still depend on the mapped URLs; Client pages do not read them after submission. No objects, policies, or product code were changed. See [the research asset](../research/legacy-public-proof-exposure.md) for counts, sources, policy facts, and ticket 12 retention unknowns.
