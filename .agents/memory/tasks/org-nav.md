---
name: memory-tasks-org-nav
description: A nav entry for the organization page — the confirmed three-task plan, and why it points at the create page rather than a list.
---

# Task: Reach an organization from the nav

## Why

The nav offers Home, Products, Servers, Tokens, Devices and the account. Nothing about
organizations — and organizations are the thing that publishes, so a signed-in person who wants
one has nowhere to go.

`/org/new` exists and is linked from exactly one place: an accordion on the landing page, inside
a closed `<details>`. Once past `/`, the page is unreachable.

## Why it points at the create page

There is no organization **list** page, and none can be written today: the panel has no endpoint
that answers "which organizations does this account belong to". Checked against the contract —
`wiki/information/api-contract.md` in `MCEngine/server-expressjs` — the org routes are
`POST /orgs`, `GET /orgs/:handle/members`, `POST|PATCH|DELETE /orgs/:handle/members/...`,
`POST /orgs/:handle/transfer` and `GET /orgs/:handle/settings`. Every one of them needs a handle
you already know, and `GET /accounts/:handle` carries no memberships.

So the two org pages are reachable only by knowing a handle, except `/org/new`. The nav entry
therefore says **New organization** and goes there: a link named for the page it opens, rather
than an "Organizations" that lands on a form.

A real list is a server change first — an endpoint listing an account's memberships — and is
recorded here as the follow-up rather than guessed at.

## The plan

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This file and its index row | `client-reactjs` | `chore/org-nav-plan` | `.agents/memory/tasks/`, `.agents/index/memory-index.md` | |
| 2 | The nav entry | A signed-in nav link to `/org/new`, and a test that it is signed-in only | `client-reactjs` | `feat/org-nav` | `src/App.tsx`, `test/auth.test.tsx` | |
| 3 | Release | Changelog, state, close this record | `client-reactjs` | `chore/org-nav-release` | `wiki/logs/0/0/0/CHANGELOG.md`, `.agents/memory/state/` | |

One repository. No server change, no new page, no new dependency.

## Entries

### Task 1 — chore/org-nav-plan

This record and its row in `.agents/index/memory-index.md`. Nothing else.

### Task 2 — feat/org-nav

`src/App.tsx` gained one `NavLink` to `/org/new`, inside the signed-in block and after *Servers*.
Named **New organization** rather than *Organizations*, because a link named for a list that
lands on a form is a small lie — and because the landing page's accordion already says *Create an
organization*, so the two accessible names stay distinct on the one page that carries both.

`test/auth.test.tsx` gained two cases: signed in, the link is in the nav and **following it**
renders the `Create an organization` heading, so the assertion covers the route and not just the
href; signed out, the link is absent, since `/org/new` is behind `RequireAuth` and a link that
answers with a sign-in page is worse than no link.

Both passed on the first run, so the second was mutated to check it could fail: moving the link
out of the signed-in block made *is absent while signed out* fail, and reverting restored it.

Rendered in Chromium against the built bundle at both widths, since the desktop row now carries
six links, a name and a button:

| | 1280px | 390px |
|---|---|---|
| Horizontal overflow | none | none |
| The link | visible, 147px wide | visible, 358px, inside the viewport |
| Following it | `/org/new`, `h1` *Create an organization* | the same, and the menu closes |

The mobile menu still computes to `rgba(255, 255, 255, 0.98)` with `backdrop-filter: none`,
which is the overlay rule holding with one more item in it.
