---
name: MUASuites
description: Invisible micro-SaaS for MUA booking management in Malaysia
colors:
  primary: "oklch(0.50 0.15 18)"
  primary-foreground: "oklch(0.99 0.001 70)"
  background: "oklch(0.985 0.002 70)"
  foreground: "oklch(0.178 0.012 55)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.178 0.012 55)"
  muted: "oklch(0.958 0.003 70)"
  muted-foreground: "oklch(0.525 0.012 55)"
  secondary: "oklch(0.958 0.003 70)"
  secondary-foreground: "oklch(0.225 0.012 55)"
  accent: "oklch(0.958 0.003 70)"
  accent-foreground: "oklch(0.225 0.012 55)"
  destructive: "oklch(0.577 0.245 27.325)"
  border: "oklch(0.92 0.004 70)"
  input: "oklch(0.92 0.004 70)"
  ring: "oklch(0.50 0.15 18)"
  chart-1: "oklch(0.50 0.15 18)"
  chart-2: "oklch(0.55 0.06 55)"
  chart-3: "oklch(0.45 0.04 55)"
  chart-4: "oklch(0.65 0.04 70)"
  chart-5: "oklch(0.75 0.03 80)"
typography:
  body:
    fontFamily: "'Inter Variable', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Inter Variable', system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.25
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  2xl: "1.125rem"
  3xl: "1.375rem"
  4xl: "1.625rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.4xl}"
    padding: "0.75rem 1rem"
    height: "2.25rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.4xl}"
    padding: "0.75rem 1rem"
    height: "2.25rem"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
  input-default:
    backgroundColor: "{colors.input} 50%"
    textColor: "{colors.foreground}"
    rounded: "{rounded.3xl}"
    padding: "0.25rem 0.75rem"
    height: "2.25rem"
---

# Design System: MUASuites

## 1. Overview

**Creative North Star: "The Invisible Concierge"**

MUASuites is a design system for a micro-SaaS that should feel like it barely exists. The visual language is warm without being decorative, polished without being loud, and generous with space without being wasteful. Every pixel earns the RM30/month subscription price through craft — smooth transitions, correct defaults, human microcopy — never through ornament.

This system rejects the tropes of generic SaaS (high-density dashboards, chart-heavy management views) and cheap booking widgets (Calendly-lite, Google Forms). It chooses a warm, approachable palette anchored by a deep rose primary on near-white backgrounds, pill-shaped interactive elements, and a single typeface (Inter Variable) that carries both body and label roles through weight and size alone.

The result is a tool that integrates into the MUA's existing workflow — WhatsApp, Instagram, Telegram — rather than wrapping them in a separate software layer. The dashboard exists but is rarely needed. The client funnel is mobile-first, self-guided, and disappears after use.

**Key Characteristics:**
- Low density, generous whitespace
- Pill-shaped buttons and inputs (rounded-4xl / rounded-3xl)
- Warm neutral palette with a single rose accent
- Single typeface family (Inter Variable) with weight-driven hierarchy
- Soft shadows on overlays, flat surfaces at rest
- Mobile-first defaults that scale up gracefully

## 2. Colors

The palette is restrained by SaaS standards — one primary accent, tinted neutrals, and a single functional color for destructive actions. The body background is a warm off-white (chroma 0.002 toward hue 70), avoiding the sterile gray of corporate UI without tipping into the cream/sand AI default.

### Primary
- **Deep Rose** (`oklch(0.50 0.15 18)`): The single accent color. Used as button backgrounds, focus rings, link text, and active indicators. Chroma 0.15 at lightness 0.50 gives it presence without shouting. Appears on ≤10% of any given screen.

### Neutral
- **Warm Paper** (`oklch(0.985 0.002 70)`): Body background. Nearly white with a whisper of warmth (0.002 chroma toward hue 70).
- **Ink** (`oklch(0.178 0.012 55)`): Primary text color. Near-black with a warm undertone.
- **Pure White** (`oklch(1 0 0)`): Card, popover, and elevated surface backgrounds.
- **Soft Mute** (`oklch(0.958 0.003 70)`): Secondary and muted surface backgrounds for subtle containers.
- **Muted Text** (`oklch(0.525 0.012 55)`): Secondary text, placeholder text, and metadata.
- **Border Light** (`oklch(0.92 0.004 70)`): Borders and dividers. Visible but restrained.

