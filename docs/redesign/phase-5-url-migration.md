# Phase 5 — URL Migration Report

**`/outreach/**` becomes `/resources/**`, and `/people/` is removed.** This
document records how every old URL was preserved.

| | |
|---|---|
| Date | 2026-09-22 |
| Branch | `redesign/phase-5-supporting-content` |
| Base revision | `2fe07ba` (after Phase 4) |
| Hugo | 0.157.0 extended (CI pins 0.152.1) |
| Deployment | GitHub Pages (`.github/workflows/publish.yaml`), Cloudflare in front |
| Browser | Chrome 153.0.8010.53 headless, driven over CDP |

---

## 1. Redirect mechanism

Unchanged from Phase 4: GitHub Pages ignores Netlify `_redirects`, so the only
mechanism is **Hugo alias stubs** — `<meta http-equiv=refresh>` plus
`<link rel=canonical>`. `disableAliases` was already `false` after Phase 4 and
was **not** touched in this phase.

Aliases went from **30 → 52** (EN). The 22 added are the 21 in the table below
plus one paginator stub; BN is unchanged at 11.

---

## 2. Outreach migration

Every row verified three ways: the alias file exists and points at the expected
canonical URL; the canonical target exists and is **not itself an alias** (no
redirect chains); and a real browser landed on the canonical path.

| Old URL | Existing content | New canonical URL | Alias required | Verified |
|---|---|---|---|---|
| `/outreach/` | Verbatim copy of the homepage outreach block | `/resources/` | yes | ✅ |
| `/outreach/lor/` | LOR request guidance + request form + CV template | `/resources/academic/lor/` | yes | ✅ |
| `/outreach/scientific-typing/` | Unicode scientific symbol cheatsheet | `/resources/academic/scientific-typing/` | yes | ✅ |
| `/outreach/templates/` | Q-PACERS presentation templates (3 × pptx) | `/resources/templates/` | yes | ✅ |
| `/outreach/graphics/` | BUET / BUET-EEE logo files (24 assets) | `/resources/templates/graphics/` | yes | ✅ |
| `/outreach/blog/` | Blog listing | `/resources/blog/` | yes | ✅ |
| `/outreach/professional/` | IEEE / Optica service record | `/resources/professional/` | yes | ✅ |
| `/outreach/songs/` | Music — covers, compositions | `/resources/personal/songs/` | yes | ✅ |
| `/outreach/poetry/` | Bengali poetry | `/resources/personal/poetry/` | yes | ✅ |
| `/outreach/hobbies/` | Photography, guitar, web development | `/resources/personal/hobbies/` | yes | ✅ |

### Blog posts

| Old URL | New canonical URL | Verified |
|---|---|---|
| `/outreach/blog/20230414-md-image/` | `/resources/blog/20230414-md-image/` | ✅ |
| `/outreach/blog/20230424-ai-tools/` | `/resources/blog/20230424-ai-tools/` | ✅ |
| `/outreach/blog/20230707-excelhacks/` | `/resources/blog/20230707-excelhacks/` | ✅ |
| `/outreach/blog/20240711-paperrevisionoverleaf/` | `/resources/blog/20240711-paperrevisionoverleaf/` | ✅ |
| `/outreach/blog/20250407-microsoft-teams-bulkadd/` | `/resources/blog/20250407-microsoft-teams-bulkadd/` | ✅ |
| `/outreach/blog/20250427-microsoft-teams-biis-check/` | `/resources/blog/20250427-microsoft-teams-biis-check/` | ✅ |
| `/outreach/blog/20250511-ct-admin/` | `/resources/blog/20250511-ct-admin/` | ✅ |
| `/outreach/blog/20260124-citation-count/` | `/resources/blog/20260124-citation-count/` | ✅ |
| `/outreach/blog/20260224-word-lakh-taka-bdt/` | `/resources/blog/20260224-word-lakh-taka-bdt/` | ✅ |

### Workshop move

| Old URL | New canonical URL | Rationale | Verified |
|---|---|---|---|
| `/outreach/blog/20260811-bracu-arm-workshop/` | `/teaching/workshops/bracu-arm-workshop/` | Workshop handout, not a blog post (roadmap §25) | ✅ |

