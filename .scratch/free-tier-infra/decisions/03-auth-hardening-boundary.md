# 03 — Auth hardening boundary

**Type:** grilling (HITL)
**Status:** resolved

## Question

How should authentication gating be structured once the root layout stops doing auth work?

## Answer

Move session resolution into the authenticated subtree (`(auth)` group): a server layout resolves the session and issues a 303 redirect to the login page when unauthenticated, **before** any dashboard/settings HTML renders. The login page stays outside the gated subtree (it must be reachable when logged out) and redirects already-authenticated MUAs to the dashboard. This replaces today's client-side-only redirect (`goto('/login')` after render, empty data server-side) and stops unauthenticated SSR of the dashboard shell.
