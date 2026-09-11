---
name: memory-tasks-demo-and-landing
description: This repository's entries in the landing-page and demo-account plan — the plan table itself lives in MCEngine/server-expressjs.
---

# Task: A front door, and a way in without registering — client-reactjs entries

**The plan table is not here.** It lives in `MCEngine/server-expressjs` at
`.agents/memory/tasks/demo-and-landing.md`, because the server owns whether a demo account
exists and what its credentials are. The decision behind it is there too, at
`.agents/memory/decisions/demo-account.md`.

Tasks 3, 4 and 5 of that plan are this repository's.

## Entries

### Task 3 — feat/landing-page

`/` became a landing page and the catalogue moved to `/products`.

**The catalogue was a fine page and a poor front door.** It answers "what has been published" to
a reader who has not yet been told what publishing means, who does the downloading, or what the
three repositories have to do with each other. The new page answers those, in that order, and
puts the catalogue one click away.

**`Home.tsx` became `Products.tsx` with `git mv`**, so the history of the catalogue page follows
it rather than appearing as a delete and an add.

**The page reads nothing.** No `useAsync`, no request — it is the one page in the panel that
holds still, and a test asserts it by stubbing only the session routes: if it ever starts
fetching, the stub has no route for it and an alert renders.

**Two duplicate link names were found by writing the tests and fixed in the page.** The hero and
the accordion both said "Browse products", and both said "Your servers" when signed in — two
links with the same accessible name on one page. The accordion's now read "Open the catalogue"
and "Register a server", which are more accurate for where they sit.

**One test in `auth.test.tsx` needed scoping rather than changing.** It asserted a "Sign in" link
appears after a failed sign-out; the landing page now offers one too, so the query matched twice.
It is scoped to the nav, which is what the assertion was always about.

Verified: `npm run check` green — 56 tests across six suites, 5 new. Rendered in Chromium at
1280px and 390px: no horizontal overflow on either, `/` shows `MCPluginManager` and `/products`
shows `Products`.

Next task depends on: nothing here. The auth forms are independent.