The other nine blog posts stayed in `/resources/blog/` — they are tutorials and
tooling write-ups, not teaching material. Classification was by purpose, not by
format.

---

## 3. People cleanup

`content/people/_index.md` differed from `content/authors/_index.md` by **one
line** (`subtitle: 'Principal Investigator'` vs `subtitle: ''`), verified with
`diff` before deletion. The authors copy was the better of the two, so nothing
unique was lost.

| Old URL | New canonical URL | Alias | Verified |
|---|---|---|---|
| `/people/` | `/authors/` | yes, on `content/authors/_index.md` | ✅ |

The `authors` **taxonomy is deliberately not renamed** to `team` (IA §16). The
navbar label reads "Team" while the route stays `/authors/`; renaming the
taxonomy key would churn every author URL for a cosmetic gain.

---

## 4. Routes introduced

| URL | Content |
|---|---|
| `/resources/` | Resources section index (new layout, not the old block copy) |
| `/resources/academic/` | Academic Resources group |
| `/resources/templates/` | Templates & Tools (moved) |
| `/resources/blog/` | Writing & Tutorials (moved) |
| `/resources/professional/` | Professional Activities (moved) |
| `/resources/personal/` | Beyond Research group |
| `/teaching/curriculum/` | Curriculum & Laboratory Development |
| `/teaching/notes/` | Books & Lecture Notes (honest placeholder, no fake chapters) |
| `/teaching/workshops/` | Workshops & Tutorials |
| `/teaching/workshops/bracu-arm-workshop/` | Workshop handout (moved) |

**No course URL was moved.** `/teaching/<course>/` and `/teaching/archive/<course>/`
are unchanged. The Teaching landing was reorganised without touching the routes,
per roadmap §22 — the existing URLs are stable and meaningful, so moving them
would have added migration risk without adding meaning.

---

## 5. Alias generation

**Verified — yes.** Checked against generated artifacts, not console output.
All **21** alias stubs (20 Outreach + `/people/`) were confirmed to:

1. exist at the expected output path;
2. contain a refresh URL exactly matching the intended canonical URL;
3. resolve to a target that exists and is **not itself an alias**.

Result: **PASS = 21, FAIL = 0.** No redirect loops, no duplicate output paths,
no canonical conflicts.

---

## 6. Local browser redirects

**Verified — yes.** Chrome headless navigated to each old URL against
`hugo server` and the resulting `location.pathname` was recorded. See
`docs/redesign/evidence/phase5-qa.json` → `redirects`.

---

## 7. Production verification

**PENDING.** As in Phase 4, local alias files cannot prove deployed GitHub Pages
behaviour. After merge and deploy, confirm on the live domain:

```
https://www.sajid.bd/outreach/            -> /resources/
https://www.sajid.bd/outreach/lor/        -> /resources/academic/lor/
https://www.sajid.bd/outreach/blog/       -> /resources/blog/
https://www.sajid.bd/outreach/blog/20260811-bracu-arm-workshop/
                                          -> /teaching/workshops/bracu-arm-workshop/
https://www.sajid.bd/people/              -> /authors/
```

Cloudflare caching sits in front of Pages, so allow for a purge before judging a
stale response.

---

## 8. Internal links

Crawl over the generated non-minified site (`docs/redesign/evidence/crawl`):

| Metric | Result |
|---|---|
| Pages crawled | 599 |
| Internal links checked | 41,748 |
| **Links resolving via an alias (stale)** | **0** |
| Broken links attributable to Phase 5 | **0** |

Normal internal navigation points at canonical `/resources/**` routes
everywhere; `/outreach/**` survives only as alias stubs.

### Stale links fixed in this phase

