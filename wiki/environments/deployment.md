# Deployment

[← Back to README](../../README.md)

This page covers running the panel as a container. For running it from source, see
[`setup.md`](setup.md); for the one build-time variable, see [`env.md`](env.md).

## Build

```bash
docker build -t mcengine/client-reactjs:0.0.0 .
```

Two stages: Node typechecks and bundles, nginx serves the result. The runtime carries no Node
and no `node_modules` — a built single-page app is static files, and shipping the toolchain that
produced them would be shipping a build environment to production.

`npm run build` is `tsc --noEmit && vite build`, so a type error fails the image rather than
producing a bundle nobody typechecked. The suites are not in the build context: a test file
cannot change the artifact, and copying them in would invalidate the layer on every test edit.
`npm run check` remains the repository's gate and covers both.

## Run

```bash
docker run -d --name mcpm-panel \
  -p 8080:8080 \
  -e API_UPSTREAM=server:3000 \
  mcengine/client-reactjs:0.0.0
```

| Variable | Default | What it does |
|---|---|---|
| `API_UPSTREAM` | `server:3000` | Host and port `/api` is proxied to. `host:port` only — a scheme or a path here is a 500 |
| `DNS_RESOLVER` | `127.0.0.11` | Docker's embedded DNS. Set it to the platform's resolver anywhere that is not a Docker network |

Both are substituted into the nginx configuration when the container starts, so one image runs
in every environment.

**Port 8080, not 80.** The base image is `nginxinc/nginx-unprivileged`: it runs as uid 101 with
no root anywhere, and an unprivileged process cannot bind a port below 1024.

## Why this image proxies the API

The panel's requests are **relative** — `/api/v1/...` — and that is load-bearing rather than
incidental. Serving the bundle from a different origin than the API breaks it twice over: the
browser asks for permission the server never grants, since the server has no CORS layer at all,
and the refresh token is an `HttpOnly` cookie issued `SameSite=Lax`, which a browser does not
attach to a cross-site request. The symptoms are a request that never leaves the browser and a
session that will not survive a reload. [`env.md`](env.md) shows both, measured.

So nginx serves the bundle *and* forwards `/api` to the server, and the browser only ever talks
to one origin.

```
browser ──▶ panel:8080 ──┬──▶ /            the bundle, from disk
                         └──▶ /api/…       proxied to API_UPSTREAM
```

`proxy_pass` goes through a variable rather than naming the upstream literally. A literal one is
resolved once, when the configuration loads — so when the API container is replaced and takes a
new address, nginx keeps sending to the old one until nginx itself is restarted. It looks exactly
like the API being down while the API is up.

## What nginx does with each kind of request

| Path | Behaviour | Why |
|---|---|---|
| `/assets/…` | Served from disk, `Cache-Control: public, max-age=31536000, immutable` | Vite fingerprints these, so the name changes when the content does |
| A missing `/assets/…` | `404`, **not** cached | A cached 404 on a fingerprinted name would outlive a rollback that restores it |
| `/index.html` | `Cache-Control: no-cache` | It names the current fingerprints; a cached one points at assets that no longer exist |
| `/api/…` | Proxied, unbuffered, no size cap of its own | A jar upload is a large streamed body; the service caps it against the org's quota, and a smaller nginx limit would turn that answer into a bare `413` |
| Anything else | `index.html` | React Router owns the path. Without it, reloading `/product/acme-tools` is a 404 from nginx |

`X-Content-Type-Options`, `X-Frame-Options` and `Referrer-Policy` are set on every response,
including errors. They are repeated inside each location that sets a header of its own, because
nginx gives a location that declares any `add_header` **none** of the enclosing block's — an
inheritance rule that silently drops security headers if you write the file the obvious way.

## Setting `API_UPSTREAM`

`API_UPSTREAM` is **`host:port`** — no scheme, no trailing slash, no path. The template does
`proxy_pass http://$api_upstream`, so whatever you set is pasted after `http://`. The three
ways to get it wrong all fail differently, and none of them says "your API_UPSTREAM is
malformed":

| Value | What happens | In the nginx log |
|---|---|---|
| `server:3000` | Works | — |
| `https://api.example.com` | **500** on every `/api` request | `invalid port in upstream "https://api.example.com"` |
| `api.example.com:443` | **502** | `recv() failed (104: Connection reset by peer) while reading response header from upstream` |
| A hostname the resolver cannot answer | **Requests hang**, then time out | nothing for the first 30 seconds |

The second is the obvious guess and the third is the interesting one: a public HTTPS address
reached over plaintext. This image proxies **plaintext HTTP to a private address**. It has no
`proxy_ssl_*` configuration, so it cannot terminate TLS to an upstream — point it at the
server's private address on the network the two share, not at the server's public URL.

`DNS_RESOLVER` is the other half of that. `proxy_pass` goes through a variable so names are
re-resolved per request, and a variable `proxy_pass` requires a `resolver`. The default,
`127.0.0.11`, is Docker's embedded DNS and exists on a Docker or Compose network. Anywhere
else it is an address with nothing behind it, and the symptom is the fourth row above: `/api`
requests that hang while the server is perfectly healthy. Set it to the platform's resolver —
the first `nameserver` line in `/etc/resolv.conf` inside the running container.

## On a platform that builds your Dockerfile for you

Render, Railway, Fly and similar hosts present one "environment variables" panel, and it is
not one thing. A variable there can reach the **image build** as a build argument as well as
the running container. That is the trap this section exists for:

* **Set `API_UPSTREAM`** to the server service's private `host:port`, and `DNS_RESOLVER` if
  the platform is not Docker's own network.
* **Leave `VITE_API_BASE_URL` unset — including in the dashboard.** It looks like a runtime
  variable and is not: the build inlines it into the bundle, every request becomes
  cross-origin, the preflight goes unanswered, and the `HttpOnly` refresh cookie stops being
  sent. [`env.md`](env.md) has the whole failure, measured.

The panel service is the one that gets a public URL. The server service does not need one —
nothing but the panel talks to it, and giving it one makes it a second origin for anything a
browser does.

## Pointing the panel at an API on another origin

There is one build argument for it, and it is not the path this image is built for:

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.example.com -t mcengine/client-reactjs:0.0.0 .
```

**Do not reach for this to solve a deployment.** The central server has no CORS layer and
issues its refresh cookie `SameSite=Lax`, so a browser will refuse the preflight and then
decline to send the cookie. Neither is configurable today — `PANEL_ORIGIN` on the server does
not do it. The proxy above is not a convenience around that; it is how the panel is meant to
be served. See [`env.md`](env.md).

Nothing secret may be passed here either: whatever is inlined ships to every browser that
loads the page.

## Both halves together

The compose example is in `MCEngine/server-expressjs` at `wiki/environments/deployment.md`, and
is repeated there rather than here because it names both images and neither repository owns the
other.
