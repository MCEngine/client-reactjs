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

## Decisions

| File | Purpose |
|---|---|
| [`decisions/design-system-adoption.md`](../memory/decisions/design-system-adoption.md) | Why Silver Glass lives in `.agents/design/`, what a React SPA replaces in its static-site sections, and why no CSS dependency was added. |
