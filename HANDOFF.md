# Handoff — MUAsuites landing page build

## Next session focus

Continue building the MUAsuites marketing landing page: finish Phase 2 verification, then Phase 3 (mockups/hero/video) and Phase 4 (polish/SEO/docs).

## Project & repo

- Repo: root of this project (SvelteKit 5 runes + Tailwind v4 + shadcn-svelte/bits-ui + Supabase + Cloudflare adapter, TypeScript strict, npm)
- Product: "invisible" booking micro-SaaS for Malaysian makeup artists — WhatsApp-first, DuitNow QR deposits, Telegram notifications, .ics calendar, magic-link auth at `/login`
- Key docs (read these first, do not duplicate):
  - `DESIGN.md` — design system, strict rules (Inter only, sentence case, no eyebrows/gradient text/glassmorphism, rose ≤10%, flat cards with ring)
  - `PRODUCT.md` — brand personality (invisible, warm, hasslefree), anti-references
  - `PROJECT_SPEC.md` — routes, schema, booking flow
  - `LANDING_COPY.md` — **Phase 1 output: full approved landing copy for all 11 sections** (source of truth for wording)

## Locked decisions (user-confirmed)

1. Language: clean premium English, sentence case (SG/ID-expandable)
2. Free tier copy = **5 active bookings** (DB RPC `secure_checkout_slot` still enforces 2 — user will update separately; do NOT change in this work)
3. Sell Telegram **inline approve/decline** (ships at launch) and **.ics auto-dispatch** (live at launch)
4. Demo CTA → seeded demo studio on real `/[mua_slug]` route; assumed slug `/aina-beauty` (unconfirmed)
5. Design direction: "calm editorial" — DESIGN.md tokens + a marketing expression layer (Zen Browser-inspired: soft warm washes, ambient motion); product mockups stay DESIGN.md-accurate; add a "Marketing surfaces" addendum to DESIGN.md in Phase 4
6. Hero media: coded mockup sequence baseline + Zen-style muted device-framed demo video loop (≤2.5MB, poster fallback, lazy-loaded) in Phase 3

## Current state — Phases 1, 2, 3, 4 complete

Landing page fully built and verified:

- `src/routes/+page.svelte` — assembly, SEO/OG meta, JSON-LD (SoftwareApplication + FAQPage from `faq-data.ts`)
- `src/lib/components/landing/` — AnnouncementBar, Nav, Hero, HeroSequence (auto-cycling 4-frame phone sequence, captions, reduced-motion aware), mockups/ (Chat, Checkout, Telegram, Calendar), ProblemSection, ComparisonSection, HowItWorks, ClientExperience, FeaturesSection, ControlSection, PricingSection, FaqSection, FinalCta, Footer, StickyMobileCta, faq-data.ts
- `static/og.svg` — OG image placeholder (replace with PNG render before launch; some platforms ignore SVG OG images)
- `src/app.css` — `.landing-wash` utility
- Docs updated: DESIGN.md §7 "Marketing Surfaces", PROJECT_SPEC.md route map for `/`

Verification done: prettier/ESLint clean, svelte-check clean for landing files, dev smoke test 200 OK with all sections + JSON-LD present. ESLint notes: `svelte/no-navigation-without-resolve` requires literal fragment hrefs or direct `resolve()` calls (no dynamic `link.href`); JSON-LD in svelte:head needs the closing tag split (`</` + 'script>') to avoid the parse error.

## Remaining work

1. **Demo video** (Phase 3b) — demo studio is seeded and live at `/aina-beauty` (seed saved to `supabase/seed.sql`, re-runnable). Next: record real app flows at ~390px viewport + the coded Telegram/.ics mockups, export WebM+MP4 ≤2.5MB with poster, embed muted/loop/playsinline lazy-loaded in hero
2. **OG PNG** — render og.svg to 1200×630 PNG before launch
3. **KNOWN PRE-EXISTING ISSUE:** `npm run build` fails — `MAPBOX_ACCESS_TOKEN` missing from `.env` (imported via `$env/static/private` in `src/routes/api/*/+server.ts`). Predates landing work; blocks deployment until user adds the key. svelte-check also reports 13 pre-existing warnings in `[mua_slug]/[token]` and `(dashboard)/bookings/all`.

## Conventions observed in repo

- Tabs, single quotes, prettier + eslint (run `npm run lint` before done)
- UI imports: `import * as Card from '$lib/components/ui/card'`, `import { Button } from '$lib/components/ui/button'`
- Icons: `@lucide/svelte`
- Sections: container `mx-auto w-full max-w-6xl px-5 sm:px-8`, padding `py-20 sm:py-28`, titles `text-3xl font-semibold tracking-tight sm:text-4xl`, alternating `bg-muted/40` bands

## User's own parallel todos (not ours)

Raise FREE capacity 2→5 in `secure_checkout_slot` RPC · ship Telegram inline buttons · wire .ics auto-dispatch · seed demo studio row · confirm demo slug, footer contact channel, Pro "priority support" promise

## Suggested skills

- No environment skills are required for this work (`customize-opencode` and `find-skills` are irrelevant here — this is application code, not opencode config)
- Work directly from `DESIGN.md` / `PRODUCT.md` / `LANDING_COPY.md`; follow the todo list phases

## Sensitive info

- `.env` exists in repo root; was never read. No secrets in this handoff.
