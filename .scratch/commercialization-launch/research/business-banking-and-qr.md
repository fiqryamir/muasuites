# Malaysian business banking and DuitNow QR setup

> Research for commercialization-launch decision 02. Captured 2026-09-07 from current first-party sources only. Banking products, fees, campaigns, and eligibility can change; confirm the operative terms with the bank and a Malaysian professional adviser before opening an account or launching paid operations.

## Executive finding

The launch baseline should be an SSM-linked dedicated business account plus a provider-issued business DuitNow QR. MUASuites should not make a personal QR its production payment arrangement.

The strongest low-friction candidate found is **GXBank Biz Account**: it is expressly available to Malaysian SSM-registered sole proprietors, opens in the app, currently advertises no account fees and no minimum balance, and includes DuitNow QR. The strongest traditional-bank comparison found is **CIMB Business Current Account plus its Basic Package**: it has a higher initial deposit and a branch step, but CIMB publishes explicit business-QR issuance, unlimited daily acceptance, zero MDR for CASA/e-wallet DuitNow QR, and settlement timing.

This is a shortlist for professional review, not a final bank recommendation. The unresolved decision is whether GXBank's lower-friction account is sufficient for the required QR name, records, and operational controls, or whether CIMB's more explicit merchant package is worth the higher setup cost and branch process.

## Operating boundary

- The client pays the MUA directly. MUASuites displays the MUA's payment details, accepts a receipt submission, and supports the MUA's approval workflow.
- MUASuites does not collect, hold, split, or settle client money.
- MUASuites' own SaaS revenue should use the founder's dedicated business account and business QR once paid public launch begins. This is separate from each MUA's client-payment setup.
- A bank account is not a substitute for Malaysian legal, tax, or accounting advice. Both GXBank's terms and CIMB's pages direct applicants to their applicable terms and requirements.

## GXBank Biz Account

### Eligibility and documents

- GXBank's product page says the account is available to Malaysian sole proprietors with a valid SSM Business Registration Number and lists the latest one-month business or personal bank statement from another bank as an eligibility requirement. Source: https://www.gxbank.my/bizaccount
- GXBank's Help Centre says the onboarding process needs only MyKad and BRN, but also says GXBank may request additional documentation. Treat the statement requirement above as a real preparation item rather than assuming the two-item list is exhaustive. Source: https://help.gxbank.my/Business%2F%2FBusiness_Onboarding%2FAccount_Opening%2F14_Are_there_any_documents_required_to_open_a_GX_Biz_Account%3F
- The account is intended for business activity. GXBank's business terms say a business account must be used solely for conducting business activity and not for individual usage. Source: https://www.gxbank.my/business-terms-and-conditions

### Opening method and funding

- The account is opened and managed through the GXBank app; the product page describes the flow as app-based with no paperwork or branch visit. Source: https://www.gxbank.my/bizaccount
- GXBank says opening is within minutes, subject to internet stability and any further verification checks. Source: https://help.gxbank.my/Business%2F%2FBusiness_Onboarding%2FAccount_Opening%2F15_How_fast_can_I_open_a_GX_Biz_Account%3F
- A minimum initial deposit of RM10 is required from the applicant's own bank account in the applicant's name. Source: https://help.gxbank.my/Business%2F%2FMSME%2FFund_Transfer%2F09_Do_I_need_to_make_a_minimum_deposit_to_open_a_GX_Biz_Account%3F

### Fees and balances

- The current product page advertises no monthly fees, no maintenance fees, and no minimum balance. Source: https://www.gxbank.my/bizaccount
- GXBank's Help Centre states that there are currently no fees or charges associated with the Biz Account. Source: https://help.gxbank.my/Business%2F%2FBiz_Deposits%2FFees%2C_Charges%2C_and_Transactions%2F01_Are_there_any_fees_or_charges_with_my_GX_Biz_Account%3F
- The terms reserve GXBank's right to impose a minimum balance and describe a possible dormant-account fee after 12 continuous months without customer transactions. The published zero-fee/no-minimum position therefore needs to be checked against the live fee schedule at account opening. Source: https://www.gxbank.my/business-terms-and-conditions

### DuitNow QR and settlement identity

