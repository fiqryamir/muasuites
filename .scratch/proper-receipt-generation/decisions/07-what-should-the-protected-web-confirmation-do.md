# 07 - What should the protected web confirmation do?

Type: prototype
Status: resolved
Blocked by: 04 - What data does a confirmation carry?; 06 - How should protected confirmation access work?

## Question

Create and review a rough protected web confirmation flow for mobile Client use and authenticated MUA use. Use the settled content and access decisions to decide the page hierarchy, Deposit versus Balance presentation, status language, print/download affordance, correction/superseded messaging, and the manual WhatsApp share action.

This is a cheap interaction prototype for agreement, not production UI or a PDF implementation.

## Comments

<!-- claim this ticket before the live discussion -->

## Prototype

- [Protected confirmation UI variants](../../../src/routes/prototype/payment-confirmation/+page.svelte): run `npm run dev`, then open `/prototype/payment-confirmation?variant=A`, `B`, or `C`.
- Variant A is a quiet paper-like confirmation, Variant B is a ledger/timeline layout, and Variant C is a mobile-first shareable pass. Each includes Deposit/Balance switching, superseded-state preview, print/save, and protected-link sharing controls.

## Answer

Choose **Variant A - Quiet paper** as the Client-facing confirmation direction. Its restrained paper-like hierarchy makes the document feel trustworthy and shareable without implying a tax invoice: the MUA identity and confirmation status lead, the verified payment amount is prominent, booking context and remaining Balance are easy to scan, and the direct-payment notice is visible without dominating the document.

Carry two elements from the other variants into the implementation handoff:

- Use Variant C's compact mobile action treatment for `Print / save` and `Share protected link`, with the actions remaining reachable on a narrow Client screen.
- Use Variant B's payment timeline and attempt-history density in the authenticated MUA audit view, not in the primary Client document.

The production confirmation route should open one specific Deposit or Balance confirmation; the prototype's Deposit/Balance switch is only a comparison control, not a requirement for one document to change payment type. A current confirmation shows `Confirmed`, its settled content contract, print/save and protected-link sharing. A superseded token shows a protected superseded notice and points to the current record; it does not show the old confirmation as current. No Proof of Transfer image, public URL, tax field, or legal-invoice styling is included.

The prototype remains a throwaway visual reference linked above. No production UI or backend behavior was implemented by this ticket.
