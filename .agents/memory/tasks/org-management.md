---
name: memory-tasks-org-management
description: This repository's entries in the organization management plan — the plan table itself lives in MCEngine/server-expressjs.
---

# Task: Organizations a person can find and administer — client-reactjs entries

**The plan table is not here.** It lives in `MCEngine/server-expressjs` at
`.agents/memory/tasks/org-management.md`, with the reasoning and the token-ownership defect found
while planning. Tasks 6, 7 and 8 are this repository's, and they call `GET /me/orgs` and
`/orgs/:handle/tokens`, which land in tasks 3 and 4 there.

## Entries

### Task 6 — feat/organization-page

The nav entry is now **Organization** and opens `/org`, which lists what you belong to — handle,
display name, and the role you hold — and carries the create form under it. `CreateOrg.tsx` is
gone; its form is a section of the new page, because a list with nothing in it and a create page
one click away are two pages saying what one says. `/org/new` is a `Navigate` to `/org`, since
the landing page published that address.

Creating an organization reloads the list rather than navigating: the new row appearing at
`owner` is the confirmation. **Task 7 changes that to open its settings**, once there are
settings to open — the first draft navigated there straight away and its test failed against a
route that did not exist yet, which is the task boundary doing its job rather than a surprise.
