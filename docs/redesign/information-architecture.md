# SAJID.BD — Information Architecture

**Phase 1 proposal. Nothing below has been implemented.**

---

## 1. Current navigation and sitemap

### 1.1 Primary navbar as configured

`config/_default/menus.yaml` — **every item is an anchor into the homepage**:

```
Home          → /#about          (weight 10)
Research      → /#research       (weight 20)
Funding       → /#projects       (weight 25)
Team          → /#team           (weight 30)
Publications  → /#publication    (weight 40)
Teaching      → /#teaching       (weight 45)
News          → /#news           (weight 50)
Outreach      → /#outreach       (weight 60)
Contact       → /#contact        (weight 70)
```

A parallel `menus.bn.yaml` exists for Bengali.

### 1.2 What actually exists as pages

```
/                                     landing, 12 blocks, 12,728 px tall
├── /research/                         landing — hero + "Research Grants" collection
│   ├── /research/quantum/             landing — hero + tag-filtered publications
│   ├── /research/photonics/
│   ├── /research/antenna/
│   ├── /research/computing/
│   ├── /research/embedded/
│   └── /research/renewable/
├── /publication/                      62 items, filters, unpaginated
│   └── /publication/{j-001…j-029, c-001…c-028, p-01…p-02, x-01…x-04}/
├── /projects/                         ⚠ titled "Projects", contains 3 GRANTS
│   └── /projects/{g-01,g-02,g-03}/
├── /authors/                          "Our Team" — 25 people
│   └── /authors/{me, alumni, 24 students}/
├── /people/                           ⚠ duplicate of /authors/
├── /teaching/                         "Courses Offered"
│   ├── /teaching/{a2025_eee6516, eee400, jul2025_eee303, jul2025_eee304}/
│   └── /teaching/archive/
├── /news/                             21 posts
├── /outreach/                         ⚠ verbatim copy of homepage #outreach block
│   ├── /outreach/blog/                10 posts
│   ├── /outreach/templates/
│   ├── /outreach/lor/
│   ├── /outreach/scientific-typing/
│   ├── /outreach/graphics/
│   ├── /outreach/professional/
│   ├── /outreach/songs/
│   ├── /outreach/hobbies/
│   └── /outreach/poetry/
├── /tags/                             tag taxonomy
├── /publication_types/                publication-type taxonomy
├── /downloads/                        (empty)
└── /bn/…                              376 Bengali pages
```

**The gap is the whole problem:** a substantial, well-built page tree exists, and the primary navigation
points at none of it.

---

## 2. Problems with the current hierarchy

| # | Problem | Evidence |
|---|---|---|
| 1 | **Nav is anchors-only.** No primary nav item leads to a real page. | `menus.yaml`; rendered `nav.visibleLinks` |
| 2 | **Nine equal-weight items.** No hierarchy, no room for Projects or Books, no room for a Contact action. | `detail/home-1440-light-y0.jpg` |
| 3 | **Active state never fires.** `eq $menuURL $pageURL` can't match an anchor against a page URL. | `navbar.html:54`; zero `.active` in DOM |
| 4 | **`Funding` → `/#projects` → folder `projects/` → page titled "Projects".** Three names, one body of content. | visual-audit P1-08 |
| 5 | **The `projects` namespace is already taken** by funding, blocking the new portfolio. | `content/projects/` |
| 6 | **`/outreach/` duplicates the homepage block verbatim.** | `content/outreach/_index.md` |
| 7 | **`/people/` duplicates `/authors/`.** Both "Our Team", neither has an `h1`. | visual-audit P1-11 |
| 8 | **"Outreach" is a weak label** covering resources, blog, service, poetry and songs. | `content/outreach/` |
| 9 | **The homepage is an index of everything** — 12 sections, 12,728 px. It has no editorial view. | measured |
| 10 | **Bengali content nested inside the English contentDir** → every BN page built twice. | visual-audit P0-04 |
| 11 | **Research areas are orphaned.** Six good landing pages reachable only via homepage cards. | `menus.yaml` |
| 12 | **No breadcrumbs in use** despite `_partials/breadcrumbs.html` existing. | rendered DOM |

---

## 3. Proposed sitemap

