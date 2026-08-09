# 04 — Mechanism split

**Type:** grilling (HITL)
**Status:** resolved

## Question

Which protections live in the codebase versus the Cloudflare dashboard?

## Answer

**Code-first**: prerender, Cache-Control headers, UA/scanner triage, and robots.txt all live in the repo under version control. The human operates the free dashboard toggles: Browser Integrity Check, Bot Fight Mode, and one free rate-limit rule. Measurement runs through Workers observability plus dashboard analytics (human does a weekly check per the report's monitoring section).
