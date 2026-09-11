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

- `src/styles/` and `.agents/design/` — the **Silver Glass** design system: white, silver and
  transparent, with translucent panels, hairline borders and a fixed silver gradient field. The
  panel had no styling at all until now, deliberately, so the look could be applied to every
  page at once. Tokens, layout and components in three stylesheets; the system and the rules a
  new page must hold to in `.agents/design/`, with an `AGENTS.md` row that fires on writing
  anything a person looks at.

- `/` is a landing page: what MCPluginManager is, how the panel, the server and the plugin fit
  together, what it does differently, and where to start. The catalogue moved to `/products`.

- The sign-in page shows a demo account's credentials when the server advertises one on
  `GET /api/v1/meta`, with a button that fills the form — and says the account is shared.
  Registering is still offered beside it.
- The register form confirms the password. Two that disagree are refused in the panel, before
  any request, because a typo there is an account nobody can sign in to.

## Changed

- **The product page shows one version at a time, chosen from a dropdown**, instead of
  rendering every published version in full. A product with twelve versions is now exactly as
  long as one with two. The latest is selected on arrival; the order and the choice of latest
  are the server's, not recomputed here.

- **The publish form sends `PUT /api/v1/products/:id/versions/:version`**, with the version in
  the path and out of the body — the server refuses a body version rather than ignoring it. An
  empty version is caught before it becomes a path segment, because `required` is satisfied by
  whitespace and an empty segment would 404 with nothing useful to read.
- `README.md` rewritten from a bare title into an overview: what the panel is, its place in
  the platform, and links into `wiki/`.
- **`wiki/environments/env.md` now documents the runtime variables too, and says to leave
  `VITE_API_BASE_URL` empty.** The page listed one key — the build-time one — so a reader
  looking for the variable that points the panel at its API found the wrong one and set it. A
  cross-origin build is not a supported configuration: the server emits no `Access-Control-*`
  header and hardcodes the refresh cookie to `SameSite=Lax`, so the browser gets no answer to
  its preflight and never sends the cookie. `deployment.md` gained the shape `API_UPSTREAM`
  must take, what each malformed value does, and a warning that a hosting platform's single
  environment panel can feed the image build.

