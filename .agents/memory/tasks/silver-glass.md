---
name: memory-tasks-silver-glass
description: Task record for adopting the Silver Glass design system in the panel — the confirmed four-task plan, with one entry appended per task as it lands.
---

# Task: Silver Glass

## Goal

The panel renders correctly and looks like nothing. Adopt **Silver Glass** — a white, silver and
transparent design system — as a standing constraint in `.agents/design/`, and apply it to every
page.

## Objective

* `.agents/design/` carries the design system, is indexed, and has a row in `AGENTS.md`.
* Every route uses the system's component vocabulary; no page carries a bespoke hex value.
* No new runtime dependency. Three before, three after.
* `npm run check` green and `npm run build` producing a bundle.

## Detail

* One repository. The server renders nothing and `MCEngine/plugin-manager` is a jar.
* The system is written for a **static documentation site**. Its tokens, glass recipe, component
  vocabulary, overlay rule and accessibility checklist carry over unchanged; its runtime include
  system (§6) and per-page CSS linking (§7) do not, because this is a Vite SPA with one
  component tree and one entry point. The mapping is recorded rather than left implicit.
* The version does not move.

## Decisions

| Decision | Value |
|---|---|
| Location | `.agents/design/`, as instructed — with its own index, since a scope with no index routes nowhere |
| The system document | Kept as written; it is meant to be dropped into any repository unchanged |
| §6 runtime includes | Not implemented. `App.tsx` is the shared chrome and `NavLink` knows the active route |
| §7 CSS layering | Import order in `main.tsx` rather than per-page `<link>` tags |
| Dependencies | None added. Plain CSS with custom properties |
| Mobile menu | Opaque, `backdrop-filter: none` — it covers content and is nested inside a blurred header |

Recorded in [`../decisions/design-system-adoption.md`](../decisions/design-system-adoption.md).

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This file, its decision, and the index rows | `client-reactjs` | `chore/silver-glass-plan` | `.agents/memory/`, `.agents/index/` | MCEngine/client-reactjs#10 |
| 2 | The design system | `.agents/design/`, its index, its `AGENTS.md` row | `client-reactjs` | `docs/design-system` | `.agents/design/`, `.agents/index/`, `AGENTS.md` | MCEngine/client-reactjs#11 |
| 3 | Apply it to every page | Stylesheets, the shell, the shared components, every route | `client-reactjs` | `feat/panel-design` | `src/styles/`, `src/App.tsx`, `src/components/`, `src/routes/`, `index.html` | MCEngine/client-reactjs#12 |
| 4 | Release | Logs, this table, the record closed | `client-reactjs` | `chore/silver-glass-release` | `wiki/logs/0/0/0/`, `.agents/` | MCEngine/client-reactjs#13 |

## Entries

### Task 1 — chore/silver-glass-plan

Wrote the record and the decision before any CSS, because the interesting choice is not the
palette — it is which parts of a system written for static HTML pages apply to a single-page
application, and which would be cargo cult if copied.

**Two sections do not survive the move.** §6 fetches `partials/header.html` at runtime so
navigation lives in one file; `App.tsx` already is that file, and `NavLink` already knows which
link is active. §7 links four stylesheets per page in order; Vite has one entry, so the same
layering is import order. Both are recorded rather than silently skipped, so a later reader does
not go looking for `js/site.js`.

**The panel being unstyled was planned, not neglected.** Three earlier records say the markup is
semantic and unstyled on purpose so the look is applied to every page at once. This is the task
they were deferring to, which is why task 3 touches every route rather than a few.

Next task depends on: nothing beyond this record.

### Task 3 — feat/panel-design

Three stylesheets, a rebuilt shell, five restyled shared components, and every route composed
from the system's vocabulary. No new dependency: three runtime dependencies before, three after.

**`src/styles/{main,layout,components}.css`, imported in that order from `main.tsx`** — the
layering §7 describes, expressed the way a single entry point allows. `main.css` is the only
file in the repository containing a hex value, which is what keeps a rebrand to one file; a
sweep for `#rrggbb` outside `src/styles/` comes back empty, and so does one for inline `style=`.

**The shell became the design's chrome without the design's runtime.** `App.tsx` renders
`.site-header` > `.nav`, a `.nav__toggle` that is a real `<button>` with `aria-expanded` and
`aria-controls`, `NavLink` supplying `.is-active`, and a `.site-footer`. §6's `partials/`,
`js/site.js` and `{{ROOT}}` are not here and are not wanted.

**Four corrections the work itself forced:**

* **The card link's accessible name regressed and the tests caught it.** Making the whole card
  the link meant its name became the title, the summary and the "View →" affordance run
  together — which is what a screen reader reads out. Fixed in the component with an explicit
  `aria-label`, not by loosening the test, and a new assertion (`toHaveAccessibleName`) holds it
  exactly.
* **The checksum was rendered on the `.secret` surface**, whose dashed sponsor border means
  "shown once and then gone". A checksum is public — the opposite. Added `.mono-block`, neutral,
  for a long monospace value that is not a secret.
* **`display: contents` was inline on three `<li>` elements.** It belongs in the stylesheet, and
  now is, with the reason: the `<li>` between a grid and a card would otherwise take the grid
  cell.
* Two `<main>` elements in `AccountSettings` needed the container class, not one — the loading
  branch is a page too.

**The overlay rule was implemented and then checked, not just implemented.** The mobile menu is
nested inside a header that has `backdrop-filter`; a child with its own blur can have its
background paint suppressed where the property is unsupported, letting the page bleed through.
Computed style in a real browser: `rgba(255, 255, 255, 0.98)` with `backdrop-filter: none`.

Verified in Chromium against the built bundle, not just compiled:

* `npm run check` green — 50 tests across five suites, one new.
* `npm run build` — 302.81 kB JS (92.72 kB gzipped) and 13.03 kB CSS (3.50 kB gzipped).
* Four pages rendered and screenshotted at 1280px and at 390px: the catalogue, a product page, a
  sign-in form, and the mobile menu open over content.
* **`documentElement.scrollWidth > innerWidth` is `false` on every page at both widths** — §5
  states the body must never scroll horizontally, so it is asserted rather than assumed.

Next task depends on: nothing. The release is last.

### Task 4 — chore/silver-glass-release

Filled the `PR` column, wrote this entry, and brought `repository-state.md` current.

**The version did not move.** `0.0.0`, and `wiki/logs/0/0/0/` already existed.

**What this plan changes about writing a page here.** Styling is no longer absent-by-design, so
"add a page" now means composing it from `.agents/design/`'s vocabulary. The `AGENTS.md` row
added in task 2 fires on exactly that, and `panel-application.md` carries the six rules a new
page has to hold to.

Next task depends on: nothing. This closes the record.

## Status

**Done.** All four tasks landed; the table above carries the pull request each merged through.
