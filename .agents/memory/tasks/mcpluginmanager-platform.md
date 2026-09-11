---
name: memory-tasks-mcpluginmanager-platform
description: This repository's entries in the MCPluginManager platform plan — the plan table itself lives in MCEngine/plugin-manager.
---

# Task: MCPluginManager platform — client-reactjs entries

**The plan table is not here.** It lives in `MCEngine/plugin-manager` at
`.agents/memory/tasks/mcpluginmanager-platform.md`: one twenty-task list covering all three
repositories, so the cross-repository ordering can be read in one place instead of three
that drift. Why it is arranged that way is recorded in that repository at
`.agents/memory/decisions/cross-repository-record.md`.

This file holds the entries for the tasks that land **in this repository**, in the shape
every task record takes: one `### Task k — {branch}` heading per task, appended in the same
commit as the work it describes.

Tasks 3, 15, 16, 17 and 20 of that plan are this repository's.

## Entries

### Task 3 — docs/agents-setup

Adopted the shared instruction set as a **Mode B consumer**, declaring no overrides. This is
the repository's first task record and its first commit beyond the initial one.

Created `AGENTS.md` (connector bootstrap verbatim, the auto-activation contract with its
three gates inline, a **declaration** block naming five shared tools and stamping set
version `1.0.0`, reading order, routing protocol, iron rule, placement, the discovery
protocol block, the version rule and the session-link rule); `.claude/CLAUDE.md` as an
import of `../AGENTS.md` and nothing else; the six indexes under `.agents/index/`;
`.agents/rules/repository.md`; `.agents/wiki/context/repository-map.md`; this file and
`state/repository-state.md`; `wiki/information/overview.md`; and
`wiki/logs/0/0/0/CHANGELOG.md`. Rewrote `README.md` from a bare title into an overview.

**The blocks the setup procedure requires verbatim are byte-identical to the ones in
`MCEngine/server-expressjs`** — the connector bootstrap, the auto-activation contract, the
discovery protocol block. That is intended: they are shared text reproduced into each
consuming repository, not local content that happens to look alike. Everything that
describes *this* repository — the opening paragraph, the rules hub, the map, the overview —
was written for the panel.

**Two rules here have no counterpart in the server repository**, and both come from what a
browser is: the panel holds no state of its own, and everything in the bundle is public.
They are in `.agents/rules/repository.md` rather than in the map, because they constrain
what may be written rather than describing what exists.

`LICENSE` already carried MIT with the correct holder and year and was left untouched.

Next task depends on: the server's API contract, documented in `MCEngine/server-expressjs`
before either client is written.

### Task 15 — build/react-skeleton

The build, the transport, the auth context and the shell — no pages beyond a product list and
a not-found route.

**Three runtime dependencies: React, React DOM and the router.** No state library, no
data-fetching library, no component library. The panel holds no state of its own, so there is
nothing for a state library to hold; a twelve-line `useAsync` covers what a read needs,
including discarding a late response from a superseded request.

**The access token lives in memory and nowhere else, and there is a test asserting
`localStorage` stays empty.** A token in `localStorage` is readable by any script that ends
up on the page and outlives the tab. The refresh token is an HttpOnly cookie the panel cannot
read at all, which is exactly what lets a reload recover a session without the panel ever
having stored a credential.

**Two clients, not one.** The main one refreshes on a 401 and retries once; the second has no
refresh hook and exists only to call refresh itself, because otherwise a failing refresh
would try to refresh and recurse.

**Three bugs the tests caught, all of them real:**

* `AuthProvider` built a *real* client for the refresh call even when a test injected one, so
  that one request went past the stub to the network. An injected client is the whole
  transport, and now it is used for both. The symptom was a session that never recovered.
* `AsyncBoundary` decided emptiness with `Array.isArray`, which is never true for a
  `Page<T>`, so the empty state could not render. Emptiness is now the caller's to decide,
  because what "empty" means depends on the shape.
* `signOut` used `try/finally`, so it cleared local state and then rethrew — leaving an
  unhandled rejection behind every sign-out click that happened while the server was
  unhappy. It now never rejects: the person clicked sign out, and there is no recovery a
  caller could perform with the error.

**`/api` is proxied in development rather than pointed at port 3000.** Talking to another
port would make every request cross-site in development and same-site in production, and the
difference shows up only as a refresh cookie the browser silently declines to send.

**No styling at all.** The markup is semantic and unstyled, so the look is applied to every
page at once at the end rather than being reinvented per page.

Verified: `npm run check` green, 22 tests across three suites; `npm run build` produces a
268 kB bundle, 85 kB gzipped.

Next task depends on: `useAuth`, `ConfirmButton` and the stubbed transport in
`test/helpers.tsx`.