```
/                                      curated landing page
│
├── /research/                         Research
│   ├── #overview                        what the lab does (Q-PACERS)
│   ├── /research/quantum/               ┐
│   ├── /research/photonics/             │
│   ├── /research/antenna/               ├ six area pages (unchanged URLs)
│   ├── /research/computing/             │
│   ├── /research/embedded/              │
│   ├── /research/renewable/             ┘
│   ├── /research/funding/               ← Funding & Grants  (moved from /projects/)
│   │   └── /research/funding/g-0#/
│   ├── #collaborations                  partners (from homepage logos block)
│   └── /research/opportunities/         positions, supervision, prospective students
│
├── /publications/                     Publications   (alias ← /publication/)
│   └── /publications/<id>/
│
├── /projects/                         Projects  ★ NEW — the portfolio
│   ├── /projects/software/              Software & Open Source
│   ├── /projects/educational/           Educational Tools
│   ├── /projects/research-software/     Research Software
│   ├── /projects/hardware/              Embedded / Hardware
│   ├── /projects/automation/            Automation & Utilities
│   └── /projects/<slug>/                detail pages
│
├── /teaching/                         Teaching
│   ├── /teaching/courses/               current + archive
│   ├── /teaching/curriculum/            curriculum & laboratory development
│   ├── /teaching/notes/                 Books & Lecture Notes   ★ NEW
│   │   └── /teaching/notes/<book>/
│   │       ├── /teaching/notes/<book>/ch-01/
│   │       └── /teaching/notes/<book>/downloads/
│   └── /teaching/workshops/             workshops & tutorials
│
├── /team/                             Team   (alias ← /authors/, /people/)
│   ├── /team/<person>/
│   └── /team/alumni/
│
├── /resources/                        Resources   (alias ← /outreach/)
│   ├── /resources/academic/             LOR, scientific typing
│   ├── /resources/templates/            templates & tools
│   ├── /resources/blog/                 writing / tutorials
│   ├── /resources/professional/         professional activities
│   └── /resources/personal/             graphics, songs, poetry, hobbies
│
├── /news/                             archive — NOT in primary nav
│   └── /news/<slug>/
│
└── /contact/                          page, plus a persistent header action
```

---

## 4. Proposed primary navbar

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [SAJID Lab logo]   Research  Publications  Projects  Teaching  Team         │
│                     Resources                        🔍  ☾   [ Contact ]     │
└──────────────────────────────────────────────────────────────────────────────┘
        ↑ = Home link                                              ↑ = distinct action
```

Six content items + one action. Down from nine.

### 4.1 Home

**Recommendation: remove the textual `Home` item; the logo becomes the Home link.**

The logo already links to `site.Home.RelPermalink` (`navbar.html:12`). Conditions to satisfy before
removing the text item — all cheap, none currently met:

- The brand `<a>` must have a real accessible name — today it announces raw CSS (visual-audit P1-03).
  Fix to `aria-label="SAJID Lab — home"`.
- The **mobile menu must also expose Home**, because the logo and the open menu panel compete for the
  same region on small screens. Keep a "Home" entry inside the mobile panel only.
- Breadcrumbs (`_partials/breadcrumbs.html`, already present) should be switched on for depth ≥ 2 pages
  so "back to the top level" is never only the logo.

With those three in place, removing the text `Home` is safe. Without them it is not — so treat them as a
**precondition**, not a nicety.

### 4.2 Contact

**Recommendation: a visually distinct header action, not an equal-weight nav item.**

This needs **no template work** — HugoBlox already supports it, and the override already renders it
(`navbar.html:206-216`):

```yaml
# config/_default/params.yaml
header:
  cta:
    enable: true
    text: "Contact"
    url: "/contact/"
