# client-reactjs

The web panel for **MCPluginManager**, published as `@mcengine/client-reactjs`.

A React single-page application over `@mcengine/server-expressjs`. Publishers use it to
create products, upload versioned jars and mint CI tokens; operators use it to register
Minecraft servers and set the version each one should be running.

## Key features

- Sign in by password or OAuth identity, with a session per device.
- Namespace and organization administration: handles, emails, members, roles, tokens.
- Product pages at `/product/:product_id/`, with settings, version upload, and a general
  page carrying the thirty-day id cooldown and a confirmed delete.
- A fleet view: what each registered server has installed, and what it should have.

## Quick start

Nothing to run yet. This repository currently carries its agent instruction system and its
documentation; the build is being added task by task, and
[`.agents/wiki/context/repository-map.md`](.agents/wiki/context/repository-map.md) says
exactly what exists right now.

## Documentation

The full map is
[`.agents/index/project-wiki-index.md`](.agents/index/project-wiki-index.md).

Start here:

- [Project Overview](wiki/information/overview.md) — what this panel is, the service it
  renders, and the routes it exposes.

## Working with agents

See [`AGENTS.md`](AGENTS.md). This repository consumes a shared agent instruction set served
over the `lxagents-agents-base` MCP connector; it carries no copy of that set.

## License

See [`LICENSE`](LICENSE).
