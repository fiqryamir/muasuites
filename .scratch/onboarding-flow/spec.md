# Spec — Onboarding flow for new MUAs

## Problem Statement

New MUAs sign up via magic link and land directly on an empty dashboard. Nothing tells them what to fill in, so their public booking page stays blank (fallback "Makeup Studio" branding, zero packages, no payment QR) and they can't collect deposits or convert inquiries. There is no completion signal, so the app has no way to guide or gate them — and no way to protect them from a half-configured start.

## Solution

A first-login onboarding wizard that takes a newly signed-up MUA — assumed technically naive — from an empty profile to a shareable booking page. Five linear steps, each explaining its fields in plain language. The dashboard is hard-gated until the flow is finished; the wizard is resumable from the last finished step; the final screen hands them their booking page link. Existing complete profiles are already backfilled (decision 05 — applied). Travel-fee setup becomes editable for the first time, both in the wizard's optional step and in Settings.

## User Stories

1. As a new MUA, I want to be taken straight into the setup wizard after my first login, so that I'm never left staring at an empty dashboard.
2. As a new MUA, I want each step to explain what every field is for in plain language, so that I don't need technical knowledge to finish.
3. As a new MUA, I want to set my studio name, booking page address and WhatsApp number first, so that clients can find and contact me.
4. As a new MUA, I want to set my deposit type and amount, so that clients know what to pay upfront.
5. As a new MUA, I want to upload my DuitNow QR code, so that clients can pay their deposit and I can verify receipts.
6. As a new MUA, I want to add at least one service package, so that clients have something to book.
7. As a new MUA, I want the optional extras (Telegram alerts, travel fee, working hours, break) explained without being forced to set them, so that I can learn what they do and decide later.
8. As a new MUA, I want to skip the optional step, so that I can finish quickly and add details later from Settings.
9. As a new MUA, I want to see my booking page link at the end and copy it, so that I can put it in my Instagram bio.
10. As a new MUA, I want to understand what happens next — clients check my availability, message me on WhatsApp, and I send a booking link for the deposit — so that I'm not surprised by the flow.
11. As a new MUA, I want to close the browser mid-wizard and pick up where I left off, so that I don't lose progress.
12. As a new MUA, I want my already-entered data pre-filled when I return, so that I never re-type anything.
13. As an existing MUA with a complete profile, I want to never see the wizard, so that I'm not interrupted (backfilled).
14. As an existing MUA with an incomplete profile, I want to complete the wizard once, so that my profile becomes usable.
15. As an MUA, I want to edit my travel fee in Settings after onboarding, so that I can change it without redoing the wizard.
16. As an MUA, I want my public booking page to update immediately after onboarding saves, so that clients see my data right away.
17. As a new MUA, I want the dashboard and settings locked until I finish onboarding, so that I'm never lost in a half-configured app.
18. As a logged-out visitor, I want the onboarding page to send me to login, so that the wizard is protected.
19. As a system, I want the onboarding gate to never re-trigger after completion, so that established MUAs are never forced back through setup.

## Implementation Decisions

- **State model (applied live, decision 01):** `mua_configs.onboarding_step smallint NOT NULL DEFAULT 0` (0 = not started … 4 = last input step finished) and `onboarded_at timestamptz NULL`. Gate reads `onboarded_at IS NULL` only — a pure one-time flag that never re-derives from data.
- **Gate (decision 03):** the authenticated layout's server load checks `onboarded_at` after session resolution; NULL → 303 to `/onboarding`. Every dashboard route (`/bookings`, `/bookings/all`, `/settings`, `/blackouts`) is gated with no exemptions. Login redirects stay unchanged — the layout bounces not-onboarded MUAs on the next hop, keeping the server the single source of truth.
- **`/onboarding` route (decision 03):** top-level, outside the authenticated nav shell. Own server load: unauth → `/login`; onboarded → `/bookings`; otherwise renders the wizard with config + packages prefill. Universal Supabase client bootstrap so the QR uploads from the browser. Route responses use `private, no-cache` headers.
- **Wizard (decision 02, prototype variant A — linear):** five steps — identity → payment → packages → optional extras → reveal. Real-time validation: Continue stays disabled until the step's required fields are valid. Each step's save writes its fields plus `onboarding_step` in the same update. Finishing or skipping the optional step writes `onboarding_step = 4` and `onboarded_at` together; the reveal screen is purely informational (no persisted state). Resume = `onboarding_step + 1`. Required fields: studio name, booking page address, WhatsApp number, deposit (type + value), DuitNow QR, ≥1 package. Optional: Telegram chat ID, travel fee, working hours, break.
- **Teaching copy (decision 02):** locked plain-language copy per field — "what is this for" and examples, no jargon. Step content lives in the prototype asset (`src/routes/prototype/onboarding/steps.ts`).
- **Reveal copy (decision 02, corrected):** the box shows the booking *page* link (`muasuites.com/{slug}`), labelled "Your booking page" — not a checkout link. What-happens-next: clients check availability → WhatsApp the MUA (e.g. area coverage) → MUA sends a booking link from the dashboard for the deposit → MUA approves once the receipt arrives.
- **Shared components (decision 04):** extract field-level form components (studio identity, payment, DuitNow QR, Telegram, working hours, break, package form) plus shared helpers — validation schemas, QR upload helper (same storage path as settings), profile-cache invalidation helper. Save orchestration stays per-page: settings keeps its one-shot save; the wizard keeps its per-step saves.
- **Travel fee (decision 04 finding):** `base_lat`/`base_lng`/`transport_formula`/`rate_per_km` have no settings UI today. A travel section is added to Settings (reusing the base-location search through the existing Mapbox search proxy), and the same field component serves the wizard's optional step.
- **Backfill (decision 05, applied):** columns live; complete profiles marked onboarded; `handle_new_user` unchanged (defaults put new signups at step 0).

## Testing Decisions

- No automated test framework exists in the repo (scripts are dev/build/check/lint only) — verification runs at existing seams, route-level + DB-row based (approved):
- **Gate (route level):** SSR/dev smoke — `/bookings`, `/settings`, `/blackouts` as an authed not-onboarded MUA → 303 `/onboarding`; `/onboarding` unauth → `/login`; `/onboarding` onboarded → `/bookings`. Mirrors the free-tier-infra auth-gating verification style.
- **Wizard saves (DB rows):** after each step, inspect the live cloud rows — config fields written and `onboarding_step` advanced; after the last step, `onboarded_at` set. Resume verified by re-requesting the route.
- **Public-page propagation:** onboarding saves call the profile-cache invalidation; the public page renders the saved data (slug, studio name, packages, travel).
- **Settings regression:** after the shared-component extraction, a full settings save still persists every field (identity, payment, scheduling, packages).
- Static gates: `npm run check` shows no new errors; eslint clean on touched files.

## Out of Scope

- Landing page CTA changes (CTA → `/login` stays).
- Checkout / deposit / balance behavior, the public profile page, pricing & subscription — unchanged.
- Any client-side (non-MUA) onboarding.
- Signup/email-bombing protection — separate effort (tracked as a future wayfinder).
- Introducing an automated test framework.

## Further Notes

- Prototype lives at `src/routes/prototype/onboarding/` — capture it to a throwaway branch and remove the route from main before shipping (ticket 06).
- The live DB holds 2 profiles: 1 backfilled onboarded, 1 incomplete that will enter the wizard once.
- The DB is managed live (no local migration pipeline); any further schema changes are applied directly and `npm run sync:supabase` re-run.
- All decisions live in `.scratch/onboarding-flow/decisions/` — the map's Decisions-so-far indexes them.
