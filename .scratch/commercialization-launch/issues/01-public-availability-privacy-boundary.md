# 01: Public availability privacy boundary

**What to build:** Make the public MUA profile and availability experience reveal only intentional public profile, package, availability, and payment information. Client identity and private configuration must never be part of public availability responses.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Public availability shows booked times and package information without Client names or other Client identity.
- [ ] Public responses expose an explicit safe allowlist and no Telegram, connection, account, token, or private configuration fields.
- [ ] Direct anonymous access to the public data seam is tested, not only the rendered page.
- [ ] Existing booking-link access and MUA dashboard access remain functional.
- [ ] External-behavior tests cover an active booking, a pending booking, and a temporary slot hold.
