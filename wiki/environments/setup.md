# Local Setup

[← Back to README](../../README.md)

## Requirements

- **Node 22 or newer**, and the npm that ships with it.
- The API. `@mcengine/server-expressjs` on `http://localhost:3000` is what the dev proxy
  expects; see that repository's `wiki/environments/setup.md`.

## Install and run

```bash
npm install
npm run dev        # http://localhost:5173
```

## Commands

| Command | What it does |
|---|---|
| `npm run check` | Typecheck, then the full test suite. **This is what "verify" means here.** |
| `npm run typecheck` | `tsc --noEmit` over `src/` and `test/` |
| `npm test` | Vitest, once |
| `npm run build` | Typecheck, then produce `dist/` |
| `npm run preview` | Serve the built bundle |
| `npm run dev` | Vite dev server, with `/api` proxied |

## Why `/api` is proxied rather than pointed at port 3000

The refresh token is an HttpOnly cookie. Talking to `localhost:3000` from `localhost:5173`
would make every request cross-site in development and same-site in production — a
difference that shows up only as a cookie the browser silently declines to send. The proxy
keeps both the same.

The same is true of a deployment. **Leave `VITE_API_BASE_URL` empty**, in development and in
production both: it is inlined into the bundle at build time, and a value pointing at another
origin gets the panel a preflight the server does not answer and a cookie the browser will not
send. The container image proxies `/api` for exactly this reason — see [`env.md`](env.md) and
[`deployment.md`](deployment.md).

## Layout

| Path | What is in it |
|---|---|
| `src/api/client.ts` | The one place that talks to the server. Refreshes once on a 401 and retries. |
| `src/api/types.ts` | The server's payload shapes, mirrored as types. Never leads the server. |
| `src/api/errors.ts` | `ApiError` with the server's `code`, and `NetworkError` for a request that never arrived. |
| `src/auth/AuthContext.tsx` | Holds the access token in memory. Recovers a session from the cookie on load. |
| `src/components/` | Pieces shared across routes. |
| `src/routes/` | One file per page. |
| `test/` | Vitest with Testing Library, plus `helpers.tsx` for a stubbed transport. |

## Testing

`test/helpers.tsx` gives a `stubFetch` keyed by `METHOD /path`. Routes are written from the
server's `wiki/information/api-contract.md`: the panel is tested against the **contract**,
not against a running service, and a mismatch between the stub and the real API is a
contract change that has to land in both repositories.

Prefer a query a person could make — a role and a name — over a test id. A test that can
only find an element by an attribute added for the test is not checking what the person sees.