### Functional
- **Destructive Red** (`oklch(0.577 0.245 27.325)`): Error states, destructive button variant, validation messages. High chroma ensures visibility against warm backgrounds.

### Dark Mode
Dark mode inverts the relationship: the background becomes a dark warm (`oklch(0.155 0.01 55)`), text becomes near-white, and the primary rose lifts to `oklch(0.62 0.14 18)` to maintain contrast on the darker canvas. Cards and elevated surfaces are one step lighter (`oklch(0.205 0.01 55)`). Borders are white at 10% opacity — transparent, not a hard line.

**The Rarity Rule.** The primary rose accent occupies ≤10% of any screen. Its infrequency is what gives it weight. Overuse (multiple primary buttons, primary accents on every card, rose borders) is the fastest way to make the system feel cheap.

## 3. Typography

**Body Font:** Inter Variable (with system-ui, sans-serif fallback)

Inter is a humanist sans-serif designed for screens — tall x-height, open counters, and tight spacing that remains readable at small sizes. Using the variable axis means one font file covers the entire weight spectrum (300–700). No second font family is needed; hierarchy is communicated through weight, size, and color alone.

**Character:** Functional by default, warm by micro-decisions. Inter's neutrality lets the rose accent and generous whitespace carry personality. The type never competes.

### Hierarchy
- **Display** — Not used as a distinct role. The largest text in the system is the MUA's studio name on their profile page, rendered at `clamp(1.5rem, 4vw, 2.5rem)` with font-weight 700. Below that visual level, titles and headings use the same size scale. No decorative display typography exists.
- **Title** (font-weight 600, `1rem–1.25rem`, line-height 1.3): Section headings in the booking funnel and dashboard. Sentence case, never all-caps.
- **Body** (font-weight 400, `0.875rem`, line-height 1.5): All prose text, form labels, descriptions, calendar dates. Line length capped at 65–75ch.
- **Label** (font-weight 500, `0.8125rem`, line-height 1.25): Form field labels, tab labels, small UI text. Uses medium weight for visual distinction without a size lift.
- **Caption / Muted** (font-weight 400, `0.75rem`, line-height 1.4): Helper text, metadata, fine print. Always paired with `--muted-foreground` for visual hierarchy.

### Named Rules
**The One-Family Rule.** No second typeface. Inter Variable handles every role through weight (400 body, 500 label, 600 title, 700 heading) and size. Adding a serif, script, or display font would introduce a personality clash the system doesn't need.

**The Sentence Case Rule.** Every heading, button label, and form title uses sentence case. No all-caps, no title case. It avoids the "designed-with-AI" tell of tiny uppercase tracked eyebrows above every section.

## 4. Elevation

MUASuites is flat by default. Depth is conveyed through tonal layering (lighter/darker surfaces) rather than shadows. Cards sit on a pure white surface against the warm paper background — the contrast between `oklch(1 0 0)` and `oklch(0.985 0.002 70)` is subtle but legible.

Shadows are reserved for two specific contexts:
- **Popover / Dropdown / Select Menu** (`0 4px 12px rgba(0,0,0,0.08)`): Floating UI that appears above the page. The shadow is soft and low-contrast — enough to separate, not enough to cast a hard drop.
- **Overlay / Dialog Backdrop** (`inset 0 0 0 1px rgba(0,0,0,0.03)` with `backdrop-blur-sm`): The card sits on a blurred, slightly darkened backdrop. The shadow is replaced by a thin ring (`ring-foreground/10` on the card itself) — a 1px subtle border that defines the edge.

**The Flat-by-Default Rule.** Elevation is a state, not a resting property. Surfaces are flat at rest. Shadows appear only on floating UI (popovers, select menus, dialogs). Cards do not have resting shadows — they use a 1px ring (`ring-foreground/10`) for edge definition instead.

