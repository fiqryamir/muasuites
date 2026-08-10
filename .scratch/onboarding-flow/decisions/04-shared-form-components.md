# 04 — Shared form components

**Type:** task
**Status:** resolved
**Blocked by:** 02

## Question

Does the wizard reuse the settings form fields via extracted shared components, or duplicate the markup? Deliverable is the decision + the chosen component/file layout.

## Context

- `(auth)/settings/+page.svelte` is one page holding every field the wizard needs (identity, payment, scheduling, packages) plus save logic: slug upsert on `muas`, config update on `mua_configs`, QR upload to the `qr-codes` bucket, package inserts, and `/api/cache/invalidate` after saves.
- Naively copying the wizard markup duplicates ~400 lines of forms + validation + save code across two pages.
- Extraction touches the working settings page (regression risk) — weigh that after decision 02 shows the exact field list and per-step boundaries.
- Standing preference: check `$lib/components/` for what already exists (field, input-group, select components) before deciding how much to extract.

## Answer

**Decision: extract field-level business components + shared helpers; keep save orchestration per-page.** Duplication was rejected — ~400 lines of form markup + validation copied into the wizard guarantees drift whenever settings evolves. Extraction cost is low because every wizard field is a self-contained InputGroup/compound that settings already renders.

**Component layout — new `$lib/components/forms/` folder** (business form fields; shadcn primitives stay in `ui/`, matching existing convention):

| Component | Props | Used by |
|---|---|---|
| `slug-field.svelte` | `bind:value` | settings, wizard step 1 |
| `whatsapp-field.svelte` | `bind:value` | settings, wizard step 1 |
| `deposit-fields.svelte` | `bind:mode`, `bind:value` | settings, wizard step 2 |
| `duitnow-qr-field.svelte` | `bind:file`, `existingUrl` | settings, wizard step 2 |
| `telegram-field.svelte` | `bind:chatId`, `testTelegram` callback | settings, wizard step 4 |
| `working-hours-field.svelte` | `bind:start`, `bind:end` | settings, wizard step 4 |
| `buffer-field.svelte` | `bind:value` | settings, wizard step 4 |
| `package-form.svelte` | `bind:packages` (add/list/remove) | settings, wizard step 3 |

**Shared helpers in `$lib/`:**
- `schemas.ts` (already exists) — move `configSchema` + `packageSchema` here from the settings page; wizard imports them.
- `duitnow.ts` (new) — `uploadDuitNowQr(supabase, userId, file)` → public URL (wraps the storage upload to `qr-codes` at `${userId}/duitnow_qr.ext`, with mime allow-list + upsert).
- `cache.ts` (new) — `invalidateProfileCache(slug)` (the inline `/api/cache/invalidate` fetch currently in settings).

**Stays per-page (NOT extracted):** settings' one-shot save orchestration, balance-due-days field + capacity display, prefill/load logic; wizard's step state machine, per-step save (writes config + `onboarding_step` + `onboarded_at` atomically), resume prefill.

**New finding (build note):** `base_lat` / `base_lng` / `transport_formula` / `rate_per_km` have **no settings UI today** — verified by grep across `(auth)/*` (zero matches). The wizard's step 4 travel fee will be the first place these are settable. Build must either add a travel section to settings (recommended — otherwise it's wizard-only forever) or deliberately accept wizard-only. The existing `/api/search-location` Mapbox proxy can serve the base-location search.

**Regression note:** extraction refactors the working settings page — do it as its own commit during build, verify with `npm run check` + manual smoke on settings before wiring the wizard to the same components.
