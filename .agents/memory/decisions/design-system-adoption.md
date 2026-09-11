---
name: memory-decisions-design-system-adoption
description: Why Silver Glass lives in .agents/design/ rather than wiki/, what a React SPA replaces in its static-site sections, and why the panel still ships no CSS dependency.
---

# Adopting Silver Glass

The panel had **no styling at all**. That was deliberate — the markup was written semantic and
unstyled so a look could be applied to every page at once rather than reinvented per page. This
is that pass.

## Why `.agents/design/` and not `wiki/`

The placement rules say human documentation goes to `wiki/` and agent knowledge to
`.agents/wiki/`. A design system is neither, exactly: it is a **standing constraint on what gets
written**, in the same way the branching strategy constrains how a branch is named. It is closer
to a rule than to a page.

The user named the location, so `.agents/design/` it is, and it gets its own index — a scope with
no index is a scope nothing routes to. Placement authority is `{shared}/rules/directories.md`;
this is a local scope it does not currently name, which is worth raising there rather than
deciding here twice.

## The system is project-agnostic; two of its sections are not

`silver-glass.md` is kept as written, because it is the source of truth for the visual language
and is meant to be dropped into any repository unchanged. But it describes a **static
documentation site**, and two sections do not survive contact with a Vite SPA:

* **§6, the runtime include system.** Header and footer as `partials/*.html` fetched by
  `js/site.js`, with a `{{ROOT}}` token and `window.SITE_ROOT`. This panel already has one
  component tree and one router; `App.tsx` *is* the shared chrome, and `NavLink` already knows
  which link is active. Re-implementing §6 here would add a `fetch()` on every page load to
  solve a problem React does not have.
* **§7, the CSS file organization.** `css/shared/*.css` linked per page in order. Vite has one
  entry, so the same layering is expressed as import order in `main.tsx`.

Everything else — tokens, the glass recipe, the component vocabulary, the overlay rule, the
accessibility checklist — applies unchanged. `panel-application.md` records the mapping so the
next reader does not have to work out which half is which.

## Still no dependency

Three runtime dependencies before this change; three after. The system is plain CSS with custom
properties, which is what makes it portable — a component library would have brought its own
tokens and its own opinions, and the panel would have inherited both.

No `@import`, no CSS-in-JS, no preprocessor. Three stylesheets imported in order from
`main.tsx`, which is the layering §7 asks for expressed the way this build already works.

## The overlay rule is the one that will be broken by accident

§3 says an overlay that **covers page content** — the mobile navigation panel — must be opaque
and must not rely on `backdrop-filter`. The reason is specific: a child with `backdrop-filter`
nested inside a parent that also has one can have its background paint suppressed where the
property is unsupported or disabled, and the content behind bleeds through.

The mobile menu here is inside the sticky glass header, which is exactly that nesting. It is
solid `--surface-solid` with `backdrop-filter: none`, and the rule is written in the stylesheet
next to it rather than only in the design document.
