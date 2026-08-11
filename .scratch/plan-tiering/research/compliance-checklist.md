# Compliance checklist — what the founder legally needs to charge for MUASuites subscriptions

Research for decision ticket [04 — What does the founder legally need to charge for subscriptions?](../decisions/04-what-does-the-founder-legally-need-to-charge-for-subscriptions.md). Question: what must a solo Malaysian founder (no company registered yet) do to legally sell software subscriptions in Malaysia, in what order, at what cost, with what lead time.

Method: primary sources only — SSM (ssm.com.my), LHDN (hasil.gov.my), RMCD/MySST (mysst.customs.gov.my), PayNet (paynet.my), the gateways' own sites/docs. Every claim cites its source URL. Verified 11 Aug 2026 (most pages updated 2026). Where a fact is uncertain or recently changed, it is flagged.

**Bottom line:** the founder can legally start selling as a **sole proprietor with an SSM business registration, a business bank account, and a DuitNow QR** — no Sdn Bhd is required by any of the launch payment rails (DuitNow, FPX gateways) and none of the four gateways surveyed (Chip, BayarCash, ToyyibPay, Billplz) requires Sdn Bhd status. Service tax (SST) does not bite a consumer-facing SaaS at launch scale; income tax is an annual filing once a TIN exists (auto-issued to Malaysian citizens ≥ 18).

---

## 1. The ordered checklist (the deliverable)

| # | Step | Why | Cost | Lead time | Do it when |
|---|---|---|---|---|---|
| 1 | **Register the business with SSM (sole proprietorship)** via ezBiz/MyEntity — trade name (e.g. "MUASuites") or own name | Legal basis to trade under a business name; the SSM registration number is the KYC key for every bank and gateway below | **RM 60/yr** (trade name) or **RM 30/yr** (personal name); renewal RM 30–60/yr, renewable 1–5 years at once | Same-day to ~2 working days online (ezBiz) | **Before launch — blocking** |
| 2 | **Confirm/obtain LHDN Tax Identification Number (TIN)** — citizens ≥ 18 get TIN automatically from JPN data; verify on mytax.hasil.gov.my (e-Daftar only needed for non-citizens) | Every taxable business needs a TIN; gateways (e.g. Billplz) ask for it during onboarding; required to file Form B | Free | Instant (auto); e-Daftar processing days | Before opening bank account / gateway account |
| 3 | **Open a business bank account (sole prop current account)** — requires SSM cert + NRIC (+ initial deposit, varies by bank) | Required to (a) receive gateway settlements — Billplz/Chip/ToyyibPay/BayarCash all pay out only to a bank account **under the registered business name** — and (b) get a DuitNow Business QR | Initial deposit typically RM 250–1,000 depending on bank; most have low/zero monthly fees for small business accounts | Same-day to ~1 week (bank-dependent; some banks open sole-prop accounts digitally) | **Before launch — blocking** |
| 4 | **Issue a DuitNow QR** — either **DuitNow Business QR** via the new business account (proper route: QR shows business name), or the founder's **personal DuitNow QR** as a low-volume stopgap | Launch billing model is manual DuitNow + receipt upload; personal QR routes payments to a personal account | Free (DuitNow QR is free at banks; no per-transaction MDR) | Instant (personal); same-day (business QR via bank app) | **At launch** (personal QR acceptable; upgrade to business QR when volume is meaningful) |
| 5 | **File income tax — Form B (e-Filing)** each year once business income exists (sole prop profits are taxed on the individual) | LHDN compliance; late filing → penalties | Tax on profit at progressive individual rates (up to 30%); filing free | Deadline YA2025: **30 June 2026**, e-Filing grace to **15 July 2026** (annual) | First filing after first year of revenue; then annually |
| 6 | **Keep proper records 7 years** (BM or English, kept in Malaysia) | Income tax record-keeping; also the service tax record rule if ever registered | Free | Ongoing | Ongoing |
| 7 | **Invoice every subscription** (plain commercial invoice is fine pre-SST; SST-formatted invoice only if SST-registered) | Good practice + required once SST-registered; **e-Invoice (MyInvois) is NOT required while annual turnover < RM 1,000,000** (exemption updated 7 Dec 2025) | Free (invoice text/template) | n/a | From launch; revisit e-Invoice at RM 1M turnover |
| 8 | **Monitor the service tax (SST) triggers** — SaaS sales to consumers are IT services under Group G, item (h) of the Service Tax Regulations 2018; registration is required once taxable supplies cross **RM 500,000 in 12 months**, and supplies to SST-registered businesses (B2B) attract 8% service tax (B2B exemption rules apply between registered persons) | Avoid unregistered-trading penalties; only bite at scale or if a corporate (SST-registered) subscriber appears | 0 at launch; 8% on taxable supplies once registered | Register via MySST (SST-01) when threshold reached; then file SST-02 bi-monthly | **Not at launch** — revisit at ~RM 500k/yr taxable supplies |
| 9 | **Later (auto-billing): apply to a payment gateway** — Chip, BayarCash, ToyyibPay, or Billplz; all accept sole props with an SSM number + business bank account; **no Sdn Bhd required** | Future automated PRO billing; all four offer FPX; Chip is the strongest for card-based recurring (tokens; renewal logic is merchant-side) | Setup-free at Chip/ToyyibPay/Billplz Basic; BayarCash T+ plan free (FPX RM 1.00/tx); per-transaction FPX RM 1.00–1.20 B2C | e-KYC + bank verification typically 24h–few days (Billplz states up to 24 business hours for bank verification) | Only when auto-billing is built — nothing to do at launch |
| 10 | **Optional now: incorporate Sdn Bhd instead** (RM 1,000 SSM fee + name reservation RM 50/30 days + mandatory company secretary, commonly RM 500–1,500/yr; annual return RM 150 + FS lodgement RM 20–50; audit-exempt as a small private company under PD 10/2024) | Only justified for liability shielding / investor-readiness / future card MDR merchant contracts; **none of the launch rails or surveyed gateways require it** | ~RM 1,000–1,500 setup + ~RM 1,000–2,000/yr running | 1–3 working days via service company; 1 day via MyCoID/SSM eBiz with secretary | Defer until revenue or risk warrants; sole prop can convert later |

