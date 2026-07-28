# Spring-Based Motion System

We decided to use spring-based animations (Motion/Framer Motion) instead of CSS `transition` for all interactive motion. CSS transitions are fixed-duration and cannot be interrupted or velocity-matched. Springs are inherently interruptible, velocity-aware, and feel physically natural — matching Apple's "Designing Fluid Interfaces" principles. The trade-off is a dependency on Motion library versus native CSS.

**Considered Options:**
- CSS transitions — native, no dependency, but not interruptible
- Motion/Framer Motion — spring physics, interruptible, velocity-aware
- Custom spring implementation — full control, but high maintenance

**Consequences:**
- Adds ~12KB gzipped dependency (motion)
- All interactive animations must use `animate()` from Motion
- CSS transitions remain acceptable for non-interactive state changes (hover, focus)
- Spring defaults documented in DESIGN.md Section 8
- Must handle `prefers-reduced-motion` with opacity cross-fades
