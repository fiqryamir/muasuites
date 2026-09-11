# Malaysian commercialization launch obligations

Research for commercialization-launch decision 01. Captured 2026-09-07. This is a planning brief based on Malaysian government, regulator, and provider sources. It is not legal or accounting advice, and it does not replace review by a Malaysian lawyer, accountant, the Personal Data Protection Commissioner, RMCD, LHDN, or the relevant bank/provider.

## Scope and operating assumptions

This research uses the current MUASuites plan:

- MUASuites sells booking-management SaaS to Malaysian freelance makeup artists (MUAs).
- Clients are not MUASuites account holders. They use public booking links and WhatsApp to book an MUA service.
- The client pays the MUA directly. MUASuites displays the MUA's DuitNow QR, accepts a receipt upload, and exposes the MUA's approval workflow.
- MUASuites does not collect, hold, split, settle, refund, or commission client service payments.
- MUASuites separately charges MUAs for PRO access by manual DuitNow payment and receipt verification. Auto-billing, payment gateways, and marketplace commissions are out of scope.

## Executive finding

The commercialization plan can continue to use an SSM sole proprietorship as the working entity route, subject to professional review. That route is already supported by the existing paid-plan compliance research and is not displaced by this ticket. [S1] [S2]

The new launch blockers are operational rather than a new product registration:

1. MUASuites is processing personal data in commercial transactions. A privacy notice, data-role allocation, vendor/data-processing terms, retention and deletion rules, subject-request handling, and security/breach process must exist before the beta handles real client data. [S3] [S4] [S5]
2. The MUA must remain the clearly identified service provider and payment recipient for client bookings. MUASuites must not describe or operate the flow as collecting client money or guaranteeing the MUA service. This is a risk-control conclusion from the planned money flow, not a ruling on licensing. [S6] [S7]
3. The public booking flow needs clear identity, price, payment, cancellation/refund, and responsibility disclosures. Whether the Consumer Protection (Electronic Trade Transactions) Regulations 2012 apply to each MUASuites/MUA flow still needs legal classification. [S8] [S9] [S10]
4. Receipt screenshots and notification messages are a material privacy/security issue in the current implementation. Receipt files are uploaded and exposed through public URLs, and booking/payment details plus those URLs can be sent to Telegram. This requires a product/security review before real-client beta use. [I1] [I2] [I3]

## Product data inventory

The current code shows that the system handles at least:

- MUA account identity and configuration, including email-backed authentication, studio name, WhatsApp number, DuitNow QR image, and Telegram chat configuration. [I4] [I5]
- Client name, phone number, event date/time, venue address, and venue coordinates during booking. [I1]
- Package, price, deposit, balance, and booking status. [I1] [I2]
- Deposit and balance receipt screenshots. The upload code accepts JPEG, PNG, and WebP, stores the file in `receipt-uploads`, and obtains a public URL. [I1] [I2]
- Client and payment details in Telegram notification messages, including the receipt URL for deposit review. [I1] [I3]
- Venue search/retrieval data sent to Mapbox, including the selected Mapbox identifier, session token, address, and coordinates used to resolve a venue. [I1] [I6]

This inventory is an implementation snapshot, not a final records-of-processing register. Confirm it against the live schema and deployed vendor configuration before relying on it.

## 1. Entity and registration

### Facts

- SSM describes a sole proprietorship as a business wholly owned by one individual using the individual's personal name or a trade name. SSM publishes separate fees for personal-name and trade-name registrations. [S1] [S2]
- The existing paid-plan research recommends an SSM sole proprietorship as the initial route and found no requirement for a Sdn Bhd in the planned manual DuitNow model or in the surveyed future gateway onboarding. [S11]
- The Attorney General's Chambers maintains the federal legislation repository. KPDN states that the Electronic Commerce Act 2006 gives legal recognition to online transactions. [S12] [S8]

### Planning conclusion

Use the sole-proprietorship route as the planning baseline, but have counsel confirm:

- the exact SSM business activity/name to register;
- personal liability and insurance exposure for operating the SaaS;
- whether the Founder beta is operated under the same business or before paid launch; and
- when risk, revenue, hiring, investment, or client-contract exposure justifies a Sdn Bhd.

