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
| 1 | Task record | This file, its decision, and the index rows | `client-reactjs` | `chore/silver-glass-plan` | `.agents/memory/`, `.agents/index/` | |
| 2 | The design system | `.agents/design/`, its index, its `AGENTS.md` row | `client-reactjs` | `docs/design-system` | `.agents/design/`, `.agents/index/`, `AGENTS.md` | |
| 3 | Apply it to every page | Stylesheets, the shell, the shared components, every route | `client-reactjs` | `feat/panel-design` | `src/styles/`, `src/App.tsx`, `src/components/`, `src/routes/`, `index.html` | |
| 4 | Release | Logs, this table, the record closed | `client-reactjs` | `chore/silver-glass-release` | `wiki/logs/0/0/0/`, `.agents/` | |

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
