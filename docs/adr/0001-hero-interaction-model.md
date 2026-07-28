# Hero Interaction Model

We decided to replace the auto-cycling hero sequence with user-driven interaction (click/swipe). Auto-cycling violates Apple's interruptibility principle — users cannot grab and reverse a CSS transition mid-flight. A user-driven model lets visitors control the narrative pace, matching Zen Browser's hero approach. The trade-off is less "wow factor" on initial load versus more user agency and better accessibility (reduced motion users see static content).

**Considered Options:**
- Auto-cycling (current) — 4.2s interval, no user control
- User-driven with click — frame dots for navigation
- User-driven with swipe — Pointer Events with velocity handoff

**Consequences:**
- Requires Motion/Framer Motion for spring-based frame transitions
- Need to add swipe gesture handling with velocity tracking
- `prefers-reduced-motion` users see first frame statically (already implemented)
- Copy must emphasize control: "see a demo" not "watch this"
