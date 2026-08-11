# 03 — Which Malaysian gateway for future auto-billing?

Type: research
Status: resolved
Blocked by:

## Question

Compare Malaysian payment gateways for *future* automated PRO billing (out of scope for launch, but the choice shapes what company entity the founder should register now — see 04). Compare at minimum **Chip** and **BayarCash**, plus ToyyibPay and Billplz if they surface. Concretely:

- **Costs**: MDR per transaction, setup/monthly fees, minimum commitments
- **Recurring billing**: which support true subscription/recurring charges (Chip is known for this) vs one-off FPX only
- **Onboarding**: what the merchant must provide — company entity type required (sole prop vs Sdn Bhd?), KYC documents, timeline to approval
- **Technical fit**: API quality, webhook support, Malaysia-only vs regional

The answer feeds the compliance checklist in 04 and the spec's "future auto-billing" section. Resolve via a `/research` subagent against primary sources (gateway official sites/docs), findings as a Markdown file linked below.

## Answer

Findings file: `.scratch/plan-tiering/research/gateway-comparison.md` (captured 2026-08-11, primary sources only).

**Headline:** Chip is the best technical fit for future PRO auto-billing (card-token recurring-charge API, BNM-registered non-bank merchant acquirer, RM 1.00 FPX, no setup/monthly/annual fees, no contracts) — but it requires an **SSM-registered business + business bank account** to onboard, so it cannot be used until the founder incorporates. Only BayarCash offers a no-entity Personal tier (NRIC-based, no SSM); its FPX direct debit (RM 1.50/deduction, weekly/monthly e-mandate) is the cheapest true recurring rail. Billplz also supports recurring (Auto-Deduct 2.3%+RM1.25 or 2%+RM0.75 on RM999/yr plan; card tokenization paid-plan only) and accepts any SSM/ROS/ROC entity incl. sole prop. ToyyibPay has NO recurring billing today (direct debit "Coming Soon", no subscription API endpoints).

Key facts:
- **Chip**: recurring via saved-card "recurring token" + Charge API; merchant runs the renewal cron (Chip does not auto-charge). FPX B2C RM 1.00 next-day; local credit 2.0%, debit 1.0%, foreign 3.0% (T+2); DuitNow QR 1.0% min RM 0.15. KYC: credit-agency checks, PEP/sanctions, corporate docs. TOS flags for us: prepayment/deposit models may need prior CHIP approval + segregated trust account (cl. 6A); TOS contemplates payment-facilitator/sub-merchant setups.
- **BayarCash**: free T+ plan; FPX RM 1.00, direct debit RM 1.50, card RM 1.00+1%; T+2 settlement (realtime plans RM189–RM12,000/yr, Public Bank/Bank Islam only); all fees +8% SST. Three entity tiers: Business (SSM), Society (ROS), Personal (no SSM). Mandate approval 3–5 days.
- **Billplz**: Basic free (FPX RM 1.25) / Standard RM 999/yr (FPX RM 0.75); sign-up ~10 min incl. CTOS e-KYC, bank verification ≤24 business hours; needs org-name bank account + TIN.
- **ToyyibPay**: FPX RM 1.00; card 1.5% local + RM 100 onboarding fee; accounts gated by manual approval (no published timeline).

**Entity implication (feeds ticket 04):** no gateway except BayarCash-Personal works pre-incorporation; Chip/Billplz require at minimum a sole-proprietorship SSM registration + business bank account. Registering the entity is a prerequisite for the auto-billing path.

<!-- research findings file: .scratch/plan-tiering/research/gateway-comparison.md -->
<!-- resolution: mark Status: resolved, gist on the map -->