This decision does not mean that SSM registration alone satisfies privacy, tax, consumer, payment-provider, or contractual requirements.

## 2. Income tax, SST, and invoicing

### Facts carried forward from current primary-source research

- LHDN states that Malaysian citizens and permanent residents aged 18 and above are auto-registered for a tax identification number through JPN data; the TIN should be checked through MyTax. [S13]
- A sole proprietor reports business income on the individual business return, Form B. LHDN publishes the annual filing programme and deadlines. [S14]
- LHDN's current e-Invoice timeline states that businesses with annual turnover below RM1,000,000 are exempt from e-Invoice implementation. Re-check the timeline when the business approaches the threshold or the rules change. [S15]
- The existing research identified IT services under Group G of the Service Tax Regulations 2018, an RM500,000 rolling threshold for Group G, and an explicit B2B exemption framework. It also records that the current IT-services guide does not expressly settle every B2C treatment. [S16]

### Planning controls

- Issue ordinary commercial invoices for MUASuites PRO payments from launch, showing the registered seller, invoice date/number, customer, service period, amount in MYR, and tax treatment. Do not present an invoice as SST-inclusive unless the business is registered and the treatment has been confirmed.
- Keep a revenue and expense ledger, bank evidence, invoices, renewal receipts, and relevant business records. The existing primary-source research records a seven-year recordkeeping expectation. [S11]
- Monitor both gross turnover and the nature of customers. Do not use the RM500,000 SST threshold as a blanket conclusion that all SaaS supplies are exempt, particularly if the customer mix changes to SST-registered businesses or if MUASuites later sells other services.

### Accountant questions

1. Is MUASuites' exact SaaS supply taxable under the current Group G treatment for its MUA customer mix?
2. If an MUA is not SST-registered, what is the treatment of the supply at launch?
3. If an MUA is SST-registered, does the B2B exemption apply and what evidence must be retained?
4. When does the business need to register, issue SST invoices, file SST returns, or implement e-Invoice based on the actual turnover and effective dates?

## 3. PDPA and personal-data handling

### Scope

- The JPDP says Act 709 applies to a person who processes personal data, or controls or authorizes processing, in connection with commercial transactions. It also states that processing includes handling such as collecting, recording, holding, storing, using, disclosing, and destroying data. [S3] [S4]
- JPDP's public guidance describes personal data broadly as information from which a living individual can be identified, including names, addresses, identification numbers, health information, email addresses, and pictures. [S4]
- MUASuites therefore cannot treat the absence of registered client accounts as an absence of PDPA obligations. Public booking links, forms, phone numbers, addresses, location data, and receipt images are still data-handling activities. [S3] [S4]

### Roles that need to be documented

The likely operating model is:

| Party | Likely role to validate | Data context |
|---|---|---|
| MUA | Controller for the client relationship and makeup-service booking | Chooses the client-service purpose, receives payment, verifies the receipt, and decides whether to approve the booking |
| MUASuites | Controller for its own MUA account, SaaS billing, support, security, and marketing | Determines why it needs MUA account, payment, support, and operational data |
| MUASuites | Potential processor, and possibly an independent controller for some operational/security uses, for client booking data | Stores and presents client booking data for the MUA, while also operating the platform and security controls |
| Supabase, Mapbox, Telegram, storage, and other vendors | Processor or separate controller depending on the service and contract | Hosting, database/storage, venue search, and notifications |

JPDP's FAQ describes the controller/processor distinction and says the controller must ensure the processor takes security measures. The same current FAQ separately says DPO duties can apply to both controllers and processors. Do not rely on an informal label; have counsel document the purposes, instructions, disclosures, and responsibilities for each data flow. [S4]

### Required privacy controls

JPDP publishes seven principles: general, notice and choice, disclosure, security, storage, data integrity, and access. [S5]

Before real-client beta use, the plan should have:

