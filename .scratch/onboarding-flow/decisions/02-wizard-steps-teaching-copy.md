# 02 — Wizard steps & teaching copy

**Type:** prototype
**Status:** resolved
**Blocked by:** None

## Question

Sketch the full wizard as a cheap, rough artifact to react to: step-by-step field lists, plain-language teaching copy for a non-technical MUA, the package-creation UX, and the final link-reveal screen. Resolution locks the step content for build.

## Context (locked by charting)

- 5 steps:
  1. **Identity** — studio name, booking link handle (slug, confirm the email-derived default), WhatsApp number.
  2. **Payment** — deposit mode (fixed RM / percent), deposit value, DuitNow QR upload.
  3. **Packages** — ≥1 required, multiple allowed; emoji + name + duration + price.
  4. **Optional teaching step** — Telegram chat ID (with test), base location + travel rate, working hours, buffer. Marked "recommended", skippable.
  5. **Link reveal** — public profile link (muasuites.com/{slug}) with copy button + pointer that specific checkout links are generated from the dashboard.
- Every field explains what it's for and what happens next, in plain language.
- Validation reuses the zod schemas from `(auth)/settings`; QR upload writes to the `qr-codes` bucket.
- Link the prototype as an asset on resolution.

## Answer

**Winner: Variant A — Linear wizard.** One card per step, numbered progress (1–4), inline "why" copy under each field, Continue/Back, Skip for now on step 4. Rejected: variant C (conversational, one field per screen) — 12 screens reads as friction and makes non-technical users feel the setup is long; variant B (one-page checklist) was not chosen.

**Locked step content** (prototype asset: `src/routes/prototype/onboarding/` — `steps.ts` holds the locked copy):

1. **Identity** — studio name (required, "name clients know you by"), booking page address `muasuites.com/{slug}` (required, prefilled from email, short-and-easy guidance), WhatsApp number +60 (required).
2. **Payment** — deposit type (Fixed RM / Percentage, big choice), deposit value (required), DuitNow QR upload (required, with live preview).
3. **Packages** — add-package mini-form (emoji, name, duration hrs, price RM), ≥1 required, list with remove, "You can edit these anytime."
4. **Optional extras** — Telegram chat ID + Test, travel fee (base location + RM/km), working hours (defaults 08:00–18:00), break between bookings (chips: none/15/30/45/60 min). Both "Skip for now" and "Save" complete the step.
5. **Reveal** — "You're all set!" + booking page link box with Copy + "What happens next."

**Reveal copy (corrected per human feedback — the profile page is NOT the checkout):** clients open the page link, check availability, then message the MUA on WhatsApp (e.g. to confirm the MUA covers their area); when both agree on a date, the MUA creates a booking link from the dashboard and sends it — that's where the client pays the deposit; the MUA approves each booking once the receipt arrives. The link box is labelled "Your booking page", not "Your booking link", to avoid implying clients book through it.

**Validation model (fog item graduated):** real-time — Continue stays disabled until the step's required fields are valid (no on-submit error wall).

**Build note:** the real wizard will be re-implemented from this content (prototype code is throwaway, no persistence, no auth). At build handoff, capture the prototype set to a throwaway branch and remove the `/prototype/onboarding` route from main.
