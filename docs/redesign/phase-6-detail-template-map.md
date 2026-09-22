# Phase 6 — Detail template map

Inventory taken from the **actual repository and a rendered build**, not from
the Phase 1 plan. Base revision `6b518eb` (after Phase 5).

---

## 1. Current state

| Type | Content path | Canonical URL | Current template | Renders via |
|---|---|---|---|---|
| Publication | `content/publication/<id>/index.md` | `/publication/<id>/` | `layouts/publication/single.html` | project |
| Project | `content/projects/<slug>/index.md` | `/projects/<slug>/` | `layouts/projects/single.html` | project |
| Grant | `content/research/funding/g-0N/index.md` | `/research/funding/g-0N/` | `layouts/grant/single.html` | project |
| Author profile | `content/authors/<slug>/_index.md` + `data/authors/<slug>.yaml` | `/authors/<slug>/` | `layouts/authors/term.html` | project |
| Research area | `content/research/<area>/…` | `/research/<area>/` | `layouts/research-area.html` | project |
| **Course (current)** | `content/teaching/<course>.md` | `/teaching/<course>/` | *none* | **vendor `single.html`** |
| **Course (archive)** | `content/teaching/Archive/<course>.md` | `/teaching/archive/<course>/` | *none* | **vendor `single.html`** |
| **Workshop** | `content/teaching/workshops/<slug>/index.md` | `/teaching/workshops/<slug>/` | *none* | **vendor `single.html`** |
| **Blog article** | `content/resources/blog/<slug>/index.md` | `/resources/blog/<slug>/` | *none* | **vendor `single.html`** |
| **News post** | `content/news/<slug>.md` | `/news/<slug>/` | *none* | **vendor `single.html`** |
| **Personal page** | `content/resources/personal/*.md` | `/resources/personal/<slug>/` | *none* | **vendor `single.html`** |
| Book / chapter | — | — | — | does not exist yet |

**Six of twelve detail types had no project-owned template at all.** They fell
through to `_vendor/…/blox/layouts/single.html`, which is where the missing
breadcrumbs and the unconstrained prose width both come from.

---

## 2. Front-matter fields that actually exist

Measured across the repository, not assumed.

### Publications (61 bundles)

| Field | Count | Note |
|---|---|---|
| `title`, `authors`, `publication_types`, `date` | 61 | always present |
| `cite.bib` resource | 61 | BibTeX works today |
| `publication` (venue) | 56 | |
| `hugoblox.ids.doi` | 52 | **the template read `.Params.doi`, which no publication has** |
| `abstract` | 29 | |
| `tags` | 60 | |
| `links:` (`[{name: URL, url}]`) | 10 | only ever `name: URL` |
| `url_pdf` | 1 | |
| `featured: true` | 4 | homepage curation flag, **not** an image |
| images in bundle | **0** | no publication figure exists anywhere |
| `projects:` | 0 | no publication→project relationship data |

### Projects (2 bundles)

`title`, `summary`, `description`, `date`, `project_category`, `status`,
`technologies`, `project_links`, `collaborators`; one has `related_research`.
**No images, no screenshots, no body content.**

### Courses (33 files)

| Field | Count |
|---|---|
| `summary` | 15 |
| `course_type` | 9 |
| `date` | 6 |
| `syllabus` | 2 |
| `outcomes`, `schedule`, `materials`, `announcement`, `instructor`, `assessment` | **0** |

Course structure lives in the Markdown body as `## Course Outcomes`,
`## Syllabus`, `## Textbooks` and HTML tables — not in front matter.

### Authors (164 taxonomy terms, 25 profile pages)

`data/authors/<slug>.yaml` supplies `title`, `name`, `role`, `bio`,
`organizations`, `education`, `interests`, `user_groups`, and for students
`params.student`, `graduation_year`, `thesis`.

---

## 3. Known weaknesses found

| # | Finding | Where |
|---|---|---|
| 1 | **DOI / URL / PDF action buttons never render.** Template reads `.Params.doi` / `.Params.url` / `.Params.pdf`; the real fields are `hugoblox.ids.doi` (52), `links[].url` (10), `url_pdf` (1). Only "Cite" and "BibTeX" appeared. | `publication/single.html` |
| 2 | Two empty `<p>` elements under the Citation and BibTeX headings | `publication/single.html` |
| 3 | Inline `<style>` block using `--color-primary-*` literals instead of Phase 2A `--sj-*` tokens | `publication/single.html` |
| 4 | Featured image emitted with no `width`/`height` | `publication/single.html` |
| 5 | Screenshot loop sets caption to `$.file` (the page's File object, not a caption) and emits `alt=""` for every screenshot | `projects/single.html` |
| 6 | Breadcrumb is a single hardcoded link in a `<p>`, not a semantic trail | `projects/single.html` |
| 7 | No publications / projects / supervision on author profiles | `authors/term.html` |
| 8 | No breadcrumbs anywhere; `show_breadcrumb` is set on no page | site-wide |
| 9 | Vendor breadcrumb partial uses `<div>` + `whitespace-nowrap overflow-hidden` — not a `<nav>`/`<ol>`, and cannot wrap on mobile | `_vendor` |
| 10 | Project-owned `layouts/_partials/breadcrumbs.html` is unused and emits `◎` plus a non-existent `fas fa-page` icon | project |
| 11 | **Phantom author identity.** All 59 publications write `' me'` with a leading space, so Hugo mints a second term `/authors/-me/` beside `/authors/me/`. Both render a full page. | `content/publication/*` |
| 12 | Author identities split: publication credits create `/authors/ayon-sarker/` while the profile lives at `/authors/0421062344-ayon-sarker/` | taxonomy vs content |

Items 11 and 12 are **content/taxonomy data issues**, not template bugs. Fixing
them properly means either editing 59 files or renaming taxonomy keys, and
renaming the author taxonomy is an explicit Phase 6 stop condition. They are
therefore worked around template-side and reported, not silently changed.

---

## 4. Phase 6 target

| Type | Template | Action |
|---|---|---|
| Publication | `layouts/publication/single.html` | fix actions, citation block, figures capability, related, breadcrumb, tokens |
| Project | `layouts/projects/single.html` | fix screenshot caption/alt, real breadcrumb |
| Grant | `layouts/grant/single.html` | breadcrumb only — Phase 4 layout otherwise kept |
| Author | `layouts/authors/term.html` | add publications, projects, supervision |
| Course | **`layouts/teaching/single.html`** (new) | header, metadata strip, body, tables, TOC, breadcrumb |
| Workshop / blog / news / personal | **`layouts/single.html`** (new) | 68ch prose, breadcrumb, conditional metadata |
| Book index | **`layouts/notes/list.html`** (new) | chapter list, status, downloads |
| Book chapter | **`layouts/notes/single.html`** (new) | sidebar, prev/next, breadcrumb |
| Breadcrumb | `layouts/_partials/breadcrumbs.html` | rewrite as accessible `<nav>`/`<ol>` |

One shared breadcrumb partial, one shared prose container, no duplicate
templates solving the same problem.