- A MUASuites privacy notice covering MUA account data, SaaS billing, support, security, marketing, cookies/logs if used, vendors, retention, and contact channels.
- A client-facing notice shown at or before the booking/receipt collection point. It should identify the MUA and MUASuites roles, explain why name, phone, venue, booking, and receipt data are collected, identify relevant disclosures, and explain how requests can be made.
- An MUA SaaS agreement and data-processing schedule covering permitted client-data use, instructions, confidentiality, security, sub-processors, deletion/return, incident cooperation, and responsibility for the MUA service.
- A documented retention schedule. Expired booking links, rejected/stale bookings, receipt files, old MUA records, and logs should not be kept indefinitely without a stated purpose.
- A process for access, correction, withdrawal where applicable, direct-marketing opt-out, complaints, and deletion/retention exceptions. JPDP lists these as data-subject rights and handling expectations. [S10]
- Access controls and an incident process for receipt files, public booking links, Telegram notifications, database access, and vendor credentials.

### Current implementation risk

The receipt actions call `getPublicUrl` after uploading screenshots to `receipt-uploads`, then pass the URL to the MUA's Telegram notification path. [I1] [I2] [I3] A receipt can contain payer identity, account details, transaction references, and amount. Treat it as potentially financial information until counsel confirms its classification.

Before launch, security/product review should decide whether receipt files must be private, authenticated, time-limited, access-logged, deleted after a defined period, and excluded from broad notification payloads. This is a launch gate recommendation based on the current data exposure, not a claim that the current implementation has been legally adjudicated.

Mapbox and Telegram are also disclosures to external service providers. The privacy notice, contracts, vendor review, and cross-border analysis must reflect the actual deployed services and their processing locations. JPDP publishes cross-border-transfer guidance, but this research did not extract a final fact pattern for every vendor. [S3] [S18]

### DPO and data-controller registration

- JPDP's current FAQ says a controller or processor must appoint and register a DPO where processing involves more than 20,000 data subjects, sensitive personal data including financial information for more than 10,000 data subjects, or regular and systematic monitoring such as online user-behaviour tracking. It says the appointment notification is due within 21 days where the criteria are met. [S4]
- The same FAQ says organisations outside the 13 registered classes are still bound by Act 709. [S4]
- JPDP says registration is mandatory for the 13 listed data-controller classes and publishes a registration process and penalties for failure to register. The current class descriptions need to be checked against the final entity and activity, rather than assuming that every SaaS operator is or is not included. [S19]

For the planned beta, maintain a written DPO-threshold assessment and an assessment of whether any analytics or behaviour tracking is regular and systematic. Have counsel confirm whether MUASuites falls within a registrable class and whether the MUA's own role creates separate registration duties.

### Breach response

JPDP publishes a Data Breach Notification portal, a breach-notification circular, and a breach-notification guideline. [S20] The current public page exposes the reporting manual but not the full operative detail in text. The launch plan should therefore include an internal incident runbook, vendor escalation path, evidence preservation, affected-MUA/client assessment, and the current Commissioner/subject notification decision tree confirmed by counsel.

## 4. Website, SaaS terms, and consumer/e-commerce exposure

### Facts

- KPDN says the Electronic Commerce Act 2006 gives legal recognition to online transactions. [S8]
- KPDN describes consumer rights as including information, choice, compensation, and safe goods/services. [S9]
- KPDN's Tribunal for Consumer Claims page says a consumer is an individual acquiring goods or services primarily for personal, domestic, or household purposes; an individual acquiring mainly for business purposes or in a company's name is not a consumer for that definition. [S10]
- KPDN says the Tribunal can hear permitted goods/services claims up to RM50,000 that accrue within three years, subject to its exclusions. [S10]
- KPDN's official functions include consumer protection and regulation of businesses under related legislation, and its online-business FAQ directs consumers to verify a merchant's address and phone number. [S21] [S8]

### Planning conclusion

The MUA is the service owner for makeup bookings. MUASuites should not rely on a disclaimer alone; the page structure, payment instructions, receipts, confirmation messages, and support responses must consistently identify who sells the makeup service and who receives the money.

The public booking and payment flow should make these points clear:

- MUA identity and contact details;
- service package, price, travel fee, deposit, balance, and any surcharge;
- that payment is made directly to the MUA's displayed account/QR;
- that MUASuites does not receive or hold the client service payment;
- who approves, cancels, reschedules, refunds, or disputes the makeup booking;
- receipt-upload purpose and handling;
- the MUA's service terms and MUASuites' limited platform role; and
- how a client can contact the MUA and MUASuites about a data or platform issue.

