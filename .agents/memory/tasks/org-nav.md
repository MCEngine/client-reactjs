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
