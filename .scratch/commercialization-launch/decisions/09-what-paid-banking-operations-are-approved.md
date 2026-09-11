# 09 - What paid banking operations are approved?

Type: grilling
Status: resolved
Blocked by: 02 - What banking and DuitNow QR setup fits the launch?; 03 - Which entity and liability posture governs the paid launch?; 05 - How should direct client payment be described and governed?; 11 - Can personal QR be used for public Client payments?

## Question

Choose the operational banking and payment setup for paid launch. Decide which account receives MUASuites plan-renewal payments, which QR is displayed for MUA-to-MUASuites renewal versus client-to-MUA deposits, how receipt evidence is stored and reconciled, who approves each payment, how refunds or mistaken transfers are handled manually, and what bookkeeping record is retained. Keep the two flows separate: MUA subscription payments to MUASuites versus client service payments directly to the MUA.

## Comments

<!-- claim this ticket before the live discussion -->

## Answer

Use GXBank Biz Account as the working provider for MUASuites SaaS renewals, subject to live provider confirmation and Malaysian professional review. Use a static provider-issued business QR. The Founder manually approves each MUA renewal after checking the bank transaction, submitted proof, selected period, and ledger entry.

Keep the two payment flows strictly separate. MUASuites' business account and QR receive only MUA SaaS-renewal payments. Client service payments go directly to the MUA's own payment destination; each MUA confirms those payments, owns the ledger and refund/dispute process, and does not route Client funds through MUASuites.

For MUASuites renewals, maintain a per-payment ledger with the MUA, period, amount, transfer date, bank reference, proof, verification date, invoice or receipt number, and new expiry, reconciled monthly to the business-account statement. Hold mismatched or duplicate payments until manually reconciled. Refunds and mistaken transfers are handled manually by the owner of the relevant payment flow, with the action and reason recorded.

Personal QR is permitted only inside an MUA-controlled one-time Booking Link, never on a public MUA profile or as a MUASuites default. Each MUA must confirm that their provider permits the exact use case and accept responsibility for payment records, disputes, and refunds. Public payment surfaces require a provider-approved business QR or BRN-linked business identity. This is a scoped commercialization exception and does not claim that personal-rail commercial use is generally approved; the research ticket remains the source for that uncertainty.
