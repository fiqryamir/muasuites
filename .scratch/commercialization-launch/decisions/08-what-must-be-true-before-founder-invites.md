# 08 - What must be true before Founder invitations?

Type: task
Status: resolved
Blocked by:

## Question

Produce a verified launch-baseline audit of the current product against the Founder beta promise and the intended direct-to-MUA payment flow. Record the actual behavior and gaps for plan limits and pricing copy, receipt upload and approval states, public data exposure, notification paths, production configuration, and any blocking security or reliability issue. This ticket is complete when the facts and a prioritized blocker list exist for the later beta and paid-launch decisions; it is not a request to implement the fixes.

## Comments

<!-- task output should be linked under ## Answer -->

## Answer

Audit: [Founder beta launch baseline](../audits/founder-beta-launch-baseline.md)

The audit found five P0 blockers before real-client Founder invitations: public Client/config data exposure; public receipt images and Telegram receipt URLs; balance uploads auto-marking `FULLY_PAID` without MUA Payment Confirmation; no corrected-proof submission history; and the missing privacy/legal operating pack. It also found P1 blockers for stale pricing/capacity copy, stale Telegram approval claims, and the documented fresh-build `MAPBOX_ACCESS_TOKEN` requirement. No product code was changed.

The beta can use a privacy-safe manual scorecard rather than new analytics, but the scorecard and a support/incident log must exist before invitations. The minimum pre-invitation baseline is listed in the audit and is a hard input to the paid-launch go/no-go decision.
