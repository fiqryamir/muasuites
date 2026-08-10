# 06 — End-to-end verification + prototype cleanup

**What to build:** proof the whole flow works together, and the cleanup that lets the feature ship. Verify across the three seams — route-level redirects, DB rows, public-page propagation — for every actor: a fresh signup through all five steps, a mid-wizard exit and resume, skipping the optional step, the backfilled complete profile never seeing the wizard, and the incomplete existing profile entering it once. Regression-smoke the settings page after the component extraction. Then capture the prototype to a throwaway branch and remove the `/prototype/onboarding` route from main.

**Blocked by:** 02 — onboarding gate + route shell; 03 — settings travel-fee section; 04 — wizard steps 1–2; 05 — wizard steps 3–5; 07 — one-tap Telegram connect.

**Status:** ready-for-agent

- [ ] Fresh signup: login → forced into wizard → completes all steps → dashboard reachable, gate off.
- [ ] Mid-wizard close and re-login resumes at the last finished step with data prefilled.
- [ ] Skipping the optional step completes onboarding; "Save" on the optional step does too.
- [ ] Backfilled complete profile never sees the wizard; incomplete existing profile enters it once and finishes.
- [ ] DB rows verified per step (`onboarding_step` progression, `onboarded_at` set once, never unset).
- [ ] Public booking page reflects final data after cache invalidation on every relevant save.
- [ ] Settings page regression-free after the shared-component extraction (full save smoke).
- [ ] Prototype captured to a throwaway branch (primary source); `/prototype/onboarding` route removed from main.
- [ ] `npm run check` — no new errors; eslint clean on touched files.

Reference: `.scratch/onboarding-flow/spec.md` (testing decisions).
