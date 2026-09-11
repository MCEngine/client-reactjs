# Changelog — 0.0.0

**2026-09-11** — the MCPluginManager web panel: signing in across devices, administering a
namespace or an organization, publishing versioned product jars, minting the scoped tokens a
Minecraft server downloads with, and telling each registered server what to run.

Pre-release. This version covers the repository from its initial commit up to the first
release. Nothing has shipped; `0.0.0` has not moved and the first version that ships is the
one that asks.

## Added

- `AGENTS.md`, `.claude/CLAUDE.md`, and the `.agents/` tree — six indexes, the repository
  rules hub, the agent repository map, and the memory tree. The repository consumes the
  shared instruction set over the `lxagents-agents-base` connector as a Mode B consumer and
  declares no overrides.
- `wiki/information/overview.md` — what this panel is, the service it renders, and the
  routes it will expose.
- This changelog, and the version-directory log structure it sits in.
- The Vite build: `package.json` at `0.0.0`, strict TypeScript, Vitest with Testing Library,
  and three runtime dependencies — React, React DOM and the router.
- `src/api/` — the one place that calls `fetch`, refreshing once on a 401 and retrying, with
  the server's payload shapes mirrored as types.
- `src/auth/AuthContext.tsx` — the access token held in memory only, with a session recovered
  on load from the HttpOnly refresh cookie the panel cannot read.
- `src/components/ConfirmButton.tsx` — a destructive action behind an explicit confirm with a
  cancel beside it, and a typed phrase where the server also requires one.
- The shell, a product list and a not-found route.
- `wiki/environments/setup.md` and `wiki/environments/env.md`.
- Sign in and register, account settings with the handle cooldown, multiple email addresses,
  the signed-in device list, and API token management — a minted token shown once and never
  stored.
- Creating an organization, and managing its members, roles and storage usage.
- The fleet view: registering a server (its key shown once, for `config.yml`) and seeing the
  drift between what each server has installed and what it should have.
- The four product routes: `/product/:product_id/` showing the id, name, detail and
  publishing organization — and the source repository only when it is set;
  `/product/:product_id/settings/`; `/product/:product_id/setting/update/` with one file
  input and the remaining quota; and `/product/:product_id/setting/general/` with the
  thirty-day id cooldown and a delete that asks for the id and then sends it.

- `Dockerfile`, `docker/default.conf.template` and `.dockerignore` — a two-stage image that
  typechecks and bundles with Node, then serves the result from
  `nginxinc/nginx-unprivileged` on port 8080 with no Node in the runtime at all. nginx serves
  the bundle **and** proxies `/api` to the server, because the panel's requests are relative and
  its refresh cookie depends on one origin; the upstream is set per container.
- `wiki/environments/deployment.md` — building and running the image, why the API is proxied
  rather than addressed directly, what nginx does with each kind of request, and what a
  cross-origin API would cost.

## Changed

- **The publish form sends `PUT /api/v1/products/:id/versions/:version`**, with the version in
  the path and out of the body — the server refuses a body version rather than ignoring it. An
  empty version is caught before it becomes a path segment, because `required` is satisfied by
  whitespace and an empty segment would 404 with nothing useful to read.
- `README.md` rewritten from a bare title into an overview: what the panel is, its place in
  the platform, and links into `wiki/`.
