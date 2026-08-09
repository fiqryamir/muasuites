# Issue tracker: Local Markdown

Issues, specs, and maps for this repo live as markdown files in `.scratch/`.

Chosen because the `gh`/`glab` CLIs are not installed on this machine. Switch to GitHub Issues by installing `gh`, authenticating, and re-running `/setup-matt-pocock-skills` — the tickets themselves are identical, only the shape of blocking edges changes.

## Conventions

- One effort per directory: `.scratch/<effort-slug>/`
- The spec is `.scratch/<effort-slug>/spec.md`
- Wayfinder **decision** tickets: `.scratch/<effort-slug>/decisions/<NN>-<slug>.md`, numbered from `01`
- **Build** tickets (from /to-tickets): `.scratch/<effort-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Triage/state is a `Status:` line near the top of each ticket file (`open` / `claimed` / `resolved` / `ready-for-agent`)
- Comments and answers append under `## Comments` / `## Answer` headings
- Never a single combined tickets file — one file per ticket

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<effort-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** has one **child** file per decision ticket.

- **Map**: `.scratch/<effort>/map.md` — the Destination / Notes / Decisions-so-far / Fog body.
- **Decision ticket**: `.scratch/<effort>/decisions/NN-<slug>.md`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `open`/`claimed`/`resolved`.
- **Blocking**: a `Blocked by:` line near the top. A ticket is unblocked when every ticket it lists is resolved.
- **Frontier**: scan `.scratch/<effort>/decisions/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` before any work.
- **Resolve**: append the answer under `## Answer`, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far.

Build tickets under `.scratch/<effort>/issues/` are **not** wayfinder decision tickets — exclude them from the frontier scan. A build ticket may list a decision ticket in its `Blocked by:` line.
