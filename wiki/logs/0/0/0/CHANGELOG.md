# Changelog — 0.0.0

Pre-release. This version covers the repository from its initial commit up to the first
release, and is appended to as each task lands.

## Added

- `AGENTS.md`, `.claude/CLAUDE.md`, and the `.agents/` tree — six indexes, the repository
  rules hub, the agent repository map, and the memory tree. The repository consumes the
  shared instruction set over the `lxagents-agents-base` connector as a Mode B consumer and
  declares no overrides.
- `wiki/information/overview.md` — what this panel is, the service it renders, and the
  routes it will expose.
- This changelog, and the version-directory log structure it sits in.
- The Vite build: `package.json` at `0.0.0`, strict TypeScript, Vitest with Testing Library,
  and three runtime dependencies — React, React DOM and the router.
- `src/api/` — the one place that calls `fetch`, refreshing once on a 401 and retrying, with
  the server's payload shapes mirrored as types.
- `src/auth/AuthContext.tsx` — the access token held in memory only, with a session recovered
  on load from the HttpOnly refresh cookie the panel cannot read.
- `src/components/ConfirmButton.tsx` — a destructive action behind an explicit confirm with a
  cancel beside it, and a typed phrase where the server also requires one.
- The shell, a product list and a not-found route.
- `wiki/environments/setup.md` and `wiki/environments/env.md`.

## Changed

- `README.md` rewritten from a bare title into an overview: what the panel is, its place in
  the platform, and links into `wiki/`.
