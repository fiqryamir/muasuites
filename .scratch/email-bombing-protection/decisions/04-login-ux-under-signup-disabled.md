# 04 — Login UX under signup-disabled

**Type:** grilling (HITL)
**Status:** resolved

## Question

What should the login page do and say once `disable_signup = true`?

`src/routes/login/+page.svelte:55` prints GoTrue's raw `error.message` for the magic-link form. Once signup is disabled, the error for an unknown email will reveal whether the address exists (user enumeration) — and raw provider errors are unpolished for a MUAs-facing page anyway.

Decide:

- Normalize the error client-side to a single generic message (e.g. "If an account exists for this email, we've sent a login link") — hiding enumeration and matching the invisible posture?
- What, if anything, changes for the success state and the "Use a different email" retry path.
- Whether the server-side login page (`+page.server.ts`) needs any change or the message normalization is purely client-side.

## Answer

**Success-always.** Every submit produces the same "Check your inbox" outcome — known email, unknown email, or blocked — so the form reveals nothing about whether an address is registered. The existing success card and "Use a different email" retry path already cover typo'd MUAs; no copy change needed there.

- **429 special-case**: when GoTrue returns a 429 (`over_email_send_rate_limit` or `over_request_rate_limit`), show "Too many login attempts right now — please wait a few minutes." instead. Reveals no account info; helps a real MUA who hit a burned Auth Email Budget.
- **Error branching**: client-side, on error → success-always message (or the 429 variant); never display `error.message` or `error.code` raw.
- **Server-side**: no change — `+page.server.ts` keeps its redirect-if-authed behavior; normalization is purely client-side in `login/+page.svelte`.
- Implementation lands in ticket 05 alongside the `shouldCreateUser: false` edit.