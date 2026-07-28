# Mockup Brand Colors

We decided to use authentic third-party brand colors (WhatsApp green, Telegram blue) inside product mockups while keeping all page chrome in MUASuites tokens. Authentic colors provide instant recognition for the target audience (Malaysian MUAs who live in WhatsApp). The trade-off is slightly breaking the "one palette" rule for authenticity versus confusing users with token-based approximations.

**Considered Options:**
- MUASuites tokens only — consistent palette, but unrecognizable
- Authentic brand colors — instant recognition, breaks palette consistency
- Hybrid — MUASuites chrome, authentic content (chosen)

**Consequences:**
- ChatMockup uses `#075e54` header, `#dcf8c6`/`#d9fdd3` bubbles
- TelegramMockup uses `#0088cc` header, `#effdde` bubbles
- CheckoutMockup stays MUASuites tokens (this is product UI, not a third-party)
- Page chrome (nav, buttons, cards) never uses third-party colors
- DESIGN.md Section 10 documents permitted brand colors