The MUA SaaS agreement should separately cover PRO fees, manual renewal, suspension, Founder status, revocation, support, acceptable use, IP, confidentiality, data roles, liability, termination, and governing law. The Founder beta also needs participation, revocation, support, data-use, and public-identity/output consent terms.

### Unresolved legal classification

The sources reviewed here do not establish that the Consumer Protection (Electronic Trade Transactions) Regulations 2012 apply in full to this split MUA/MUASuites model. Obtain the regulations from the current AGC repository and have counsel classify:

- MUASuites' MUA-facing B2B SaaS sale;
- the MUA's client-facing makeup-service sale;
- the public booking page as a platform, agent, or service-provider interface; and
- whether any mandatory online-business disclosure, order, cancellation, refund, or record requirements attach to MUASuites itself.

Until classified, implement the transparency controls above rather than assuming that B2B positioning removes all client-facing obligations.

## 5. Payment and DuitNow boundary

### Facts

- PayNet describes DuitNow QR as Malaysia's national QR standard and says a business sets it up through a preferred bank or acquirer. Provider fees, notifications, settlement, and terms vary by provider. [S6]
- PayNet separately describes business DuitNow Transfer identities and BRN-linked business accounts. [S7]
- Existing banking research recommends an SSM-linked dedicated business account and provider-issued business QR for paid public launch. It limits personal QR to a time-boxed private-beta test only where the provider permits it. [S23]

### Operating control

The product and contracts should preserve this exact boundary:

- The QR belongs to the MUA, not MUASuites.
- Client funds settle directly to the MUA's provider-approved account.
- MUASuites does not route funds through its own account, pool client money, split payments, calculate a commission, issue a payment-provider receipt, or decide a refund on the MUA's behalf.
- The MUA is responsible for payment verification, service delivery, cancellation/refund terms, and client payment disputes.
- MUASuites charges only its own SaaS fee through its separate business account and records that revenue separately.

This operating model reduces the payment-regulatory risk created by custody and settlement, but the sources reviewed do not amount to a legal opinion that no licence or provider approval can ever be required. A Malaysian lawyer and the selected bank/acquirer must confirm the exact description of MUASuites' role and the MUA client-payment use case.

## Launch gates

These are planning gates, not executed registrations:

| Gate | Minimum evidence before live use |
|---|---|
| Entity and tax | SSM route chosen and reviewed; TIN checked; invoice/tax record process defined |
| Privacy | MUASuites privacy notice, client-facing notice, MUA data terms, retention schedule, subject-request contact, and incident owner |
| Receipt security | Private/access-controlled storage decision, URL/access expiry, deletion policy, notification minimization, and abuse test |
| Vendor disclosures | Current Supabase, storage, Mapbox, Telegram, email, analytics, and hosting inventory with contract/privacy review |
| Client relationship | Booking page and messages identify the MUA as service provider and direct payment recipient; refund/cancellation ownership is explicit |
| Payment | MUA QR/provider approval confirmed; no personal QR in public client-payment flows; MUASuites SaaS receipts reconciled separately |
| Contracts | MUA SaaS terms, data-processing schedule, client-facing booking/payment terms, and Founder beta terms reviewed |
| Tax | Accountant confirms SST/e-Invoice position and the trigger-monitoring owner |

## Questions for professional review

1. Is the sole-proprietorship route appropriate for liability, insurance, contracting, and the planned Founder beta?
2. What exact SSM business description and registered/trading name should be used?
3. Is MUASuites a controller, processor, or both for each category of MUA and client data?
4. Is MUA client data being disclosed to Telegram, Mapbox, Supabase, or other vendors on a sufficient legal and contractual basis?
5. What cross-border transfer steps apply to the deployed vendor locations and services?
6. Does MUASuites fall within one of the 13 data-controller registration classes?
7. Does any planned analytics, link tracking, or operational monitoring trigger the DPO threshold?
8. Are receipt screenshots or transaction details sensitive/financial personal data for threshold, notice, security, and retention purposes?
9. What current breach-notification deadlines and Commissioner/subject notification steps apply to a receipt or booking-data incident?
10. Does the Consumer Protection (Electronic Trade Transactions) Regulations 2012 apply to the MUA-facing SaaS sale, the MUA-facing client sale, or the platform interface?
11. Does the current SaaS customer mix create an SST liability before RM500,000, and how should B2C/B2B treatment be evidenced?
12. Does the displayed MUA QR and receipt workflow require any provider approval, merchant registration, or wording beyond the direct-payment boundary?

