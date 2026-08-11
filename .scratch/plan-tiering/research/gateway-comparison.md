# Malaysian payment gateways — comparison for future automated subscription billing

> Research for decision ticket 03 (plan-tiering). Captured 2026-08-11 from PRIMARY sources only (official websites, official pricing pages, official docs, official terms of service). Every claim cites the URL that owns it. Pricing/terms change often — verify before signing.

---

## 1. CHIP (Chip In Sdn. Bhd.) — chip-in.asia

Registered Merchant Acquirer (non-bank) listed by BNM, listed by PayNet as FPX Third-Party Acquirer, PCI-DSS compliant, company no. 202201010914 (1456611-H). Source: https://www.chip-in.asia/ (footer) and https://www.chip-in.asia/terms-of-service

### Costs
- **No setup, monthly or annual fees, no long-term contracts** — explicitly stated in pricing FAQ ("CHIP does not charge setup, monthly or annual fees", "CHIP does not require long-term contracts or commitments"). Source: https://www.chip-in.asia/pricing
- FPX Online Banking: **RM 1.00 per paid transaction (B2C)**, RM 2.00 (B2B1). Settlement: every next day. Source: https://www.chip-in.asia/pricing
- Cards: local credit **2.0%**, local debit **1.0%**, foreign **3.0%**. Settlement T+2 business days. Source: https://www.chip-in.asia/pricing
- DuitNow QR (online & in-person): **1.0%, min RM 0.15**, next-day settlement. Cross-border QR (Indonesia, Thailand, Singapore) supported. Source: https://www.chip-in.asia/pricing
- E-wallets (TNG/GrabPay/ShopeePay): 1.4%, T+2. BNPL: Atome 5.3%, SPayLater 1.4%. Stablecoin (USDT/USDC etc.): 1.5%. Source: https://www.chip-in.asia/pricing
- Refund fee: only FPX B2C RM1.00 / B2B RM2.00; no additional fee for other methods. Source: https://www.chip-in.asia/pricing
- Note: TOS boilerplate (cl. 7.1.1–7.1.2) references a "Signup Fee" and annual "Maintenance Fee", but the operative published pricing page states no such fees; pricing email/dashboard prevails per cl. 7.2. Source: https://www.chip-in.asia/terms-of-service

### Recurring billing — YES (cards; the strongest API support of the four)
- Dedicated **Subscriptions** product flow in official docs, marketed at SaaS ("Recurring Memberships / SaaS products / courses"). Source: https://docs.chip-in.asia/chip-collect/overview/online-purchases/subscription
- Mechanics: customer pays a registration/token purchase via card (with `force_recurring: true`), CHIP stores a **recurring token**; merchant then calls the **Charge API** (`/purchases/{id}/charge/`) whenever a renewal is due. Works with free trials, registration fees, whitelisted methods visa/mastercard/maestro. Source: same URL above.
- **CHIP does NOT auto-renew** — "the automatic renewal logic must be implemented on the merchant's side, for example using a cron job". Tokens are tied to brand_id and referenced by customer_email; list/delete-token APIs provided. Source: same URL above (FAQ section).
- Recurring is card-based only; FPX is one-off. Plugins exist for WooCommerce Subscriptions and Pabbly Subscription billing. Sources: https://www.chip-in.asia/collect/payments (plugins section), https://blog.chip-in.asia/chip-with-pabbly-subcription-billing/ (linked from that page)
- Pre-auth (skip_capture) also supported — useful for hold-then-charge. Source: https://docs.chip-in.asia/chip-collect/overview/online-purchases/pre-auth (linked from homepage nav)

### Onboarding / entity required
- **SSM-registered business + business bank account under the registered business name required.** Official FAQ: "You'll need an SSM-registered business and a business bank account under your registered business name. During onboarding, we'll ask for supporting documents such as your business registration, identity documents, bank statement, and additional information depending on the payment methods you apply for (such as FPX, cards, e-wallets or BNPL)." Source: https://www.chip-in.asia/collect/payments (FAQ section, "What do I need to create CHIP account?")
- No individual/personal tier advertised (unlike BayarCash). NGOs/associations/mosques OK with ROS/JAIS etc. registration. Source: same FAQ section.
- KYC per TOS: credit agency checks, PEP/sanctions/adverse-media screening, corporate structure docs, UBO/director/shareholder info, ongoing monitoring (AMLA). Source: https://www.chip-in.asia/terms-of-service (cl. 4.2, 5.1A–5.1D)
- Approval timeline: not published on site; docs/FAQ don't state days. Must confirm with sales (contact/WhatsApp on site).
- **Compliance flags in TOS relevant to MUASuites:** (a) prepayment-model merchants (deposits!) may require prior written CHIP approval before going live plus settlement into a dedicated trust/segregated account until fulfilment (cl. 6A.1); (b) TOS has a full Payment-Facilitator/sub-merchant framework (cl. 5.1A–5.1D, 5A) — CHIP explicitly contemplates a SaaS platform onboarding its own merchants as sub-merchants. Source: https://www.chip-in.asia/terms-of-service