**Total to start selling: ~RM 60/yr (SSM) + initial deposit for a business account (RM 250–1,000, refundable while account stays open). Time: 1–2 weeks including bank visit.**

---

## 2. Detail per topic

### 2.1 Entity — SSM sole proprietorship vs Sdn Bhd

**Sole proprietorship (Registration of Businesses Act 1956):**
- "Business wholly owned by a single individual using personal name as per his/her identity card or trade name." — https://www.ssm.com.my/Pages/Register_Business_Company_LLP/Business/Starting_Sole_Partnership.aspx
- Fees (SSM Table of Fees — Registration of Business): new registration **RM 60/yr (trade name), RM 30/yr (personal name)**, RM 5/yr per branch; business updates RM 20. — https://www.ssm.com.my/Pages/Services/Registration-of-Business-(ROB)/table-of-fees/Table-of-Fees.aspx
- Renewal: apply any time before expiry and up to 12 months after; can renew for 1–5 years at once. — https://www.ssm.com.my/Pages/Register_Business_Company_LLP/Business/Business_Renewal.aspx
- Registration online via ezBiz (ssm4u / MyEntity) — guidelines linked from https://www.ssm.com.my/Pages/Services/Registration-of-Business-(ROB)/EzBiz-Online.aspx

**Sdn Bhd (Companies Act 2016):**
- SSM incorporation fee for a company limited by shares: **RM 1,000**; name reservation **RM 50 per 30 days**; annual return lodgement (private company) **RM 150**; financial statements lodgement (private): audited **RM 50** / non-audited **RM 20**. — https://www.ssm.com.my/Pages/Services/Registration-of-Company-(ROC)/Table-of-Fees.aspx
- Company secretary is mandatory; incorporation is done via MyCoID or a service company (which also provides the registered address). — https://www.ssm.com.my/Pages/Services/Registration-of-Company-(ROC)/CLBG/CLBG.aspx
- **Audit exemption (new criteria, Practice Directive 10/2024, 16 Dec 2024):** a private company is exempt from audit if it meets any **two** of: annual revenue ≤ threshold, total assets ≤ threshold, employees ≤ 30 — with thresholds phased **2025: RM 1M → 2026: RM 2M → 2027: RM 3M**. A solo-founder SaaS company will qualify trivially. — https://www.ssm.com.my/Pages/Legal_Framework/Audit-Exemption.aspx (PD 10/2024 PDF, para 5 and 9)
- Note: Companies (Amendment) Act 2024 is in force — SSM landing page; no material change to the above for a private company.

