# WhatsApp Notifications for MUASuites — Cheapest Reliable Option (Primary-Source Research)

**Research date: 2026-08-13.** All claims below are from official first-party sources (Meta, WhatsApp, Telegram, Twilio, 360dialog, WATI, Vonage, Gupshup, Infobip). Where Meta's developer portal blocked direct fetches, I used **Internet Archive captures of Meta's own pages** (capture timestamps given). Items I could NOT verify from a primary source are explicitly flagged.

---

## TL;DR verdict (details in §5)

- The old "conversation-based pricing with 1,000 free service conversations" model **no longer exists**. Since **July 1, 2025** Meta charges **per delivered template message**, and **service (non-template) messages are entirely free** (since Nov 1, 2024) — unlimited, no 1,000 cap.
- Cheapest reliable option: **Meta Cloud API direct** (no BSP needed), sending MUA alerts as **free-form messages inside a 24-hour customer-service window** that the MUA opens by tapping a wa.me link (client-initiates pattern). Cost ≈ **$0/month Meta fees**.
- If you accept business-initiated utility templates outside the window: **~US$0.014 per message in Malaysia** (Meta fee, per Twilio's published rate card) — **$2.80–$8.40/month for 10 MUAs at 20–60 alerts each**.
- All BSPs with monthly fees (360dialog €49/mo, WATI from ~$39/mo) are **not** cost-effective at this volume. Twilio/Vonage/Gupshup add small per-message fees on top of Meta's.
- Reliability caveat: WhatsApp alerts outside the customer-service window require **approved templates**, and delivery is only guaranteed-free within the window; Telegram remains free with no such constraints.

---

## 1. WhatsApp Business Platform / Cloud API (Meta, official)

### 1.1 The pricing model changed: per-message since July 1, 2025

The official pricing page (business.whatsapp.com/products/platform-pricing, archived 2026-01-02) states: *"Effective July 1, 2025 we will introduce per-message pricing and also introduce updated rates and new volume tiers for utility and authentication"* and *"Businesses using our platform are charged on a per-message basis for each message we deliver to users — We charge when a message is **delivered** (not sent)"*.
Source: https://web.archive.org/web/20260102232603/https://business.whatsapp.com/products/platform-pricing

The developer docs confirm the four categories and the deprecation: *"Conversation-based pricing is deprecated. It was replaced with per-message pricing on July 1, 2025"* — categories: **marketing, utility, authentication, service**; "Template messages are the only message type that can be sent outside of a customer service window".
Source: https://web.archive.org/web/20260811184851/https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing (captured 2026-08-11; Meta's docs moved to developers.facebook.com/documentation/business-messaging/whatsapp/pricing)

### 1.2 The 24-hour customer service window and what's free

- *"When users message a business, this opens a 24-hour customer service window during which businesses can respond with service messages, **at no charge**. This window **resets with each user message**."*
  Source: https://web.archive.org/web/20260102232603/https://business.whatsapp.com/products/platform-pricing
- Free, per the pricing docs (captured 2026-08-11):
  - **"As of November 1, 2024 – Meta does not charge for non-template messages"** (free-form text/image/etc., only sendable inside an open customer service window).
  - **"As of July 1, 2025 – Meta does not charge for utility templates in response to users (delivered within an open customer service window)."**
  - **Free entry point window: "All messages, including template messages, are free for 72 hours, if sent within an open free entry point window"** — free entry points are specifically a **Click-to-WhatsApp Ad** or **Facebook Page call-to-action button** (i.e., NOT plain wa.me links).
  Source: https://web.archive.org/web/20260811184851/https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- Worked charge example (same page): user messages business → 24h CSW opens; business text reply = "None" charge; utility template within CSW = "None" charge; utility template at hour 30 (window closed) = "Utility" charge.

### 1.3 The "1,000 free service conversations" — verify: OBSOLETE

- Under the old conversation-based pricing (pre-July 2025), the free tier evolved: the **first 1,000 service conversations/month** free (still described by Infobip's own pricing page, captured 2023-03-31: *"The first 1,000 conversations per registered WhatsApp Business Account are free of charge every month"* — https://web.archive.org/web/20230331223357/https://www.infobip.com/whatsapp-business/pricing), then **"As of November 1, 2024, you can open an unlimited number of service conversations at no charge"** (Meta's own archived CBP docs, https://web.archive.org/web/20250602173237/https://developers.facebook.com/docs/whatsapp/pricing).
- Under today's per-message model, service/free-form messages are simply **always free, unlimited** — the 1,000 cap no longer exists and the question "is 1,000/month enough?" is moot.
- There is no separate "free tier" to claim; the free mechanisms are: (a) user-initiated conversations → 24h CSW → free service messages + free in-window utility templates; (b) free entry point windows (Ads/FB Page CTA) → 72h of free everything.

### 1.4 Malaysia rates (utility / marketing)

- Meta publishes rates only as downloadable rate-card CSVs (MYR rate card exists — **MYR became a billing currency effective April 1, 2026** per the docs' rate-card history: *"8 new billing currencies introduced: ARS, CLP, COP, MYR, PEN, SAR, SGD, AED"*). The CSV files themselves are on Meta's CDN and returned 403 to direct fetch; **I could not read Meta's own CSV**.
  Source (MYR currency + CSV links): https://web.archive.org/web/20260811184851/https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- **Verified equivalent from Twilio's official pricing CSV** (Twilio's first-party download of Meta's current per-message fees, fetched live 2026-08-13): **Malaysia (MY): Marketing $0.086/message, Utility $0.014/message, Authentication $0.014/message**.
  Source: https://www.twilio.com/content/dam/twilio-com/pricing-data/en/WhatsAppPricing-pricing-details.csv
- Malaysia is its own rate-card market (country calling code +60), not a "Rest of" region. Source: https://web.archive.org/web/20250602173237/https://developers.facebook.com/docs/whatsapp/pricing (country-calling-code table) and the 2026 docs capture.
- Volume tiers exist for utility/authentication (aggregated per business portfolio, only charged messages count; tiers reset monthly) — irrelevant at our volumes. Source: 2026 docs capture (same URL as above).

### 1.5 Getting access (no BSP required)

- Cloud API **Get Started** (Meta docs, captured 2025-05-13): you need a Meta developer account, a business app, and a Meta Business Account (MBA). Adding the WhatsApp product auto-creates a **test WABA + test number** — *"you can send free messages to up to 5 recipient phone numbers"*, with pre-approved templates; later you add a **real business phone number** and create a real WABA. No BSP is mentioned or required for direct access.
  Source: https://web.archive.org/web/20250513024816/https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- **Business verification** is required to scale: *"Businesses must initiate business verification when they are ready to scale marketing, utility, and authentication conversations, add additional phone numbers, or request to become an Official Business Account"* — plus payment method on file, opt-in permission from users for templates, and adherence to WhatsApp's Commerce/Business policies.
  Source: https://web.archive.org/web/20250526191713/https://developers.facebook.com/docs/whatsapp/overview
- Phone number must be a "valid business phone number" not already in use; WATI's onboarding (first-party) states plainly: *"You must have a phone number that does not have a WhatsApp Account"* — https://www.wati.io/pricing/ (fetched 2026-08-13). Meta's exact number-registration requirements live in the "Phone numbers" doc which I could not render; flagged.

### 1.6 Reliability / design constraints

- **Messaging limits** (Meta docs, captured 2025-05-22): numbers start at **250 business-initiated template conversations per 24h moving period**, upgradable to 1K/10K/100K/unlimited via business verification, identity verification, or 1K-conversations-in-30-days + automatic scaling. **Quality rating** (based on blocks/reports/mutes) can keep limits low or reduce them. Irrelevant at 20–60 alerts/month but worth knowing.
  Source: https://web.archive.org/web/20250522081019/https://developers.facebook.com/docs/whatsapp/messaging-limits
- Default throughput ~80 messages/sec (referenced in 360dialog's own docs: "exceeds Meta's standard 80 messages per second limit" — https://www.360dialog.com/pricing/).
- No formal uptime SLA from Meta; Cloud API hosting is free (Meta-hosted). Charged on delivery, not send — failed sends cost nothing (except BSP failed-message fees, e.g., Twilio $0.001/message on "Failed" status — https://www.twilio.com/en-us/whatsapp/pricing).
- Business-initiated free-form messages are **impossible outside the CSW** — the only out-of-window message type is an approved template (marketing/utility/authentication). Source: 2026 pricing docs (URL above).

---

## 2. Telegram Bot API (current baseline)

- Free: official Bots FAQ — *"By default, bots are able to message their users **at no cost**"*, with limits: ≥1 message/sec per chat, ≥20 messages/min per group, **~30 messages/sec** for bulk broadcasts; beyond that, paid broadcasts cost **0.1 Telegram Stars per message** (requires 100k Stars balance + 100k monthly active users — irrelevant here).
  Source: https://core.telegram.org/bots/faq
- Delivery mechanics: simple HTTPS POST to `https://api.telegram.org/bot<token>/METHOD_NAME`; no per-message fee, no conversation windows, no template approval, no recipient opt-in regime beyond the user starting the bot.
  Source: https://core.telegram.org/bots/api (fetched 2026-08-13)
- Why it's cheap: no message fees at all at our volume, no category system, no delivery-based billing. Constraints that DO apply to us: none practically (a handful of messages/day per MUA).

---

## 3. BSPs — primary-source pricing (all fetched 2026-08-13 unless noted)

**Twilio** (https://www.twilio.com/en-us/whatsapp/pricing):
- *"Twilio's message handling fee: $0.005 per message (inbound or outbound)"* + *"Pay Meta's template fees"* pass-through; *"No Meta fee during customer service window for utility and free-form messages"*; free-form messages = $0.005 Twilio fee, no Meta fee; failed-message processing fee $0.001/message. Utility/auth "start at $0.0034/message" (Meta fee, per-country). No monthly fee. Malaysia utility per their CSV: $0.014 + $0.005 = **$0.019/message**.

**360dialog** (https://www.360dialog.com/pricing/):
- WhatsApp API **REGULAR €49 per number per month** + Meta fees; PREMIUM €99/mo; High Throughput €249/mo; Marketplace €99/number/mo; Partner Platform €250–€1,000/mo + per-channel. "Zero message markup" on Meta fees (Partner Platform section: "zero message markup"). No per-message surcharge, but the €49/mo floor kills it for our volume.

**WATI** (https://www.wati.io/pricing/):
- Current page: subscription tiers (Growth / Pro / Business, annual & monthly; **the current tier prices are JS-rendered and were not machine-readable** — flagged) + *"Per message charges vary for marketing, utility & authentication"* and *"Charged based on WATI rate card"* (their rate card lives on Google Drive, not on their site). Archived May-2024 page shows **Growth $39/mo, Pro $79/mo, Business $229/mo (USD annual)** each including *"1000 Free Service Conversations/Month"*.
  Sources: https://www.wati.io/pricing/ ; https://web.archive.org/web/20240525211629/https://www.wati.io/pricing/
- **The "$0.04 per conversation" claim could NOT be verified** from WATI's current pricing page, their archived pricing pages, or their support site (the support article cited for it now returns 410 Gone). Current WATI billing is subscription + per-message rate card. Flagged clearly.

**Vonage** (https://www.vonage.com/communications-apis/messages/features/whatsapp/pricing/):
- *"WhatsApp fees apply on a per message basis for each delivered message"* (Meta, linked) + *"Vonage platform fee … starting as low as 0.0001 Euros (0.00016 USD) per message"*. No monthly fee mentioned. FAQ confirms: messages in the 24h CSW are *"free from Meta. Vonage platform fees still apply."* Effectively Meta + ~$0.0002/msg.

**Gupshup** (self-serve pricing page, archived 2022-06-25 — the current site is JS-gated, flagged):
- *"Gupshup charges a standard 0.001 USD per message fee. WhatsApp charges conversation based fee and it is billed at actuals."* — i.e., **$0.001/message Gupshup fee + Meta at actuals**, no monthly fee in that model. Gupshup's own support article (June 2025) confirms their billing moved to per-message pricing (PMP) with Meta's July 2025 change, including `free_customer_service` (in-window utility/non-template) and `free_entry_point` messages being free, and volume-tier refunds at month end.
  Sources: https://web.archive.org/web/20220625072858/https://www.gupshup.io/channels/self-serve/whatsapp/pricing ; https://web.archive.org/web/20250619151930/https://support.gupshup.io/hc/en-us/articles/47379153369113-Gupshup-PMP-per-message-pricing-related-changes-for-July-2025

**Infobip** (https://web.archive.org/web/20230331223357/https://www.infobip.com/whatsapp-business/pricing and https://web.archive.org/web/20260306053500/https://www.infobip.com/whatsapp-business):
- **No public list prices.** Their WhatsApp "pricing" page is purely educational (describes Meta's model) and routes to "Contact an expert". Infobip is a Meta BSP ("WhatsApp Business Platform provider") but per-message fees are quote-only. Flagged: exact Infobip fees unverifiable.

---

## 4. Free / hybrid alternatives

### 4.1 WhatsApp Business App + wa.me — not an API, cannot be automated
- Meta's official platform docs draw the line explicitly: *"Unlike the consumer app and small business app, the business platform is not an app, but a programming language interface that allows you to connect at scale."* The WhatsApp Business App page (archived 2025-12-19) describes a manual app: *"The WhatsApp Business app is built with the small business owner in mind… Use the app to communicate one-on-one with your customers."*
  Sources: https://web.archive.org/web/20250526191713/https://developers.facebook.com/docs/whatsapp/overview ; https://web.archive.org/web/20251219220422/https://business.whatsapp.com/products/business-app
- Meta reserves the right to cut off unauthorized automation: *"If you use anything other than the official WhatsApp Business Platform or other official WhatsApp tools, we reserve the right to limit or remove your access to WhatsApp… Please do not use any non-WhatsApp authorized third-party tools to communicate on WhatsApp."* (WhatsApp FAQ "Unauthorized use of automated or bulk messaging on WhatsApp" is linked from that page; the FAQ body itself was bot-blocked, flagged.)
  Source: https://web.archive.org/web/20250526191713/https://developers.facebook.com/docs/whatsapp/overview
- Conclusion: the free Business App route = **manual notifications only**; your platform cannot push alerts through it. **Not viable as a replacement.**

### 4.2 "Flip the model": client initiates → replies are free. VERIFIED from Meta docs.
- Any message from the MUA (recipient) to your business number opens a 24h customer-service window: *"The user messages you… This opens a 24 hour customer service window"*; *"Messages sent from a WhatsApp user to a business are not charged"* (2026 pricing docs, charge example). Inside the window, non-template messages and utility templates are **free** (see §1.2).
- Mechanically: your MUA taps a `wa.me/<business-number>?text=…` link (prefilled) at onboarding and ideally once daily; the platform then sends each alert as a free-form message inside the window. **Cost: $0 Meta fee.**
- Two caveats from the docs: (1) a plain wa.me tap opens a 24h CSW, but it is **NOT** a "free entry point" — Meta defines free entry points (72h of free everything) only as Click-to-WhatsApp Ads and Facebook Page CTA buttons (2026 pricing docs); (2) if the window lapses, the platform cannot send free-form at all and must fall back to an **approved utility template** (≈$0.014 in Malaysia) or wait for the MUA's next message. The official Click-to-Chat FAQ (faq.whatsapp.com/general/260000930958) was bot-blocked and not archived — the wa.me mechanic itself is corroborated by Meta's CSW docs above; flagged as indirect.

### 4.3 Malaysia-specific quirks — mostly unverifiable
- **WhatsApp penetration in Malaysia: no primary source exists** (Meta does not publish per-country user stats; the "2.44 billion users" figure on Infobip's page is attributed to Statista, a secondary source). Any penetration claim for Malaysia would be secondary — **flagged, excluded**.
- Verified primary-source facts for Malaysia: Malaysia is a standalone rate-card market (calling code +60) and MYR is a supported billing currency since April 1, 2026 (Meta pricing docs, §1.4). The MUA's DuitNow QR receipt flow is unrelated to WhatsApp delivery (no primary source documents any interaction); nothing in Meta's docs constrains WhatsApp alert content about DuitNow payments.

---

## 5. Verdict: cheapest + reliable for low-volume MUA alerts (Malaysia)

**Cost model (10 MUAs, 20–60 business-initiated alerts/MUA/month → 200–600 msgs/month, Malaysia):**

| Option | Meta fee | Provider fee | Monthly total (200–600 msgs) | Notes |
|---|---|---|---|---|
| **Cloud API direct + CSW pattern (MUA taps wa.me)** | $0 | $0 | **$0.00** | Alerts as free-form inside 24h window; needs fallback template |
| **Cloud API direct, utility templates** | $0.014/msg | $0 | **$2.80–$8.40** | Needs 1 approved utility template + business verification |
| Twilio | $0.014/msg | $0.005/msg | $3.80–$11.40 | No monthly fee; simplest managed API |
| Vonage | $0.014/msg | ~$0.0002/msg | ~$2.84–$8.52 | No monthly fee; platform fee "as low as 0.0001 EUR" |
| Gupshup | $0.014/msg | $0.001/msg | $3.00–$9.00 | 2022 self-serve rate; current rate unverified |
| 360dialog | $0.014/msg | €49/mo | **€49+ / month** | Not economical at this volume |
| WATI | rate card | $39–$229/mo | **$39+ / month** | Subscription floor; $0.04/conversation claim unverified |
| Infobip | n/a | quote-only | unknown | No public pricing |

**Recommendation:**
1. **Primary: Meta Cloud API, direct (no BSP).** $0–$9/month. Implement the "client-initiates" pattern (wa.me link with prefilled text in the MUA's WhatsApp settings/onboarding) so alerts ride the free 24h customer-service window as free-form messages; also submit **one utility template** (e.g., "Booking alert: {client} on {date} — {link}") as the out-of-window fallback (~$0.014/msg in Malaysia). Budget: **$0–$10/month at realistic volumes**, growing ~$0.014 per out-of-window alert.
2. **If you want zero template-maintenance and no Meta console work: Twilio** — no monthly fee, $0.005/msg on top of Meta's $0.014, free-form inside the window. ~$4–$11/month.
3. **Avoid monthly-fee BSPs (360dialog, WATI)** at this volume — the subscription alone exceeds the entire utility-template bill for a year.
4. **Reliability trade-off vs Telegram:** Telegram remains free, unlimited, and simpler (no templates, no windows, no opt-in paperwork). WhatsApp's constraints are: template approval, 24h free-form window, per-delivery billing, quality-rating exposure, and business verification for scale — all manageable at this volume, but the "client-initiates" pattern adds a behavioral dependency (MUA must message at least once per 24h for the $0 path).
5. Keep Telegram as fallback channel during migration (both are just HTTP POSTs from SvelteKit).

**Unverified items (flagged):** Meta's own Malaysia rate CSV (403-blocked; used Twilio's official mirror of the same rate card — $0.014); WATI's "$0.04/conversation" claim (absent from all accessible WATI primary pages); Gupshup's current fee (2022 rate cited); Infobip fees (quote-only); WATI current plan prices (JS-rendered; May-2024 prices cited); Malaysia WhatsApp penetration and the Click-to-Chat FAQ body (no accessible primary source).
