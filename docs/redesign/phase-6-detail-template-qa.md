# Phase 6 — Detail template QA

| | |
|---|---|
| Date | 2026-09-22 |
| Branch | `redesign/phase-6-detail-templates` |
| Base revision | `6b518eb` (after Phase 5) |
| Hugo | 0.157.0+extended (CI pins 0.152.1) |
| Browser | Chrome 153.0.8010.53 headless over CDP — nothing installed |
| Viewports | 1440×900, 768×1024, 390×844 |
| Raw results | `docs/redesign/evidence/phase6-qa.json` |

Template inventory and the weaknesses this phase set out to fix:
`docs/redesign/phase-6-detail-template-map.md`.

---

## Publication

**Route:** `/publication/<id>/` · template `layouts/publication/single.html`

| Field | Supported | Source |
|---|---|---|
| Title, authors, venue, date, type | ✅ | front matter |
| DOI action | ✅ | `hugoblox.ids.doi` |
| Publisher URL action | ✅ | `links[].url` |
| PDF action | ✅ | `url_pdf` → `links[name=PDF]` → `*.pdf` resource |
| Citation block | ✅ | `views/citation` partial |
| BibTeX block | ✅ | `cite.bib` resource |
| Abstract | ✅ | `abstract` |
| Figure | capability only | no publication bundle ships an image |
| Related (tags → topic pages) | ✅ | `tags` |

### The headline fix

The action row read `.Params.doi`, `.Params.url` and `.Params.pdf`. **No
publication in the repository has any of those fields** — Phase 4 moved DOIs to
`hugoblox.ids.doi`, the publisher link lives in `links:`, and the single PDF is
`url_pdf`. Every publication page therefore shipped with **zero** external
action buttons; only "Cite" and "BibTeX" rendered.

| | Before | After |
|---|---|---|
| Pages with a DOI button | 0 | **52** |
| Pages with a publisher URL button | 0 | **8** |
| Pages with a PDF button | 0 | **1** |
| Pages with no external action | 61 | **4** |

The remaining 4 genuinely have no DOI, URL or PDF. Two further papers declare
`links: [{name: URL, url: ''}]` — an empty string — and are correctly skipped
rather than rendering a button that goes nowhere.

**Sparse data:** `/publication/x-03/` (no DOI, no PDF, no abstract) renders with
one `<h1>`, no empty action row and no empty panels.
**Stress data:** `/publication/j-023/` — a 17-word title, two authors, a long
journal name, a full abstract and a 20-line BibTeX entry. No overflow at any
viewport. Titles containing math (`Steane [[7,1,3]]`) render through KaTeX
without raw LaTeX leaking into `<title>`.

**Also fixed:** two empty `<p>` elements under the Citation and BibTeX
headings; an inline `<style>` block built on `--color-primary-*` literals moved
to `assets/css/phase6.css` and re-expressed in Phase 2A tokens — its dark rule
ended in `rgba(255,255,255,1)`, painting a white band across the hero in dark
mode.

---

## Project

**Route:** `/projects/<slug>/` · template `layouts/projects/single.html`

The Phase 4 layout already covered the roadmap's sequence, so this phase
repaired it rather than rewriting it.