### Technical fit
- RESTful Collect API (`gate.chip-in.asia/api/v1`, Bearer secret key) + Send (payouts) API with HMAC-signed requests; OpenAPI specs published; webhooks for payments; staging/test mode; 20+ plugins and 30+ sales-platform integrations; iOS/Android SDKs. Sources: https://docs.chip-in.asia/llms.txt, https://www.chip-in.asia/collect/payments
- Malaysia-first (MYR settlement; cross-border inbound QR from ID/TH/SG; foreign cards accepted); Singapore presence (`/sg` site). Source: https://www.chip-in.asia/pricing, https://www.chip-in.asia/sg
- Self-described fit for SaaS platforms: "Collect payments securely from customers through your own SaaS platform and website using APIs." Source: https://www.chip-in.asia/ (use-case section)

---

## 2. BayarCash (Bayarcash Sdn. Bhd., under Web Impian Sdn. Bhd.) — bayarcash.com

### Costs
- **Free T+ plan** (T+2 payout): FPX B2C **RM 1.00**, FPX B2B RM 2.00, credit card RM 1.00 + 1%, **Direct Debit RM 1.50 per deduction**, DuitNow QR 1.60% (min RM 0.15), Boost PayFlex / QRIS / NETS / PromptPay 1.60% (min RM 0.15). All fees exclude **8% SST**. Source: https://bayarcash.com/ and https://bayarcash.com/rpp/
- Realtime-settlement plans (Public Bank & Bank Islam only; others get T+1): **Starter RM 189/yr** (online banking RM 1.20/txn), **Lite RM 2,899/yr** (RM 0.70/txn), **Enterprise RM 12,000/yr** (RM 0.20/txn); DuitNow QR RM 0.50 flat on all realtime plans; wallets RM 0.50. Sources: https://bayarcash.com/, https://bayarcash.com/rpp/
- DuitNow QR "free of charge until further notice" for merchants on realtime plans (except credit-card-account QRs); bank fees may vary by merchant (online banking "usually from RM 0.70"). Sources: same.

### Recurring billing — YES (FPX direct debit / e-mandate; cheapest true recurring)
- **Direct Debit**: weekly (every Friday, first deduction 2 weeks after enrolment) or monthly (3rd–5th of month, one retry 25th–28th if first fails); each mandate takes **3–5 days to approve**; self-service maintenance/termination; fee **RM 1.50 per deduction** (T+ plan). Sources: https://docs.bayarcash.com/380, https://docs.bayarcash.com/377, https://bayarcash.com/ (pricing)
- Direct Debit appears only on the T+ (free) price table, not the realtime plans. Source: https://bayarcash.com/rpp/
- Integrates with WooCommerce Subscriptions and GiveWP Recurring Donations via official plugins. Sources: https://docs.bayarcash.com/245, https://docs.bayarcash.com/252
- Positioning: "auto debit mingguan & bulanan via online banking — fees paling murah" (cheapest fees); also sells instalment programs + CTOS credit checking. Source: https://bayarcash.com/
- Shariah-compliant; explicitly excludes non-Shariah business activities (liquor, gambling, tobacco, pork, interest-based lending, forex for individuals, etc.). Source: https://bayarcash.com/go/tsp/ (Merchant Registration form)

