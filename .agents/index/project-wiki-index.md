---
name: project-wiki-index
description: Index of wiki/ — human-facing documentation for this repository, excluding the versioned logs.
---

# Project Wiki Index

**Scope:** `wiki/`, except `wiki/logs/`
**Parent:** [root-index](root-index.md)

Any page added to or removed from `wiki/` is reflected here in the same commit. Pages here
are plain markdown with no frontmatter. This index never writes into `.agents/`.

`wiki/logs/` has its own index — see [`logs-index.md`](logs-index.md).

## Information

| File | Purpose |
|---|---|
| [`information/overview.md`](../../wiki/information/overview.md) | What this panel is, the service it renders, and the routes it will expose. |

## Environments

| File | Purpose |
|---|---|
| [`environments/setup.md`](../../wiki/environments/setup.md) | Requirements, the commands, why `/api` is proxied rather than pointed at another port, and how the tests stub the transport. |
| [`environments/env.md`](../../wiki/environments/env.md) | Every environment variable, and why none of them may be secret. |
| [`environments/deployment.md`](../../wiki/environments/deployment.md) | Running the panel as a container: the two build stages, why nginx proxies `/api`, what it does with each kind of request, and the cost of a cross-origin API. |
