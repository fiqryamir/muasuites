# 04 — Plan reminders and surfaces

**What to build:** the plan's ambient surfaces — reminders, nav identity, and honest public copy. A scheduled job (same pattern as the existing stale-booking cleanup) sends Telegram nudges at three points: 7 days before expiry, at grace start, and at expiry — telling the MUA to renew before capacity drops to 2 active bookings. The plan badge moves into the dashboard nav, always visible, so every MUA knows their tier at a glance.

**Blocked by:** 01 — Plan state and enforcement

**Status:** ready-for-agent

- [ ] Scheduled job reads plan state and sends Telegram reminders at T-7 days, grace start, and expiry — each message names the action ("renew to keep unlimited")
- [ ] No reminder spam: each threshold fires once per plan period
- [ ] Plan badge rendered in the dashboard nav on every authenticated page (FREE / PRO / FOUNDER)
- [ ] Reminders and badge respect the effective plan — a FOUNDER or fully unlimited PRO is never nudged
