# MUASuites

A SaaS booking management platform for freelance makeup artists in Malaysia. The context covers the entire booking lifecycle from client inquiry to confirmed appointment.

## People

**MUA (Makeup Artist)**:
A freelance makeup artist who uses MUASuites to manage bookings and client communication.
_Avoid_: Vendor, provider, seller

**Client**:
A person who books MUA services through an invite link. Not a registered user — interacts entirely through public URLs and WhatsApp.
_Avoid_: Bride, customer, user, guest

## Booking Concepts

**Booking Link**:
A unique, one-time-use URL that guides a client through the checkout flow to reserve a date and pay a deposit. Contains optional pricing overrides set by the MUA.
_Avoid_: Invite, invitation, link, URL

**Service Package**:
A service offering defined by an MUA with a name and price (e.g., "Bridal Makeup" at RM 888). Multiple packages can be active at once.
_Avoid_: Package, offering, tier

**Travel Fee**:
Additional cost for MUA travel to the client venue, calculated from the MUA's Base Location and rate per km using Mapbox directions.
_Avoid_: Surcharge, transport fee, travel surcharge, delivery fee

**Slot Hold**:
A temporary reservation on a date created during checkout. Lasts 10 minutes while the client pays. Prevents other clients from booking the same slot.
_Avoid_: Lock, reservation, hold slot, booking hold

**Deposit**:
Upfront payment required to secure a booking. Can be a fixed amount or percentage of the total service price.
_Avoid_: Down payment, advance, prepayment

**Balance**:
Remaining amount due after the deposit. Typically paid on the event day.
_Avoid_: Due amount, remaining, remainder

## Location & Travel

**Base Location**:
The MUA's studio origin from which every Travel Fee is measured. Set once via the Base Location picker.
_Avoid_: Studio location, home base, origin address

**Venue**:
The Client's destination for a specific booking (hotel, hall, or home address).
_Avoid_: Destination, event venue, client address

**Venue Suggestion**:
One autocomplete result for a Venue or Base Location query. Resolved to a canonical place and coordinates.
_Avoid_: Suggest list item, dropdown item, location suggestion, place prediction

**Travel Fee Estimate**:
A client-facing preview of the Travel Fee on the MUA profile page before booking. Not yet a ledger value.
_Avoid_: Travel estimate, estimate travel cost, travel surcharge preview

## Onboarding

**Onboarding**:
The guided setup flow every new MUA must complete before their first use of the dashboard. Progress is tracked per step and the dashboard stays gated until the flow is finished.
_Avoid_: Setup wizard, signup flow, getting started

**Onboarding Step**:
One stage of the onboarding flow: identity, payment, packages, optional extras, then the link reveal. Each step is complete once its fields are saved and validated — the optional step can be skipped, which counts as complete.
_Avoid_: Wizard page, stage, tab

## Plans

**Plan**:
The tier an MUA holds — FREE, PRO, or FOUNDER — which sets their active booking capacity. FREE allows 2 active bookings; PRO and FOUNDER are unlimited.
_Avoid_: Subscription, tier, package level

**Plan Renewal**:
A manual monthly (RM 29) or yearly (RM 290) payment by a PRO MUA via DuitNow QR with a receipt upload, verified by the founder. There is no auto-billing.
_Avoid_: Subscription payment, auto-renewal, billing

**Plan Expiry**:
The end of a paid period. A 7-day grace period follows, during which the MUA is still treated as PRO; after grace, existing CONFIRMED bookings are honored but new checkouts fall to the FREE capacity.
_Avoid_: Lapse, plan end, overdue plan

**Founder Plan**:
The FOUNDER tier: current PRO parity, free for life, and manually granted to up to 10 launch MUAs after written acceptance. Launch grants are revocable only for documented serious terms or acceptable-use breach, fraud, abuse, unlawful use, deliberate harm, or abandonment after contact attempts.
_Avoid_: Lifetime deal, beta tier, pro bono

## Commercialization

**Founder Beta**:
A private validation cohort of up to 10 Founding MUAs before paid public launch. Entry requires written acceptance; participation asks for lightweight real-use feedback and receives priority best-effort support without an SLA. Real-client use requires the relevant privacy and security terms; public use of a participant's identity or outputs requires separate written consent.
_Avoid_: Public launch, free trial, lifetime deal

**Founding MUA**:
An MUA participating in the private Founder Beta and receiving the Founder Plan. A Founding MUA is a beta participant, not a founder, owner, investor, or decision-maker for MUASuites.
_Avoid_: Founder (when referring to a beta participant), cofounder, investor

