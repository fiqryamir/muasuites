# Map — Onboarding flow for new MUAs

> Effort: `onboarding-flow`

## Destination

A first-login onboarding flow for newly signed-up MUAs — assumed technically naive — that takes them from an empty profile to their first shareable booking link. Hard-gated until complete, resumable from the last finished step, ending with a link-reveal screen (public profile link + pointer to dashboard checkout links). Completion persisted once; existing profiles backfilled so they skip the wizard. Reaching the end of the map = every decision below is locked and handed off to build (spec + tickets).

## Notes

- Domain: use the glossary in `CONTEXT.md` — MUA, Client, Booking Link, Deposit, Balance, Slot Hold. Avoid: vendor, bride, customer, user.
- Product principle (locked): the wizard teaches. Every field gets a plain-language "what is this for" explainer — target user is a non-technical MUA (assume very low technical knowledge).
- Mandatory fields (locked): studio name, WhatsApp number, ≥1 service package, DuitNow QR + deposit. Optional but surfaced in a teaching step: Telegram chat ID, base location + travel rate, working hours, buffer.
- Existing fields/forms live in `(auth)/settings/+page.svelte` — same tables (`muas`, `mua_configs`, `packages`), same zod validation; the wizard must not fork the data model.
- Gate mechanics already exist in `(auth)/+layout.server.ts` (session check + 303 to `/login`) and `login/+page.server.ts` (authed → `/bookings`) — the onboarding gate hooks into these.
- Cache: onboarding saves must invalidate the public-profile KV (`/api/cache/invalidate`), like settings saves do.
- DB is managed live (no local migrations; `npm run sync:supabase` captures state) — schema changes applied directly to the cloud project, then recaptured.
- Skills: `/grilling` + `/domain-modeling` on HITL tickets; `/prototype` for the wizard sketch; `design-taste-frontend` / `high-end-visual-design` when the wizard UI gets built.

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then zoom the link for the detail -->

- [Onboarding state model](decisions/01-onboarding-state-model.md) — two columns on `mua_configs` (`onboarding_step` 0–4, `onboarded_at`); gate = `onboarded_at IS NULL`, pure one-time flag; completion written with the optional step's save; resume = last finished step + 1.
- [Wizard steps & teaching copy](decisions/02-wizard-steps-teaching-copy.md) — variant A (linear wizard) wins; 5 steps locked (identity → payment → packages → optional extras → reveal); plain-language why-copy per field; real-time validation (Continue disabled until valid); reveal = booking *page* link + corrected flow copy (profile = availability + WhatsApp inquiry; deposit checkout via dashboard booking links). Prototype at `src/routes/prototype/onboarding/`.
- [Gate mechanics](decisions/03-gate-mechanics.md) — gate lives in `(auth)/+layout.server.ts` (one `onboarded_at` lookup, 303 to `/onboarding`); login redirects unchanged (bounce via layout); `/onboarding` = top-level route, own server load (unauth → login, onboarded → bookings, else prefill) + universal client bootstrap; `hooks.server.ts` gets `/onboarding` in the `private, no-cache` bucket; no exemptions, public tree untouched.
- [Shared form components](decisions/04-shared-form-components.md) — extract field-level components into `$lib/components/forms/` (slug, whatsapp, deposit, QR, telegram, working hours, buffer, package-form) + shared helpers (`schemas.ts` gains config/package schemas, new `duitnow.ts` + `cache.ts`); save orchestration stays per-page; travel fee fields have no settings UI today — build must add them.
- [Existing-user backfill](decisions/05-existing-user-backfill.md) — migration applied live: `onboarding_step` + `onboarded_at` columns added to `mua_configs`; 1 of 2 existing profiles backfilled onboarded (1 incomplete stays gated); `handle_new_user` unchanged; `supabase-state.md` recaptured.

## Not yet specified

- **QR upload path**: whether the wizard reuses the settings storage path (`${userId}/duitnow_qr.ext`) — decided yes via the shared `duitnow.ts` helper (ticket 04).
- **Travel fee settings gap**: `base_lat`/`base_lng`/`rate_per_km` are settable nowhere in the UI today; wizard step 4 is the first place — build decides whether settings gets a travel section alongside (recommended).

## Out of scope

<!-- work ruled beyond the destination; closed, never graduates -->

- Landing page CTA changes (CTA → `/login` stays).
- Checkout / deposit / balance behavior, public profile page, pricing & subscription — unchanged.
- Any client-side (non-MUA) onboarding.
