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

### Task 16 — feat/account

Sign in and register, account settings with the handle cooldown, email addresses, signed-in
devices, API tokens, organizations and their members, and the fleet view.

**Every rule shown here belongs to the server; the panel only explains it.** Three places
make that visible: the handle cooldown renders the `available_at` the server put in the error
details rather than computing thirty days locally; "make primary" is disabled with a `title`
saying why for an unverified address, while the server refuses it regardless; and the invite
form does not offer `owner` at all, because ownership moves by transfer. A second
implementation of any of those would eventually disagree with the server, and the browser
would be the copy that is wrong.

**`RequireAuth` is a convenience, not a guard**, and says so where it lives. Anyone can ask
for the data directly; the guard is the server's.

**Every write goes through `Form`**, which submits once at a time and renders the failure. An
`onClick` that fires a promise nobody catches looks to a person exactly like a button that
does nothing.

**Two secrets are each shown exactly once and never stored**: a minted API token and a newly
registered server's key. Both come with a dismiss button, and dismissing removes the only copy
the panel ever had.

**Two test failures were my own bugs, both worth keeping the fix for.** `Handle` was both a
heading and a field label on the same page, which is ambiguous for a screen reader as well as
for a query — the field is now "New handle". And a confirm button labelled `Revoke` cannot be
found by the name `Confirm`; the test now queries inside the group the component opens, which
is what a person navigating by landmark would do too.

Verified: `npm run check` green, 34 tests across four suites, 12 of them new; `npm run build`
produces a 285 kB bundle, 89 kB gzipped.

Next task depends on: `ConfirmButton`, `Form` and `CooldownNotice`, all of which the product
settings pages reuse.

### Task 17 — feat/product

The four `/product/*` routes, exactly as specified: the public page, the settings landing,
publishing a version, and general.

**`repo_url` is shown only when set, and nothing renders in its place when it is not.** The
server omits the key rather than sending null, and clearing the field in the general settings
form sends `null` rather than `""` — because `""` is *set*, and the product page would show
an empty link. Two tests hold the pair.

**The description renders as text, never as markup.** A publisher writes it and everyone
reads it, so interpreting it as HTML would make the product page a cross-site scripting
surface. There is a test that puts an `<img onerror>` in a description and asserts no image
element exists.

**One file input, and the page says why.** A version carries exactly one jar — the server
enforces it as a primary key — so a second input would be a control that cannot succeed. The
form says "publish them as two products" instead.

**Deleting asks for the id and then sends it.** The dialog's typed phrase and the request body
are the same string, so a confirmed dialog is never answered with `confirmation_mismatch`.

**`required` was removed from the file input, and this is a small correction worth keeping.**
jsdom never marks a file input valid after `userEvent.upload`, so browser validation silently
blocked every submit and the failure looked like a form that did nothing. The handler already
checks the file and reports "Choose a jar to upload." through the same error line as every
other failure — which is a better message than the browser's bubble, and the reason the
attribute is gone rather than the test being worked around.

Verified: `npm run check` green, 49 tests across five suites, 15 of them new; `npm run build`
produces a 292 kB bundle, 91 kB gzipped.

Next task depends on: nothing in this repository. What remains is the plugin, and then the
release.

### Task 20 — chore/release

The release, run in all three repositories at once. Here it wrote three things: this entry,
the release header on `wiki/logs/0/0/0/CHANGELOG.md`, and `repository-state.md` brought
current. The plan table it fills the `PR` column of lives in `MCEngine/plugin-manager`, and
so does the account of what the twenty tasks add up to.

**The version did not move.** `@mcengine/client-reactjs` stays at `0.0.0`, and
`wiki/logs/0/0/0/` already existed, so this appends rather than making a version claim.

**What is open, named so it is not mistaken for done.** No styling: the markup is semantic
and unstyled on purpose, so a look is applied to every page at once rather than reinvented
per page. No pagination controls, though the API client and the payload types both carry
cursors — every list renders its first page. No sign-in through an OAuth provider, because
the server has no provider redirect to send anyone to. No CI workflow.

Next task depends on: nothing. This is the last task in this repository's stack.
