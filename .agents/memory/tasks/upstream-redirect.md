---
name: memory-tasks-upstream-redirect
description: The proxy forwarding the browser's Host to a public upstream, which made an ordinary misconfiguration into an infinite redirect loop — the confirmed three-task plan.
---

# Task: Do not hand the browser's Host to someone else's edge

## Why

The deployment that could not resolve its upstream last time now loops. Every `/api` request
ends in `ERR_TOO_MANY_REDIRECTS`, and the response says why:

```
GET https://mcengine-client-reactjs.onrender.com/api/v1/meta
HTTP/2 301
location: https://mcengine-client-reactjs.onrender.com/api/v1/meta
x-render-origin-server: nginx/1.27.5
```

A redirect to the URL that was just requested.

Measured, in this order, rather than reasoned:

1. The server's public host **does** bounce a plaintext request — `http://…onrender.com/api/v1/meta`
   answers `301` to its own `https://`. That is the platform's edge, not this service.
2. `X-Forwarded-Proto: http` over TLS does **not** provoke it: the same request with that header
   answers `200`. So the forwarded scheme is not the trigger.
3. Our nginx does **not** rewrite `Location` — `proxy_redirect default` does not apply when
   `proxy_pass` uses a variable, and a stand-in upstream's absolute `Location` came back through
   the proxy untouched.
4. Therefore the panel's own hostname in that `Location` was built by the upstream from the
   `Host` header it received. Reproduced exactly, against a stand-in that redirects the way
   Render's edge does:

```
curl -H 'Host: mcengine-client-reactjs.onrender.com' http://127.0.0.1:8081/api/v1/meta
HTTP/1.1 301 Moved Permanently
Location: https://mcengine-client-reactjs.onrender.com/api/v1/meta
```

So: `API_UPSTREAM` is the server's public hostname **without a scheme**, which is port 80 and
plaintext — and `docker/default.conf.template` sends `Host: $host`, the panel's own hostname, to
whatever is at the other end. A public edge builds its https redirect from that Host, which
points at the panel, which proxies again.

**The misconfiguration is the operator's; the loop is ours.** nginx's own default is
`Host: $proxy_host` — the upstream — and the template overrode it with the browser's Host,
which is right for a private hop and wrong for anything that routes on Host. A wrong
`API_UPSTREAM` should fail, not recurse.

## The plan

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This file and its index row | `client-reactjs` | `chore/upstream-redirect-plan` | `.agents/memory/tasks/`, `.agents/index/memory-index.md` | |
| 2 | Address the upstream as itself | `Host` is the upstream's; a redirect from it is reported, not followed; forwarded scheme stops lying | `client-reactjs` | `fix/upstream-host` | `docker/`, `test/docker.test.ts`, `wiki/environments/` | |
| 3 | Release | Changelog, state, close this record | `client-reactjs` | `chore/upstream-redirect-release` | `wiki/logs/0/0/0/CHANGELOG.md`, `.agents/memory/state/` | |

One repository this time: `MCEngine/server-expressjs` is not involved. Its only part in this is
the demo account, which is off — `GET /api/v1/meta` there answers `{"demo_account":null}`, which
is `DEMO_ACCOUNT_ENABLED` not being set and is already documented on both sides.

## Entries

### Task 1 — chore/upstream-redirect-plan

This record and its row in `.agents/index/memory-index.md`. Nothing else.

### Task 2 — fix/upstream-host

`docker/10-api-upstream.envsh` sends the upstream its own `Host`, always — nginx's default, and
the reason the default is what it is. The port is left off when it is the scheme's own, so a
public endpoint gets `Host: api.example.com` rather than an unusual `:443`. The script also
warns at start-up when a dotted name is reached over plaintext, naming the exact value to write
instead, because that is the misconfiguration that caused this.

`docker/default.conf.template` stops forwarding an upstream redirect at all:
`proxy_intercept_errors on` with `error_page 301 302 303 307 308` into a named location that
returns `502` carrying the service's own error envelope, so the panel renders the reason through
the same path as any other failure. `X-Forwarded-Proto` now comes from a `map` over the incoming
header, since this container is addressed over plaintext behind whatever terminates TLS and
`$scheme` was telling the API the session was insecure.

Verified against a stand-in that redirects the way the platform's edge does — the request that
used to come back as `301` to the panel's own URL now comes back as the `502` above — and
against the live server over `https://`, which answered `200`. An echo upstream confirmed what
it receives: `Host: <itself>`, `X-Forwarded-Host: panel.example.com`, `X-Forwarded-Proto: https`.

`test/docker.test.ts` is 16 cases now. The one that matters most asserts the template never
sends `Host: $host`, which is the line that turned a wrong variable into a loop.
