---
name: memory-state-repository-state
description: What this repository contains right now, what it does not yet, and the next obvious step.
---

# Repository state

Overwritten in place, always current.

## As of the 0.0.0 pre-release

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

Plus the four `/product/*` pages: `src/routes/product/`.

**Ships as a container.** `Dockerfile` builds the bundle with Node and serves it from
`nginxinc/nginx-unprivileged` on port 8080, with `docker/default.conf.template` proxying `/api`
to `API_UPSTREAM` — the panel and the API are one origin by design, because the refresh cookie
is `HttpOnly`. `wiki/environments/deployment.md` has the detail.

**Styled, as of the Silver Glass pass.** `src/styles/{main,layout,components}.css`, imported in
that order from `main.tsx`. `main.css` is the only file carrying a hex value. The system and the
six rules a new page must hold to are in `.agents/design/`, which has an `AGENTS.md` row that
fires on writing anything a person looks at.

**Does not exist:** a CI workflow; none was asked for. No pagination controls, though the API
client and the payload types both carry cursors.

**The panel is otherwise complete against `wiki/information/api-contract.md`.**

## Stack

**Installed:** Vite 6, React 19, React Router 7, TypeScript 5.8 in strict mode with
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, Vitest with Testing Library and
jsdom. Three runtime dependencies — React, React DOM and the router. No state library, no
data-fetching library, no component library: the panel holds no state of its own, and a
twelve-line `useAsync` covers what it needs from a read.

**Verified:** `npm run check` green — `tsc --noEmit` clean and 51 tests across five suites.
`npm run build` produces 303.37 kB of JS (92.86 kB gzipped) and 13.03 kB of CSS (3.50 kB
gzipped). The built bundle was also rendered in Chromium at 1280px and 390px: no page scrolls
horizontally, and the mobile menu computes to `rgba(255, 255, 255, 0.98)` with
`backdrop-filter: none`, which is the overlay rule holding rather than being asserted.

## Next step

**Five plans are finished and all five records are closed**: the twenty-task platform plan
(`../tasks/mcpluginmanager-platform.md`, table in `MCEngine/plugin-manager`), the version-route
plan (`../tasks/version-route.md`, table in `MCEngine/server-expressjs`), which moved publishing
to `PUT /api/v1/products/:id/versions/:version`, the container-image plan
(`../tasks/container-image.md`, table also in `MCEngine/server-expressjs`), the Silver Glass
plan (`../tasks/silver-glass.md`, table here), and `../tasks/version-picker.md`, which collapsed
the product page's version list into a dropdown. Follow-up work opens a new record rather than
appending to any of them.

The candidates, in the order they matter: making a version linkable with a `?version=`
parameter, which the picker made worth wanting; pagination controls, since the client and the payload types already
carry the cursors; a sign-in through an OAuth provider, once `MCEngine/server-expressjs` has a
provider redirect to send anyone to; and a CI workflow that builds and pushes the image the
Dockerfile now defines. A first shipping version is a version claim and therefore asks first.
