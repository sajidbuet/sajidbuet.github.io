# Phase 5 — Manual review set

| | |
|---|---|
| Date | 2026-09-22 |
| Branch | `redesign/phase-5-supporting-content` |
| Base revision | `2fe07ba` — *redesign: polish phase 4 projects and research layouts* |
| Hugo | 0.157.0+extended windows/amd64 (CI pins 0.152.1) |
| Browser | Chrome 153.0.8010.53, headless, driven over CDP (nothing installed) |
| Server | `hugo server --renderToMemory` on `127.0.0.1:1331` |
| Scale | deviceScaleFactor 1, scrollbars hidden |

Full matrix: `../full-qa/` (15 routes × 7 viewports, light + dark, plus zoom,
focus, reduced-motion and mobile-menu captures).
Machine-readable results: `../../../evidence/phase5-qa.json`,
`phase5-focus.json`.

---

## Pages captured

| # | File | Route | Viewport | Theme |
|---|---|---|---|---|
| 01 | `01-teaching-1440-light.png` | `/teaching/` | 1440×900 | light |
| 02 | `02-team-1440-light.png` | `/authors/` | 1440×900 | light |
| 03 | `03-resources-1440-light.png` | `/resources/` | 1440×900 | light |
| 04 | `04-resources-blog-1440-light.png` | `/resources/blog/` | 1440×900 | light |
| 05 | `05-teaching-390-light.png` | `/teaching/` | 390×844 | light |
| 06 | `06-team-390-light.png` | `/authors/` | 390×844 | light |
| 07 | `07-resources-390-light.png` | `/resources/` | 390×844 | light |
| 08 | `08-news-1440-light.png` | `/news/` | 1440×900 | light |
| 09 | `09-resources-1440-dark.png` | `/resources/` | 1440×900 | dark |
| 10 | `10-teaching-1440-dark.png` | `/teaching/` | 1440×900 | dark |

All full-page captures.

---

## What to look for

- **03 / 07 — Resources.** This replaces `/outreach/`, whose landing was a
  verbatim copy of the homepage outreach block. Five groups (Academic,
  Templates & Tools, Writing & Tutorials, Professional Activities, Beyond
  Research) rendered as rule-separated lists rather than a grid of large cards,
  because the items are heterogeneous text links. Groups appear only when they
  have content. Check the grouping reads sensibly and that personal material
  sits clearly under **Beyond Research**.
- **01 / 05 — Teaching.** Four current courses, then Curriculum & Laboratory
  Development, Books & Lecture Notes, Workshops & Tutorials, and the Archive
  linked by count rather than listed. **No course URL moved.** Check the
  Curriculum page does not overstate — it is written only from the EEE 416
  material already in the repository.
- **02 / 06 — Team.** This page previously had **no `<h1>` at all**. Confirm the
  heading and intro read correctly above the team showcase blocks.
- **08 — News.** Unchanged in substance; confirm it still looks right now that it
  is reached from the homepage and footer rather than the navbar.
- **09 / 10 — dark mode.** No literal colours were introduced; everything uses
  the Phase 2A semantic tokens.

---

## Migration status

| Item | Status |
|---|---|
| `/outreach/**` → `/resources/**` | done, 20 aliases |
| `/people/` → `/authors/` | done, 1 alias |
| Alias files generated and targets correct | ✅ 21/21, verified against build output |
| Local browser redirects | ✅ 13/13 checked in Chrome |
| No redirect chains or loops | ✅ every target confirmed not itself an alias |
| Internal-link crawl | ✅ 41,748 links / 599 pages — 0 stale, 0 Phase-5 breakage |
| Phase 4 routes intact | ✅ incl. `/projects/g-01..03/` → `/research/funding/g-01..03/` |
| Production Hugo build | ✅ passes, no new warnings |
| **Production redirect verification** | ⏳ **pending deploy** |

---

## QA results

