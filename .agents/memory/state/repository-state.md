---
name: memory-state-repository-state
description: What this repository contains right now, what it does not yet, and the next obvious step.
---

# Repository state

Overwritten in place, always current.

## As of the agent instruction system landing

`MCEngine/client-reactjs` is a **Mode B consumer** of the shared instruction set served by
the `lxagents-agents-base` connector. It declares no overrides.

**Exists:** `AGENTS.md`, `.claude/CLAUDE.md`, the six indexes under `.agents/index/`,
`.agents/rules/repository.md`, `.agents/wiki/context/repository-map.md`, this memory tree,
`wiki/information/overview.md`, `wiki/logs/0/0/0/CHANGELOG.md`, `README.md`, and `LICENSE`
(MIT, MCEngine, 2026 — already present, not written by the setup).

**Does not exist:** every line of code. No `package.json`, no `src/`, no `index.html`, no
`vite.config.ts`, no `.gitignore`, no lockfile, no tests, no CI. The version carrier itself
— `version` in `package.json` — does not exist yet either; `0.0.0` is the agreed value for
when it does.

## Stack

Decided in the plan, not yet installed: Vite, React and TypeScript, with a router and a
typed API client over `@mcengine/server-expressjs`. The panel holds no state of its own.

## Next step

The React skeleton: `package.json` at `0.0.0` naming `@mcengine/client-reactjs`, the Vite
and TypeScript configuration, the router, the API client and the auth context. It waits on
the server's API contract, which is documented before either client is written.

The full ordered plan is in `MCEngine/plugin-manager` at
`.agents/memory/tasks/mcpluginmanager-platform.md`.
