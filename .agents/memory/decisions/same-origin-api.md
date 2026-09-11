---
name: memory-decisions-same-origin-api
description: Why the panel and the API are one origin, what a cross-origin build actually breaks, and why VITE_API_BASE_URL and API_UPSTREAM are not two ways to do the same thing.
---

# One origin, and the two variables that look interchangeable

## Decision

**The panel is served from the same origin as the API, and `VITE_API_BASE_URL` stays empty.**
The container image's nginx serves the bundle and proxies `/api` to `API_UPSTREAM`; the dev
server proxies the same path to `localhost:3000`. Neither is a convenience. They are the only
configuration the pair supports.

## Why a cross-origin build is not merely harder

Measured, not assumed. Building the panel with a value set:

```
$ VITE_API_BASE_URL=https://mcpm-server.onrender.com npm run build
$ grep -o 'https://mcpm-server.onrender.com' dist/assets/index-*.js
https://mcpm-server.onrender.com
```

Then the server, booted on `PANEL_ORIGIN=https://mcpm-panel.onrender.com`:

```
OPTIONS /api/v1/auth/login   Origin: https://mcpm-panel.onrender.com
HTTP/1.1 200 OK
Allow: POST                                    <- no Access-Control-Allow-Origin

POST /api/v1/auth/register   Origin: https://mcpm-panel.onrender.com
HTTP/1.1 201 Created
Set-Cookie: mcpm_refresh=...; Path=/api/v1/auth; HttpOnly; SameSite=Lax
```

Two independent blockers, neither of which has a setting:

* **No CORS layer exists.** `MCEngine/server-expressjs` has no `cors` dependency and emits no
  `Access-Control-*` header anywhere. `PANEL_ORIGIN` is validated by `src/config.ts` at startup
  and never read again — it configures nothing today.
* **`SameSite=Lax` is hardcoded** on the refresh cookie. A browser will not attach it to a
  cross-site request, so the session dies at the first refresh even where CORS is granted.

So "set the API URL" is not a supported deployment with more steps. It is a deployment that
cannot work, and it fails in the browser — where the server's log shows nothing.

## Why both variables still exist

They answer different questions and are read at different times.

| | `VITE_API_BASE_URL` | `API_UPSTREAM` |
|---|---|---|
| Read | At build, by Vite | At container start, by nginx |
| Lives in | The bundle every visitor downloads | The container's environment |
| Changing it | Requires a rebuild | Requires a restart |
| Shape | An origin, or empty | `host:port`, no scheme |
| What the browser sees | A second origin | Nothing — one origin |

A hosted platform that builds the Dockerfile presents **one** environment-variables panel for
both, and may pass its contents to the build as build arguments. That is how a value that reads
like a runtime setting ends up compiled into the bundle, and it is the specific way this went
wrong on Render.

## The template's own constraints

`proxy_pass http://$api_upstream` pastes the value after `http://`, so the failures are:

| Value | Result |
|---|---|
| `server:3000` | works |
| `https://api.example.com` | 500, `invalid port in upstream` |
| `api.example.com:443` | 502, connection reset — plaintext into a TLS port |
| a name the resolver cannot answer | requests hang for 30s, then time out |

The image speaks plaintext HTTP to a private address and carries no `proxy_ssl_*`
configuration, so an upstream's *public* HTTPS URL is not a value it can use.

## What would change this

Adding a CORS layer and making the cookie's `SameSite` configurable — both in the server — is
what a cross-origin deployment would need. Until someone needs it, one origin is fewer moving
parts and one fewer thing to get wrong in a browser rather than in a log.
