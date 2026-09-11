---
name: memory-tasks-container-image
description: This repository's entries in the container-image plan — the plan table itself lives in MCEngine/server-expressjs.
---

# Task: Container images — client-reactjs entries

**The plan table is not here.** It lives in `MCEngine/server-expressjs` at
`.agents/memory/tasks/container-image.md`. The server is the half whose constraints drove the
shape — a native module, a writable volume, a readiness probe — and this image exists to sit in
front of it. The decisions are recorded there at
`.agents/memory/decisions/container-image-shape.md`.

Tasks 3 and 4 of that plan are this repository's.

## Entries

### Task 3 — build/container-image

A two-stage `Dockerfile`, `docker/default.conf.template`, `.dockerignore`, and
`wiki/environments/deployment.md`.

**The runtime carries no Node.** A built single-page app is static files; shipping the toolchain
that produced them would be shipping a build environment to production. The base is
`nginxinc/nginx-unprivileged` — the nginx team's own image, uid 101, no root anywhere — and
listening on 8080 is the consequence of that rather than a preference.

**nginx proxies `/api`, and that is the point of the image rather than a convenience.** The
panel's requests are relative because the refresh token is an `HttpOnly` cookie: a second origin
would make every request cross-site in production while the dev proxy keeps it same-site, and the
symptom is a cookie the browser silently declines to send.

**`proxy_pass` goes through a variable plus a `resolver`.** A literal upstream is resolved once,
at configuration load, so a replaced API container is unreachable until nginx itself restarts —
a failure that looks exactly like the API being down while the API is up.

**Three defects were found by running nginx rather than reading the file**, and each was in the
first draft:

* The fingerprinted-asset location set `expires 1y` *and* an `add_header Cache-Control`, so every
  asset came back with two `Cache-Control` headers. One `add_header` now.
* **The security headers were missing from `/assets/` and `/index.html`.** nginx gives a location
  that declares any `add_header` **none** of the enclosing block's — so adding one cache header
  to a location silently dropped `X-Content-Type-Options`, `X-Frame-Options` and
  `Referrer-Policy` from it. They are repeated per location now, with the rule written above
  them, because the obvious way to write this file is wrong and nothing warns you.
* The immutable cache carried `always`, which put a **one-year cache on the 404** for a missing
  asset. A browser that cached one could never load that asset again if a rollback restored it.
  The `always` is gone from that header alone; the security headers keep theirs, because those
  belong on errors too.

**Two mistakes in the Dockerfile were caught the same way.** It copied a `tsconfig.node.json`
that does not exist in this repository, which would have failed the build at the `COPY`. And
excluding `test/` from the build context changes what `npm run build`'s `tsc --noEmit` covers —
kept, because a test file cannot affect the artifact and copying the suites in would invalidate
the layer on every test edit, but now said in a comment rather than left as a silent difference.

**Verified without a Docker daemon, because this session has none — and what was not run is said
rather than implied.** Everything the image wraps was run directly:

* `npm ci` and `npm run build` in a tree holding **only** the files the `COPY` lines name, which
  is the build stage's context exactly. It builds, and emits `dist/index.html` plus
  `dist/assets/index-*.js` — confirming the `location /assets/` block matches what Vite actually
  produces rather than what it was assumed to.
* `nginx -t` on the rendered template: syntax ok. An earlier run of this check passed against an
  **empty** file, because `envsubst` is absent here and had silently produced nothing; the render
  is done in Python now and the file is asserted non-empty before the check counts.
* nginx 1.24 actually serving the real bundle with a stub API behind it. Headers and status were
  checked on all five route classes: `/`, a deep link, a present asset, a missing asset, and a
  proxied call. The proxy preserves the full path and the method — `PUT /api/v1/products/…`
  arrives as a `PUT` with its path intact, which is what the publish route needs.

What remains unverified is the image build itself: base image resolution, the `envsubst` pass the
nginx entrypoint performs, and layer caching. Those need a daemon.

Next task depends on: nothing. The release is last.

### Task 4 — chore/container-image-release

The release, in both repositories. Here it wrote this entry and brought `repository-state.md`
current; the plan table and the `PR` column are in `MCEngine/server-expressjs`.

**The version did not move.** `@mcengine/client-reactjs` stays at `0.0.0`, and
`wiki/logs/0/0/0/` already existed, so this appends rather than making a version claim.

Next task depends on: nothing. This closes this repository's part of the record.

