---
name: memory-tasks-api-proxy-reachability
description: The panel's nginx could not resolve its upstream on Render — the confirmed six-task plan across two repositories, and one entry per task.
---

# Task: An image that can reach its API anywhere

## Why

A live deployment: the panel served its bundle and every `/api` request came back `502` after
thirty seconds. The server was healthy the whole time.

```
GET https://<server>.onrender.com/health          -> 200 in 0.77s
GET https://<server>.onrender.com/api/v1/meta     -> 200 {"demo_account":null}
GET https://<panel>.onrender.com/api/v1/meta      -> 502 in 30.49s   (nginx's own error page)
GET https://<panel>.onrender.com/                 -> 200 in 0.76s
```

Thirty seconds is nginx's default `resolver_timeout`, which names the cause exactly.
`docker/default.conf.template` does `proxy_pass` through a variable — deliberately, so a
replaced upstream is re-resolved rather than cached until restart — and a variable `proxy_pass`
needs a `resolver`. The image defaulted that to `127.0.0.11`, **Docker's embedded DNS**. On a
Docker or Compose network that address answers. On Render it is an address with nothing behind
it, so every name lookup ran to timeout and the operator saw a `502` from a panel whose server
was up.

The previous plan (`same-origin-api.md`) measured this exact failure and wrote it down as a
variable to set. Documenting a default that cannot work on the platform the user deploys to is
not a fix; the default has to work.

Two more facts from Render's own documentation shape the rest:

* **Free web services can send private network requests but cannot receive them.** A free-tier
  API therefore has no private address at all, and the only way to reach it is its public
  HTTPS URL — which the template refused, because `proxy_pass http://$upstream` cannot speak
  TLS and a scheme in the value is `invalid port in upstream`.
* **Port `10000` always routes to a web service's primary HTTP server**, whatever port it binds.

## The plan

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This file and its index row | `client-reactjs` | `chore/api-proxy-reachability-plan` | `.agents/memory/tasks/`, `.agents/index/memory-index.md` | |
| 2 | Reach the API from anywhere | Derive the resolver from `/etc/resolv.conf`; accept an `https://` upstream with SNI; fail fast | `client-reactjs` | `fix/api-proxy` | `docker/`, `Dockerfile`, `test/`, `wiki/environments/` | |
| 3 | Say what a gateway failure is | `502`/`503`/`504` reads as "could not reach the server", not "The server returned 502." | `client-reactjs` | `fix/gateway-error` | `src/api/`, `test/` | |
| 4 | Release | Changelog, state, close this record | `client-reactjs` | `chore/api-proxy-reachability-release` | `wiki/logs/0/0/0/CHANGELOG.md`, `.agents/memory/state/` | |
| 5 | Deploying the pair on a host | Render's port rule, and that the demo account is off until asked for | `server-expressjs` | `docs/render-deployment` | `wiki/environments/`, `.agents/memory/` | |
| 6 | Release | Changelog, state, close the server's record | `server-expressjs` | `chore/api-proxy-reachability-release` | `wiki/logs/0/0/0/CHANGELOG.md`, `.agents/memory/state/` | |

Tasks 1–4 stack in this repository; 5–6 stack in `MCEngine/server-expressjs` and are ordered
after them.

**The same-origin rule does not change.** `/api` is still proxied and the browser still sees one
origin; what changes is that the proxy can now find the upstream on a platform that is not
Docker, including one where the only address available is public and TLS-terminated.

## Entries

### Task 1 — chore/api-proxy-reachability-plan

This record and its row in `.agents/index/memory-index.md`. Nothing else.
