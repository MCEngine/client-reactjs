---
name: memory-tasks-docker-test-shell
description: test/docker.test.ts resolving sh by absolute path so the suite runs on Windows, and skipping with a stated reason where no POSIX shell exists — the confirmed three-task plan.
---

# Task: Let the docker suite run on a machine without a bare `sh`

## Why

`test/docker.test.ts` sources `docker/10-api-upstream.envsh` under a POSIX shell, the way the
image's entrypoint does. On Windows it failed 11 of its 16 tests with
`Error: spawnSync sh ENOENT`, and **the other 5 passed**. The file is byte-identical to what it
was before the news pages work, and the count is constant on every branch back through the stack,
so nothing the news and reference pages did caused it.

**The script is correct; the invocation is not.** `sourceScript()` hands the child a fixed
`PATH` — `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin` — deliberately, so that
whatever the developer has exported cannot decide what the container would do. On Windows Node
resolves the *executable name* against that same child `PATH`, so `sh` cannot be found before the
script is ever read. Three experiments, run rather than reasoned:

1. `execFileSync('sh', …, { env: { PATH: '/usr/local/sbin:/usr/bin' } })` — **ENOENT**
2. prepending `C:/Program Files/Git/bin` to `process.env.PATH` and repeating — **ENOENT**, the
   `env` option overrides it
3. the same call with the absolute path `C:/Program Files/Git/bin/sh.exe` — **passes**, and
   produces correct output (`DNS_RESOLVER=127.0.0.11`, `API_PROXY_ADDR=server:3000`)

Git for Windows ships a real POSIX shell, and `awk` and `tr` resolve inside it, which is all the
script needs.

**Measured on Linux first, before changing anything: `npm run check` is green — 119 passed, 0
failed, 0 skipped.** The failure was never a defect in this repository's code. What it cost was
that `npm run check` is what this repository means by *verify*, and on a Windows machine it could
never be green, so a contributor there could not tell a real regression from 11 known ones. That
is the reason to fix it, and it is a smaller claim than "make the suite green".

**Measured, this time on Linux** — 119 passed, 0 failed, 0 skipped, `test/docker.test.ts` 16/16.

## The plan

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | Task record | This file and its index row | `client-reactjs` | `chore/docker-test-shell-plan` | `.agents/memory/tasks/`, `.agents/index/memory-index.md` | — |
| 2 | Resolve the shell by absolute path | Where a POSIX shell exists, use it; where none does, skip with a reason | `client-reactjs` | `fix/docker-test-shell` | `test/docker.test.ts` | — |
| 3 | Release | Changelog, state, close this record | `client-reactjs` | `chore/docker-test-shell-release` | `wiki/logs/0/0/0/CHANGELOG.md`, `.agents/memory/state/` | — |

One repository. `MCEngine/server-expressjs` is not involved.

**What must not change.** `docker/10-api-upstream.envsh` is correct and is not touched — the
defect is in how the test invokes it. Neither is `docker/default.conf.template` or `Dockerfile`,
and nothing in `src/`. The fixed POSIX `PATH` stays, because it is the reason the test means
anything. `version` in `package.json` stays `0.0.0`, and no new `wiki/logs/{M}/{m}/{p}/`
directory is created — this appends to the existing `0/0/0`.

**Only the 11 tests that source the script may be skipped.** The other 5 in
`the image and the template agree` read files and call `git`, and must keep running on a machine
with no shell at all; skipping that whole describe would drop coverage that never needed one.

## Entries

### Task 1 — chore/docker-test-shell-plan

This record and its row in `.agents/index/memory-index.md`. Nothing else.

### Task 2 — fix/docker-test-shell

`test/docker.test.ts` resolves its shell through `resolveShell()`: `sh` everywhere, and on
`win32` the absolute path of Git for Windows' `sh.exe`, checked in both the 64-bit and 32-bit
Program Files locations. `platform()` from `node:os` rather than `process.platform`, because
this file deliberately has no `process` global — `src/` is browser code and must never believe
Node's globals exist. The fixed POSIX `PATH` is untouched: it is the reason the test means
anything, and only the executable *name* lookup was broken.

Only the tests that source the script are conditional — `the resolver` and `the upstream` in
full, plus the one case in `the image and the template agree` that calls it. The other five in
that describe read files and call `git` and keep running with no shell installed at all; skipping
the whole describe would have dropped coverage that never needed one.

**Verified on Linux: 119 passed, 0 failed, 0 skipped, `test/docker.test.ts` 16/16.** The suite
is unchanged, which is the entire point of the exercise. The build is the same bundle to the
kilobyte, 341.28 kB of JS and 14.62 kB of CSS.

The skip branch was measured separately, with a throwaway file of the same 4 + 6 + 1 shape and no
shell present, which reported **5 passed, 11 skipped** — exactly the eleven that need one. What
is **not** verified here is Windows itself, which cannot be measured from a Linux machine. That
claim is left to whoever runs the suite there, and the record says so rather than implying it.

### Task 3 — chore/docker-test-shell-release

The changelog entry, the state file, and this record. `0.0.0` did not move and no new log
directory was created — the entry appends to the existing `0/0/0`.

The state file's verified numbers were stale: it claimed 64 tests across seven suites and a
310.05 kB bundle, both left over from before the news pages. Corrected to what this run measured,
since a state file that claims to be current and is not is worse than no state file.