- The Biz Account product page advertises DuitNow QR as one of the account features and describes one QR for customers to pay the business. Source: https://www.gxbank.my/bizaccount
- GXBank's business Help Centre documents receiving money through DuitNow Transfer by registering the BRN as a DuitNow ID linked to the GX Biz Account; direct account-number transfers are also supported. Source: https://help.gxbank.my/Business%2F%2FMSME%2FDuitNow_Transfer%2F02_How_do_I_use_DuitNow_Transfer%3F
- GXBank's business terms define a business DuitNow ID as including the business registration number and say the bank may perform a name enquiry against the National Addressing Database. The reviewed public sources do not state exactly what payer-visible name appears on a GXBank QR payment confirmation or whether it is the legal SSM name, trading name, or another configured label. Source: https://www.gxbank.my/business-terms-and-conditions
- The reviewed sources do not specify whether the Biz Account QR is static or dynamic, how the QR is issued or downloaded, payment limits for incoming QR, or whether a separate merchant agreement is required. These are pre-launch confirmation questions, not assumptions.

### Transaction records

- GXBank makes monthly Biz Account statements available in the app and allows the user to select and download a month. Source: https://help.gxbank.my/Business%2F%2FMSME%2FStatements_and_Transaction_History%2F09_How_do_I_download_my_GX_Biz_Account_monthly_statements%3F
- E-statements are currently downloadable only as PDF and are available for up to seven years. Source: https://help.gxbank.my/Business%2F%2FMSME%2FStatements_and_Transaction_History%2F10_What_formats_can_I_download_my_GXB_e-statements_in%3F and https://help.gxbank.my/Business%2F%2FMSME%2FStatements_and_Transaction_History%2F11_How_long_will_my_GX_Biz_Account_monthly_statements_be_available_on_the_app%3F
- For outgoing transfers, the app provides a Share receipt action from the transaction detail screen. The business terms also provide for periodic statements and transaction notifications. Source: https://help.gxbank.my/Business%2F%2FMSME%2FStatements_and_Transaction_History%2F04_How_do_I_get_proof_of_transaction_after_completing_a_transaction%3F and https://www.gxbank.my/business-terms-and-conditions
- This is adequate for manual SaaS reconciliation, but PDF-only statements may be less convenient than CSV/API records if transaction volume grows. No CSV or API export was verified in the reviewed sources.

## CIMB Business Current Account and Basic Package

### Eligibility and documents

- CIMB explicitly includes Sole Proprietorship / Enterprise among the eligible business types. Source: https://www.cimb.com.my/en/business/business-day-to-day/deposit-investments/current-account/online-business-current-account.html
- For a sole proprietorship, CIMB's listed branch requirements include the business account application form, owner identification, and the initial deposit. The page says the owner and authorised signatories must attend the branch. Source: https://www.cimb.com.my/en/business/business-day-to-day/deposit-investments/current-account/online-business-current-account.html
- The published application flow is: complete the form digitally, email it to `bizca.support@cimb.com`, then attend an arranged branch visit with supporting documents. CIMB says the account number is available the same day once the branch application is completed. Source: https://www.cimb.com.my/en/business/business-day-to-day/deposit-investments/current-account/online-business-current-account.html

### Fees and balances

- CIMB lists a minimum initial deposit of RM3,000 for sole proprietorships and enterprises. Source: https://www.cimb.com.my/en/business/business-day-to-day/deposit-investments/current-account/online-business-current-account.html
- CIMB advertises complimentary monthly statements for the Business Current Account. Source: https://www.cimb.com.my/en/business/business-day-to-day/deposit-investments/current-account/online-business-current-account.html
- The exact current-account fee schedule is linked by CIMB but was not reproduced in the product page. The live fee schedule and business-account terms must be checked before selection. Source: https://www.cimb.com.my/en/business/business-day-to-day/deposit-investments/current-account/online-business-current-account.html

### Business QR issuance and settlement