## 5. Components

All components are built on shadcn-svelte (bits-ui) primitives and Tailwind CSS v4 utilities. They share a common DNA: pill-shaped interactive elements, warm neutral backgrounds, and the rose accent reserved for primary actions.

### Buttons
- **Shape:** Pill-shaped (`rounded-4xl`, 1.625rem radius — essentially fully rounded for the default 2.25rem height).
- **Default (Primary):** Deep Rose background, white text. `hover:bg-primary/80` for a subtle darkening. Active state translates 1px down (`active:translate-y-px`). Focus visible shows a `ring-ring/30` ring.
- **Outline:** Transparent background with `border-border`. Hover reveals a muted background.
- **Secondary:** `--secondary` background (Soft Mute), `--secondary-foreground` text. Subtle containment for non-primary actions.
- **Ghost:** No border or background at rest. Hover reveals a muted background. Used for inline actions and navigation.
- **Destructive:** Transparent with a red tint (`bg-destructive/10`). Hover deepens the tint. For delete/cancel actions only.
- **Link:** Text-only, underlined on hover. For navigational links that look like hyperlinks.
- **Sizes:** Default (h-9, 2.25rem), xs (h-6), sm (h-8), lg (h-10), icon variants. Touch targets ≥ 44px on mobile regardless of size.

### Cards
- **Shape:** Rounded-xl (0.875rem / 14px). Generous internal padding (1.5rem vertical, 1.5rem side for default size).
- **Background:** Pure white (`--card`). Contrasts subtly against the warm paper body.
- **Edge:** 1px ring at `ring-foreground/10` (approximately `oklch(0.178 0.012 55)` at 10% opacity). Not a shadow — a hairline border that defines the card edge.
- **Shadow:** None at rest. Cards float via tonal contrast, not elevation.
- **Internal Spacing:** `gap-6` (1.5rem) between child elements in default size, `gap-4` (1rem) in the `sm` variant.
- **Images:** If the card contains an `<img>` as its first child, the top padding is removed and the image gets `rounded-t-xl`. The image sits flush with the card's top edge.

### Inputs / Fields
- **Shape:** Pill-shaped (`rounded-3xl`, 1.375rem / 22px radius). Slightly less rounded than buttons, distinguishing inputs from interactive controls.
- **Background:** `bg-input/50` — 50% opacity of the border color, creating a subtle fill that's lighter than a solid input background.
- **Border:** 1px solid `transparent` at rest. The "border" is implied by the tinted fill.
- **Focus:** A `ring-ring/30` ring (rose-tinted) replaces the default browser outline. Border shifts to `border-ring` for a focused edge.
- **Placeholder:** `--muted-foreground` (`oklch(0.525 0.012 55)`) — approximately 4.5:1 contrast against the input background, meeting WCAG AA.
- **Error:** `aria-invalid` triggers a red ring (`ring-destructive/20`) and red border (`border-destructive`).
- **Disabled:** 50% opacity, `pointer-events: none`, `cursor: not-allowed`.

### Select
- Shares the input shape and sizing (`rounded-3xl`, h-9). The trigger looks like an input with a chevron icon. The dropdown content uses the shadow vocabulary from Elevation (soft shadow + ring).
- Items have a selected state (highlighted with `bg-accent` / `text-accent-foreground`) and a focus ring for keyboard navigation.

### Separator
- A thin horizontal or vertical line using `--border`. Used sparingly to group form sections without adding visual noise. The default is horizontal with `h-px` and full width.

### Navigation (Dashboard)
- A top bar (not a sidebar) — consistent with the "dashboard is secondary" principle. Contains the MUASuites brand, nav links (Bookings, Settings), and a logout action.
- Uses ghost-style buttons for nav items. The active route is highlighted with the rose primary (text or underline treatment, inherited from the `link` button variant or active styling).

## 6. Do's and Don'ts

