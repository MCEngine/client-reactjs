---
name: design-panel-application
description: How this React single-page application applies Silver Glass — the class vocabulary in use, what replaces its runtime includes and per-page CSS linking, and the rules that bind when adding a page.
---

# Applying Silver Glass here

[`silver-glass.md`](silver-glass.md) is the visual language and is binding. It is written for a
**static documentation site**; this is a Vite single-page application. Two of its sections
therefore describe machinery this repository does not have, and this page records what stands in
their place.

Everything not named below applies unchanged: the tokens (§2), the glass recipe and the overlay
rule (§3), the component vocabulary (§4), the layout and responsive rules (§5), and the
accessibility checklist (§9).

## §6, the runtime include system — not implemented

The system fetches `partials/header.html` and `partials/footer.html` at runtime so navigation
lives in one file, driven by `window.SITE_ROOT` and `window.PAGE_SECTION`.

`src/App.tsx` already **is** that one file: it renders the header, the routes and the footer for
every page, and `NavLink` from React Router already sets the active class. Implementing §6 here
would add a `fetch()` on every page load to solve a problem that does not exist.

So: **no `partials/`, no `js/site.js`, no `{{ROOT}}` token, no `SITE_ROOT` global.** A reader
looking for them should stop here.

| §6 concept | Here |
|---|---|
| `partials/header.html` | The `<header class="site-header">` block in `src/App.tsx` |
| `partials/footer.html` | The `<footer class="site-footer">` block in `src/App.tsx` |
| `{{ROOT}}` + `window.SITE_ROOT` | Router paths are absolute; there is nothing to rebase |
| `window.PAGE_SECTION` + `.is-active` | `NavLink`'s `isActive`, which sets `.is-active` |
| The mobile menu wiring | React state in `App.tsx`, on a real `<button>` |

## §7, the CSS file organization — expressed as import order

The system links four stylesheets per page in a fixed order. Vite has one entry, so the same
layering is import order in `src/main.tsx`:

```ts
import './styles/main.css';        // :root tokens + base elements
import './styles/layout.css';      // header, nav, footer, breadcrumbs
import './styles/components.css';  // panels, cards, tables, badges, buttons, callouts
```

There is no per-section layer and there should not be one until a page genuinely needs bespoke
layout. Nothing so far has.

## The class vocabulary actually in use

Composed from §4 rather than invented. A page that needs something not on this list should
compose it from these before anything new is written.

| Where | Classes |
|---|---|
| Every page | `.container` (`.narrow` for text-heavy pages), `.panel`, `.eyebrow`, `.lead` |
| Lists of things | `.card-grid` > `.card` (`a.card` where the whole card is the link), with `.card__title`, `.card__desc`, `.card__more` |
| Facts about one thing | `.deflist` > `.deflist__row` > `.deflist__term` |
| Tables | `.table-wrap` > `table` — always, so a wide table scrolls inside its own box |
| Status | `.badge` (`--accent`, `--ok`, `--warn`), `.chip` / `.chip-row` |
| Actions | `.btn` (`--primary`, `--sponsor`), `.btn-row` |
| Notices | `.callout` (`--info`, `--warn`, `--danger`) |
| Context trail | `.breadcrumbs` |

## Rules that bind when adding a page

1. **Never write a hex value in a component.** Every color comes from a token in §2. If a token
   is missing, add it to `:root` in `main.css` rather than inlining one.
2. **Wrap the page in `<main class="container">`**, with exactly one `<h1>`.
3. **Wrap every table in `.table-wrap`.** The page body must never scroll horizontally.
4. **An overlay that covers page content is opaque.** §3's rule, and the mobile menu is the case
   that will otherwise be got wrong: it is nested inside a header that has `backdrop-filter`, and
   a child with its own blur can have its background paint suppressed where the property is
   unsupported — letting the page behind bleed through. It uses `--surface-solid` and
   `backdrop-filter: none`, and the stylesheet says so where it is defined.
5. **Forms go through `src/components/Form.tsx`**, which already renders its error and success
   lines as `.callout--danger` and `.callout--info`. A bare `<form>` reimplements that badly.
6. **Loading and failure go through `AsyncBoundary`**, which renders `.async-status` and
   `.callout--danger`. Do not write a bespoke spinner.

## What this does not change

No dependency was added. Three runtime dependencies before the design system and three after —
React, React DOM and the router. The system is plain CSS with custom properties, which is the
whole reason it is portable.
