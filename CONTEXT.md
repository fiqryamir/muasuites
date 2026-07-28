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
Additional cost for MUA travel to the client venue, calculated from the MUA's base location and rate per km using Mapbox directions.
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

**Slot Locking**:
A database row-level lock on the MUA's configuration during checkout. Prevents concurrent booking attempts for the same date slot.
_Avoid_: Row lock, mutex, serialization

**Atmospheric Wash**:
A soft radial gradient background used on the hero and final CTA sections of the landing page. Ambient background only — never on text.
_Avoid_: Gradient background, color wash, overlay

**Product Mockup**:
A faithful rendering of the actual product UI shown in marketing contexts. Uses the same design tokens, shapes, and colors as the real product.
_Aavoid_: Demo, preview, screenshot, illustration
