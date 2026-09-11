---
name: memory-index
description: Index of .agents/memory/ — task records, durable decisions, and current repository state.
---

# Memory Index

**Scope:** `.agents/memory/`
**Parent:** [root-index](root-index.md)

Any file added to or removed from `.agents/memory/` is reflected here in the same commit.
This index lists memory files only — never rules, never documentation.

Memory is written freely and automatically; it is the one tree exempt from the discovery
protocol's approval gate. See `{shared}/rules/memory-policy.md`.

## State

| File | Purpose |
|---|---|
| [`state/repository-state.md`](../memory/state/repository-state.md) | What exists in this repository right now, what does not yet, and the next obvious step. |

## Tasks

| File | Purpose |
|---|---|
| [`tasks/mcpluginmanager-platform.md`](../memory/tasks/mcpluginmanager-platform.md) | This repository's entries in the MCPluginManager platform plan. The plan table itself lives in `MCEngine/plugin-manager`. |
| [`tasks/version-route.md`](../memory/tasks/version-route.md) | This repository's entries in the version-route plan. The plan table itself lives in `MCEngine/server-expressjs`. |
| [`tasks/container-image.md`](../memory/tasks/container-image.md) | This repository's entries in the container-image plan. The plan table itself lives in `MCEngine/server-expressjs`. |
| [`tasks/silver-glass.md`](../memory/tasks/silver-glass.md) | Adopting the Silver Glass design system: the four-task plan, and one entry per task. |
| [`tasks/version-picker.md`](../memory/tasks/version-picker.md) | Replacing the product page’s full version list with a dropdown: the three-task plan, and one entry per task. |
| [`tasks/demo-and-landing.md`](../memory/tasks/demo-and-landing.md) | This repository's entries in the landing-page and demo-account plan. The plan table itself lives in `MCEngine/server-expressjs`. |
| [`tasks/same-origin-api.md`](../memory/tasks/same-origin-api.md) | Documenting `VITE_API_BASE_URL` and `API_UPSTREAM` after a cross-origin deployment broke: the confirmed five-task plan across two repositories. |
| [`tasks/api-proxy-reachability.md`](../memory/tasks/api-proxy-reachability.md) | The panel's nginx resolving its upstream on a platform that is not Docker: the confirmed six-task plan across two repositories. |
| [`tasks/upstream-redirect.md`](../memory/tasks/upstream-redirect.md) | The proxy handing the browser's `Host` to a public upstream, turning a wrong `API_UPSTREAM` into an infinite redirect loop: the confirmed three-task plan. |
| [`tasks/org-nav.md`](../memory/tasks/org-nav.md) | A nav entry for the organization page, and why it points at the create page rather than a list: the confirmed three-task plan. |
| [`tasks/org-management.md`](../memory/tasks/org-management.md) | This repository's entries in the organization management plan. The plan table itself lives in `MCEngine/server-expressjs`. |
| [`tasks/token-provenance.md`](../memory/tasks/token-provenance.md) | The role chip escaping its card, and an organization token whose creator is recorded but reaches nobody: the confirmed six-task plan. |

## Decisions

| File | Purpose |
|---|---|
| [`decisions/design-system-adoption.md`](../memory/decisions/design-system-adoption.md) | Why Silver Glass lives in `.agents/design/`, what a React SPA replaces in its static-site sections, and why no CSS dependency was added. |
| [`decisions/same-origin-api.md`](../memory/decisions/same-origin-api.md) | Why the panel and the API are one origin, what a cross-origin build actually breaks, and why `VITE_API_BASE_URL` and `API_UPSTREAM` are not interchangeable. |
