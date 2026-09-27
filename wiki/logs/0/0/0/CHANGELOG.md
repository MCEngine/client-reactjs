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
- **The image could not find its API anywhere but a Docker network.** nginx needs a `resolver`
  for the variable `proxy_pass`, does not read `/etc/resolv.conf` to get one, and the image
  defaulted it to `127.0.0.11` — Docker's embedded DNS. On any other platform every `/api`
  request ran to a thirty-second timeout and returned `502` from an API that was healthy one hop
  away. `docker/10-api-upstream.envsh` now derives the resolver from `/etc/resolv.conf`,
  `resolver_timeout` is five seconds, and `API_UPSTREAM` accepts a scheme: `https://host`
  proxies over TLS with SNI and certificate verification, which is the only way to reach an API
  whose platform lets it send private traffic but not receive it. `test/docker.test.ts` sources
  the script the way the base image does, so the whole thing is covered without a Docker daemon.
- **A `502`, `503` or `504` with no error envelope now reads as the server being unreachable**,
  naming `API_UPSTREAM`, instead of "The server returned 502." A failure without an envelope was
  written by the proxy in front of the API rather than by the API; one *with* an envelope keeps
  the service's own message.
- **The proxy no longer hands the browser's `Host` to the upstream, and no longer forwards an
  upstream's redirect.** `Host: $host` meant a public API reached over plaintext answered
  `301 https://<the panel's own hostname><path>`, which the browser followed back to the panel,
  which proxied again — `ERR_TOO_MANY_REDIRECTS` on every `/api` request. The upstream is now
  asked for its own `Host` (nginx's default), the browser's travels as `X-Forwarded-Host`,
  `X-Forwarded-Proto` reports the scheme the browser used rather than the plaintext one this
  container is addressed with, and a `3xx` from the upstream is answered as `502` carrying the
  service's own error envelope — so the panel shows what is wrong instead of bouncing. The
  container also warns at start-up when `API_UPSTREAM` names a dotted host over plaintext.
- **The nav opens the organization page.** A signed-in person now has *New organization* between
  *Servers* and *Tokens*; before this the only link to `/org/new` was inside a closed accordion
  on the landing page, so the page was unreachable once you had left `/`. It is named for the
  page it opens rather than *Organizations*, because no endpoint lists an account's
  organizations — every other org route needs a handle already known — so there is no list to
  open. Signed-out visitors do not see it: the route is behind `RequireAuth`.
- **An Organization page.** The nav entry is now *Organization* and opens `/org`, which lists the
  organizations you belong to with the role you hold in each, and carries the create form beneath
  them. `/org/new` redirects there, since the landing page published that address.
- **A settings page per subject.** `/org/:handle/settings` is the landing — what the organization
  is, its storage against its quota, and one card per subject — with
  `/org/:handle/setting/general` (display name, description, handle and its thirty-day cooldown),
  `/org/:handle/setting/member` (the members page, moved) and `/org/:handle/setting/token`
  (credentials the organization owns). The same shape a product's settings already use.
  `/org/:handle/members` redirects to the member page.
- `src/components/TokenManager.tsx` — the personal token page and an organization's differ only
  in the collection they read, so the list, the mint form, the scopes and the shown-once rule are
  one component.
- **The role sits inside its organization card.** `.card-grid > li` is `display: contents`, so
  every child of the `li` becomes a grid item — the role chip beside the card was taking a cell
  of its own. It is a badge inside the card now, the same idiom the members page uses.
- **Each token says who minted it.** The organization's token page shows *Minted by `<handle>`*,
  from the `created_by` the server now returns. An organization's token acts as the organization
  and outlives whoever created it, so the list is where that has to be readable.
- **The navigation is a rail on the left**, fixed rather than sticky, so it follows the scroll on
  its own and scrolls inside itself when the list outgrows the viewport. Below 900px it is the
  top bar and drawer it already was: a 236px rail on a 390px screen is most of the screen.
- **News**: `/news` lists ten at a time and asks for more when the end of the list comes into
  view, `/news/:news_id` renders one, `/news/create` and `/news/edit/:news_id` write them in
  **Markdown**, and `/news/:news_id/settings` hides or deletes one behind a dialog.
- `src/components/Markdown.tsx` — Markdown rendered as **React elements**, with no
  `dangerouslySetInnerHTML` and therefore nothing to sanitize: a `<script>` in a body is a
  paragraph reading `<script>`. A link whose scheme is not `http`, `https`, `mailto`, `/` or `#`
  keeps its text and loses its link, because an `href` is the one vector building elements does
  not close.
- **`ConfirmButton` is a dialog over the page** rather than a panel that expands in place, with
  escape and the scrim as cancels and focus starting on the safe button. Every destructive action
  in the panel gets it.
- `/ci-cd` — a GitHub Actions file and a GitLab CI file, written out whole and pointed at this
  deployment, with `PLUGIN_ID` and `USER_TOKEN` explained and named as the developer's to rename.
- `/policy` — what may be published, what is guaranteed about a download, and exactly what the
  service stores.

