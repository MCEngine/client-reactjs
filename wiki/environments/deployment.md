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
| `API_UPSTREAM` | `server:3000` | Host and port `/api` is proxied to |
| `DNS_RESOLVER` | `127.0.0.11` | Docker's embedded DNS. Set it to the cluster resolver on Kubernetes |

Both are substituted into the nginx configuration when the container starts, so one image runs
in every environment.

**Port 8080, not 80.** The base image is `nginxinc/nginx-unprivileged`: it runs as uid 101 with
no root anywhere, and an unprivileged process cannot bind a port below 1024.

## Why this image proxies the API

The panel's requests are **relative** — `/api/v1/...` — and that is load-bearing rather than
incidental. The refresh token is an `HttpOnly` cookie the panel cannot read; serving the bundle
from a different origin than the API would make every request cross-site in production while the
development proxy keeps it same-site. The symptom is a cookie the browser silently declines to
send, and a session that will not survive a reload.

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

## Pointing the panel at an API somewhere else

`VITE_API_BASE_URL` is a **build** argument, not a runtime variable: Vite inlines every
`VITE_`-prefixed value into the bundle.

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.example.com -t mcengine/client-reactjs:0.0.0 .
```

Leave it empty unless you have a reason. A cross-origin API means the refresh cookie needs
`SameSite=None; Secure` and a CORS policy that allows credentials — two more things to get right,
for no benefit over the proxy above. Nothing secret may be passed here: whatever is inlined ships
to every browser that loads the page.

## Both halves together

The compose example is in `MCEngine/server-expressjs` at `wiki/environments/deployment.md`, and
is repeated there rather than here because it names both images and neither repository owns the
other.
