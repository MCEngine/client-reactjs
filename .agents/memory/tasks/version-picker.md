---
name: memory-tasks-version-picker
description: Task record for replacing the product page's full version list with a dropdown — the confirmed three-task plan, with one entry appended per task as it lands.
---

# Task: Pick a version from a dropdown

## Goal

The product page renders **every** published version in full — badges, compatibility chips, a
download button, a 64-character checksum and a changelog each. A product with twenty versions is
a page nobody scrolls to the bottom of, and the thing almost everyone wants is at the top only by
luck.

## Objective

* One version's detail is shown at a time, chosen from a dropdown.
* The latest is selected on arrival, because it is what a person almost always wants.
* Nothing else about the section changes: the same badges, chips, download link, checksum and
  changelog, for whichever version is selected.
* `npm run check` green, and the page still renders in a browser at both widths.

## Detail

* One repository, one component: `src/routes/product/ProductPage.tsx`.
* **The panel does not re-sort.** The server orders versions by `version_norm`, which is why
  `1.10.0` is above `1.9.0` rather than below it; sorting again here would be a second
  implementation of a server rule, and the browser would eventually be the copy that is wrong.
* The version does not move.

## Decisions

| Decision | Value |
|---|---|
| Control | A native `<select>`, labelled — not a custom listbox |
| Default | The version the server marks `is_latest`, falling back to the first row |
| Order | The server's, unchanged |
| Count | Shown next to the picker, so the dropdown does not hide how much is there |
| URL state | **Not** added. See below |

**No `?version=` in the URL, deliberately.** It would make a version linkable, which is a real
want — but it is a new URL surface on a public page and it is not what this task is for. Named
here so the next session treats it as a candidate rather than an oversight.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This file and its index row | `client-reactjs` | `chore/version-picker-plan` | `.agents/memory/`, `.agents/index/` | |
| 2 | Pick a version from a dropdown | The picker, and the tests that change with it | `client-reactjs` | `feat/version-picker` | `src/routes/product/ProductPage.tsx`, `test/` | |
| 3 | Release | Logs, this table, the record closed | `client-reactjs` | `chore/version-picker-release` | `wiki/logs/0/0/0/`, `.agents/` | |

## Entries

### Task 1 — chore/version-picker-plan

Wrote the record first. The change is small enough that the only thing worth deciding in advance
is what the page does when it arrives — and "the latest, selected already" is a different product
from "the newest row, whichever that is".

**An existing test asserts the old behaviour and will change.** `lists versions newest first,
with the checksum a client verifies against` checks that both versions render in order. Under a
picker only one renders, so the ordering assertion moves to the `<option>` elements and the
checksum assertion gains a second half: the unselected version's checksum must **not** be on the
page. That is stronger than what it replaces, which is the bar for changing a test rather than
deleting coverage.

Next task depends on: nothing beyond this record.