| Aspect | Result |
|---|---|
| Header: title, summary, category, status, licence, links | ✅ kept |
| Motivation → problem → features → architecture | authored in Markdown body, rendered as prose |
| Screenshots | **fixed** — the caption was read from `$.file` (the *page's* File object, always nil) and every image shipped `alt=""`. Now reads `caption`/`alt` from each screenshot entry |
| Technologies, related publications, related research, collaborators | ✅ kept, all conditional |
| Breadcrumb | **upgraded** from a single hardcoded `<p>` link to the shared trail |

Narrative sections are deliberately **not** front-matter driven. Neither
project has body content or screenshots today, and inventing an architecture
section from a repository name is exactly what §15 forbids. The template
renders whatever the author writes.

**Sparse data:** a fixture with only title/summary/date/status/category rendered
with no empty media frame, no "Technologies" label and no empty link row.
**Stress data:** a fixture with a 28-word title, 10 technologies, 5 link types,
2 related publications, a related research area and a collaborator produced no
overflow at 390 px.

---

## Course

**Route:** `/teaching/<course>/`, `/teaching/archive/<course>/` ·
**new** template `layouts/teaching/single.html`

Courses previously had **no project template at all** and fell through to the
vendor default.

| Aspect | Result |
|---|---|
| Title, subject, course type, term, archived status | ✅ front matter |
| Instructor | ✅ supported (`instructor:`), currently set by no course |
| Outline / outcomes / materials / schedule / announcements | rendered from the Markdown body |
| Tables | scroll inside their own wrapper; page never overflows |
| Table of contents | disclosure, shown only when the page is long enough |
| Archived notice | text label plus a link back to Teaching — never colour alone |

Across 33 course files there are **zero** uses of `outcomes`, `schedule`,
`materials`, `announcement`, `instructor` or `assessment` in front matter — that
structure is authored as `## Course Outcomes`, `## Syllabus`, `## Textbooks` and
HTML tables. Building front-matter-driven sections would have created machinery
no course populates, so the template supplies the header, metadata strip and
table treatment and renders the body as written.

**A large improvement in page weight:** the vendor template's `page_related`
partial was emitting a link to **every publication in both languages** on every
course page. `/teaching/jul2025_eee303/` went from **250 internal links to 23**.
That block is precisely the algorithmic "you may also like" dump §42 rules out.

---

## Team profile

**Route:** `/authors/<slug>/` · template `layouts/authors/term.html`

| Section | Result |
|---|---|
| Portrait, name, role, affiliation, links | ✅ already present |
| Biography, research interests, education, experience | ✅ already present |
| **Publications** | ✅ **new** — 8 most recent plus a count link |
| **Projects** | ✅ **new** — from explicit `collaborators` |
| Supervision | ❌ **not built — no data exists** |
| Breadcrumb | ✅ new |

`/authors/me/` now lists 8 of **59** authored papers with "All publications (59)".
Student profiles list their own papers. 146 of 164 author pages gained a
related section; **0** rendered an empty list.

### Two data quirks worked around, not silently changed

1. Every publication writes `' me'` with a **leading space**, so Hugo mints a
   phantom term `/authors/-me/` next to the real `/authors/me/`, and the real
   term page has no pages attached.
2. Student profiles live at `/authors/0421062344-ayon-sarker/` while their
   publication credits create `/authors/ayon-sarker/`.

Matching on the profile's display name as well as the term slug resolves both
**template-side**. Fixing them at source means editing 59 files or renaming the
author taxonomy — and renaming that taxonomy is an explicit Phase 6 stop
condition. Recommended follow-up is in the map document.

**Supervision is deliberately absent.** No `supervisor`, `advisor` or equivalent
field exists in any of the 19 author data files. §23 forbids inferring it from
co-occurrence, so the section is not built and is reported as blocked on data.

---

## Article / news

**Routes:** `/resources/blog/<slug>/`, `/news/<slug>/`,
`/teaching/workshops/<slug>/`, `/resources/personal/<slug>/` ·
**new** template `layouts/single.html`

These four types had no project template. The new one provides breadcrumbs, a
bounded reading measure, conditional date/author metadata, a lead image with
explicit dimensions, and a TOC disclosure for long pages.

**Measured reading width: 68 ch** on article, news, workshop, chapter and
archived-course pages (64 ch on the current-course page, whose body font differs
slightly) — inside the 65–72 ch target. Figures, tables, code blocks and
KaTeX display math break out of the measure so wide scientific tables stay
readable.

**Sparse data:** a fixture with only a title and body rendered with no metadata
row, no media frame and no TOC.
**Stress data:** the BRACU ARM workshop — 364 KB of HTML, 87 headings, 8 images,
27 anchor targets — renders with one `<h1>`, no heading skips and no overflow at
390 px.

**Also fixed:** six blog articles began at `###` or `####`, producing an
`h1 → h3` skip. All now start at `##`.

---

## Books & Notes

**Routes:** `/teaching/notes/`, `/teaching/notes/<book>/`,
`/teaching/notes/<book>/<chapter>/` ·
**new** templates `layouts/notes/list.html`, `layouts/notes/single.html`

| Requirement | Status |
|---|---|
| Book index / shelf | ✅ one template serves both, decided by the content tree |
| Chapter template | ✅ |
| Sidebar with current-chapter marking | ✅ |
| Previous / next | ✅ ordered by Hugo page `weight`, never hardcoded |
| Mobile disclosure | ✅ `<details>`, 52 px closed vs 259 px open at 390 px |
| Downloads | ✅ renders only genuinely attached file resources |
| Status badge (draft / in progress / published) | ✅ when `status` is set |
| Breadcrumbs | ✅ four levels deep |
| **Real book content** | ❌ **none exists** |

`type: notes` is **cascaded** from `content/teaching/notes/_index.md`. Hugo
derives `type` from the top-level section, so without the cascade every book and
chapter would inherit `type: teaching` and render with the course template —
which is exactly what happened on the first attempt.

**No fake book was created.** `/teaching/notes/` shows an honest empty state.
The templates were validated against a temporary fixture book (3 chapters,
including a deliberately long chapter title), which confirmed:

* chapter 1 → no previous link, next = chapter 2;
* chapter 2 → previous = 1, next = 3, position "2/3";
* chapter 3 → previous = 2, no next link.

**The fixture was deleted before completion.** Chapter screenshots taken against
it remain in `full-qa/` as template-validation evidence and are labelled as
such; the review set carries `06-notes-index-1440-light.png` instead, per the
instruction's fallback.

**Print/PDF:** no PDF mechanism exists in the repository and none was added — a
PDF engine is an unapproved dependency. Chapter pages inherit the site's
existing print behaviour. Full-book PDF export is **deferred and unimplemented**;
it is not claimed anywhere in the UI.

---

## Breadcrumbs

`layouts/_partials/breadcrumbs.html`, rewritten. One implementation, used by
every detail template.

Two inadequate implementations already existed. The project-owned partial was
unused and emitted a `◎` glyph plus a `fas fa-page` icon that does not exist in
the icon set. The vendor partial is a `<div>` with `whitespace-nowrap
overflow-hidden` — neither a navigation landmark nor able to wrap at 390 px —
and was gated behind `show_breadcrumb`, which no page sets.

| Requirement | Result |
|---|---|
| `<nav aria-label="Breadcrumb">` | ✅ |
| Semantic ordered list | ✅ |
| Current page not linked to itself, carries `aria-current="page"` | ✅ |
| Wraps at 390 px | ✅ flex-wrap, no `nowrap` |
| Depth ≥ 2 only | ✅ a page whose only ancestor is home renders nothing |

**13/13** real detail routes pass all three structural checks. Verified trails:

```
Teaching > EEE 303 (Jul 2025)
Teaching > Archive > EEE 416 (January 2023)
Teaching > Workshops & Tutorials > Instructions to Hardware: …
Teaching > Books & Lecture Notes > <book> > <chapter>
Resources > Writing & Tutorials > Getting Citation Count …
Resources > Beyond Research > Poems
Publications > <paper title>
Projects > CTAdmin
Team > Dr. Sajid Muhaimin Choudhury
Research > Funding & Grants > <grant>
```

Section landings (`/teaching/`, `/resources/`, `/news/`) correctly render none.

---

## Images

| Metric | Result |
|---|---|
| Detail pages scanned | 316 |
| `<img>` tags | 354 |
| **Missing `width`/`height`** | **0** |
| Missing `alt` | 0 |

The only offender was the footer `BUET_LOGO.svg`, present once on every page.
Hugo cannot report `.Width`/`.Height` for an SVG resource, so its intrinsic size
was taken from the file's own `viewBox` (`0.0 0.0 316.0 316.0`) rather than
guessed. CSS still controls display size; the attributes only fix the aspect
ratio.

Publication figures, project screenshots and article lead images all emit
dimensions from the processed Hugo resource. Lead images are `fetchpriority=high`;
below-the-fold screenshots are `loading=lazy`.

**No exceptions remain.** No remote image is referenced by any Phase 6 template.

---

## Responsive QA

18 routes × 3 viewports (1440×900, 768×1024, 390×844) + dark at 1440 = **54
light combinations plus 18 dark**.

| Check | Result |
|---|---|
| Horizontal overflow | **0** across every combination, light and dark |
| Exactly one `<h1>` | **0** failures |
| Heading-level skips | **0** on real routes after the blog fix |
| Images missing dimensions | **0** |

---

## Accessibility smoke test

| Check | Result |
|---|---|
| One `<h1>` per page | ✅ 13/13 real detail routes |
| Logical heading sequence | ✅ 0 skips |
| Breadcrumb semantics | ✅ nav + ol + `aria-current`, 13/13 |
| Keyboard focus visibility | ✅ **26/26** tab stops on a chapter page show the 2 px `--sj-focus-ring` outline |
| Chapter sidebar without a mouse | ✅ `<details>`/`<summary>` is natively focusable and operable |
| Tables usable | ✅ inner scroll, semantic `<table>`, readable headers, both themes |
| Essential content hidden by JS | ✅ none — the sidebar list is in the DOM regardless of disclosure state |
| Console errors | 1, pre-existing: `/pagefind/pagefind.js` 404 |

Focus was measured with real `Tab` keypresses. A programmatic `.focus()` reports
no ring by design here, because `custom.css:83` suppresses the outline for
`:focus:not(:focus-visible)`.

---

## Regression

| Route | Result |
|---|---|
| `/`, `/research/`, `/research/funding/`, `/projects/`, `/publication/`, `/teaching/`, `/authors/`, `/resources/`, `/news/` | ✅ all render |
| `/projects/g-01/` → `/research/funding/g-01/` | ✅ Phase 4 alias intact |
| `/outreach/lor/` → `/resources/academic/lor/` | ✅ Phase 5 alias intact |
| `/people/` → `/authors/` | ✅ Phase 5 alias intact |
| `/outreach/` → `/resources/` | ✅ Phase 5 alias intact |
| Internal-link crawl | 27,872 links / 599 pages — **0 stale, 0 new breakage** |

Landing pages were never at risk from the new generic `layouts/single.html`:
every one of them declares `type: landing`, which takes precedence.

**One artifact URL disappeared:** `/teaching/notes/page/1/`, a Hugo paginator
stub. `/teaching/notes/` no longer calls `.Paginate`, so no stub is emitted. It
was created in Phase 5, is linked from nowhere and was never a content URL.

### Pre-existing broken links, unchanged

`/research/RISE-Metalens` · `/courses/EEE_303_2020/Lecture_{1,2-3,4-6,7-8}.pdf` ·
six `files/…` targets referenced by the workshop handout but never committed ·
ten `/bn/…` routes that do not exist in the Bengali site (Phase 8).
