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
| 1 | Task record | This file and its index row | `client-reactjs` | `chore/version-picker-plan` | `.agents/memory/`, `.agents/index/` | MCEngine/client-reactjs#14 |
| 2 | Pick a version from a dropdown | The picker, and the tests that change with it | `client-reactjs` | `feat/version-picker` | `src/routes/product/ProductPage.tsx`, `test/` | MCEngine/client-reactjs#15 |
| 3 | Release | Logs, this table, the record closed | `client-reactjs` | `chore/version-picker-release` | `wiki/logs/0/0/0/`, `.agents/` | MCEngine/client-reactjs#16 |

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

### Task 2 — feat/version-picker

The version list became a labelled `<select>` plus one version's detail. Same badges, chips,
download link, checksum and changelog — for whichever version is selected.

**A separate `VersionPicker` component, because the selection is state** and the render prop
inside `AsyncBoundary` cannot call a hook.

**Nothing is recomputed from the server's answer.** The default is the row the server marked
`is_latest`, falling back to the first it sent; the options keep the order they arrived in. The
panel sorting again would be a second implementation of `version_norm`, and the browser would
eventually be the copy that is wrong.

**The test that asserted the old behaviour was rewritten, not deleted, and covers more than
before.** It now checks the option order, that the latest is selected on arrival, that its
checksum is shown — and that the *unselected* version's checksum is **not on the page**. That
last assertion is the one that matters: without it the old list could still be rendering below
and nothing would fail. A second test picks the other version and asserts the detail swaps and
the `latest` badge goes away.

**A suspected accessibility defect was investigated and turned out not to exist.** Playwright
reported the select's name as `"Version2.20.1 (latest) —"`, which looked like the selected
option bleeding into the accessible name of every wrapped `<label>` in the panel. Checking
Chromium's own computation instead — an exact-name role query — the name is exactly `"Version"`,
for both the wrapped-label and `for=`-attribute patterns. The label pattern was left alone. The
Playwright message was its own substring matching, which also matched the
`aria-labelledby="versions-heading"` section.

Verified in Chromium against the built bundle:

| Check | Result |
|---|---|
| `npm run check` | green — 51 tests across five suites, one more than before |
| Page height, 2 versions | 1274px |
| Page height, **12** versions | **1274px** — the page no longer grows with the catalogue |
| Horizontal overflow, 1280px and 390px | none |
| Options rendered | `2.20.1 (latest) — release`, `2.19.0 — beta`, in the server's order |
| Selected on arrival | `2.20.1` |
| After picking `2.19.0` | download link becomes `AcmeTools-2.19.0.jar` |

The constant height is the whole point, and it is measured rather than asserted: twelve versions
render in exactly as much space as two.

Next task depends on: nothing. The release closes the record.

### Task 3 — chore/version-picker-release

Filled the `PR` column, wrote this entry, and brought `repository-state.md` current.

**The version did not move.** `0.0.0`, and `wiki/logs/0/0/0/` already existed.

**Still open, and named in task 1 rather than discovered here:** a version is not linkable. A
`?version=` query parameter would make one shareable, which is a real want — but it is a new URL
surface on a public page and was not what this task was for.

Next task depends on: nothing. This closes the record.

## Status

**Done.** All three tasks landed; the table above carries the pull request each merged through.
