# 09: Staged production rollout and retention verification

**What to build:** Promote the payment-confirmation and legacy-proof changes safely through staging and production using expand/verify/contract, with explicit rollback-forward procedures and a fresh live Supabase state record.

**Blocked by:** 01: Server-owned payment snapshot and private proof intake; 03: Deposit verification and confirmation issuance; 04: Protected Client confirmation document; 05: Balance verification and full-payment confirmation; 06: Confirmation correction lineage and MUA audit history; 07: Dashboard sharing and notification privacy; 08: Legacy Proof of Transfer privacy remediation

**Status:** ready-for-agent

- [ ] The new schema, server actions, RLS, Storage controls, indexes, and compatibility behavior are represented in versioned migrations.
- [ ] The current live migration/state baseline is documented before the first new migration is applied.
- [ ] The full migration and confirmation flow passes in a separate Supabase staging project with the approved integration and smoke checks.
- [ ] Production promotion is manually approved and uses protected credentials, separate from application deployment.
- [ ] Expand/verify/contract order keeps existing booking and payment flows available until the replacement path is verified.
- [ ] Production legacy backfill covers the approved mapped objects, quarantine, MUA notice, grace period, and public-read revocation sequence.
- [ ] Failure handling disables the affected route or feature and uses a reviewed forward fix without deleting confirmed payment history.
- [ ] The two-year private-proof retention and MUA-approved cleanup boundary is documented and verifiable.
- [ ] A fresh `npm run sync:supabase` capture is produced after production apply and confirms the expected schema, RPC, RLS, Storage, and migration state.
- [ ] Final validation records `npm run check`, deployment health, protected-access checks, notification leakage checks, and the absence of new public proof URLs.