- CIMB's Basic Package is expressly suitable for sole proprietors and partnerships with one to two outlets. It requires a CIMB Business Current Account/-i. Source: https://www.cimb.com.my/en/business/business-solutions/solutions/merchant-solutions.html
- The Basic Package is a static DuitNow QR: the customer enters the payment amount after scanning, and the QR contains the account details. Source: https://www.cimb.com.my/en/business/business-solutions/solutions/merchant-solutions.html
- CIMB says the Basic Package accepts payments from CIMB and other banking apps and e-wallets, has an unlimited daily payment acceptance limit, and charges zero MDR for CASA and e-wallet DuitNow QR. The page lists 0.35% for credit card acceptance, with a 0% promotional rate until further notice. Source: https://www.cimb.com.my/en/business/business-solutions/solutions/merchant-solutions.html
- For Basic Package transactions before 8 p.m., CIMB says settlement reaches the CIMB Business Current Account on the next business day. Transactions after 8 p.m. settle after two business days. Source: https://www.cimb.com.my/en/business/business-solutions/solutions/merchant-solutions.html
- Without OCTO Biz/BizChannel, the application requires the merchant form and nearest-branch submission. With OCTO Biz/BizChannel, CIMB provides a separate acceptance-and-call process. Source: https://www.cimb.com.my/en/business/business-solutions/solutions/merchant-solutions.html
- CIMB also documents a P2P DuitNow QR route for individuals and micro SMEs using CIMB Clicks. That page says the user can share a QR instead of a personal account number, but it is not the same evidence as a dedicated business merchant package and should not be treated as the launch baseline. Source: https://www.cimb.com.my/en/business/business-solutions/solutions/merchant-solutions.html

### Transaction records

- CIMB's business-account page promises complimentary monthly statements and says OCTO Biz supports online account inquiries and fund transfers. Source: https://www.cimb.com.my/en/business/business-day-to-day/deposit-investments/current-account/online-business-current-account.html
- The reviewed CIMB merchant page does not specify the exact QR transaction-history export format, payer-visible settlement name, or reconciliation report retention period. Confirm these with CIMB before relying on the package for operational reporting.

## PayNet and provider model

- PayNet describes DuitNow QR as Malaysia's national QR standard. A business can accept payments from participating banks and e-wallets using one QR, and PayNet says setup is done by contacting a preferred bank or acquirer. Source: https://www.paynet.my/business-solutions/duitnow-qr.html
- PayNet says payments are typically received instantly and incoming payment notifications are provided, but both are subject to the terms of the selected bank, e-wallet, or third-party provider. PayNet also says fees vary by provider. Source: https://www.paynet.my/business-solutions/duitnow-qr.html
- PayNet's business page positions consolidated statements as a reconciliation benefit of DuitNow QR. This does not guarantee that every provider exposes the same report format. Source: https://www.paynet.my/business-solutions/duitnow-qr.html
- PayNet's provider contact page lists banks and acquirers including CIMB, Hong Leong, Maybank, Public Bank, RHB, UOB, and third-party providers. Source: https://www.paynet.my/business-solutions/duitnow-qr-merchant-sign-up.html
- For DuitNow Transfer, PayNet says an SSM-registered business can link its BRN as a DuitNow ID, each ID can be linked to only one bank account, and multiple verified IDs can be registered. Source: https://www.paynet.my/business-solutions/duitnow-transfer.html

## Comparison

| | GXBank Biz Account | CIMB Business Current Account + Basic Package | Provider-neutral PayNet model |
|---|---|---|---|
| Sole-proprietor fit | Explicitly available to Malaysian SSM sole proprietors | Sole Proprietorship / Enterprise explicitly eligible | Depends on selected bank or acquirer |
| Opening | App-based; within minutes subject to checks | Digital form/email followed by branch visit; same-day account number after branch completion | Provider-specific |
| Preparation | MyKad, BRN, likely latest one-month statement from another bank, RM10 first-party deposit | Application form, ID, RM3,000 initial deposit, branch attendance | Provider-specific KYC and business account requirements |
| Published account cost | No current account fees or minimum balance advertised; terms reserve changes and dormant fees | RM3,000 initial deposit; account fee schedule must be checked | Fees vary by provider |
| QR | DuitNow QR advertised, but static/dynamic and issuance details not verified | Static business QR; amount entered by payer; unlimited daily acceptance | One QR across participating banks/e-wallets; provider issues it |
| Settlement | Linked Biz Account; timing and payer-visible name not verified | Next business day before 8 p.m.; after 8 p.m. in two business days | Typically instant, subject to provider terms |
| Records | Monthly PDF statements, PDF only, up to seven years, outgoing share receipts | Complimentary monthly statements; QR export/name details not verified | Consolidated statements advertised, format varies |
| Practical advantage | Lowest friction and lowest disclosed capital requirement | Most explicit business-QR and settlement terms found | Broadest provider choice and interoperability |
| Main uncertainty | QR product mechanics, fee schedule caveats, visible settlement name | Total fees, merchant onboarding details, QR report/name behavior | Comparing providers requires separate terms review |

## Personal QR fallback boundary

The sources do not establish a universal transaction amount at which a personal QR becomes prohibited. The relevant distinction is operational identity and intended use, not a particular ringgit threshold.

