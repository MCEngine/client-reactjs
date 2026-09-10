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

Plus the build and the shell: `package.json` (`@mcengine/client-reactjs` at `0.0.0`),
`tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `.env.example`,
`package-lock.json`, `src/` and `test/`, and `wiki/environments/{setup,env}.md`.

Plus the account, organization and fleet pages: `src/routes/account/`, `src/routes/org/`,
`src/routes/fleet/`, `src/routes/RequireAuth.tsx`, and the `Form`, `Field` and
`CooldownNotice` components.

**Does not exist:** the `/product/*` pages — the product page itself, its settings landing,
the version upload form, and the general page with the id cooldown and the confirmed delete.
No styling — the markup is semantic and unstyled on purpose. No CI workflow.

## Stack

**Installed:** Vite 6, React 19, React Router 7, TypeScript 5.8 in strict mode with
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, Vitest with Testing Library and
jsdom. Three runtime dependencies — React, React DOM and the router. No state library, no
data-fetching library, no component library: the panel holds no state of its own, and a
twelve-line `useAsync` covers what it needs from a read.

**Verified:** `npm run check` green — `tsc --noEmit` clean and 34 tests across four suites.
`npm run build` produces a 285 kB bundle, 89 kB gzipped.

## Next step

The product pages: `/product/:product_id/`, `/product/:product_id/settings/`,
`/product/:product_id/setting/update/`, and `/product/:product_id/setting/general/` with the
thirty-day id cooldown and a delete that requires the id to be repeated.

The full ordered plan is in `MCEngine/plugin-manager` at
`.agents/memory/tasks/mcpluginmanager-platform.md`.
