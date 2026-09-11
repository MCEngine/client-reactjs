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

### Task 4 — feat/auth-forms

The sign-in page shows the demo account when the server has one; the register form confirms the
password.

**The sign-in page asks `GET /api/v1/meta` rather than being told at build time.** Whether a
deployment has a demo account is the server's to answer, and the panel and the server are
configured separately — one at build time, one at runtime. Baking credentials into the bundle
would couple them at exactly the point they are decoupled.

**A defect the existing suite caught, and my own test had missed.** The block was first written
with `AsyncBoundary`, which renders a failure as an alert — so a deployment with no demo
account, or one whose `/meta` read failed, showed an **error on its sign-in page**. The code
comment claimed it showed nothing; it did not. `account.test.tsx` found it by failing with "found
multiple elements with role alert", because it stubs no `/meta` route.

My own test for that case asserted the form still rendered and stopped there, which is exactly
why it passed while the page was wrong. It now also asserts **no alert is present**, and there is
a second test for the plain no-demo-account case. A missing convenience must be invisible, not
broken.

**Confirm password is checked in the panel and nowhere else**, and a test asserts the register
request is **not sent** when the two disagree. The server has no opinion about a second copy of a
field — this is not a rule about accounts, it is a guard against a typo becoming an account
nobody can sign in to, and before the request is the only moment that can be caught. Another test
asserts no `confirmPassword` reaches the wire.

**Registering is still offered on the sign-in page**, with a test, because the demo account is an
addition rather than a replacement — which is what the request asked for.

Verified: `npm run check` green — 64 tests across seven suites, 9 new. Rendered in Chromium with
the demo account on: the credentials show, **zero alerts on the page**, and clicking *Fill the
form* puts `demo@mcengine.local` in the email field.

Next task depends on: nothing. The release is last.

### Task 5 — chore/demo-and-landing-release

The release, in both repositories. Here it wrote this entry and brought `repository-state.md`
current; the plan table and the `PR` column are in `MCEngine/server-expressjs`.

**The version did not move.**

Next task depends on: nothing. This closes this repository's part of the record.