### Do:
- **Do** use the rose primary sparingly — on one primary button per view, on focus rings, on links. Its rarity gives it authority.
- **Do** prefer pill shapes (`rounded-3xl` / `rounded-4xl`) for all interactive elements: buttons, inputs, selects, search bars.
- **Do** use sentence case everywhere — headings, buttons, labels, empty states. No all-caps.
- **Do** keep density low. Generous whitespace around every element. Nothing should feel crowded.
- **Do** use the ring token for card edges (`ring-foreground/10`) instead of shadows. Cards float by contrast, not elevation.
- **Do** design for mobile first. Single-column flows. Thumb-friendly touch targets (≥44px). No hover-gated interactions.
- **Do** use the muted-foreground color for placeholder text, not a lighter gray. Verify placeholder text meets WCAG AA 4.5:1 contrast.
- **Do** prefer Inter Variable's weight axis over introducing a second font family. Weight-driven hierarchy (400 body, 500 label, 600 title, 700 heading) keeps the system coherent.
- **Do** use `text-wrap: balance` on titles and section headings for even line lengths.

### Don't:
- **Don't** use generic SaaS dashboard patterns — high density, chart-heavy management views, sidebar-overloaded layouts. The dashboard is intentionally sparse.
- **Don't** use cheap booking-widget aesthetics — Calendly-lite, Google Forms, low-effort booking embeds. Every surface must feel worth RM30/month.
- **Don't** lean into over-the-top bridal clichés — pink sparkles, script fonts, floral motifs, lace textures. This is a professional tool, not a wedding planning site.
- **Don't** use border-left or border-right greater than 1px as a colored accent on cards, list items, or callouts. The side-stripe border is the most common AI design tell.
- **Don't** use gradient text (`background-clip: text` with gradient). Decorative, never meaningful. Use a single solid color.
- **Don't** use glassmorphism as a default decorative treatment. Blurs are purposeful and rare, not a "let's add depth" reflex.
- **Don't** add tiny uppercase tracked "eyebrow" text above every section (`ABOUT / PROCESS / PRICING`). This is the single strongest AI tell in 2025–26. One deliberate kicker as voice is fine; an eyebrow on every surface is not.
- **Don't** put numbered section markers (`01 · About / 02 · Process`) as default scaffolding. Numbers earn their place only when the section is a real sequence (a timeline, a multi-step process) and the order carries information.
- **Don't** gate content visibility behind class-triggered transitions. Reveal animations must enhance an already-visible default, not gate it.
- **Don't** use `overflow: hidden` on containers holding absolutely-positioned dropdowns — the dropdown clips. Use the native `<dialog>` / popover API or a portal.
- **Don't** pair two similar fonts (two geometric sans-serifs). If you must add a second family, pick on a contrast axis: serif + sans, humanist + geometric.
- **Don't** let heading text overflow its container. Test headlines at every breakpoint and reduce clamp max or rewrite copy if they break.
- **Don't** use hyphens in user-facing copy. Hyphenated modifiers ("auto-calculated", "token-gated", "mobile-first") are an AI tell. Rewrite naturally: "calculated automatically", "protected by your unique link", "built for phones".

## 7. Marketing Surfaces (Landing Page)

The public landing page (`/`) is a marketing surface, not a product surface. Sections 1–6 still govern its foundation, with these deliberate extensions:

- **Atmospheric washes.** The `.landing-wash` utility (soft radial rose/warm gradients) may be used as ambient background behind the hero and final CTA only. It is a wash, never a text effect — the gradient-text ban still applies. Third-party brand colors (WhatsApp, Telegram, DuitNow) may appear **only inside product mockups** for authenticity, never as page chrome.
- **Display type.** The hero H1 may scale beyond product type sizes (up to `text-6xl`), still Inter Variable, still weight-driven, still sentence case. Section titles stay at `text-3xl–4xl`.
- **Mockups are product.** Any mockup of the app (chat, checkout, Telegram, calendar) must render the product UI faithfully per sections 1–6 — same tokens, same shapes. The marketing canvas is softer; the product inside it is not.
- **Motion is ambient.** Slow (≥350ms), gentle, enhances already-visible content, and always respects `prefers-reduced-motion`. Scroll-triggered reveals must never gate content.
- **Sequenced storytelling** (e.g. the hero frame cycle) uses numbered/labeled steps only because the order carries real information — the booking flow itself.

