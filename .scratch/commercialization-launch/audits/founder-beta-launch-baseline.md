# Founder beta launch baseline audit

Captured 2026-09-07. Read-only audit against the commercialization map, the live Supabase state snapshot, and the current repository. No product code was changed.

## Verified behavior

| Area | Current behavior | Source |
|---|---|---|
| Free capacity | Checkout enforcement and the booking route use a 2-active-booking Free limit. | `docs/agents/supabase-state.md` (`secure_checkout_slot`); `src/routes/[mua_slug]/[token]/+page.server.ts:131-145`; `src/routes/(auth)/bookings/+page.svelte:78-96` |
| Public pricing copy | Landing page says Free has 5 active bookings and Pro costs RM30/month. The commercialization decision is 2 active bookings and RM29/month or RM290/year. | `src/lib/components/landing/PricingSection.svelte:5-13,51-58`; `.scratch/plan-tiering/decisions/01-what-are-the-pro-and-founder-tiers.md` |
| Deposit proof flow | A slot hold becomes `PENDING_APPROVAL` after proof upload. The MUA dashboard can confirm it as `CONFIRMED` or reject it as `CANCELLED`. | `docs/agents/supabase-state.md:256-283`; `src/routes/(auth)/bookings/+page.svelte:248-343` |
| Balance proof flow | `finalize_balance_payment` changes `CONFIRMED` directly to `FULLY_PAID` on upload, before explicit MUA confirmation. | `docs/agents/supabase-state.md:213-254`; `src/routes/pay/balance/[token]/+page.server.ts:54-114` |
| Balance notification | `notifyBalancePaid` exists but has no caller. The balance route does not notify the MUA after upload. | `src/lib/telegram.server.ts:72-97`; repository search |
| Receipt storage | `receipt-uploads` is a public bucket. Both upload paths create public URLs; the URL is sent in the deposit Telegram message. There is no server-side file-size limit, although the UI says 5MB. | `docs/agents/supabase-state.md:795`; `src/routes/[mua_slug]/[token]/+page.server.ts:328-415`; `src/routes/pay/balance/[token]/+page.server.ts:59-108`; `src/routes/[mua_slug]/[token]/+page.svelte:1277-1289` |
| Public profile data | The public RPC returns all `mua_configs` columns through `row_to_json(mc.*)` and includes `clientName` in public day slots. The public profile renders `slot.clientName`. | `docs/agents/supabase-state.md:350-396`; `src/routes/[mua_slug]/+page.server.ts:12-54`; `src/routes/[mua_slug]/+page.svelte:577-604` |
| Approval messaging | Product copy says Telegram approval is available, but current approval is performed in the dashboard. Telegram sends a pending-review alert; no Telegram approve/decline action is implemented. | `src/lib/components/landing/HowItWorks.svelte:13-17`; `src/lib/components/landing/FeaturesSection.svelte:23`; `src/routes/[mua_slug]/[token]/+page.server.ts:391-415`; `src/routes/(auth)/bookings/+page.svelte:248-343` |
| Measurement | No dedicated product analytics package or beta telemetry is present. Existing booking, onboarding, and payment records can support the agreed privacy-safe manual scorecard. | `package.json`; current `src` search; `src/routes/(auth)/bookings/+page.svelte:64-96`; `src/routes/onboarding/+page.server.ts` |
| Production readiness | `wrangler.jsonc` enables observability and binds `MUA_CACHE`. A fresh build/check is documented as requiring `MAPBOX_ACCESS_TOKEN`; the handoff says a fresh build fails without it. `npm run check` currently passes with 0 errors and 13 pre-existing warnings. | `wrangler.jsonc:5-21`; `HANDOFF.md:38-53`; command run 2026-09-07 |

## Prioritized blockers

### P0 - block real-client Founder invitations

1. **Public personal-data exposure.** The public profile exposes client names in the visible calendar and the public RPC returns the entire config row, including fields that are not public profile data. Remove client identity from public availability and return an explicit allowlist from the public RPC.
2. **Receipt confidentiality failure.** Proof-of-transfer images are publicly addressable and copied into Telegram links. Before real-client use, storage must be private or time-limited and access-controlled, with retention/deletion, access logging, notification minimization, and an incident path.
3. **Payment confirmation is incorrect.** Balance upload currently marks a booking `FULLY_PAID` without MUA Payment Confirmation, contradicting the commercialization decision. Deposit/balance states, MUA actions, notifications, and public copy must agree.
4. **Corrected-proof history is missing.** The deposit flow marks the booking link used at first submission, and there is no submission-history model. The agreed replacement behavior cannot be delivered by the current flow; define the safe resubmission/audit behavior before live use.
5. **Privacy and legal launch pack is absent from the repository.** The required privacy notices, MUA data terms, retention and request process, incident process, Founder terms, and client-facing platform/payment notice remain professional-review and execution gates.

### P1 - block paid public launch and undermine beta trust

6. **Pricing and capacity promise is stale.** Correct the landing page from 5 to 2 active bookings and RM30 to RM29, and publish the yearly RM290 option before paid-intent testing or paid launch.
7. **Approval claims are stale.** Remove or implement the claim that Founders can approve or decline from Telegram. The current source of truth is dashboard approval.
8. **Production build configuration is not reproducible from the repository.** A fresh build requires a real `MAPBOX_ACCESS_TOKEN`; verify the production Worker secret and a clean deployment before invitations. Secrets were not read or changed during this audit.

### P2 - measurement and operations follow-up

9. **No product analytics or support ledger exists.** This is acceptable for the beta only if the agreed manual scorecard and a support/incident log are created before invitations.
10. **Notification and status coverage is incomplete.** Balance-paid notification has no caller, and corrected-proof history is not represented. These should be included in the P0 payment-flow work rather than treated as optional polish.

## Minimum pre-invitation baseline

- P0 items are fixed and manually tested with deposit, balance, rejected, duplicate, and corrected-proof scenarios.
- Public availability contains no Client identity and the public RPC exposes only an explicit safe allowlist.
- Proof-of-transfer storage/access and retention behavior are reviewed and documented.
- Deposit and balance both require explicit MUA Payment Confirmation, with dashboard state, Telegram messages, and client copy aligned.
- Privacy notices, data-processing terms, Founder terms, platform-role notice, and incident/request processes are ready for professional review.
- Pricing/capacity copy is corrected and the production build/deployment configuration is verified.
- A manual beta scorecard and support/incident log are ready for the 12-week graduation period.