**Which is needed to collect DuitNow business payments / apply to a gateway: neither requires Sdn Bhd.** PayNet's DuitNow QR is offered as a separate **Business** product (banks issue it against business accounts, which a sole prop can hold with an SSM cert) and a **Personal** product. — https://www.paynet.my/business-solutions/duitnow-qr.html and https://www.paynet.my/personal-solutions/duitnow-qr.html. All four gateways accept sole props (see §2.4). Sdn Bhd's only hard advantages: limited liability and corporate credibility for larger merchant contracts — not launch blockers.

### 2.2 Banking

- **Sole prop business account:** banks open current accounts for sole proprietorships against the SSM registration certificate + NRIC. Public Bank's business banking is now on the dedicated enterprise portal (https://www.pbenterprise.com/); Maybank's business banking is on the Maybank2u business site (https://www.maybank2u.com.my/maybank2u/malaysia/en/business/index.page). Exact doc lists and initial deposits vary by bank — the SSM cert is the constant. Confirm per-bank minimum deposit (typically RM 250–1,000) at the branch of choice.
- **Sdn Bhd account:** additionally requires the company incorporation docs, secretary's letter, directors' NRIC, board resolution to open the account — heavier, slower.
- **Does a personal DuitNow QR suffice for low-volume launch payments?** Yes as a practical stopgap: a personal DuitNow QR pays into the founder's personal bank account, and DuitNow QR is free with no MDR. Caveats: (a) it displays the individual's name, not the business; (b) PayNet segments DuitNow QR into Personal vs Business products — a personal QR used for business income muddies the audit trail; (c) business QR (displays business name) requires the business account. Recommendation in the checklist: personal QR to launch, business QR as soon as the business account is open.

### 2.3 Tax — LHDN income tax + SST service tax

**Income tax (LHDN):**
- **TIN registration:** since 1 Jan 2024, Malaysian citizens and permanent residents aged 18+ are **auto-registered** for a TIN via JPN data; check on MyTax (https://mytax.hasil.gov.my). Manual/e-Daftar registration only applies to non-citizens/temporary residents, and those carrying on business must attach the **SSM sole-prop registration certificate**. — https://www.hasil.gov.my/en/individu/pendaftaran/
- **Filing:** a sole proprietor's business income is declared on **Form B**; the 2026 filing programme fixes YA2025 Form B at **30 June 2026**, with e-Filing grace to **15 July 2026**. — https://www.hasil.gov.my/en/borang/program-memfail-borang-nyata/ (PDF: program-memfail-bn-bagi-tahun-2026.pdf)
- **Records:** keep income records 7 years (standard LHDN retention; also the SST record rule).
- **e-Invoice:** phased for turnover bands — > RM 100M: 1 Aug 2024; > RM 25M–100M: 1 Jan 2025; > RM 5M–25M: 1 Jul 2025; **≤ RM 5M: 1 Jan 2026; < RM 1,000,000: EXEMPTED** (timeline updated 7 Dec 2025). So a launch-stage MUASuites (< RM 1M turnover) does **not** need MyInvois e-invoicing yet; ordinary invoices suffice. — https://www.hasil.gov.my/en/e-invois/pelaksanaan-e-invois-di-malaysia/garis-masa-pelaksanaan-e-invois/

**Service tax (SST, RMCD/MySST) — is software subscription sales taxable?**
- Rate: **8%** on all taxable services since **1 March 2024** (6% retained only for F&B, logistics, telecommunications, parking; RM 25 for credit cards). — https://mysst.customs.gov.my/faq-services-tax/
- **Yes, SaaS is a taxable service in scope** — IT services sit at **Group G, item 8/(h), First Schedule, Service Tax Regulations 2018** ("provision of all types of information technology services"), effective 1 Sep 2018; the current industry guide explicitly lists **cloud services and data subscription** as IT services, and the registration threshold for Group G is **RM 500,000 in 12 months** (combined taxable services). — https://mysst.customs.gov.my/wp-content/uploads/2025/03/Service-Tax-Regulations-2018.pdf (First Schedule Group G) and *Panduan Perkhidmatan Teknologi Maklumat – V7 (26 Feb 2026)*, paras 7–8, 10 (https://pub-359af8e1f79c472292a7e44ec60f3027.r2.dev/Industry%20Guides/MS/Panduan%20Perkhidmatan%20Teknologi%20Maklumat%20-%20V7%2026.02.2026.pdf)
- **But the practical exposure at launch is nil:**
  - **B2B exemption (since 1 Jan 2019):** IT services supplied between registered persons are exempt under Item 1, Service Tax (Persons Exempted from Payment of Tax) Order 2018 when the recipient is a registered person — so supplies to SST-registered corporates are exempt (with conditions) — ibid., para 19.
  - Supplies to non-registered end users (MUAs — micro-businesses, not SST-registered) are the launch market; the V7 guide does **not** expressly tax B2C IT supplies, and RMCD's long-standing treatment has been that IT services are effectively taxed only in the registered-business channel. **Flag:** this B2C point is not spelled out in the current guide — if MUASuites ever sells to an SST-registered business, confirm treatment with RMCD before relying on the exemption.
  - Registration is liability-based: only once **taxable** supplies exceed RM 500k/12 months; voluntary registration is possible (s.14 ACP 2018). — IT guide FAQ S1 (same PDF).
- **The 1 July 2025 service tax expansion did NOT touch IT services.** The 2025 expansion added private healthcare, construction works, private education, rental/leasing, and financial services (Groups H→Finance, K, L, M) — IT services stayed in Group G. — https://mysst.customs.gov.my/faq-expansion-of-service-tax-scope-2025/ and Service Tax (Amendment) Regulations 2025 (P.U.(A) 201/2025, https://mysst.customs.gov.my/wp-content/uploads/2025/07/5-PUA-201.2025.pdf)
- **If/when SST-registered:** file **SST-02 every two months** (due last day of the following month, even if nil), pay by FPX/cheque, issue invoices in **Bahasa Melayu or English with prescribed particulars**, keep records **7 years**; late payment penalties 10%/15%/15% (max 40% after 90 days). — https://mysst.customs.gov.my/faq-services-tax/
- **Invoicing:** pre-registration, a plain commercial invoice is legally sufficient; SST-formatted invoice (with service tax number and tax line) is mandatory only once registered. The founder's existing deposit-flow receipts are fine at launch.

### 2.4 Gateway prerequisites (KYC/company material) — register the right entity the first time

All four surveyed gateways onboard **sole proprietorships** — the SSM registration certificate/number is the universal gate; none demands Sdn Bhd:

- **Billplz** (most explicit, documented end-to-end): signup requires a valid **MyKad/passport with e-KYC** (CTOS, MyKad photo + selfie), the organization's **SSM/ROC/ROS registration number**, and a **bank account registered under the organization's name** (verification within 24 business hours); the compliance step then asks for business address/description/website, the **12-digit SSM number**, the **LHDN TIN**, and whether the business is **SST-registered**. — https://support.billplz.com/guide/sign-up-for-a-billplz-account
- **Chip** (CHIP IN Sdn Bhd; BNM-registered non-bank merchant acquirer + PayNet FPX third-party acquirer): onboarding = business name, **SSM registration number**, business address, **settlement bank account**, then identity verification before activation. — https://www.chip-in.asia/ (compliance section) and official guide https://blog.chip-in.asia/panduan-mudah-daftar-payment-gateway-malaysia-2025/
- **ToyyibPay:** "verified merchant onboarding" under its risk-management framework (FPX, cards, DuitNow QR; pricing below). — https://www.toyyibpay.com/risk-management/ and https://www.toyyibpay.com/pricing-plans/
- **BayarCash:** merchant signup with bank settlement (realtime settlement only via Public Bank/Bank Islam accounts). — https://www.bayarcash.com/

**Pricing snapshot (all MYR, fees stated excluding 8% SST where noted):**

| | Chip | ToyyibPay | Billplz | BayarCash |
|---|---|---|---|---|
| Setup/monthly | None | None (cards: RM 100 onboarding + RM 100/yr) | Free Basic; Standard RM 999/yr | Free T+ plan; Starter RM 189/yr; Lite RM 2,899/yr; Enterprise RM 12,000/yr |
| FPX per tx (B2C) | RM 1.00 (B2B RM 2.00) | RM 1.00 (B2B RM 2.00) | from RM 0.75 (Basic plan, per homepage) | RM 1.00 (T+); RM 1.20 (Starter) |
| Cards | 2.0% local credit / 1.0% local debit / 3.0% foreign | 1.5% local / 3.5% foreign (via partners) | per plan (contact) | RM 1.00 + 1% (T+) |
| DuitNow QR | 1.0% (min RM 0.15) | 1.0% or RM 1.00 | via DuitNow | RM 0.50 (Starter/Lite) or 1.6% min RM 0.15 (T+) |
| Settlement | next day (FPX) | 1–4 business days | next business day (FPX) | realtime (PBB/Bank Islam) or T+1/T+2 |
| Recurring billing | **Yes — card tokens; renewal logic merchant-side** (no auto-renew) | no (collections) | no | Direct Debit (e-mandate) |
| Sources | https://www.chip-in.asia/pricing | https://www.toyyibpay.com/pricing-plans/ | https://www.billplz.com/ (pricing) | https://www.bayarcash.com/ |

**Key takeaways:** (a) FPX-only collection is cheap everywhere and works for any SSM-registered business; (b) **only Chip offers card-token subscription billing** (SaaS use case documented; automatic renewal must be implemented merchant-side via cron — https://docs.chip-in.asia/chip-collect/overview/online-purchases/subscription); (c) a **business bank account under the registered name is mandatory for settlement at every gateway** — the personal DuitNow QR launch path is fine, but it cannot receive gateway payouts.

### 2.5 Sequence with costs and lead times (summary table)

See §1. Ordering logic: SSM registration (1 day, RM 60) → TIN check (instant, free) → business bank account (1 day–1 week, deposit RM 250–1,000) → DuitNow QR (instant, free) → sell. Gateway application (24h–few days, free–RM 189/yr) only when auto-billing lands. Sdn Bhd conversion (RM 1,000 + secretary, 1–3 days) only when liability/investment demands it.

---

## 3. What can wait vs what's needed to start selling

**Needed to start selling (blocking):**
1. SSM sole-prop registration — RM 30–60/yr, ~1 day. Without it no business bank account, no gateway, no DuitNow Business QR, and (for non-citizens) no TIN.
2. LHDN TIN (auto for citizens) — free, instant to verify.
3. Business bank account — deposit RM 250–1,000, days. Needed for business DuitNow QR and all future gateway settlements.
4. DuitNow QR (personal acceptable at launch) — free, instant.

**Can wait (non-blocking at launch):**
- Service tax registration (only at RM 500k taxable supplies, or when selling to SST-registered corporates).
- e-Invoice/MyInvois (exempt while turnover < RM 1,000,000; updated 7 Dec 2025).
- Payment gateway (launch model is manual DuitNow + receipt upload; gateways accept the same sole-prop material later).
- Sdn Bhd incorporation (not required by any launch rail or surveyed gateway; defer until liability/investment need).
- Accounting software — simple books + 7-year records suffice.

---

## 4. Source index

**SSM:** Starting a sole proprietorship/partnership — https://www.ssm.com.my/Pages/Register_Business_Company_LLP/Business/Starting_Sole_Partnership.aspx · ROB Table of Fees — https://www.ssm.com.my/Pages/Services/Registration-of-Business-(ROB)/table-of-fees/Table-of-Fees.aspx · Business renewal — https://www.ssm.com.my/Pages/Register_Business_Company_LLP/Business/Business_Renewal.aspx · ezBiz — https://www.ssm.com.my/Pages/Services/Registration-of-Business-(ROB)/EzBiz-Online.aspx · ROC Table of Fees — https://www.ssm.com.my/Pages/Services/Registration-of-Company-(ROC)/Table-of-Fees.aspx · Audit exemption (PD 10/2024) — https://www.ssm.com.my/Pages/Legal_Framework/Audit-Exemption.aspx

**LHDN:** Individual registration/TIN — https://www.hasil.gov.my/en/individu/pendaftaran/ · Filing programme 2026 (Form B: 30 Jun 2026, e-Filing to 15 Jul 2026) — https://www.hasil.gov.my/en/borang/program-memfail-borang-nyata/ · e-Invoice timeline (exempt < RM 1M; updated 7 Dec 2025) — https://www.hasil.gov.my/en/e-invois/pelaksanaan-e-invois-di-malaysia/garis-masa-pelaksanaan-e-invois/ · About e-Invoice — https://www.hasil.gov.my/en/e-invois/pelaksanaan-e-invois-di-malaysia/mengenai-e-invois-manfaatnya/

**MySST/RMCD:** FAQ Service Tax (8% rate, threshold method, SST-02, invoices, penalties) — https://mysst.customs.gov.my/faq-services-tax/ · Service Tax Regulations 2018 (First Schedule Group G) — https://mysst.customs.gov.my/wp-content/uploads/2025/03/Service-Tax-Regulations-2018.pdf · Guide on IT Services V7 26.02.2026 — https://pub-359af8e1f79c472292a7e44ec60f3027.r2.dev/Industry%20Guides/MS/Panduan%20Perkhidmatan%20Teknologi%20Maklumat%20-%20V7%2026.02.2026.pdf · FAQ Expansion of Service Tax Scope 2025 — https://mysst.customs.gov.my/faq-expansion-of-service-tax-scope-2025/ · Service Tax (Amendment) Regulations 2025 — https://mysst.customs.gov.my/wp-content/uploads/2025/07/5-PUA-201.2025.pdf · MySST registration — https://sst01.customs.gov.my/account/register-license/2

**PayNet:** DuitNow QR (Personal vs Business products) — https://www.paynet.my/business-solutions/duitnow-qr.html · https://www.paynet.my/personal-solutions/duitnow-qr.html

**Banks:** Public Bank enterprise portal — https://www.pbenterprise.com/ · Maybank business — https://www.maybank2u.com.my/maybank2u/malaysia/en/business/index.page

**Gateways:** Billplz signup guide (KYC/KYB, bank verification ≤ 24 business hours, TIN/SST fields) — https://support.billplz.com/guide/sign-up-for-a-billplz-account · Billplz pricing — https://www.billplz.com/ · Chip homepage/compliance — https://www.chip-in.asia/ · Chip pricing — https://www.chip-in.asia/pricing · Chip subscriptions docs — https://docs.chip-in.asia/chip-collect/overview/online-purchases/subscription · Chip onboarding guide — https://blog.chip-in.asia/panduan-mudah-daftar-payment-gateway-malaysia-2025/ · ToyyibPay pricing — https://www.toyyibpay.com/pricing-plans/ · ToyyibPay compliance — https://www.toyyibpay.com/risk-management/ · BayarCash pricing — https://www.bayarcash.com/

## 5. Open questions / flags

- **B2C IT services:** the current (Feb 2026) IT services guide does not expressly state the treatment of IT services supplied to non-registered consumers; the B2B exemption is explicit. Historical RMCD guidance treated B2C IT supplies as outside the tax. If MUASuites ever sells to an SST-registered corporate, confirm with RMCD (SST helpdesk 1-300-888-500) whether the B2B exemption or 8% applies.
- **Bank deposit/requirements** are per-bank and change; the RM 250–1,000 initial-deposit range is a planning figure — verify at the chosen bank.
- **Form B deadline** quoted for YA2025 (30 Jun 2026 / e-Filing 15 Jul 2026); re-check the annual programme each year.
- Chip's DuitNow QR and card MDRs changed in 2025–2026 (per their pricing page); re-verify at application time.
