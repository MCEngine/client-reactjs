---
name: memory-tasks-version-route
description: This repository's entries in the version-route plan — the plan table itself lives in MCEngine/server-expressjs.
---

# Task: Address a version by its path — client-reactjs entries

**The plan table is not here.** It lives in `MCEngine/server-expressjs` at
`.agents/memory/tasks/version-route.md`, because that repository owns the API contract this
change alters. Why publishing moved is recorded there at
`.agents/memory/decisions/version-addressed-by-path.md`.

Tasks 3 and 4 of that plan are this repository's.

## Entries

### Task 3 — refactor/version-route

The publish form now sends `PUT /api/v1/products/:id/versions/:version` and leaves the version
out of the body, because the server refuses a body version outright rather than ignoring it.

**An empty version is caught before it becomes a path segment.** `required` on the field is
satisfied by whitespace, which trims to nothing — and an empty segment would request
`/versions/` and come back as a 404 saying nothing about what the person got wrong. The handler
checks it and reports "Enter a version, like 1.2.3." through the same error line as every other
failure, which is the same reasoning that removed `required` from the file input in task 17 of
the platform plan. A test types three spaces and asserts the message.

**The version is percent-encoded into the path.** It reaches the URL from a text field, and a
version is the one user-supplied value in that URL.

Verified: `npm run check` green — 50 tests across five suites, one new; `npm run build`
produces a 294.59 kB bundle, 91.57 kB gzipped. The fetch stub keys on method and path, so the publish test reaching a
201 at all is the assertion that the request went to the right URL with the right verb; it also
asserts the form body carries no `version` key.

Next task depends on: nothing. The release is last.

### Task 4 — chore/version-route-release

The release, in both repositories. Here it wrote this entry, the changelog line for the publish
form, and `repository-state.md` brought current.

**The version did not move.** `@mcengine/client-reactjs` stays at `0.0.0`, and
`wiki/logs/0/0/0/` already existed, so this appends rather than making a version claim.

Next task depends on: nothing. This closes this repository's part of the record.

