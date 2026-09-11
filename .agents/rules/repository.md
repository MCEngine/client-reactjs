---
name: repository-rules
description: Rules specific to MCEngine/client-reactjs — what it is, what it consumes, its version carrier, and the boundaries that hold once code exists.
---

# Repository-specific rules — client-reactjs

This repository is **`MCEngine/client-reactjs`**, published as `@mcengine/client-reactjs`:
the web panel for MCPluginManager. Read
[`../wiki/context/repository-map.md`](../wiki/context/repository-map.md) for what currently
lives where before making changes.

## Mode and the shared set

This repository is a **Mode B consumer**. The shared instruction set — branching, commits,
pull requests, the task workflow, the creators, the placement and versioning rules — is
served by the **`lxagents-agents-base`** MCP connector and is never copied here. This
repository carries only what is its own: its indexes, this file, its two wiki trees, and its
memory.

## Rules

* **Nothing shared is copied here.** A file readable from `agents://` must not exist in
  `.agents/` unless it is a declared override with a row in
  [`../index/root-index.md`](../index/root-index.md). There are currently no overrides.
* **The package name is `@mcengine/client-reactjs`** and the version carrier is `version` in
  `package.json`. It is `0.0.0` and never moves without explicit user approval —
  `{shared}/rules/versioning.md`.
* **This panel holds no state of its own.** Every fact it renders comes from
  `@mcengine/server-expressjs`. Do not add a second source of truth — no client-side mirror
  of a server rule, no duplicated validation that can disagree with the server's.
* **The server enforces, the panel explains.** A cooldown, a quota or a permission check
  renders as a disabled control and a reason; it is never the only thing standing between a
  user and the action. A panel-side check that the server does not also make is a bug.
* **Never render a destructive action without an explicit confirm step.** Deleting a product
  or revoking a token shows what will be lost, offers cancel, and requires confirm.
* **Never put a secret in the bundle.** No API keys, no client secrets. A token minted in
  the panel is displayed once, from the server's response, and never persisted by the panel.
* **API changes come from the server repository.** `MCEngine/server-expressjs` owns the
  contract; this repository follows it. When a route or payload changes, update the calling
  code and the documentation in the same commit — `{shared}/rules/change-propagation.md`.
* **Docs and indexes.** Keep both wiki trees current with any structural change, and update
  the index that owns the changed scope in the same commit. See
  `{shared}/creators/index-creator.md`.

## Build and test commands

**None yet.** This repository currently contains the agent instruction system, the two wiki
trees, `README.md` and `LICENSE`. There is no `package.json`, so there is nothing to install
and nothing to run.

The build, the scripts and the test harness arrive with the React skeleton task; this
section and the repository map are rewritten by that task, and this line stops being true
the moment it lands. **Do not infer commands that are not written here.**

## Version carriers in this repository

`{shared}/rules/versioning.md` gates every one of these; this table says where they are.

| Carrier | Where |
|---|---|
| Package version | `package.json` — does not exist yet |
| Log directories | `wiki/logs/{Major}/{Minor}/{Patch}/` |
| Git tags and release drafts | GitHub releases |