Adopt this launch rule:

- A personal QR may be used only as a time-boxed private Founder-beta test path, and only after the account holder confirms with the provider that the intended business use is permitted. Maintain a manual ledger and show the recipient identity clearly.
- If the Founder beta includes real public clients paying for services, the personal-QR exception has ended for that MUA. Use a business account and provider-issued business QR instead.
- A personal QR is not acceptable in any paid public launch flow, on a public MUASuites page, or as the default instruction for client payments. Do not wait for a volume threshold.
- If a MUA cannot obtain a business QR before beta, the safer product posture is to keep that MUA out of a live client-payment flow or use a direct provider-approved business transfer method, not to normalize personal QR as the platform default.

This is a commercialization control derived from the business-account purpose, reconciliation, and naming requirements above. It is not presented as legal or bank-specific advice.

## Founder comparison for professional review

- **GXBank Biz Account** is the first candidate to validate when speed, low upfront capital, app-only operation, PDF records, and a simple BRN-linked identity matter most. Before relying on it, confirm the exact DuitNow QR workflow, QR type, visible settlement name, incoming transaction record, limits, and current fee schedule.
- **CIMB Business Current Account plus Basic Package** is the first candidate to validate when explicit business static QR support and published settlement timing matter more than the RM3,000 deposit and branch process. Confirm the all-in fee schedule, account/merchant name shown to payers, report format, and whether the service-provider use case fits the package.
- **Other PayNet providers** should be considered only if they offer a materially better answer on those confirmation questions. PayNet's model is interoperable, but PayNet does not set the provider's fees, settlement timing, or records policy.

No final bank is selected by this research alone.

## Unresolved preference decisions

1. Is app-only opening and RM10 funding more valuable than CIMB's explicit merchant-package terms and published settlement schedule?
2. Is PDF-only monthly recordkeeping sufficient for the first year, or is CSV/export/API access a launch requirement?
3. Is a static QR acceptable for SaaS payments and MUA client deposits, or is a dynamic amount-bearing QR worth extra cost or hardware?
4. Must the payer-visible QR name match the registered SSM name exactly, or is a configured studio/trading name acceptable after professional review?
5. Does the private Founder beta permit any real client payment using a personal QR, or should business QR be a beta gate as well?
6. Should MUASuites publish a direct BRN/account-number transfer fallback alongside each MUA's QR, subject to the MUA's provider terms?

## Confirmation checklist

Before paid public launch, obtain written or in-app confirmation for the chosen provider on:

- sole-proprietor eligibility and exact documents;
- account opening and activation timeline;
- current account fees, minimum balance, dormant fees, and taxes;
- QR issuance, QR type, downloadable/displayable format, and whether a separate merchant application is required;
- payer-visible business or account name;
- incoming QR transaction notifications and searchable history;
- statement format, retention, and export capability;
- incoming payment limits and settlement timing;
- dispute, refund, mistaken-payment, and fraud handling;
- whether the business activity and client-payment use case are permitted under the provider's terms.

## Source list

- GXBank Biz Account: https://www.gxbank.my/bizaccount
- GXBank Business Banking: https://www.gxbank.my/business
- GXBank Business Banking Terms, effective 9 March 2026: https://www.gxbank.my/business-terms-and-conditions
- GXBank Business Help Centre, Account Opening: https://help.gxbank.my/Business%2F%2FBusiness_Onboarding
- GXBank Business Help Centre, Payments and Transfers: https://help.gxbank.my/Business%2F%2FMSME
- GXBank Business Help Centre, Statements and Transaction History: https://help.gxbank.my/Business%2F%2FMSME%2FStatements_and_Transaction_History
- CIMB Business Current Account: https://www.cimb.com.my/en/business/business-day-to-day/deposit-investments/current-account/online-business-current-account.html
- CIMB Merchant Solutions: https://www.cimb.com.my/en/business/business-solutions/solutions/merchant-solutions.html
- CIMB OCTO Biz: https://www.cimb.com.my/en/business/digital-services/octo-biz.html
- PayNet DuitNow QR for Business: https://www.paynet.my/business-solutions/duitnow-qr.html
- PayNet DuitNow QR provider contacts: https://www.paynet.my/business-solutions/duitnow-qr-merchant-sign-up.html
- PayNet DuitNow Transfer for Business: https://www.paynet.my/business-solutions/duitnow-transfer.html
