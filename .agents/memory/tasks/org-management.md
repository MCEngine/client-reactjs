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

### Task 7 — feat/org-settings

Four pages, mirroring the product settings shape so organizations and products are administered
the same way:

| Address | Page |
|---|---|
| `/org/:handle/settings` | The landing: what it is, storage against the quota, one card per subject |
| `/org/:handle/setting/general` | Display name, description, and the handle, with its thirty-day cooldown |
| `/org/:handle/setting/member` | `Members.tsx`, moved and renamed |
| `/org/:handle/setting/token` | The organization's own tokens |

`src/components/TokenManager.tsx` is new: the personal token page and the organization's differ
only in the collection they read, so the list, the mint form, the scope checkboxes and the
shown-once rule live in one component and `Tokens.tsx` is now sixteen lines.

Storage moved from the members page to the landing — it belongs to no subject and is the fact
you check before deciding to do anything. `/org/:handle/members` redirects to the member page,
and the product page's "published by" link now opens the settings landing.

Task 6's create form navigates to the new organization's settings now that there are settings to
open, which is the two-line change that task deferred.

**Rendered in Chromium at 1280px and 390px**, all five pages: no horizontal overflow, no alerts,
every `h1` correct. It also caught a real defect — the settings landing had a *Tokens* card while
the nav carries a *Tokens* link to the personal list. Same accessible name, different
destinations, which is the ambiguous case rather than the harmless one; the card is now
*Organization tokens*. The remaining duplicate is *Organization* in the nav and in the
breadcrumb, which points at the same page and sits inside the Breadcrumb landmark.
