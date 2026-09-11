# 02 - What pricing snapshot is authoritative?

Type: grilling
Status: resolved
Blocked by: 09 - What live schema and storage constraints must the spec honor?

## Question

Choose the server-authoritative commercial facts captured by a MUA Payment Confirmation. Resolve how Service Package price, Travel Fee, custom surcharge, total, Deposit, Balance, currency, and payment amount are calculated and frozen; how invite overrides are represented; and how the system handles existing bookings whose amounts were supplied by the Client during checkout.

The target must not treat hidden Client form fields as authoritative. Decide whether the confirmation uses a booking-time snapshot, a recomputation from current package/configuration data, or another explicit source of truth.

## Comments

<!-- claim this ticket before the live discussion -->

## Answer

Create the authoritative commercial snapshot on the server when the Booking is created during checkout, before any Proof of Transfer is submitted. The server must resolve the selected Service Package, Booking Link overrides, and MUA configuration; it must ignore the hidden Client-submitted amount fields as authority and persist the server-calculated values instead. The snapshot remains the source for every later Payment Attempt and MUA Payment Confirmation, even if the Package, Booking Link, or MUA configuration is later changed or deleted.

The full snapshot preserves:

- Service Package identity and price.
- Travel Fee, custom surcharge, and surcharge remark.
- The effective Deposit mode and value, including any Booking Link override.
- Total, Deposit, Balance, and an explicit currency code (`MYR` for the current Malaysia-first product).
- The expected scheduled amount for each payment event: Deposit or Balance.

Use server-side decimal money arithmetic with two-decimal monetary results. Calculate a percentage Deposit from the full Total, including Travel Fee and custom surcharge, then calculate Balance as Total minus Deposit. A MUA Payment Confirmation records the frozen expected scheduled amount; partial payments, overpayments, and payment-amount variances are not part of this first model and can be handled as a rejected proof or MUA-owned exception.

Bookings created before this snapshot exists retain their current values as historical operational data. They receive no automatic recalculation, backfill, or MUA Payment Confirmation. Any legacy reconciliation requires a separate explicit policy and must not silently rebuild amounts from current mutable Package, Booking Link, or MUA configuration rows.
