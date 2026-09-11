# 07: Dashboard sharing and notification privacy

**What to build:** Connect current confirmations to MUA operations and notifications without leaking Proof of Transfer URLs, Client bearer tokens, or claims that MUASuites verified Client funds.

**Blocked by:** 02: MUA review, rejection, and corrected Proof of Transfer; 04: Protected Client confirmation document; 05: Balance verification and full-payment confirmation; 06: Confirmation correction lineage and MUA audit history

**Status:** ready-for-agent

- [ ] The authenticated MUA dashboard offers View confirmation and Copy protected link for the current Deposit and Balance confirmation.
- [ ] The dashboard offers a manual WhatsApp share action with a short payment-kind, event-date, MUA-confirmation message and protected link.
- [ ] WhatsApp sharing never includes proof images, public proof URLs, Client confirmation bearer tokens, or platform-verification claims.
- [ ] The payment surfaces show pending, rejected, corrected, confirmed, and fully-paid states consistently with the underlying Payment Attempt and confirmation records.
- [ ] Telegram pending-proof and confirmation notifications link to the authenticated MUA workflow or contain safe operational facts only.
- [ ] Telegram notifications contain no public proof URLs, Client confirmation tokens, or statement that MUASuites received, held, or verified money.
- [ ] Notification and sharing behavior remains MUA-operational and does not add automated Client delivery.
- [ ] Tests assert the generated message contents and explicitly reject sensitive URL/token leakage.
