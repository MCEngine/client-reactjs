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
