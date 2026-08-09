# 01 — Serve the landing page without the Worker

**Type:** grilling (HITL)
**Status:** resolved

## Question

Should the landing page keep being rendered by the Cloudflare Worker on every hit — with the root layout running an auth session check first, costing request quota and 10ms-class CPU even to bots — or be served as a static edge asset with zero Worker cost?

## Answer

Prerender the landing page as a static Cloudflare asset at build time. The root public layout must first stop running auth work (it currently runs a session check on every page, including the landing page), which also strips the auth-check cost from all public routes at once. Decided by grilling with the human: the full fix (auth restructure + prerender) beats the stopgap of a CDN `s-maxage` on `/`, because it zeroes Worker cost and hardens auth in one move rather than patching the landing page in isolation.
