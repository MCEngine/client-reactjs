# Project Overview

`@mcengine/client-reactjs` is the web panel for **MCPluginManager**. It is a React
single-page application, and it is the surface a person uses; everything it shows comes from
`@mcengine/server-expressjs` over HTTP.

## The three repositories

| Repository | Package | Role |
|---|---|---|
| [`MCEngine/plugin-manager`](https://github.com/MCEngine/plugin-manager) | — | The Minecraft plugin. Runs on a SpigotMC, PaperMC or Folia server and applies changes to that server's `plugins/` directory. |
| [`MCEngine/server-expressjs`](https://github.com/MCEngine/server-expressjs) | `@mcengine/server-expressjs` | The central server. Accounts, the artifact catalogue, tokens, and the fleet control plane. |
| [`MCEngine/client-reactjs`](https://github.com/MCEngine/client-reactjs) | `@mcengine/client-reactjs` | This panel. |

The plugin and this panel are both clients of the same service and never talk to each other.

## What it is for

Two people use this panel, often the same person wearing two hats.

**A publisher** belongs to an organization and ships jars. They create a product, upload a
version, write its changelog, mark which platforms and Minecraft versions it works on, and
optionally point it at the repository it was built from. They mint the tokens their CI uses
to publish without a browser.

**An operator** runs Minecraft servers. They register each server, see what it currently has
installed and how far behind it is, and set the version each server should be running. The
plugin on that server does the rest.

## The routes

A product is addressed by an id that is unique across every organization, so a URL needs no
organization prefix:

| Route | Who it is for |
|---|---|
| `/product/:product_id/` | Everyone. Id, name, detail, the publishing organization, versions to download, and the source repository link when the product has one. |
| `/product/:product_id/settings/` | Members of the owning organization. The settings landing page. |
| `/product/:product_id/setting/update/` | Publishing a new version: the jar, the version string, the changelog, compatibility. |
| `/product/:product_id/setting/general/` | Renaming the product id — which has a thirty-day cooldown — and deleting the product, behind an explicit confirm step with a cancel beside it. |

Alongside those sit the namespace and organization pages: profile and handle, email
addresses, signed-in devices, organization members and roles, tokens, and the fleet view.

## Two rules this panel follows

**It holds no state of its own.** There is no client-side mirror of a server rule. A
cooldown, a quota or a permission is rendered from what the server says, not recomputed
here, because two implementations of one rule eventually disagree and the browser is the
copy that is wrong.

**The server enforces, the panel explains.** A control the user may not use renders disabled
with a reason next to it. That is a courtesy, not a gate — the gate is on the server, and a
check that exists only here is a bug.

## Status

Pre-release at `0.0.0`. At the time of writing the repository carries the agent instruction
system and this documentation; the build, the routes and the components are being added task
by task. `.agents/wiki/context/repository-map.md` is the page that says what exists right
now, and it is updated by each task as that task makes something true.
