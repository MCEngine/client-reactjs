---
name: agent-wiki-context-repository-map
description: Orientation for agents — what currently lives in this repository, what is planned, and where each kind of file belongs.
---

# Repository map

Orientation before touching anything. For what this panel *is*, read
[`wiki/information/overview.md`](../../../wiki/information/overview.md) — the facts live
there once, and this page links rather than repeats them.

## What exists right now

| Path | What it is |
|---|---|
| `AGENTS.md` | Entry point: shared set resolution, the tool declaration block, reading order. |
| `.claude/CLAUDE.md` | A single import of `../AGENTS.md`, so Claude Code and every other agent read the same instructions. Never paste content into it. |
| `.agents/index/` | Every index. Six files, flat, named `{scope}-index.md`. |
| `.agents/rules/repository.md` | This repository's own rules hub. |
| `.agents/wiki/context/` | This page. |
| `.agents/memory/` | Current state and this repository's entries in the platform task record. |
| `wiki/` | Human documentation, plus `wiki/logs/` for version history. |
| `README.md`, `LICENSE` | Overview and the MIT license. |
| `package.json` | `@mcengine/client-reactjs` at `0.0.0`. The version carrier. |
| `vite.config.ts` | The dev server with `/api` proxied, and the Vitest configuration. |
| `index.html`, `src/main.tsx` | The mount point and the entry. |
| `src/api/` | The one place that calls `fetch`, the server's payload types, and the error types. |
| `src/auth/AuthContext.tsx` | The access token, held in memory only. |
| `src/components/` | `ConfirmButton` and the async-read helpers. |
| `src/routes/` | One file per page. |
| `test/` | Vitest and Testing Library, plus `helpers.tsx` for a stubbed transport. |

## What is deliberately absent

**There are almost no pages.** The shell, the product list and a not-found route are all
that exist. No sign-in form, no account or organization administration, no token management,
no `/product/*` settings pages, no fleet view — those are the next two tasks.

There is no styling either: the markup is semantic and unstyled, so a page is written once
and the look is applied to all of them at the end rather than per page. No CI workflow;
none was asked for.

The plan table lives in `MCEngine/plugin-manager` at
`.agents/memory/tasks/mcpluginmanager-platform.md`, and this repository's own entries are in
[`../../memory/tasks/mcpluginmanager-platform.md`](../../memory/tasks/mcpluginmanager-platform.md).

**Do not infer the build from this page** — it is updated by each task as that task makes
something true, so anything absent here is genuinely absent from the repository.

## Where a new file goes

| Kind | Path |
|---|---|
| A rule for this repository | `.agents/{folder}/{file}.md` — and a row in the `AGENTS.md` declaration block |
| Documentation a person reads | `wiki/{folder}/{file-name}.md` |
| Procedure or framing only an agent needs | `.agents/wiki/{type}/{file-name}.md` |
| Task state, a decision, current state | `.agents/memory/{type}/{file-name}.md` |
| A record of what changed | `wiki/logs/{Major}/{Minor}/{Patch}/CHANGELOG.md` — and creating the directory is gated |
| An index | `.agents/index/{scope}-index.md` |

Never an `INDEX.md`. Never a third documentation tree. The authority is
`{shared}/rules/directories.md`.

## Gotchas

* **`.claude/CLAUDE.md` imports `../AGENTS.md`, not `@AGENTS.md`.** The import path resolves
  relative to that file, so `@AGENTS.md` would point at `.claude/AGENTS.md`, which does not
  exist.
* **The trigger table is a declaration, not a mirror.** `AGENTS.md` names the shared tools
  this repository actually uses. A convention with no row does not apply here; adding one
  means adding its row in the same commit.
* **Memory is ungated, instructions are not.** Write `.agents/memory/` freely. Never create
  or edit an instruction file without the user selecting it first.
* **This repository consumes an API it does not own.** `MCEngine/server-expressjs` defines
  every route and payload. Read its contract documentation rather than inferring a shape
  from a component, and never work around a server rule in the client.
* **Everything in the bundle is public.** Anything committed here that a build inlines is
  readable by anyone who loads the page. Secrets belong on the server.
* **The access token is in memory and nowhere else.** `localStorage` is readable by any
  script that reaches the page and outlives the tab; the refresh cookie is HttpOnly and the
  panel cannot read it, which is what lets a reload recover a session with nothing stored.
* **An injected API client in a test replaces the whole transport**, including the refresh
  call. `AuthProvider` uses it for both — building a real client for the refresh would send
  that one request past the stub to the network, and the symptom is a session that never
  recovers.
* **`signOut` never rejects.** The person clicked it; they are signed out locally whatever
  the server said, and there is no recovery a caller could perform with the error.
* **Test by role and name, not by test id.** A test that can only find an element by an
  attribute added for the test is not checking what the person sees.
* **Creating a log directory is a version claim** and needs explicit approval. Appending to
  the existing one does not.