### Onboarding / entity required
- **Three account tiers**, published on the official merchant registration form (https://bayarcash.com/go/tsp/):
  - **Personal** — "individuals, freelancers & gig economy... **No SSM required**, uses NRIC for verification, personal bank account." Can start Personal and upgrade later.
  - **Business** — SSM-registered (Sdn Bhd, PLT, Enterprise; Sabah/Sarawak PBT licence), business bank account, higher transaction limits.
  - **Society & Organisation** — ROS-registered (NGOs, masjids, co-ops), ROS certificate + organisation current account.
- Approval timeline: not published for account activation; direct-debit mandate approvals are 3–5 days (above).

### Technical fit
- API + sandbox console (console.bayarcash-sandbox.com), official docs portal (docs.bayarcash.com), PHP SDK (Laravel/GitHub), WordPress plugins (WooCommerce, GiveWP, EDD), WHMCS, HostBill, Make, etc.; e-mandate checker + transaction checker + bank-status pages. Sources: https://bayarcash.com/, https://docs.bayarcash.com/
- Malaysia-only processing but accepts cross-border QR inflows (QRIS Indonesia, NETS Singapore, PromptPay Thailand). Realtime settlement only for Public Bank/Bank Islam accounts. Sources: https://bayarcash.com/, https://bayarcash.com/rpp/

---

## 3. ToyyibPay — toyyibpay.com

### Costs
- **Standard plan (all users)**: FPX RM 1.00 B2C / RM 2.00 B2B per transaction; settlement next 1–4 business days. **Santai plan**: free for non-profit organisations, settlement ~10 business days. Source: https://www.toyyibpay.com/pricing-plans/
- Cards (via partners): local 1.50%, foreign 3.50% of successful amount; **onboarding fee RM 100 + yearly fee RM 100** (from second year). Source: https://www.toyyibpay.com/pricing-plans/
- DuitNow QR: 1.00% or RM 1.00 per transaction, subject to provider approval, settlement next 2 business days. Source: https://www.toyyibpay.com/pricing-plans/
- No published monthly fee for FPX; split payment between ToyyibPay users supported (FPX only). Source: https://toyyibpay.com/apireference/

### Recurring billing — NO (today)
- Direct Debit is explicitly **"Coming Soon"** on the official solutions page ("Collect recurring payments with ease" — Coming Soon). Virtual Account is their workaround for subscription-style collections (assign per-payer virtual account numbers). Sources: https://www.toyyibpay.com/solutions/, https://www.toyyibpay.com/
- API reference contains **no subscription/recurring/charge-token endpoints** — only createCategory, createBill, callback, getBillTransactions, getCategory, inactiveBill (+ enterprise createAccount/getBank/getUserStatus, DuitNow QR status). Source: https://toyyibpay.com/apireference/

### Onboarding / entity required
- No explicit entity-type gate found on official pages; API's enterprise createAccount takes bankAccountType 1 = Personal Saving, 2 = Business/Company Current, 3 = Society (default 2) — i.e. personal accounts are accommodated. Source: https://toyyibpay.com/apireference/ (Create User)
- Accounts have states 0 inactive / 1 new-pending approval / 2 active; approval timeline not published. Source: https://toyyibpay.com/apireference/ (Get User Status)
- Compliance page lists a "Coming Soon" feature for "online incorporation of SDN BHD for sole prop or individual merchants; eKYC and online application for business bank account opening" — suggesting current onboarding is more manual and leans on registered businesses. Source: https://www.toyyibpay.com/risk-management/
- Shariah-compliant (certificate page). Source: https://www.toyyibpay.com/shariah-certificate/

### Technical fit
- Simple POST/form API (multipart/x-www-form-urlencoded), callback + return URL, **MD5 hash callback verification** (not HMAC/webhook-rank style), sandbox at dev.toyyibpay.com, WooCommerce plugin, PHP samples. Sources: https://toyyibpay.com/apireference/, https://www.toyyibpay.com/
- Malaysia-only; MYR only.

---

## 4. Billplz (Billplz Sdn Bhd) — billplz.com

### Costs
- **Basic plan: free** (no annual fee, no contract). FPX B2C **RM 1.25**, B2B RM 3.00, payout next business day. Card 1.8% (MYR; 3.8% non-MYR optional), T+2. Wallet/DuitNow QR 1.5%, next day. Atome instalments 6%. **Auto-Deduct: 2.3% + RM 1.25**. Source: https://www.billplz.com/pricing
- **Standard plan: RM 999/year** + processing fees: FPX B2C **RM 0.75**, B2B RM 2.00; card 1.5% (3.5% non-MYR); wallet 1.5%; **Auto-Deduct 2% + RM 0.75**. Enterprise: custom. Source: https://www.billplz.com/pricing
- Payment Order (disbursement): DuitNow transfer RM 1.25 / RM 0.75, real-time. Source: https://www.billplz.com/pricing

### Recurring billing — YES (auto-deduct)
- **Auto-Deduct** product with dedicated fee line on the official pricing page (above). Card **tokenization** also available (SenangPay 3DS vault, Visa/Mastercard; **paid plan members only**, request access by email) enabling charge-on-demand against stored cards. Sources: https://www.billplz.com/pricing, https://www.billplz.com/api (Tokenization section)
- One-off flow: Bills (expire after 30 days by default) with callback/redirect. Source: https://www.billplz.com/api

### Onboarding / entity required
- Official sign-up guide: needs **MyKad or passport (e-KYC via CTOS with photo + selfie)**, **organization's SSM/ROC/ROS registration number**, **bank account registered under the organization's name**, then TIN (LHDN), business address/description, SST number if applicable. Full process ~10 minutes; **bank-account verification within 24 business hours**. Card/e-wallet activation requires an additional email request + verification. Sources: https://support.billplz.com/guide/sign-up-for-a-billplz-account, https://support.billplz.com/guide/understanding-identity-verification-kyc-and-kyb
- Entity types: any SSM/ROC/ROS-registered organisation ("name must match registration certificate exactly, including suffixes like Sdn Bhd or PLT") — sole proprietorships (SSM-registered) are eligible; no individual/no-entity tier (unlike BayarCash).

### Technical fit
- REST API (versioned v3/v4), Basic-auth with secret key, webhooks via compulsory callback_url + X-Signature verification, webhook ranking, sandbox, rate limits (100 req/5 min GET), MYR only (no currency conversion). Sources: https://www.billplz.com/api, https://www.billplz.com/pricing
- 60,000+ Malaysian organizations; 99.9% historical uptime claim; PCI DSS, ISO 27018, PayNet System Integrator; GitHub org + dev community. Sources: https://www.billplz.com/, https://www.billplz.com/pricing
- Malaysia-only; MYR only.

---

## Comparison table

| | **Chip** | **BayarCash** | **Billplz** | **ToyyibPay** |
|---|---|---|---|---|
| FPX B2C fee | RM 1.00 | RM 1.00 (T+ plan) | RM 1.25 Basic / RM 0.75 Standard | RM 1.00 |
| Card fee | 2.0% local credit / 1.0% debit / 3.0% foreign | RM 1.00 + 1% | 1.8% / 1.5% | 1.5% local / 3.5% foreign (+RM100 onboarding, RM100/yr) |
| Setup/monthly fees | None, no contract | Free plan (T+); realtime RM189–RM12,000/yr | Basic free; Standard RM999/yr | None published (FPX); card RM100 + RM100/yr |
| **Recurring billing** | **Yes — card tokens + Charge API (merchant-side scheduling)** | **Yes — FPX direct debit e-mandate (weekly/monthly), RM 1.50/deduction** | **Yes — Auto-Deduct (2.3%+RM1.25 / 2%+RM0.75); card tokenization (paid plans)** | **No — direct debit "Coming Soon"** |
| Entity required | SSM-registered business + business bank account; no individual tier | Business (SSM), Society (ROS), **or Personal (NRIC only, no SSM)** | Any SSM/ROC/ROS-registered org + org-name bank account | Not explicit; personal bank accounts accommodated via API; approval manual |
| Approval timeline | Not published | Not published (mandates 3–5 days) | ~10 min + 24 business hours bank verification | Not published |
| Webhooks/API | REST + OpenAPI, webhooks, test mode, HMAC Send API | API + sandbox, PHP SDK, plugins | REST v3/v4, compulsory callbacks, X-Signature, webhook rank | Simple POST API, MD5 hash callbacks |
| Scope | Malaysia (+SG ops; cross-border QR ID/TH/SG; global cards; stablecoin) | Malaysia (cross-border QR inflows ID/SG/TH) | Malaysia-only, MYR only | Malaysia-only |
| Regulated | **BNM registered merchant acquirer + PayNet FPX TPA** | Shariah-compliant (TSP of banks) | PayNet System Integrator, PCI DSS | Shariah-certified |

---

## Recommendation

For the future PRO auto-billing (decision ticket 03), **Chip is the best technical fit**: true recurring-charge API built on saved-card tokens, BNM-registered non-bank merchant acquirer, PayNet FPX TPA, no fees or contracts, FPX at RM 1.00, and CHIP explicitly targets SaaS platforms (even its TOS contemplates a payment-facilitator/sub-merchant model). **But Chip requires an SSM-registered business plus a business bank account in the business's name before onboarding** — the founder cannot onboard as an individual. Billplz is the runner-up (auto-deduct + tokenization; SSM/ROS org required; RM 999/yr for the lower 0.75 FPX rate). BayarCash is the only one with a no-entity Personal tier and its FPX direct debit (RM 1.50/charge) is the cheapest true recurring rail, but it lacks Chip's developer-grade subscription tooling and settles T+2. ToyyibPay is out for subscriptions today (no recurring until direct debit ships).

**Entity implication for the founder (no company registered yet):** registering at least a sole proprietorship with SSM + a business bank account unlocks Chip and Billplz; only BayarCash's Personal tier works pre-registration. If the choice is Chip, the founder should plan to incorporate (sole prop is cheapest; Sdn Bhd only if liability/VC-readiness demands it) before the auto-billing feature ships — the entity decision also feeds compliance checklist 04.

**Open questions to confirm with vendors before spec:** Chip's exact approval timeline and whether the prepayment/deposit model (cl. 6A of Chip TOS) triggers the segregated-trust-account requirement; BayarCash direct-debit eligibility on non-T+ plans; Billplz auto-deduct payer-bank coverage and mandate mechanics.

---

*Method note: all content retrieved 2026-08-11 directly from the official sites listed above (chip-in.asia was unreachable at `chip-in-asia.com`/`chip.asia`; the live official domain is `chip-in.asia`). Pricing pages are live docs, not archived captures. SST: BayarCash quotes exclude 8% SST; Chip TOS references 6% SST (older boilerplate — verify at signing).*
