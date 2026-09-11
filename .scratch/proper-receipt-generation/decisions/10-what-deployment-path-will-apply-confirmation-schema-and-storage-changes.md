# 10 - What deployment path will apply confirmation schema and storage changes?

Type: grilling
Status: resolved
Blocked by: none

## Question

Choose the supported deployment and rollback path for the new Payment Attempt and MUA Payment Confirmation schema, numbering constraints, RPCs, RLS policies, private Proof of Transfer storage, and protected-route data requirements. The live project has no tracked migration directory or database apply command, so the implementation-ready specification must name how changes are reviewed, applied to Supabase, verified, and recaptured without relying on undocumented dashboard edits.

Keep this as an execution-boundary decision: do not implement the schema or apply production changes in this ticket.

## Comments

<!-- claim this ticket before the live discussion -->

## Answer

Use a versioned Supabase migration chain as the source of truth for the Payment Attempt and MUA Payment Confirmation tables, numbering constraints, RPCs, RLS policies, private Proof of Transfer storage, and related indexes. The current live `schema_migrations` version and generated snapshot are the adoption baseline; do not reconstruct or silently edit historical migrations, and do not treat `docs/agents/supabase-state.md` as an apply source. Any baseline-adoption detail must be documented before the first new migration is applied.

Test the migration chain against a separate Supabase staging project first. Production application is a protected manual operation from a controlled environment or manually approved CI job using the official Supabase migration tooling and protected project credentials. App deployment through Wrangler remains separate; merging or deploying application code must not implicitly alter the database or Storage policy.

Roll out with an expand, verify, contract sequence: add compatible structures and protected policies, deploy the application path that can use them, perform any explicitly approved backfill, verify the live shape, then remove or disable legacy public-proof behavior in a later reviewed migration. Keep migrations forward-safe and preserve payment history. If a rollout fails, disable the affected route or feature and apply a reviewed forward fix; do not destructively roll back confirmed payment records.

Production success requires a fresh `npm run sync:supabase` capture attached to the deployment record. The capture must show the applied schema/RPC/RLS/Storage state and migration version. This ticket does not apply migrations, provision staging, or change production data or policies.
