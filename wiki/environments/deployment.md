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
| `API_UPSTREAM` | `server:3000` | Where `/api` goes. `host:port`, or `https://host` for an API reachable only over TLS |
| `DNS_RESOLVER` | from `/etc/resolv.conf` | Only set this to override what the machine already knows |

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

`API_UPSTREAM` is where `/api` goes. `host:port` is the usual form; a scheme is allowed and
means something specific:

| Value | What it does |
|---|---|
| `server:3000` | Plaintext to a private address. The Compose default |
| `api-2j3e:10000` | The same, on a platform that gives services internal names |
| `https://api.example.com` | TLS to a public endpoint, with SNI, certificate verification, and `Host` set to that hostname |
| `http://api:10000` | Plaintext, written out. Same as the first form |

`docker/10-api-upstream.envsh` works this out at start-up — the scheme, a missing port, a stray
path, an IPv6 literal — so the template is rendered from values that are already correct rather
than from whatever was typed.

**The `https://` form exists because some platforms give a service no private address at all.**
A free Render web service, for instance, can send private network traffic but cannot receive
it, so its public URL is the only way in. That hop is real internet, so the certificate is
verified against the base image's CA bundle and SNI is sent; an upstream with a self-signed
certificate is refused with `upstream SSL certificate verify error` rather than trusted
quietly.

Two values still fail, and both fail quickly now:

| Value | Result |
|---|---|
| `api.example.com:443` | **502** — plaintext into a TLS port. Write `https://api.example.com` |
| A name DNS cannot answer | **502** in five seconds, `resolver_timeout` |

### The resolver

`proxy_pass` goes through a variable so a replaced upstream is re-resolved per request rather
than cached until nginx restarts — and nginx does not read `/etc/resolv.conf` to find a
resolver. The image used to default `DNS_RESOLVER` to `127.0.0.11`, Docker's embedded DNS: an
address that answers on a Docker or Compose network and on nothing else. Anywhere else every
proxied request ran to a thirty-second timeout and came back `502` from an API that was healthy
and one hop away.

The entrypoint now takes the nameservers from `/etc/resolv.conf`, like every other program on
the machine, and `resolver_timeout` is five seconds rather than thirty. Set `DNS_RESOLVER` only
to override that — a specific cluster resolver, say. `ipv6=off` stays: these upstreams are
reached over IPv4, and an AAAA answer nginx cannot route to is a slower failure than no answer.

## On Render

Two services, each built from its repository's Dockerfile. The panel is the one that gets a
public URL; the server does not need one, though it may have one.

**On the panel service:**

| Variable | Value |
|---|---|
| `API_UPSTREAM` | The server's internal address from its **Connect → Internal** menu, with port `10000` — for example `mcengine-server-expressjs:10000` |
| `VITE_API_BASE_URL` | **Leave it unset.** It is a build argument, and a service variable can reach the image build — [`env.md`](env.md) |

Port `10000` is not a guess: Render routes private traffic on that port to a web service's
primary HTTP server whatever port it actually binds, so it keeps working if the server's `PORT`
changes.

**If the server service is on the free plan** it has no private address — free web services can
send private network requests but not receive them. Use its public URL instead, with the
scheme, and the proxy terminates TLS to it:

```
API_UPSTREAM=https://mcengine-server-expressjs.onrender.com
```

**On the server service**, `JWT_SECRET` is required, a disk mounted at `/data` is what keeps the
database and the published jars across a redeploy, and `DEMO_ACCOUNT_ENABLED=true` is what makes
the demo account exist — it is off unless asked for, which is why the sign-in page shows no
credentials until you set it. That repository's `wiki/environments/env.md` covers all three.

Both services must be in the same region for a private address to resolve.

## On a platform that builds your Dockerfile for you

Render, Railway, Fly and similar hosts present one "environment variables" panel, and it is not
one thing. A variable there can reach the **image build** as a build argument as well as the
running container:

* **Set `API_UPSTREAM`** to the API's address, as above. `DNS_RESOLVER` needs setting only where
  the platform's resolver is not the one in `/etc/resolv.conf`.
* **Leave `VITE_API_BASE_URL` unset — including in the dashboard.** It looks like a runtime
  variable and is not: the build inlines it into the bundle, every request becomes cross-origin,
  the preflight goes unanswered, and the `HttpOnly` refresh cookie stops being sent.
  [`env.md`](env.md) has the whole failure, measured.

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
