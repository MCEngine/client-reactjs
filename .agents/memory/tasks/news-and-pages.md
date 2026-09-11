---
name: memory-tasks-news-and-pages
description: This repository's entries in the news and reference pages plan — the plan table itself lives in MCEngine/server-expressjs.
---

# Task: News, two reference pages, and a nav on the left — client-reactjs entries

**The plan table is not here.** It lives in `MCEngine/server-expressjs` at
`.agents/memory/tasks/news-and-pages.md`, with the decisions behind it: who may write news, why
hiding records a timestamp, and why Markdown is parsed into React elements rather than HTML.

Tasks 4 to 8 are this repository's.

## Entries

### Task 4 — feat/sidebar-nav

The header is a fixed 236px rail down the left above 900px, and the top bar it already was below
that: a rail on a 390px screen is most of the screen. `position: fixed` rather than `sticky` is
what makes it follow the scroll independently of the page, and it scrolls inside itself when the
navigation outgrows the viewport — which this one will, since the list only grows.

`.shell` is new: the rail is out of the flow, so something has to hold the pages clear of it. A
test asserts the pages and the footer are inside it and the header is not, because a page
rendered outside that wrapper would sit under the rail with nothing failing.

Measured in Chromium at four widths, including both sides of the breakpoint:

| | 1280 | 901 | 900 | 390 |
|---|---|---|---|---|
| Header | `fixed` 236×800 | `fixed` 236×800 | `sticky` 900×65 | `sticky` 390×65 |
| Page starts at | 236px | 236px | 0 | 0 |
| Top after scrolling 400px | 0 | 0 | 0 | 0 |
| Horizontal overflow | none | none | none | none |

### Task 5 — feat/markdown

`src/components/Markdown.tsx` parses a documented subset into **React elements**. There is no
HTML in the file and no `dangerouslySetInnerHTML`, which is the whole design: the usual approach
turns Markdown into an HTML string and then needs a sanitizer, and a sanitizer is a list of the
things somebody thought of. A `<script>` in a body renders as a paragraph reading `<script>`,
because that is what it is.

The one vector that survives building elements is an `href`, since React will render
`javascript:` into one — so a link keeps its text and loses its link unless the scheme is
`http`, `https`, `mailto`, `/` or `#`.

Nine cases, three of them about exactly that: a script tag, an `img onerror`, and hrefs that try
`JaVaScRiPt:` and `data:`.

`.prose` in `components.css` styles a rendered body — the only place in the panel where a heading
or a list is written by somebody other than whoever wrote the page.

### Task 6 — feat/news-pages

Five routes: `/news`, `/news/:newsId`, `/news/create`, `/news/edit/:newsId` and
`/news/:newsId/settings`. `NewsForm` is shared by writing and editing — they differ only in what
they start from and where they send it — and its preview uses the **same** `Markdown` component
the published page uses, so a preview is not an approximation of what a reader gets.

The list pages by cursor and loads more when the end of the list comes into view, watched with an
`IntersectionObserver` rather than a scroll handler: an observer fires when the sentinel is
actually visible, where a scroll handler guesses from pixel arithmetic on every frame. The **Load
more** button is not a fallback nobody sees — it is how this works with a keyboard, and in jsdom,
which has no observer.

`ConfirmButton` became a **dialog over the page** rather than a panel that expands in place: the
request asked for a popup, and a destructive action should interrupt. Escape cancels, a click on
the scrim cancels, and the cancel button takes focus when it opens — the key a hurried person
hits and the button focus lands on are both the safe one. That changed three existing tests from
`role="group"` to `role="dialog"`, which is the more accurate role.

Verified in Chromium against the built bundle, with a stub serving 25 items:

```
on arrival:      10 items, 1 request
after scroll 1:  20 items, 2 requests   cursor 01NEWS016
after scroll 2:  25 items, 3 requests   cursor 01NEWS006
after scroll 3:  25 items, 3 requests   (a short page ends it)
```

and the detail page at 1280 and 390: `h1` "Release 25", the body's own `#` rendering as an `h2`
under it, `**shipped**` bold, no horizontal overflow.

### Task 7 — feat/reference-pages

`/ci-cd` carries both files whole — GitHub Actions and GitLab CI — because what a person wants
from that page is something to commit, not a description of it. The base URL is
`window.location.origin`, so a copy works without a third variable to set, and the page says
outright that `PLUGIN_ID` and `USER_TOKEN` are names the developer owns and may rename as long as
the `curl` line changes with them. It also says which is a secret and which is not, and why:
GitHub masks a secret in logs and does not mask a variable.

`--fail-with-body` is in both, and the page says why — a rejected publish has to fail the job
*and* print what the server said, or it looks like a successful one.

`/policy` is the operator's policy, and says so: what may be published (the jars are executed by
the servers that install them), what is guaranteed about a download, that removal is the
operator's and there is no built-in reporting route to pretend otherwise, and exactly what is
stored — the scrypt hash, the session digests, the token digests, the audit trail, what a
registered server reports. Everything on it is something this software actually does.

Checked in Chromium at both widths. At 390px the two `<code>` blocks are wider than the viewport
and the page is not: they are inside `pre.md-code`, which scrolls on its own. That is the
design's rule for code rather than an exception to it.

### Task 8 — chore/news-and-pages-release

The changelog entries, the state file, and this record. `0.0.0` did not move.

**Left for later, deliberately:** the news list shows a hidden item to an author with no way to
filter for only the hidden ones, and there is no page listing every news item for editing — you
reach one through the list or its address. Both want a route that does not exist yet rather than
a guess at one.