## 8. Motion System

MUASuites uses spring-based animations for all interactive motion. Springs are interruptible, velocity-aware, and feel alive — unlike fixed-duration CSS transitions which lock out input and feel robotic.

**Design inspiration:** Apple's "Designing Fluid Interfaces" (WWDC 2018) and Zen Browser's hero animation approach.

### Spring Defaults

| Interaction | Damping | Response | Use Case |
|-------------|---------|----------|----------|
| Default UI | 1.0 | 0.3s | Cards, modals, standard reveals |
| Momentum / flick | 0.8 | 0.3s | Swipe gestures, drag releases |
| Hero text reveal | 1.0 | 0.4s | Staggered text entrance |
| Scroll reveal | 1.0 | 0.4s | Section fade-in on scroll |

### Implementation

```css
/* Tailwind utility classes */
.spring-default { transition: transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1); }
.spring-bounce { transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1); }
```

For gesture-driven interactions (hero swipe, carousel), use Motion/Framer Motion:
```js
import { animate } from 'motion';

// Critically damped (no overshoot)
animate(el, { y: 0 }, { type: 'spring', bounce: 0, duration: 0.3 });

// Momentum interaction (slight bounce)
animate(el, { y: target }, { type: 'spring', bounce: 0.2, duration: 0.4 });
```

### Rules

- **Always interruptible.** Every animation can be grabbed and reversed mid-flight. Never lock out input during transitions.
- **Animate from presentation value.** On interrupt, read the element's live on-screen transform and start the new animation from there — never from the logical target.
- **Respect `prefers-reduced-motion`.** Replace springs with short opacity cross-fades. Keep color/opacity changes that aid comprehension.
- **Velocity handoff.** When a gesture ends, the animation continues at the finger's exact velocity. No visible seam between dragging and animating.

## 9. Copywriting

MUASuites copy should sound like a human texting a friend — warm, direct, and unpolished in the right ways.

### The No-Hyphen Rule

Avoid hyphens in all user-facing copy. Hyphenated modifiers are an AI-generated tell.

| Avoid | Write Instead |
|-------|---------------|
| auto-calculated | calculated automatically |
| token-gated | protected by your link |
| mobile-first | built for phones |
| 5-step | five steps |
| pixel-perfect | precise |
| one-time-use | unique |
| real-time | live |

**Exceptions:** Only when the hyphenated form is standard and clarity demands it (e.g., brand names like "DuitNow QR").

### Tone Guidelines

- **Contractions are required.** "You're", "it's", "don't" — never "you are", "it is", "do not".
- **Short sentences.** If a sentence exceeds two lines, break it up.
- **Read it aloud.** If it sounds like a brochure, rewrite. If it sounds like a friend texting, ship it.
- **No jargon.** Clients don't know what "slot locking" means. Say "your date is held for 10 minutes".

## 10. Mockup Authenticity

Product mockups in marketing contexts (landing page hero sequence) must render the product UI faithfully using MUASuites design tokens. However, third-party brand colors are permitted **inside mockups only** for instant recognition.

### Permitted Brand Colors (Inside Mockups Only)

| Brand | Color | Usage |
|-------|-------|-------|
| WhatsApp | `#075e54` | Chat header background |
| WhatsApp | `#dcf8c6` | Message bubble (incoming) |
| WhatsApp | `#d9fdd3` | Message bubble (outgoing) |
| Telegram | `#0088cc` | Chat header background |
| Telegram | `#effdde` | Message bubble |
| DuitNow | White/neutral | QR code container |

### Rules

- **Mockup borders/chrome:** Always MUASuites tokens (ring-foreground/10, bg-card)
- **Mockup content:** Authentic brand colors for recognition
- **Page chrome:** Never use third-party brand colors (no WhatsApp green nav, no Telegram blue buttons)
- **Product UI inside mockups:** Must match actual product (same tokens, same shapes)