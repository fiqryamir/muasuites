# MUASuites Landing Page Redesign — Implementation Plan

## Context

Inspired by Zen Browser's clean, centered landing page and Apple's "Designing Fluid Interfaces" principles. Redesign the MUASuites landing page to be more fluid, interruptible, and authentic.

## ADRs

- [ADR-001: Hero Interaction Model](./docs/adr/0001-hero-interaction-model.md) — User-driven, not auto-cycle
- [ADR-002: Spring-Based Motion System](./docs/adr/0002-spring-motion-system.md) — Springs, not CSS transitions
- [ADR-003: Mockup Brand Colors](./docs/adr/0003-mockup-brand-colors.md) — Authentic brands inside mockups

## Phase 1: Foundation ✅

| File | Status |
|------|--------|
| `CONTEXT.md` | ✅ Created |
| `DESIGN.md` | ✅ Updated (Sections 8-10) |
| `docs/adr/0001-hero-interaction-model.md` | ✅ Created |
| `docs/adr/0002-spring-motion-system.md` | ✅ Created |
| `docs/adr/0003-mockup-brand-colors.md` | ✅ Created |
| `PLAN.md` | ✅ Created |

## Phase 2: Hero Redesign

| Task | File | Details |
|------|------|---------|
| Add spring utilities | `app.css` | `.spring-default`, `.spring-bounce` classes |
| Rewrite hero layout | `Hero.svelte` | Centered, Zen-inspired with animated text reveal |
| Rewrite hero sequence | `HeroSequence.svelte` | Remove auto-cycle, add swipe with velocity handoff |
| Copy audit | `Hero.svelte` | Remove hyphens, add contractions |

**Hero Animation Spec (Zen-inspired):**
```
Text lines: translateY(20px) + blur(4px) + opacity(0) → visible
Stagger: 100ms between each line
Spring: damping 1.0, response 0.4s
Reduced motion: instant reveal, no animation
```

**Swipe Gesture Spec:**
```
Pointer Events + setPointerCapture
Track position history (last 5 points)
On release: calculate velocity → project to frame
Animate with spring: damping 0.8, response 0.3s
```

## Phase 3: Mockup Authenticity

| Task | File | Details |
|------|------|---------|
| WhatsApp colors | `ChatMockup.svelte` | Header: `#075e54`, Bubbles: `#dcf8c6`/`#d9fdd3` |
| Telegram colors | `TelegramMockup.svelte` | Header: `#0088cc`, Bubbles: `#effdde` |
| Verify product UI | `CheckoutMockup.svelte` | Keep MUASuites tokens |

**Mockup Rules:**
- Borders/chrome: MUASuites tokens (`ring-foreground/10`, `bg-card`)
- Content: Authentic brand colors for recognition
- Page chrome: Never use third-party colors

## Phase 4: Copy Pass

| Task | File | Changes |
|------|------|---------|
| Hyphen removal | All landing components | See copy audit below |
| Contractions | All landing components | "you're", "it's", "don't" |
| Read aloud test | All landing components | Rewrite brochure-speak |

**Copy Audit:**
| File | Current | Fixed |
|------|---------|-------|
| `HowItWorks.svelte` | "auto-calculated" | "calculated automatically" |
| `ComparisonSection.svelte` | "token-gated" | "protected by your link" |
| `Hero.svelte` | "5-step checkout" | "five steps on her phone" |
| `PricingSection.svelte` | Audit | Check for hyphens |
| `ProblemSection.svelte` | Audit | Check for hyphens |
| `FaqSection.svelte` | Audit | Check all FAQ answers |
| `FinalCta.svelte` | Audit | Check for hyphens |
| `Footer.svelte` | Audit | Check for hyphens |

## Phase 5: Motion Polish

| Task | File | Details |
|------|------|---------|
| FAQ expand | `FaqSection.svelte` | Spring height animation on `<details>` toggle |
| Pro card elevation | `PricingSection.svelte` | Add `shadow-sm` to Pro card |
| Scroll reveals | All sections | Fade in on scroll, ≥350ms, respect reduced motion |

**Scroll Reveal Spec:**
```
IntersectionObserver (threshold: 0.1)
On enter: spring animate opacity 0→1, translateY(20px)→0
Spring: damping 1.0, response 0.4s
Reduced motion: instant reveal
Never gate content — visible by default
```

## Phase 6: Typography Refinements

| Task | File | Details |
|------|------|---------|
| Hero tracking | `Hero.svelte` | `letter-spacing: -0.02em` on H1 |
| Body pretty | All prose | `text-wrap: pretty` |
| Heading balance | All headings | Verify `text-wrap: balance` |

---

## Execution Order

1. Phase 2 (Hero) — largest change, blocks nothing
2. Phase 3 (Mockups) — independent, can parallel with Phase 2
3. Phase 4 (Copy) — pass through all files after structural changes
4. Phase 5 (Motion) — polish after structure is stable
5. Phase 6 (Typography) — final pass

## Verification

After each phase:
- Run `npm run lint` if available
- Run `npm run typecheck` if available
- Test on mobile viewport
- Test with `prefers-reduced-motion: reduce`
- Read all copy aloud
