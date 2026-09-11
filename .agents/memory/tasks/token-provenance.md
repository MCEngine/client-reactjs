---
name: memory-tasks-token-provenance
description: The role chip escaping its card, and an organization token whose creator is recorded but reaches nobody — the confirmed six-task plan across two repositories.
---

# Task: A card that holds its role, and a token that names who minted it

## The layout defect

On `/org`, the role rendered as a **second grid cell** beside the organization's card rather than
inside it. The cause is in this repository's own stylesheet, with the comment that warns about it
three lines above:

```css
/* A card grid is often built from a <ul> ... The <li> then sits between the
   grid and the card and would take the grid cell itself; `display: contents`
   hands the cell to the card ... */
.card-grid > li { display: contents; }
```

`display: contents` on the `<li>` means **every** child of that `<li>` becomes a grid item. The
card took one cell and the role chip beside it took the next. Anything in a `.card-grid > li` that
is not the card is a cell of its own, so the role belongs inside the card.

## The token provenance question

Asked: does a token created against an organization still trace back to the person who created
it? Measured rather than read, by minting one and looking:

```
owner_account_id = the org
created_by       = Alice (the user who minted it)
audit entry      = undefined
```

So the row records it — `api_tokens.created_by` is `NOT NULL` and references `accounts.id` — and
**nothing surfaces it**:

* `publicToken()` returns id, name, prefix, scopes and timestamps. Not the creator. An admin
  looking at the organization's tokens cannot tell who minted any of them.
* The `token.created` audit event is recorded against `subjectType: 'token'`, and
  `GET /orgs/:handle/audit` reads `subject_type = 'org'`. The event is therefore in the table and
  in nobody's trail except the creator's own `/me/audit`.

A column no route reads is a record, not a trace. The answer to "does it already trace back" is
**half**, which is why this is a task rather than a note.

## The plan

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This file and its index row | `client-reactjs` | `chore/token-provenance-plan` | `.agents/memory/` | |
| 2 | The role belongs to the card | Move the chip inside, where the grid cannot take it | `client-reactjs` | `fix/org-card-role` | `src/routes/org/Organization.tsx`, `test/` | |
| 3 | Who minted this token | Creator on the token payload; the org's own audit trail carries the event | `server-expressjs` | `feat/token-provenance` | `src/modules/auth/routes.ts`, `wiki/information/api-contract.md`, `test/` | |
| 4 | Release | Changelog, state, close the server's record | `server-expressjs` | `chore/token-provenance-release` | `wiki/logs/`, `.agents/memory/state/` | |
| 5 | Show who minted it | The organization's token page names the creator | `client-reactjs` | `feat/token-creator` | `src/components/TokenManager.tsx`, `src/api/types.ts`, `test/` | |
| 6 | Release | Changelog, state, close this record | `client-reactjs` | `chore/token-provenance-release` | `wiki/logs/`, `.agents/memory/state/` | |

Tasks 1 and 2 depend on nothing. Task 5 reads a field that task 3 adds, so it merges after it.

## Entries

### Task 1 — chore/token-provenance-plan

This record and its row in `.agents/index/memory-index.md`. Nothing else.

### Task 2 — fix/org-card-role

The role is a `.badge badge--accent` inside the card — the same idiom the members page uses for a
role — wrapped in a plain span so it sizes to its text rather than stretching across the card as
a flex item would.

Verified in Chromium rather than by reading the CSS: the grid's items went from
`[card, chip-row]` to `[card, card]`, and the badge's box is inside the card's at 1280px and
390px. The test now asserts containment with `within(card)`, which the previous `getByText` could
not: it passed while the chip was in the next cell.