| Check | Result |
|---|---|
| Exactly one `<h1>` | ✅ 105/105 route × viewport combos |
| Heading-level skips | ✅ 0 (5 `h1 → h3` skips were found and fixed) |
| Horizontal overflow | ✅ 0 across 105 combos |
| 200 % zoom (640 px) | ✅ no overflow on Teaching, Resources, Team |
| Dark mode | ✅ 15 routes, no `h1` or overflow issues |
| Keyboard focus ring | ✅ 66/66 tab stops on Resources, Teaching, Team |
| Mobile menu | ✅ opens, `aria-expanded` toggles, 8 items incl. Home |
| Reduced motion | ✅ no layout change, no overflow |
| Images missing `alt` | ✅ 0 |

---

## Known issues (all pre-existing, none introduced by Phase 5)

1. **Pagefind search 404s** — `/pagefind/pagefind.js` is missing, producing the
   only console errors in the run (43, all this one file). Untouched by
   instruction; carried since Phase 2A.
2. **Sub-24 px tap targets** — 75 on the workshop handout, 11 on a course page.
   Assigned to Phase 7.
3. **Workshop handout references 6 files that were never committed**
   (`files/memfile.dat`, `files/reference/{add.c,simple_alu.v,tb_simple_alu.v,simple_sum.s,memfile.dat}`).
   Present at `HEAD` too. Needs the author to supply them — not something to invent.
4. **`/courses/EEE_303_2020/Lecture_*.pdf`** — four links from archived EEE 303
   pages to a route that has never existed.
5. **`/research/RISE-Metalens`** — broken link predating this phase.
6. **BN site has no `/bn/resources/`, `/bn/teaching/`, `/bn/news/`** — the BN
   footer and menu point at sections that do not exist there. Pre-existing; BN
   nesting is Phase 8.
7. **27 `<a id="…"></a>` anchors** on the workshop handout. These have no `href`,
   so they are jump targets, not links, and do not appear in the accessibility
   tree. Noted only because a naive audit counts them as unnamed links.
8. **`content/authors/_index.md1`, `content/authors/me/_index.bn.md1`** — stray
   tracked files with a typo extension. Hugo ignores them. Left alone.

---

## Post-deploy checks required

Run these against the live site after merge, allowing for a Cloudflare purge:

```
https://www.sajid.bd/outreach/                               -> /resources/
https://www.sajid.bd/outreach/lor/                           -> /resources/academic/lor/
https://www.sajid.bd/outreach/blog/                          -> /resources/blog/
https://www.sajid.bd/outreach/blog/20260811-bracu-arm-workshop/
                                                             -> /teaching/workshops/bracu-arm-workshop/
https://www.sajid.bd/people/                                 -> /authors/
https://www.sajid.bd/projects/g-03/                          -> /research/funding/g-03/   (Phase 4 regression guard)
```

Local alias files and localhost browser redirects both pass, but GitHub Pages
behaviour cannot be proven locally.

---

## Environment note

This repository lives inside a synced OneDrive folder, which actively damages
it. During this phase OneDrive had left untracked `…-SAJID-PC` conflict copies
inside `content/`; Hugo published them as real pages carrying **duplicate
`/projects/g-0*/` aliases**, which silently broke a Phase 4 redirect until it was
caught here. All 11 were verified byte-identical to `HEAD`, backed up and
removed. Moving the repository outside OneDrive would remove this class of
failure entirely.

OneDrive is also writing conflict copies **inside the git directory itself** —
`.git/index-SAJID-PC`, `.git/ORIG_HEAD-SAJID-PC`, `.git/FETCH_HEAD-SAJID-PC`,
`.git/logs/HEAD-SAJID-PC`, `.git/logs/refs/remotes/origin/main-SAJID-PC`. These
were left in place rather than deleted, but they are the same mechanism that
destroyed `.git/index` outright earlier in this session, forcing a
`git read-tree HEAD` rebuild. Git metadata is not safe in a synced folder.