**Paid Public Launch**:
The point at which MUASuites accepts paid MUA customers. It follows the Founder Beta and requires the chosen business structure, dedicated business banking, professional legal/accounting review, and the agreed tax/invoicing process.
_Avoid_: Beta, soft launch, release

**Beta Graduation Gate**:
The evidence and hard readiness conditions required before moving from the Founder Beta to Paid Public Launch. It includes cohort usage, repeat value, paid intent, reliability, sustainable support, and legal, privacy, banking, and payment readiness.
_Avoid_: Launch date, product-market fit, release checklist

**Paid-Intent Commitment**:
An explicit commitment from a non-Founder MUA to start the published paid plan when public launch opens. Interest, praise, or an interview statement alone is not a commitment.
_Avoid_: Lead, compliment, survey interest

**Business Structure**:
The legal form under which MUASuites operates. The initial launch route is a sole proprietorship, with later incorporation reconsidered when liability or growth materially changes.
_Avoid_: Company (when referring specifically to a sole proprietorship), account

**MUA-Owned Client Terms**:
The terms governing the makeup service relationship between an MUA and a Client. The MUA sets the service, cancellation, rescheduling, and refund policies; MUASuites may provide a template without becoming the service provider.
_Avoid_: MUASuites service terms, platform guarantee

**Platform Role Notice**:
A client-facing explanation that identifies the MUA as the makeup service provider and payment recipient, and MUASuites as the booking software platform.
_Avoid_: Marketplace disclaimer, payment-provider notice

**Proof of Transfer**:
A Client-supplied image or record showing an attempted transfer directly to the MUA. It is evidence submitted for review, not a payment receipt issued or verified by MUASuites.
_Avoid_: Payment receipt, payment confirmation, bank receipt

**MUA Payment Confirmation**:
The MUA's explicit confirmation, after reviewing a Proof of Transfer, that the Client's money was received. Uploading proof alone is not confirmation.
_Avoid_: Automatic payment confirmation, platform verification

**Invite-Only Payment Surface**:
A Client payment surface presented only inside an MUA-controlled, one-time Booking Link rather than on a public MUA profile. A personal QR may appear there only under a provider-confirmed exception; public payment surfaces require a business identity.
_Avoid_: Public payment page, merchant storefront

## Booking Lifecycle

**Checking Out**:
The initial booking state when a client is in the checkout flow. The slot is held for 10 minutes.
_Avoid_: Pending, in progress, active checkout

**Pending Approval**:
The booking state after the client uploads a deposit receipt. Awaiting MUA verification and approval.
_Avoid_: Awaiting, awaiting confirmation, unconfirmed

**Confirmed**:
The booking state after the MUA verifies payment and approves the booking. The date is blocked on the calendar.
_Avoid_: Approved, finalized, booked

**Completed**:
The post-event booking state. A historical record.
_Avoid_: Done, finished, closed

**Cancelled**:
The booking state when a slot hold expires without payment, or the MUA cancels the booking.
_Avoid_: Expired, voided, revoked

## Technical Concepts

**Booking Link Token**:
A unique identifier embedded in the booking link URL. Validates the link is legitimate, unused, and not expired before allowing checkout access.
_Avoid_: Invite token, access token, session token

**Mapbox Search Session**:
A per-page-load UUID sent as the Mapbox Search Box `session_token` on every suggest call and the retrieve/estimate that consumes the pick, so the pair is billed as one. Rotated after a successful retrieve and after 10 minutes idle. Never used for auth; unrelated to the Booking Link Token despite the shared `session_token` wire name (which Mapbox's API requires).
_Avoid_: Booking Link Token, session token (bare — always qualify as Mapbox Search Session token)

**Slot Locking**:
A database row-level lock on the MUA's configuration during checkout. Prevents concurrent booking attempts for the same date slot.
_Avoid_: Row lock, mutex, serialization

**Atmospheric Wash**:
A soft radial gradient background used on the hero and final CTA sections of the landing page. Ambient background only — never on text.
_Avoid_: Gradient background, color wash, overlay

**Product Mockup**:
A faithful rendering of the actual product UI shown in marketing contexts. Uses the same design tokens, shapes, and colors as the real product.
_Avoid_: Demo, preview, screenshot, illustration

**Auth Email Budget**:
The instance-wide hourly cap on authentication emails (GoTrue `rate_limit_email_sent`, 30/hour on this instance). Exhaustion stops ALL auth email sends for the rest of the hour — a bombing attacker can burn the whole budget, so it is both a bomb limit and a denial vector.
_Avoid_: Email quota, send limit, SMTP cap