## Source index

### Malaysian government and regulator sources

- [S1] SSM, Starting a Sole Proprietorship/Partnership: https://www.ssm.com.my/Pages/Register_Business_Company_LLP/Business/Starting_Sole_Partnership.aspx
- [S2] SSM, Table of Fees: https://www.ssm.com.my/Pages/Services/Registration-of-Business-(ROB)/table-of-fees/Table-of-Fees.aspx
- [S3] JPDP, Application and Non-Application of Act 709: https://www.pdp.gov.my/ppdpv1/en/akta/application-and-non-application-of-the-act/
- [S4] JPDP, FAQ: https://www.pdp.gov.my/ppdpv1/en/faq/
- [S5] JPDP, Principles of Personal Data Protection: https://www.pdp.gov.my/ppdpv1/en/principles-of-personal-data-protection/
- [S6] PayNet, DuitNow QR for Business: https://www.paynet.my/business-solutions/duitnow-qr.html
- [S7] PayNet, DuitNow Transfer for Business: https://www.paynet.my/business-solutions/duitnow-transfer.html
- [S8] KPDN, Domestic Trade FAQ: https://www.kpdn.gov.my/en/frequently-asked-questions/domestic-trade
- [S9] KPDN, Consumerism FAQ: https://www.kpdn.gov.my/en/frequently-asked-questions/consumerism
- [S10] KPDN, Tribunal for Consumer Claims FAQ: https://www.kpdn.gov.my/en/frequently-asked-questions/tribunal-for-consumer-claims
- [S12] Attorney General's Chambers, Malaysia Federal Legislation: https://lom.agc.gov.my/
- [S13] LHDN, Individual registration/TIN: https://www.hasil.gov.my/en/individu/pendaftaran/
- [S14] LHDN, Filing programme: https://www.hasil.gov.my/en/borang/program-memfail-borang-nyata/
- [S15] LHDN, e-Invoice implementation timeline: https://www.hasil.gov.my/en/e-invois/pelaksanaan-e-invois-di-malaysia/garis-masa-pelaksanaan-e-invois/
- [S16] RMCD/MySST, Service Tax Regulations and IT Services Guide: https://mysst.customs.gov.my/faq-services-tax/ and https://mysst.customs.gov.my/wp-content/uploads/2025/03/Service-Tax-Regulations-2018.pdf
- [S18] JPDP, Cross-border and organizational guidance index: https://www.pdp.gov.my/ppdpv1/en/akta/pdp-act-2010/
- [S19] JPDP, Registration of Data Controller: https://www.pdp.gov.my/ppdpv1/en/registration-of-data-controller/
- [S20] JPDP, Data Breach Notification: https://www.pdp.gov.my/ppdpv1/data-breach-notification-dbn-report/
- [S21] KPDN, Functions of KPDN: https://www.kpdn.gov.my/en/corporate-info/function-kpdn

### Repository and provider sources

- [S11] Existing primary-source checklist: `../../plan-tiering/research/compliance-checklist.md`
- [S23] Banking and QR research: `business-banking-and-qr.md`
- [I1] Booking link, checkout, receipt upload, and Telegram payload: `src/routes/[mua_slug]/[token]/+page.server.ts:173-428`
- [I2] Balance receipt upload and public URL: `src/routes/pay/balance/[token]/+page.server.ts:54-114`
- [I3] Telegram notification transport: `src/lib/telegram.server.ts:3-40` and `src/lib/telegram.server.ts:47-123`
- [I4] MUA onboarding data writes: `src/routes/onboarding/+page.svelte:103-218`
- [I5] MUA/public configuration reads: `src/routes/[mua_slug]/[token]/+page.server.ts:44-57`
- [I6] Mapbox venue retrieval: `src/lib/server/mapbox.ts:19-50`
