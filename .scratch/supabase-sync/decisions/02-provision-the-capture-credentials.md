# 02 — Provision the capture credentials

**Type:** task (HITL)
**Status:** resolved
**Blocked by:** 01 — Reach the live schema with everything

## Question

Create whatever access ticket 01 concludes is needed — likely a Supabase personal access token + project ref, possibly a database password or service-role key.

The agent hands the human a precise dashboard checklist (where to click in the Supabase dashboard, what to create, what to copy). The human performs the steps. On completion, the answer records: what was provisioned, which `.env` keys were added (names only, values never written into the repo), and the project-ref/URL facts later tickets depend on.

## Checklist (from ticket 01's answer)

Two things are required, both from the Supabase dashboard:

**1. Personal Access Token (PAT)**
- Open https://supabase.com/dashboard/account/tokens
- Click **Generate new token** (name it e.g. `muasuites-sync`)
- Copy the `sbp_...` token — it is shown **only once**

**2. Project ref**
- Dashboard → your project → **Project Settings → General** — the *Project ref* is the 20-char id in the URL `https://<ref>.supabase.co`, also shown in the settings page
- (Or derive it yourself: it's the subdomain of your existing `PUBLIC_SUPABASE_URL` in `.env`)

Then add to `.env` (never commit):
- `SUPABASE_ACCESS_TOKEN=<sbp_...>`
- `SUPABASE_PROJECT_REF=<ref>`

Optional (only if ticket 03's prototype decides the pooler fallback is needed): the database password from Project Settings → Database.

## Comments

_Unblocked when ticket 01 resolves with the credential list._

## Answer

**Provisioned and verified live (2026-08-10):**

- PAT created (`muasuites-sync`), added to `.env` as `SUPABASE_ACCESS_TOKEN` — never committed.
- Project ref added as `SUPABASE_PROJECT_REF=mvycpifzcirfniiedsws`. Note: first attempt stored the full URL (`https://mvycpifzcirfniiedsws.supabase.co`) which 404'd every API call; fixed to the bare 20-char id. The sync script should normalize URL-shaped refs defensively.
- Verified against the live project: `GET .../storage/buckets` (2 buckets: `qr-codes`, `receipt-uploads`), `GET .../config/auth` (full GoTrue config), `GET .../database/openapi` (14 paths, 0 schemas — shape needs handling in 03), `POST .../database/query` (arbitrary SQL works — 7 public tables incl. `schema_migrations`, 7 RPCs).
- **Live-drift proof**: remote has `cleanup_stale_bookings`, `finalize_balance_payment`, `get_mua_public_page` — none of which exist in local `supabase/rpc/`.
- **Security finding for 03**: `GET .../config/auth` returns secrets **unredacted** (`smtp_pass`, provider secrets, hook secrets). The snapshot doc MUST redact known secret fields.
