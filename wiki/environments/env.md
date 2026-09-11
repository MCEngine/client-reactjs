# Environment Variables

[← Back to README](../../README.md)

**Nothing here is secret, and nothing secret may be added.** Vite inlines every
`VITE_`-prefixed value into the bundle, so anything in this file is readable by anyone who
loads the page. A key that needs protecting belongs on the server.

`.env.example` is a copyable template. `.env` itself is never committed, because the values
differ per deployment.

| Key | Type | Default | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | string | empty | Where the API lives. Empty means same-origin, which is what the dev proxy and a single-hostname deployment both give you. Set it only when the API is genuinely on another origin — and then the server's CORS configuration has to allow this one, and the refresh cookie has to be `SameSite=None; Secure`. |

## Adding a key

Add it to `.env.example` and to this page in the same commit, and read it through
`import.meta.env` in exactly one place rather than at each call site. A key that exists in
only one of the two is one a deployment discovers at runtime.
