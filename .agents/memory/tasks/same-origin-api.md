---
name: memory-tasks-same-origin-api
description: Documenting VITE_API_BASE_URL and API_UPSTREAM after a cross-origin deployment broke — the confirmed five-task plan across two repositories, and one entry per task.
---

# Task: One origin, documented as such

## Why

A deployment on Render set `VITE_API_BASE_URL` to the central server's public URL. Vite
inlined it, every request became cross-origin, and the panel stopped working: the preflight
had no answer and the browser declined to send the `HttpOnly` refresh cookie. The fix was to
leave `VITE_API_BASE_URL` empty and set `API_UPSTREAM` instead, so nginx proxies `/api` and
the browser only ever sees one origin.

The documentation did not prevent that. It was worse than vague — it described a knob that
does not exist:

* `wiki/environments/env.md` said to set `VITE_API_BASE_URL` when the API is on another
  origin, "and then the server's CORS configuration has to allow this one".
* `MCEngine/server-expressjs` at `wiki/environments/deployment.md` said `PANEL_ORIGIN` "is
  what the service allows cross-origin requests from".

Neither is true. Measured against the code, with the server booted on
`PANEL_ORIGIN=https://mcpm-panel.onrender.com`:

```
OPTIONS /api/v1/auth/login   Origin: https://mcpm-panel.onrender.com
HTTP/1.1 200 OK
Allow: POST                                    <- no Access-Control-Allow-Origin

POST /api/v1/auth/register   Origin: https://mcpm-panel.onrender.com
HTTP/1.1 201 Created
Set-Cookie: mcpm_refresh=...; Path=/api/v1/auth; HttpOnly; SameSite=Lax
```

The service has no `cors` dependency and emits no `Access-Control-*` header anywhere.
`PANEL_ORIGIN` is validated at startup by `src/config.ts` and never read again. The refresh
cookie's `SameSite=Lax` is hardcoded. **Cross-origin is not a supported configuration**, and
the documentation now says so in both repositories.

## The plan

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This file and its index row | `client-reactjs` | `chore/same-origin-api-plan` | `.agents/memory/tasks/`, `.agents/index/memory-index.md` | |
| 2 | The two variables, stated plainly | `VITE_API_BASE_URL` is build-time and cross-origin; `API_UPSTREAM` is the runtime one to set | `client-reactjs` | `docs/api-origin` | `wiki/environments/{env,deployment,setup}.md`, `.env.example`, `.agents/memory/decisions/` | |
| 3 | Release | Changelog, state, close this record | `client-reactjs` | `chore/same-origin-api-release` | `wiki/logs/0/0/0/CHANGELOG.md`, `.agents/memory/state/` | |
| 4 | `PANEL_ORIGIN` does not configure CORS | Correct the false claim in the server's docs and in the config comment | `server-expressjs` | `docs/panel-origin` | `wiki/environments/{env,deployment}.md`, `src/config.ts`, `.agents/memory/` | |
| 5 | Release | Changelog, state, close the server's record | `server-expressjs` | `chore/same-origin-api-release` | `wiki/logs/0/0/0/CHANGELOG.md`, `.agents/memory/state/` | |

Tasks 1–3 stack in this repository. Tasks 4–5 stack in `MCEngine/server-expressjs` and are
ordered after them rather than stacked on them, since branches cannot stack across
repositories.

**No behaviour changes.** No CORS middleware, no cookie change, no variable removed. Both
variables keep working exactly as they do; they are documented as what they are.

## Entries

### Task 1 — chore/same-origin-api-plan

This record and its row in `.agents/index/memory-index.md`. Nothing else.

### Task 2 — docs/api-origin

`wiki/environments/env.md` rewritten: the variables are now split into build-time and runtime
tables, with `API_UPSTREAM` and `DNS_RESOLVER` listed here for the first time — the page
previously held one row, so a reader looking for "the variable that points at the API" found
only the wrong one.

`wiki/environments/deployment.md` gained *Setting `API_UPSTREAM`* (the shape it must take and
the three failures, each with its nginx log line) and *On a platform that builds your Dockerfile
for you*; *Pointing the panel at an API somewhere else* was rewritten from a how-to into what it
costs. `setup.md` and `.env.example` now say to leave `VITE_API_BASE_URL` empty rather than
describing when to set it.

`.agents/memory/decisions/same-origin-api.md` records the measurements behind all of it.

Every claim in these pages was measured rather than reasoned: the bundle was built and grepped,
the server was booted and asked for a preflight, and the nginx template was rendered and run
against a live upstream for each malformed value. The rendering is worth noting — `envsubst` is
not installed here, so the first attempt tested an empty config that passed `nginx -t` happily.