```

Two caveats found in the existing markup, to fix when enabling:
- The desktop CTA is `hidden lg:inline-block`; the mobile duplicate (`navbar.html:122-130`) renders with
  `class=""` — **unstyled**. It needs styling before launch.
- The CTA's border colours are hardcoded `border-black … dark:border-white`, bypassing theme tokens.

### 4.3 Dropdowns — weaker than they look, but not broken

> **Correction (Phase 2A).** Phase 1 stated that the dropdown trigger has "no click or key handler" and
> that `aria-expanded` is "hardcoded to false". **That was wrong**, and it was wrong because the finding
> was made by reading the template alone. `_vendor/.../blox/assets/js/hb-nav.js` binds both a `click`
> and a `keydown` (Enter / Space / Escape) handler to `.nav-dropdown > .nav-link[role="button"]`, and it
> updates `aria-expanded` on toggle. Dropdowns **are** keyboard operable today.

The proposed Research and Teaching groupings imply submenus. HugoBlox's navbar supports `.HasChildren`,
and the trigger is:

```html
<span role="button" tabindex="0" aria-haspopup="true" aria-expanded="false">
```

The real, smaller problems are:

- The trigger is a `<span role="button">` rather than a `<button>` — it works, but it relies entirely on
  the JS for semantics that native markup would give for free.
- CSS **also** opens the panel on hover at ≥1024px (`lg:group-hover:visible`), independently of the JS
  state, so the visual state and `aria-expanded` can disagree.
- There is no focus management into or out of the open panel, and no click-outside dismissal.

**Therefore:** either (a) tighten the dropdown component before introducing any submenu, or
(b) ship flat top-level links to section landing pages and let each landing page carry its own in-page
sub-navigation. **Option (b) is recommended** — it is simpler, it works today, and it keeps the six
research areas discoverable via a real page rather than a hover menu.

---

## 5. Secondary navigation

| Level | Mechanism |
|---|---|
| Section landing pages | In-page section nav / anchor rail (Research: Overview · Areas · Funding · Collaborations · Opportunities) |
| Deep pages (≥ 2 levels) | Breadcrumbs — enable the existing `_partials/breadcrumbs.html` |
| Publications | Keep the existing Tag / Type / Year filter toolbar |
| Projects | Category filter mirroring the publication filter pattern |
| Books & Notes | Per-book chapter sidebar / prev-next |
| Footer | Keep the current PI card + Important Links; add the six primary destinations |
| Mobile | Single panel, 48 px rows (already correct), **plus** a keyboard-operable toggle |

---

## 6. Research / Funding migration

### 6.1 Current state

| | |
|---|---|
| Content | `content/projects/g-01`, `g-02`, `g-03` |
| URLs | `/projects/`, `/projects/g-01/`, `/projects/g-02/`, `/projects/g-03/` |
| Referenced by | homepage block `id: projects` (`view: grant`, titled "Research Grants"); `/research/` collection block (`folders: [projects]`, `view: grant`); navbar `Funding → /#projects` |
| External inbound links | Unknown — must be checked in Search Console before the move |

### 6.2 Target

```
Research
├── Overview
├── Research Areas          (the six existing Q-PACERS pages — URLs unchanged)
├── Funding & Grants        ← content/projects/  →  content/research/funding/
├── Collaborations
└── Opportunities
```

### 6.3 Migration, lowest-risk ordering

**Step 1 — rename the label only. Zero URL change.**
Change `menus.yaml` `Funding → /research/#funding`, and set the `/projects/` page title to
"Funding & Grants". Both names now agree; nothing breaks. This alone resolves most of the confusion.

**Step 2 — move the content.**
`content/projects/` → `content/research/funding/`, with `g-0#` bundles intact.
Update the two `collection` blocks' `filters.folders` from `projects` to `research/funding`.

**Step 3 — preserve the old URLs.**

> ⚠ **`disableAliases: true` is set in `hugo.yaml:45`.** Hugo's `aliases:` front matter therefore emits
> **nothing**. Either flip that flag or use the `redirects` output format (already declared for the home
> page: `outputs.home: [HTML, RSS, headers, redirects, backlinks]`), which generates a `_redirects` file.
>
> **But `_redirects` is a Netlify format and the site deploys to GitHub Pages**, which ignores it. On
> GitHub Pages the only reliable options are (a) alias pages — requires `disableAliases: false` — or
> (b) Cloudflare Bulk Redirects at the edge, since Cloudflare already fronts the domain.
>
> **Recommendation:** set `disableAliases: false` and add `aliases: ['/projects/g-01/']` etc.
> Confirm the generated `public/projects/g-01/index.html` redirect stubs exist before deploying.

**Step 4 — free the namespace.** Only after Step 3 is verified live, create the new `content/projects/`
portfolio. Never run Steps 3 and 4 in the same deploy.

**Step 5 — fix the data.** All three grants carry `date: '2008-01-01'`. Set `date` from `start_date`
(2021…) so ordering is correct, and switch `/research/funding/`'s list view from `citation` to `grant`.

### 6.4 Terminology, settled