| File | Was | Now |
|---|---|---|
| `layouts/_partials/site_footer.html` | `/outreach/lor/` | `/resources/academic/lor/` |
| `layouts/_partials/site_footer.html` | `/outreach/scientific-typing/` | `/resources/academic/scientific-typing/` |
| `layouts/_partials/site_footer.html` | `/outreach/blog/` | `/resources/blog/` |
| `config/_default/menus.yaml` | `Outreach → /outreach/` | `Resources → /resources/` |
| `content/bn/_index.md` | `url: /outreach` | `url: /resources` |
| `content/resources/academic/lor/index.md` | `https://www.sajid.bd/outreach/LOR` | `…/resources/academic/lor/` |
| `content/resources/academic/lor/index.md` | `https://https:///outreach/LOR` (malformed, ×2) | `https://www.sajid.bd/resources/academic/lor/` |
| `content/resources/blog/20250427-…-BIIS-Check/index.md` | linked to **itself** via `/outreach/blog/20250427-…` | `/resources/blog/20250407-microsoft-teams-bulkadd/` |
| `content/resources/templates/_index.md` | `PI_Presentation_QPACERS` (no extension → 404) | `PI_Presentation_QPACERS.pptx` |
| `content/news/2024-05-09-new-pg-course.md` | `/teaching/A2024_EEE6004Q` (typo, never existed) | `/teaching/archive/a2024_eee6002q/` |

### Pre-existing broken links NOT introduced by Phase 5

Left as found, since fixing them needs content that does not exist in the repo:

| Target | Referenced from | Note |
|---|---|---|
| `/research/RISE-Metalens` | research pages | predates Phase 5 |
| `/courses/EEE_303_2020/Lecture_{1,2-3,4-6,7-8}.pdf` | archived EEE 303 pages | `/courses/` route has never existed |
| `files/memfile.dat`, `files/reference/{add.c,simple_alu.v,tb_simple_alu.v,simple_sum.s,memfile.dat}` | BRACU ARM workshop handout | referenced at `HEAD` too; the files were never committed |
| `/bn/{resources,teaching,news,research/funding}/…` (10) | BN footer and menu | the BN site has no such sections; BN nesting is Phase 8 |

`result.url` in `404.html` is a JavaScript template literal, not a link.

---

## 9. Remaining risk

| Risk | Status |
|---|---|
| Production redirect behaviour on GitHub Pages | **Unverified** — post-deploy check required (§7) |
| Cloudflare may serve cached `/outreach/**` for a while | Expected; purge after deploy |
| Old `/outreach/**` links in third-party sites | Covered by aliases, which are permanent |
| BN site still lacks `/bn/resources/` | Pre-existing; deferred to Phase 8 |
| Workshop handout references 6 uncommitted files | Pre-existing; needs the author to supply them |

---

## 10. A regression this phase caught and fixed

The first production build after the content move sent `/projects/g-03/` — a
**Phase 4** alias — to `/research/funding/g-03-sajid-pc/`.

Cause: OneDrive had left untracked conflict copies (`…-SAJID-PC`) inside
`content/`, including `content/research/funding/g-0{1,2,3}-SAJID-PC/`. Hugo read
them as real pages, so two pages declared the alias `/projects/g-01..03/` and the
duplicate won. Five phantom pages were being published (631 vs 626).

All 11 conflict copies were verified byte-identical to `HEAD`, backed up, and
removed. `/projects/g-0{1,2,3}/` now resolve to `/research/funding/g-0{1,2,3}/`
again. This is why the repository should not live inside a synced OneDrive
folder — see the note in the review README.

---

## 11. A second trap: `.gitignore` was hiding the new section

`.gitignore` line 13 read:

```
resources/
```

Unanchored, so it matched **every** directory named `resources` at any depth —
not just Hugo's generated `/resources/` at the repository root. That silently
excluded the entire new section from version control:

```
content/resources/_index.md            the Resources landing page
content/resources/academic/_index.md   Academic Resources group
content/resources/personal/_index.md   Beyond Research group
layouts/resources/overview.html        the section template
```

`git status` showed nothing wrong — ignored files simply do not appear. Had this
gone unnoticed, the commit would have carried the content moves and the aliases
but **not** the landing page or its template, so `/resources/` would have
rendered as a bare Hugo fallback list (or 404'd) on the deployed site while
every `/outreach/**` alias redirected traffic to it.

Fixed by anchoring the rule to the repository root:

```
/resources/
```

Verified afterwards: `git check-ignore` reports the four files above as **not**
ignored, and `resources/` at the root is still ignored.

The moved page bundles (`content/resources/blog/**`, `templates/**`,
`professional/**`, `personal/songs/**`, `academic/lor/**`) were never at risk —
`git mv` stages a rename explicitly, which overrides the ignore rule. Only the
files created fresh in this phase were affected, which is exactly the set that
would have been hardest to notice missing.
