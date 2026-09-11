# Environment Variables

[← Back to README](../../README.md)

**Nothing here is secret, and nothing secret may be added.** Vite inlines every
`VITE_`-prefixed value into the bundle, so anything in this file is readable by anyone who
loads the page. A key that needs protecting belongs on the server.

`.env.example` is a copyable template. `.env` itself is never committed, because the values
differ per deployment.

The panel has variables of two different kinds, and mistaking one for the other is the
deployment failure this page exists to prevent.

## Build time — inlined into the bundle

| Key | Type | Default | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | string | empty | Prefix put in front of every API path. **Leave it empty.** Empty means the panel requests `/api/v1/…` relative to whatever origin served the page. |

## Runtime — read by the container when it starts

These belong to the image, not to the bundle. They are the ones a hosting platform's
"environment variables" panel is for. [`deployment.md`](deployment.md) has the detail.

| Key | Default | Notes |
|---|---|---|
| `API_UPSTREAM` | `server:3000` | `host:port` that nginx proxies `/api` to. **This is the variable to set when the central server is somewhere else.** No scheme, no path. |
| `DNS_RESOLVER` | `127.0.0.11` | Docker's embedded DNS. Set it to the platform's resolver anywhere that is not a Docker network. |

## Do not set `VITE_API_BASE_URL`

Setting it to the server's own address is the obvious thing to try, and it breaks the panel
in a way that is hard to read back to its cause. Three things have to be true at once, and
only the first is obvious.

**It is a build-time value, so it is inlined and permanent.** Vite replaces
`import.meta.env.VITE_API_BASE_URL` with a string literal while the bundle is being built:

```
$ VITE_API_BASE_URL=https://mcpm-server.onrender.com npm run build
$ grep -o 'https://mcpm-server.onrender.com' dist/assets/index-*.js
https://mcpm-server.onrender.com
```

It is in the JavaScript every visitor downloads. Changing it later means **rebuilding the
image**, not restarting the container — and on a platform that passes a service's
environment variables into the image build as build arguments, setting it in the dashboard
does reach the build even though it reads like a runtime setting.

**Every request then becomes cross-origin, and the server answers no preflight.** The
central server has no CORS layer at all: no `cors` dependency and no `Access-Control-*`
header anywhere in it. Booted with `PANEL_ORIGIN` set to the panel's exact origin, it still
answers the preflight with nothing a browser can use:

```
OPTIONS /api/v1/auth/login    Origin: https://mcpm-panel.onrender.com
HTTP/1.1 200 OK
Allow: POST                   <- and no Access-Control-Allow-Origin
```

The browser stops there. The request never leaves it, which is why the network tab shows a
failure the server's own log knows nothing about. `PANEL_ORIGIN` does not change this — see
that repository's [`env.md`](https://github.com/MCEngine/server-expressjs/blob/master/wiki/environments/env.md).

**And the session could not survive even if CORS were allowed.** The refresh token is an
`HttpOnly` cookie the panel cannot read, issued `SameSite=Lax`:

```
Set-Cookie: mcpm_refresh=...; Path=/api/v1/auth; HttpOnly; SameSite=Lax
```

`Lax` means the browser does not attach it to a cross-site request. Sign-in appears to work,
and then the first refresh fifteen minutes later — or the first page reload — has no cookie
to present. The value is hardcoded in the server; there is no setting that makes it `None`.

**So cross-origin is not a supported configuration.** Not "needs more setup": there is no
CORS to configure and no cookie attribute to change. Set `API_UPSTREAM` instead and let
nginx put the API on the panel's own origin, which is what the image is built to do.

`VITE_API_BASE_URL` stays because a build that is genuinely served from the API's own origin
by something else entirely may want it. If you reach for it, you are choosing to make CORS
and the cookie your problem.

## Adding a key

Add it to `.env.example` and to this page in the same commit, and read it through
`import.meta.env` in exactly one place rather than at each call site. A key that exists in
only one of the two is one a deployment discovers at runtime.
