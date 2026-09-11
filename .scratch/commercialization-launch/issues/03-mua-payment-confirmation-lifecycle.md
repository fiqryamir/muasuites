# 03: MUA Payment Confirmation lifecycle

**What to build:** Align deposit and balance payment state with the commercial promise that upload is evidence only and explicit MUA Payment Confirmation is required. Support corrected Proof of Transfer submissions with a visible audit history.

**Blocked by:** 02: Proof-of-Transfer confidentiality

**Status:** ready-for-agent

- [ ] Deposit upload creates a pending review state and never confirms payment by itself.
- [ ] Balance upload creates a pending review state and never marks a booking `FULLY_PAID` by itself.
- [ ] The MUA can confirm, reject, or request corrected proof for both deposit and balance flows.
- [ ] Corrected or duplicate proofs are retained as history, with the latest proof prominent and each action attributable and timestamped.
- [ ] Confirmed and rejected states drive the correct booking, balance, notification, and client-facing behavior.
- [ ] External-behavior tests cover success, rejection, duplicate upload, corrected upload, and retry after failed upload.
