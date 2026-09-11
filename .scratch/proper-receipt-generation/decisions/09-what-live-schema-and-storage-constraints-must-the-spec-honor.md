# 09 - What live schema and storage constraints must the spec honor?

Type: research
Status: resolved
Blocked by: none

## Question

Refresh and inspect the live Supabase state relevant to proper MUA Payment Confirmation generation: booking status enum and RPC behavior, current booking/payment columns, RLS policies, Storage bucket visibility and policies, existing indexes, and any migration or deployment constraints. Compare the live state with the repository snapshot and record facts the downstream lifecycle, pricing, numbering, and access decisions must honor.

Do not implement a schema change. Capture the findings as research linked from this ticket.

## Comments

<!-- claim this ticket before the research run -->

## Answer

Verified the live schema and Storage state on 2026-09-07. The current model has no confirmation/payment-attempt records, stores caller-supplied booking amounts and single mutable proof URLs, and currently advances Balance proof upload directly to `FULLY_PAID`. Both Storage buckets are public; `receipt-uploads` has broad public receipt upload/read policies, and the repository has no current database migration/apply path. See [the full research asset](../research/live-schema-and-storage.md) for facts and implications for decisions 01, 02, 03, and 06.