| Term | Means | Lives at |
|---|---|---|
| **Funding & Grants** | Money awarded to do research | `/research/funding/` |
| **Projects** | Things built — software, tools, hardware | `/projects/` |
| **Research Areas** | Q-PACERS thrusts | `/research/<area>/` |
| **Publications** | Papers | `/publications/` |

---

## 7. New Projects area

### 7.1 Recommended content model

A **page bundle per project**, `content/projects/<slug>/index.md`, with category as **taxonomy**, not
directory. Directories would force a URL change whenever a project is re-categorised; a taxonomy would
not.

Add to `hugo.yaml`:
```yaml
taxonomies:
  author: authors
  tag: tags
  publication_type: publication_types
  project_category: project_categories     # new
  technology: technologies                 # new
```

### 7.2 Front matter

```yaml
title: "QPACER Toolkit"
summary: "One sentence — what it is and who it is for."        # listing card
description: "2–3 sentences for meta description and og:description."
date: 2026-03-01                    # first public release
lastmod: 2026-09-01

project_category: software          # software | educational | research-software | hardware | automation
status: active                      # active | maintained | archived | prototype | planned
featured: true

technologies: [Python, FastAPI, Docker]

image:
  filename: thumbnail.png           # 16:9, in the bundle
  caption: "…"
  focal_point: Center
screenshots:
  - { file: screen-01.png, caption: "…" }

links:
  repository:    https://github.com/…
  demo:          https://…
  documentation: https://…
  release:       https://github.com/…/releases/latest
  package:       https://pypi.org/project/…

collaborators: [me, 0421062341-Purbayan-Das]   # reuse the existing authors taxonomy
related_publications: [j-029]                  # publication bundle IDs
related_research: [photonics]                  # research area slugs
license: MIT
```

Notes on choices:
- `collaborators` reuses the **existing `authors` taxonomy**, so project pages appear on people's
  profiles for free.
- `status` mirrors the vocabulary already used by the research cards (`active`, `emerging`, `past`,
  `planning`) — align the two rather than inventing a second set.
- `links` is a map, so a project with only a repo does not carry five empty keys.

### 7.3 Proposed categories

| Category | Slug | Scope |
|---|---|---|
| Software & Open Source | `software` | General-purpose released software |
| Educational Tools | `educational` | Teaching aids, simulators, course tooling |
| Research Software | `research-software` | Simulation, analysis, data pipelines tied to papers |
| Embedded / Hardware | `hardware` | Boards, firmware, instruments |
| Automation & Utilities | `automation` | Scripts and lab utilities |

> **Start with three, not five.** `software`, `research-software`, `hardware` cover the likely near-term
> content; a category with one item reads as an empty shelf. Add the others when they have ≥ 3 entries.

---

## 8. Teaching / Books & Lecture Notes

### 8.1 Recommended hierarchy — as proposed in the brief, with one change

```
Teaching
├── Courses                              /teaching/courses/
├── Curriculum & Laboratory Development  /teaching/curriculum/
├── Books & Lecture Notes                /teaching/notes/
└── Workshops / Tutorials                /teaching/workshops/
```

The change: **`/teaching/notes/`, not `/teaching/books/`.** "Notes" scales down to a single chapter set
without over-promising a book; a finished book still reads correctly at that URL.

`content/outreach/blog/20260811-BRACU-ARM-Workshop/` is already workshop material sitting in the blog —
it should move to `/teaching/workshops/`.

### 8.2 Book structure

```
content/teaching/notes/computer-architecture/
├── _index.md            type: book, title, summary, cover, status: draft|published
├── ch-01/index.md       weight: 1
├── ch-02/index.md       weight: 2
└── downloads/index.md   PDFs, slides, errata
```

Use Hugo's **section weight + `.Prev`/`.Next`** for chapter ordering. A book needs three things the
current site lacks: a chapter sidebar, prev/next, and a print/PDF route. Budget for those in Phase 6.

### 8.3 Promotion criteria — when "Books & Notes" earns a top-level slot

Promote only when **all** hold:

1. ≥ 2 distinct books/note sets, **or** 1 complete book of ≥ 8 chapters.
2. The material is cited or assigned outside BUET (external inbound links, another institution's syllabus).
3. Analytics show `/teaching/notes/*` receiving ≥ 15 % of `/teaching/` traffic over 3 months.
4. Its own navigation needs (chapter tree, search, downloads) have outgrown a Teaching subsection.

Until then it stays under Teaching. Adding it to the navbar early costs a top-level slot to show one
draft chapter — the brief's instinct here is right.

---

## 9. Outreach → Resources

**Recommendation: rename to `Resources`, and split off what is not a resource.**

"Outreach" in an academic context normally means public engagement and science communication. The
section actually holds student-facing resources, a technical blog, professional service, and personal
creative work — four different things for four different audiences.

| Current | Proposed | Why |
|---|---|---|
| `/outreach/lor/` | `/resources/academic/lor/` | Student-facing |
| `/outreach/scientific-typing/` | `/resources/academic/scientific-typing/` | Student-facing |
| `/outreach/templates/` | `/resources/templates/` | Reusable assets |
| `/outreach/graphics/` | `/resources/templates/graphics/` | Reusable assets |
| `/outreach/blog/` | `/resources/blog/` | Writing and tutorials |
| `/outreach/professional/` | `/resources/professional/` | Service and leadership |
| `/outreach/songs/`, `/poetry/`, `/hobbies/` | `/resources/personal/` | **Keep — do not delete** |

On the personal pages: they are part of who the site represents and the brief says to preserve
worthwhile material. Group them under one clearly-labelled "Beyond Research" heading so a visitor
looking for a template is not routed through poetry, and someone curious about the person can still find it.

**Also fix:** `/outreach/_index.md` is a verbatim copy of the homepage `#outreach` block. The section
index should be a real index of its subsections, not a clone.

---

## 10. News

**Recommendation: remove from the primary navbar; keep everywhere else.**

Reasoning from the evidence:
- 21 posts, most announcing papers and thesis defences — these are *supporting* signals, not a primary
  destination. Someone evaluating the lab wants Research, Publications, Team.
- The homepage already surfaces the 3 most recent (`count: 3`).
- Removing it from nav frees one of the six slots for **Projects**, which is genuinely new information.

**Discoverability is preserved** by: the homepage feed with a "View all news" link; a footer link;
`/news/` remaining indexed with its RSS feed (`outputs.section: [HTML, RSS]`); and news items continuing
to appear in search.

**Net:** small loss for repeat visitors who check news directly (mitigated by the footer link), clear
gain for first-time visitors. Recommended — but this is a judgement call and reasonable people differ;
if news posting is frequent and the audience is largely returning students, keeping it is defensible.

---

## 11. Contact

Covered in §4.2. In addition: create a real `/contact/` **page** rather than keeping contact as a
homepage-only anchor. The existing `contact-info` block content (address, directions, office hours, map,
social, prospective-students note) is good and should move there wholesale, with the homepage keeping a
compressed version.

---

## 12. URL changes and risk

| Current | Proposed | Risk | Mitigation |
|---|---|---|---|
| `/projects/`, `/projects/g-0#/` | `/research/funding/…` | **High** — real pages with possible inbound links | Aliases (needs `disableAliases: false`); stage per §6.3; never reuse `/projects/` in the same deploy |
| `/outreach/**` | `/resources/**` | **High** — 9 subsections, blog posts likely shared | Aliases on every moved page; keep `/outreach/` as an alias index |
| `/authors/**` | `/team/**` | **Medium** — `authors` is a *taxonomy*; renaming changes the taxonomy key | Prefer keeping `/authors/` and **deleting `/people/`**. A cosmetic rename is not worth the taxonomy churn |
| `/publication/` | `/publications/` | **Low but unnecessary** | **Recommend leaving as `/publication/`.** 62 papers with DOIs and citations point here. Cosmetic plural is not worth the risk |
| `/teaching/<course>/` | `/teaching/courses/<course>/` | Medium | Aliases |
| `/news/**` | unchanged | None | — |
| `/research/<area>/` | unchanged | None | — |

### Recommended URL policy

> **Change a URL only when the change carries meaning.** `/projects/` → `/research/funding/` does
> (it removes a genuine collision). `/publication/` → `/publications/` does not.

### Pre-migration checklist

1. Export top landing pages from Google Search Console; confirm which of the moving URLs have inbound links.
2. Verify alias generation works **on GitHub Pages** (`disableAliases: false`) on a branch deploy first.
3. Keep `sitemap.xml` and `index.xml` valid throughout; resubmit the sitemap after each stage.
4. Fix `baseURL` (visual-audit P2-06) **before** any of this — a wrong base URL poisons every emitted alias.

---

## 13. Content to consolidate

| Consolidate | Into | Reason |
|---|---|---|
| `/people/` + `/authors/` | `/authors/` | Identical pages, split link value |
| `/outreach/_index.md` block | Generated section index | Verbatim duplicate of the homepage block |
| `[X03]` + `[X04]` publications | One record | Identical entries |
| `Andrea Alu` / `Andrea Alù` | One spelling | Both slug to `andrea-alu` → duplicate taxonomy pages |
| `content/bn/` | `content.bn/` (sibling dir) | Nested contentDir → every BN page built twice |
| `/outreach/graphics/` | `/resources/templates/` | Same purpose, same audience |
| Homepage Collaborators block | `/research/#collaborations` | Belongs with research, summarised on home |

## 14. Content to keep separate

| Keep separate | Reason |
|---|---|
| Research areas as six pages | Each has distinct publications and a real audience |
| `/publication/` vs `/projects/` | Papers and built artefacts are genuinely different objects |
| Funding vs Projects | The distinction this redesign exists to make |
| `/news/` vs `/resources/blog/` | Announcements vs written articles — different cadence and intent |
| Personal pages (songs, poetry, hobbies) | Real content; group them, don't merge them into professional resources |
| Bengali site | Separate language, separate contentDir (just move it out of `content/`) |
| `/teaching/archive/` | Historical courses shouldn't dilute the current list |

---

## 15. Homepage hierarchy

### Proposed order

```
1.  Hero / Identity              who, what, one sentence — with a real <h1>
2.  Research at a Glance         6 Q-PACERS areas → /research/
3.  Selected Publications        3–5 curated, not most-recent → /publication/
4.  Featured Projects            3 featured → /projects/            ★ new
5.  Team                         PI + group snapshot → /authors/
6.  Teaching & Notes             current courses → /teaching/
7.  Latest News                  3 items → /news/
8.  Collaborators                logo band
9.  Contact / Footer
```

**One change from the brief's draft order:** Publications before Projects. The audience evaluating an
academic lab — prospective students, collaborators, reviewers — looks for publications first.
Projects is new and exciting, but publications are the credential. Revisit once the project portfolio
is substantial.

**Stats band:** move it into the hero as a compact strip rather than a separate 576 px section. The
numbers (50+ papers, 1,299+ citations, h-index 13) are the strongest credibility signal on the page
and currently sit below the fold *and* start at `opacity: 0`.

### What belongs where

| Deserves homepage prominence | Summarise on homepage | Remove from homepage | Detail/archive only |
|---|---|---|---|
| Identity + one-line positioning | 6 research areas (title + 1 line) | **Full grant list** (1,829 px — belongs on `/research/funding/`) | All 62 publications |
| Key metrics (papers, citations, h-index) | 3–5 selected publications | **Full outreach block** (1,105 px, duplicated at `/outreach/`) | All 21 news items |
| Primary CTA (Contact / Join) | 3 featured projects | **Standalone CTA-button section** (288 px for one button) | Full team roster |
| PI identity | Current courses only | Personal content (songs, poetry) | Course detail |
| | Latest 3 news | | Grant detail |

Removing the grant list, the outreach block and the orphan CTA section alone cuts roughly
**3,200 px (~25 %)** off the homepage before any redesign work.

---

## 16. Summary of IA changes

| Change | Type | Risk |
|---|---|---|
| Nav: anchors → real page links | Config (`menus.yaml`) | Low |
| Nav: 9 items → 6 + Contact CTA | Config | Low |
| Remove `Home` text item | Config + 3 preconditions (§4.1) | Low |
| Contact → header CTA | Config (`header.cta`) + style the mobile duplicate | Low |
| Remove `News` from nav | Config | Low — reversible |
| `Outreach` → `Resources` | Content move + aliases | **High** |
| Funding out of `/projects/` | Content move + aliases, staged | **High** |
| New `/projects/` portfolio | New content + taxonomies + templates | Medium |
| `Books & Notes` under Teaching | New content type | Medium |
| Delete `/people/` | Content deletion + alias | Low |
| Move `content/bn/` out of `content/` | Config + content move | Medium — verify URLs unchanged |
