# Phase 6 — Manual review set

| | |
|---|---|
| Date | 2026-09-22 |
| Branch | `redesign/phase-6-detail-templates` |
| Base revision | `6b518eb` — *redesign: complete phase 5 teaching team and resources* |
| Hugo | 0.157.0+extended windows/amd64 (CI pins 0.152.1) |
| Browser | Chrome 153.0.8010.53, headless, driven over CDP (nothing installed) |
| Server | `hugo server --renderToMemory` on `127.0.0.1:1332` |
| Viewports | 1440×900, 768×1024, 390×844 |

Full matrix: `../full-qa/` · raw results: `../../../evidence/phase6-qa.json` ·
detailed report: `../../../phase-6-detail-template-qa.md` ·
template inventory: `../../../phase-6-detail-template-map.md`

---

## Pages captured

| # | File | Route | Viewport | Theme |
|---|---|---|---|---|
| 01 | `01-publication-detail-1440-light.png` | `/publication/j-023/` | 1440×900 | light |
| 02 | `02-project-detail-1440-light.png` | `/projects/ctadmin/` | 1440×900 | light |
| 03 | `03-course-detail-1440-light.png` | `/teaching/jul2025_eee303/` | 1440×900 | light |
| 04 | `04-team-profile-1440-light.png` | `/authors/me/` | 1440×900 | light |
| 05 | `05-article-detail-1440-light.png` | `/resources/blog/20260124-citation-count/` | 1440×900 | light |
| 06 | `06-notes-index-1440-light.png` | `/teaching/notes/` | 1440×900 | light |
| 08 | `08-publication-detail-390-light.png` | `/publication/j-023/` | 390×844 | light |
| 09 | `09-project-detail-390-light.png` | `/projects/ctadmin/` | 390×844 | light |
| 10 | `10-course-detail-390-light.png` | `/teaching/jul2025_eee303/` | 390×844 | light |
| 12 | `12-publication-detail-1440-dark.png` | `/publication/j-023/` | 1440×900 | dark |
| 13 | `13-project-detail-1440-dark.png` | `/projects/ctadmin/` | 1440×900 | dark |

**07, 11 and 14 (book index / book chapter) are deliberately absent.** No real
book or lecture-note content exists, and the instruction is explicit that book
screenshots are only captured when real content does — `06-notes-index` stands
in its place. Chapter screenshots taken against a temporary validation fixture
are kept in `../full-qa/` as `book-chapter-*` and `book-index-*`; that fixture
was **deleted before completion**, so those images show content that is not in
the repository.

---

## Detail types tested

Publication · publication with sparse data · project · project minimal ·
project maximal · course (current) · course (archived) · course minimal ·
team profile (PI) · team profile (student) · blog article · article minimal ·
news post · workshop handout · notes index · book index · book chapter · grant.

**18 routes × 3 viewports + dark at 1440.**

---

## What to look for

- **01 / 08 / 12 — Publication.** The action row is the headline fix: DOI, URL,
  Cite and BibTeX. Before this phase **no publication page rendered a DOI, URL
  or PDF button at all** — the template read field names no publication uses.
  52 papers now show a DOI. Check the abstract, citation and BibTeX panels read
  cleanly and that the dark hero no longer ends in a white band.
- **02 / 09 / 13 — Project.** Header, status, technologies, links, collaborators.
  Note there is no screenshot gallery: neither project ships an image, and the
  template renders no empty media frame rather than a placeholder.
- **03 / 10 — Course.** Confirm the Course Outcomes table **scrolls inside its
  own box** at 390 px rather than pushing the page sideways, and that the
  "Course announcements" note reads as a proper callout.
- **04 — Team profile.** Publications and Projects are new. The PI page lists 8
  of 59 papers with a count link. **Supervision is intentionally missing** — no
  supervisor/advisor field exists anywhere in the author data, and inferring it
  from co-authorship is not permitted.
- **05 — Article.** Body text sits at a measured **68 ch**; tables and figures
  break out wider.
- **06 — Notes index.** An honest empty state. No fake book, no dummy chapters.
- **Breadcrumbs** appear on all of these and on none of the section landings.

---

## Minimal / maximal data tests

Temporary fixtures were used and then removed:

| Case | Result |
|---|---|
| Project: title/summary/date/status only | no empty media frame, no empty labels |
| Project: 28-word title, 10 technologies, 5 links, 2 related papers | no overflow at 390 px |
| Course: title + one-line summary only | renders clean |
| Article: title + body only | no metadata row, no TOC |
| Book chapter: no summary | renders clean |
| Publication: no DOI/PDF/abstract (`x-03`, real) | no empty action row |
| Author: name only, no profile data (real co-author terms) | no empty sections |
| Workshop: 364 KB, 87 headings, 8 images (real) | one `<h1>`, no skips, no overflow |

Across every route × viewport: **0 horizontal overflow, 0 `h1 != 1`, 0 heading
skips, 0 images without `width`/`height`, 0 empty lists.**

---

## Books & Notes status

Architecture and templates are complete and validated; **content is not**.

* `layouts/notes/list.html` serves both the shelf and a book landing.
* `layouts/notes/single.html` provides the chapter view, sidebar, prev/next.
* Ordering comes from Hugo page `weight`, never a hardcoded list.
* `type: notes` is cascaded from the section index — without that, chapters
  inherit `type: teaching` and render with the course template.
* Mobile: the sidebar collapses to 52 px closed / 259 px open at 390 px.
* Downloads render only for genuinely attached file resources.
* **Full-book PDF export is not implemented** and is not claimed in the UI. No
  PDF engine was added.

---

## Known issues

1. **Phantom author identity.** All 59 publications write `' me'` with a leading
   space, so Hugo mints `/authors/-me/` beside `/authors/me/`. Both render a full
   page — a duplicate-content split. Worked around template-side so profiles list
   the right papers; fixing it at source means editing 59 files. Recommended,
   not done here.
2. **Split student identities.** Profiles live at
   `/authors/0421062344-ayon-sarker/` while publication credits create
   `/authors/ayon-sarker/`. Resolving it properly means renaming taxonomy keys,
   which is an explicit stop condition for this phase.
3. **Supervision data does not exist** in any of the 19 author files, so that
   profile section could not be built.
4. **Pagefind search 404s** — the only console error in the run. Pre-existing
   since Phase 2A.
5. **`/teaching/notes/page/1/` no longer exists** — a Hugo paginator stub, not a
   content URL, created in Phase 5 and linked from nowhere.
6. Pre-existing broken links unchanged: `/research/RISE-Metalens`, four
   `/courses/EEE_303_2020/*.pdf`, six workshop `files/…` targets never
   committed, ten `/bn/…` routes (Phase 8).
7. Several student profile cards still have no portrait — missing avatar data,
   not a template issue.

---

## Environment note

The repository is inside a synced OneDrive folder. During Phase 5 this destroyed
`.git/index` outright and published untracked conflict copies as real pages,
silently breaking a Phase 4 redirect. Nothing similar occurred this phase, but
the hazard remains until the repository moves out of OneDrive.
