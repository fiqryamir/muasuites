# Legacy Public Proof Exposure

## Verification

Verified 2026-09-07 against the live Supabase project `mvycpifzcirfniiedsws`.

This was a read-only inventory. No Storage object was downloaded, and no database row, object, bucket, policy, or application file was changed. The report deliberately does not reproduce receipt URL values, object names, client data, or image contents.

### Primary sources and context pointers

- Supabase Management API `POST /v1/projects/{ref}/database/query`: aggregate queries over live `public.bookings`, `storage.objects`, `pg_policies`, `pg_class`, and Storage triggers.
- Supabase Management API `GET /v1/projects/{ref}/storage/buckets` and `GET /v1/projects/{ref}/config/storage`: live bucket metadata and Storage service configuration.
- Supabase Storage metadata-only list using the anonymous application key with prefix `receipts/`: `POST /storage/v1/object/list/receipt-uploads`. It returned object metadata but no image bytes were requested.
- [Live schema and Storage constraints](live-schema-and-storage.md) and the fresh generated [Supabase state capture](../../../docs/agents/supabase-state.md).
- Domain definitions for [Proof of Transfer and MUA Payment Confirmation](../../../CONTEXT.md#proof-of-transfer).
- Deposit upload/finalization: [`src/routes/[mua_slug]/[token]/+page.server.ts`](../../../src/routes/[mua_slug]/[token]/+page.server.ts#L328-L415).
- Balance upload/finalization: [`src/routes/pay/balance/[token]/+page.server.ts`](../../../src/routes/pay/balance/[token]/+page.server.ts#L54-L115).
- Client upload surfaces: [`src/routes/[mua_slug]/[token]/+page.svelte`](../../../src/routes/[mua_slug]/[token]/+page.svelte#L1255-L1317) and [`src/routes/pay/balance/[token]/+page.svelte`](../../../src/routes/pay/balance/[token]/+page.svelte#L167-L213).
- MUA dashboard consumers: [`src/lib/components/ui/receipt-buttons.svelte`](../../../src/lib/components/ui/receipt-buttons.svelte#L23-L59), [`src/routes/(auth)/bookings/+page.svelte`](../../../src/routes/(auth)/bookings/+page.svelte#L157-L167), and [`src/routes/(auth)/bookings/all/+page.svelte`](../../../src/routes/(auth)/bookings/all/+page.svelte#L314-L330).

## Live Facts

### Booking URL inventory

There are 23 live bookings. The nullable proof columns currently contain:

| Measure | Count |
|---|---:|
| Bookings with `receipt_url` | 12 |
| Bookings with `balance_receipt_url` | 3 |
| Bookings with either proof URL | 13 |
| Bookings with both proof URLs | 2 |
| Deposit-only bookings | 10 |
| Balance-only bookings | 1 |
| Individual stored URL references | 15 |

The event-date range for the 13 bookings with either URL is 2026-05-25 through 2026-07-08. Their booking `created_at` range is 2026-05-26 through 2026-06-24, and their `updated_at` range is 2026-06-24 through 2026-06-27.

Status grouping is:

| Booking status | Bookings | With deposit URL | With balance URL | With either URL | Event-date range for URL-bearing rows |
|---|---:|---:|---:|---:|---|
| `CANCELLED` | 4 | 4 | 0 | 4 | 2026-05-31 to 2026-07-02 |
| `COMPLETED` | 6 | 6 | 0 | 6 | 2026-05-25 to 2026-06-26 |
| `FULLY_PAID` | 3 | 2 | 3 | 3 | 2026-06-29 to 2026-07-08 |
| `EXPIRED` | 10 | 0 | 0 | 0 | n/a |

No live rows with another status were returned by the grouping query. In particular, four cancelled bookings still retain deposit proof references. Status is therefore not a safe proxy for whether a stored proof can be discarded.

### URL destination and booking mapping

- All 12 deposit URL values and all 3 balance URL values match the public Storage object path for bucket `receipt-uploads`.
- None of the 15 values uses an authenticated-object path, signed-object path, or another bucket name.
- All 12 deposit paths have the application-generated deposit shape `receipts/{booking-id}_{timestamp}.{extension}`.
- All 3 balance paths have the application-generated balance shape `receipts/balance_{booking-id}_{timestamp}.{extension}`.
- All 15 paths contain the current booking UUID in the expected position. Every URL path matched a current `storage.objects` row exactly.
- The 15 URL references resolve to 15 distinct current object paths. This is enough to map every currently stored URL back to a booking ID, but it is only a current-field mapping, not historical proof-attempt history.

### Receipt object inventory and metadata

The live `receipt-uploads` bucket contains 16 current objects. The Management API SQL view reports all 16 under the `receipts/` prefix; the anonymous metadata-only Storage list also returned 16 records for that prefix.

| Object fact | Count/value |
|---|---:|
| Current objects in `receipt-uploads` | 16 |
| Objects matching the deposit booking-name shape | 12 |
| Objects matching the balance booking-name shape | 3 |
| Objects with an extractable booking UUID | 15 |
| Extracted UUIDs matching current bookings | 15 |
| Distinct current booking IDs represented by object names | 13 |
| Objects without the expected booking-name shape | 1 |
| Objects without a current stored URL reference | 1 |

The one nonconforming object is not mapped to a booking by the filename convention. Its origin and relationship to the booking ledger are unknown. The counts establish that the 15 URL-linked objects are mapped and current, while one additional object needs a separate disposition in ticket 12.

Object metadata, without downloading images, showed:

- Created and updated range: 2026-05-25 through 2026-06-24.
- MIME metadata: 11 `image/png`, 4 `image/jpeg`, and 1 `application/octet-stream`; no `image/webp` objects were present.
- Total byte size from object metadata: 6,478,089 bytes.
- Minimum reported object size: 0 bytes; maximum: 1,955,432 bytes.
- All 16 current rows have a non-null `last_accessed_at` value, ranging over the same 2026-05-25 through 2026-06-24 period. This is current object metadata, not an audit trail proving that a person viewed each image.

### Bucket and object policy state

Live bucket metadata for `receipt-uploads` is:

| Property | Value |
|---|---|
| `public` | `true` |
| Type | `STANDARD` |
| Bucket file-size limit | Not configured (`null`) |
| Bucket allowed MIME types | Not configured (`null`) |

The Management API Storage config reports a service-level file-size limit of 52,428,800 bytes, but no lifecycle or retention setting. This does not create a receipt retention policy. The product UI says 5 MB, while the current server upload code does not enforce that UI limit.

RLS is enabled and not forced on both `storage.buckets` and `storage.objects`. The relevant live object policies are:

| Policy | Role | Command | Predicate |
|---|---|---|---|
| `Allow public clients to upload receipts` | `public` | `INSERT` | `bucket_id = 'receipt-uploads'` |
| `Allow public read access on receipt-uploads` | `public` | `SELECT` | `bucket_id = 'receipt-uploads'` |

There is no receipt-specific public `UPDATE` or `DELETE` policy. The live Storage schema has a `protect_objects_delete` trigger, but that is not a retention schedule. The anonymous metadata-only list succeeded for all 16 objects, corroborating that object metadata can be enumerated through the current public Storage surface. No image GET was performed.

### Application dependencies

- The deposit Client flow uploads to `receipt-uploads`, calls `getPublicUrl`, stores that value in `bookings.receipt_url`, and includes the same public link in the Telegram notification sent to the MUA.
- The balance Client flow uploads to the same bucket, calls `getPublicUrl`, stores the value in `bookings.balance_receipt_url`, and then the current RPC changes `CONFIRMED` to `FULLY_PAID`.
- The Client pages preview the local selected image and show a submission-success state. They do not read a stored `receipt_url` or `balance_receipt_url` after submission.
- The authenticated MUA dashboard reads the booking URL columns and passes them to `ReceiptButtons`; the component renders direct new-tab links to the stored values. The MUA therefore still depends on these URLs to inspect historical proof from the dashboard.
- The public receipt link in the deposit Telegram notification is an additional operational dependency outside the dashboard. Existing copied or forwarded links may also exist, but that cannot be measured from the repository or database.

## Facts Versus Inferences

### Facts

- 13 live booking rows contain 15 non-null proof URL references.
- All 15 references target the public `receipt-uploads` object path and map to current objects by booking UUID and exact object path.
- `receipt-uploads` is public, has public object-read policy, and allows public receipt uploads without a path, MIME, size, or uploader binding in the object policy.
- There are 16 current objects, including one object not referenced by any current proof URL and not mapped by the expected booking filename convention.
- The application still generates these public URLs and the MUA dashboard still renders them.
- No image was downloaded and no remediation was executed.

### Inferences

- Each of the 15 currently stored URL references is a public bearer reference to a Proof of Transfer image under the current bucket and policy state. Anyone who has one of those references is not required to authenticate through the MUA dashboard.
- Revoking public reads, deleting, or relocating the 15 mapped objects would remove or break the current MUA dashboard and old Telegram-link inspection path unless the product first supplies an authorized replacement.
- The Client upload flow itself does not need the old URL after submission, so the Client UI is not a current read dependency. This does not establish that Clients or other recipients have not retained copies.
- Filename mapping is sufficient for a targeted plan for 15 objects, but the single nonconforming/unreferenced object cannot safely be attributed to a booking from current evidence alone.
- The two mutable URL columns do not record replacements, duplicate submissions, rejected attempts, or deletion history. The 15-reference count is current exposure, not the lifetime number of images ever uploaded.

## Retention and Deletion Facts for Ticket 12

Known:

- Current object creation/update metadata spans 2026-05-25 through 2026-06-24.
- No bucket-level lifecycle, expiration, retention, or deletion schedule was present in the inspected bucket metadata or Storage config.
- Current `storage.objects` rows expose current metadata only. No deletion timestamp, deleted-object history, proof-attempt history, or access audit log was identified.
- Repository search found no current receipt-object deletion or cleanup flow. The public object policies do not grant receipt deletion to anonymous clients.
- The one extra object is not safely attributable from the current booking URL fields.

Still unknown and required for the policy decision:

- Whether any MUA or Client has downloaded, copied, forwarded, or embedded a proof image or public link outside MUASuites.
- Whether the one extra object is an abandoned upload, replacement, duplicate, or legacy file with a nonconforming name.
- Any MUA business-record expectation or legal/tax retention requirement. MUASuites should not infer legal compliance from these Storage timestamps.
- Whether a grace period or communication is needed before public-read revocation, and what authorized MUA replacement access must exist first.
- Retention behavior of provider backups, deleted-object recovery, and any external copies; these were not established by the live database/Storage metadata queries.

## Implications for Ticket 12

Ticket 12 should decide policy for at least three distinct populations: the 15 mapped URL-linked objects, the single unreferenced/nonconforming object, and any historical copies or links that are outside the database's observability. It should explicitly account for four cancelled bookings that still retain deposit proof references and for the MUA dashboard/Telegram dependencies before selecting revocation, migration, deletion, preservation, or a grace period. Any replacement must preserve the protected-confirmation model from ticket 06 and must not reuse the current public receipt URLs as protected Client access.

No deletion, revocation, migration, Storage policy change, or product-code change was made.
