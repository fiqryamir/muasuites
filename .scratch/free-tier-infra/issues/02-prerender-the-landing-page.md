# 02 — Prerender the landing page

**What to build:** the landing page is baked to a static HTML asset at build time and served from the Cloudflare edge without invoking the Worker, so every visit (including bot traffic) costs zero Worker requests and zero CPU.

**Blocked by:** 01 — Move auth gating server-side (the public layout must be free of auth work first).

**Status:** ready-for-agent

Related decision: [Serve the landing page without the Worker](../decisions/01-serve-the-landing-page-without-the-worker.md).

- [ ] The build emits the landing page as a static asset and the Worker routing config marks it excluded from Worker-run routes.
- [ ] A request to the landing page returns the same content and structured data as before (no visual, SEO, or schema regression).
- [ ] The landing page response carries an edge-friendly public cache header.
- [ ] Dashboard, login, and public profile routes are unaffected.
- [ ] Edge freshness on redeploy verified: no stale landing HTML is served after a new deploy (or a zero-config cache-busting path is confirmed).
- [ ] Observability shows the landing page serving with zero Worker invocations / ~0 CPU after deploy.
