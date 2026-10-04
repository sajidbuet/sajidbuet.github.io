# Site Audit — 4 October 2026

**Scope:** the whole sajid.bd site as built from `main` at commit `94cd8cf`, in both languages (English and Bengali): content, data, configuration, generated HTML, links and the publication record.

**Status:** findings only. Nothing was changed while preparing this report.

## How the audit was done

| Check | Method | Coverage |
|---|---|---|
| Build | `hugo --gc --minify --printPathWarnings --printI18nWarnings --printUnusedTemplates`, Hugo 0.157.0 (local) | 673 HTML files: 608 pages + 65 redirect stubs |
| Internal links and assets | Parsed every built page; resolved each `href`, `src` and `srcset` against the output folder | All 608 pages |
| Page metadata and basic accessibility | Same crawl: `<title>` in `<head>`, meta description, canonical, `lang`, `<h1>` count, image `alt`, link names, heading order, duplicate `id`s | All 608 pages |
| External links | HEAD, then GET, with a 15 s timeout | 181 unique URLs |
| Publication data | Parsed the front matter of all `content/publication` and `content/bn/publication` pages. Suspect DOIs were checked against the **Crossref API** (`api.crossref.org/works/<doi>`). | 61 EN + 62 BN papers |
| Content front matter | Parsed YAML for every `content/**/*.md` | All content files |
| Cross-source facts | Compared the CV (`cv/`), profile data (`data/authors/`), roster (`_pythonscripts/all-members.xlsx`), news and Bengali pages | Roles, dates, names, metrics |

**Limits:**
- No browser rendering, visual review or Lighthouse scores.
- External links answering 403 or timing out from this network are listed as *could not verify*, not as broken: publishers and DOI resolvers routinely block automated requests.
- Severity ratings are my judgement. They weigh public visibility and factual accuracy highest.

**Clean results** (no problems found):
- no YAML errors
- no drafts
- no future-dated pages
- every page has a `<title>`, a meta description, a `lang` attribute and a canonical URL
- every English page links only to existing English targets, apart from the 9 file links in M11

## Summary

| Severity | Count | Meaning |
|---|---|---|
| **Critical** | 3 | Publicly visible false information, or build output that is undefined |
| **High** | 8 | Wrong or contradictory facts, or broken links/pages at scale |
| **Medium** | 13 | Inconsistencies a visitor or maintainer will hit |
| **Low** | 7 | Polish, accessibility basics, repository hygiene |

---

## Critical

### C1. The Bengali homepage shows fake "partners" from the template
`content/bn/_index.md:270–310` (the `logos` block), live at `/bn/`.

The block is titled "Collaborators & Partners" and lists six organisations, each with `partners/placeholder-logo.svg` as its image:

| Listed | Description shown |
|---|---|
| MIT | Massachusetts Institute of Technology |
| Stanford University | Stanford Research Collaboration |
| Google Research | AI & Machine Learning Partnership |
| National Science Foundation | **Research Funding Partner** |
| Microsoft Research | Computing Research Collaboration |
| NIH | National Institutes of Health |

It also has a "Become a Partner" button. This is unedited HugoBlox template content. It claims funding and collaborations the lab doesn't have. The English homepage has no such block.

**Fix:** delete the block, or replace it with the real logos block used on the English homepage.

### C2. Every Bengali page is generated twice; which version is deployed is undefined
**Build log:** `WARN Duplicate target paths` for every `/bn/publication/*`, `/bn/research/*`, `/bn/index.html`, `/bn/authors/me/` and `/authors/andrea-alu/` (143 paths).

**Cause:**
- `config/_default/hugo.yaml:24–35` gives English `contentDir: content`.
- That folder also contains `content/bn/`.
- The English language therefore renders every Bengali file as an English section at `/bn/…`.
- The Bengali language (`contentDir: content/bn`) renders the same paths.

Hugo writes both, and the last write wins, so the deployed `/bn/` pages may be either version. (`/authors/andrea-alu/` is a separate cause; see H3.)

**Fix:** move the English content into `content/en/` and set `contentDir: content/en`. Alternatively, exclude `bn/**` from the English content mount.

### C3. Three conference papers have wrong titles or DOIs (verified with Crossref)
The source is `cv/papers.bib`. The errors appear on the website (`content/publication/c-025…c-028`, plus the Bengali copies) and in both CV PDFs.

| Entry | Problem | Crossref says |
|---|---|---|
| **c-025** (QPAIN 2025) | Title copied from c-024: "DFT Analysis of Strain Effect in Bilayer 2D-SiC…" | DOI `10.1109/QPAIN66474.2025.11172078` is **"Half-Adder and Full-Adder Implementation with Continuous Variable Quantum Gates in a Photonic Quantum Computer"** (Shakil, Choudhury) |
| **c-027** "Valley Photonic Topological Insulator for Fluorescence Endoscopy" | DOI `10.1109/PIERS-Spring66516.2025.11276753` | That DOI belongs to c-026 ("Towards High-Performance Quantum-Based LEDs…", Haque, Choudhury) |
| **c-028** "Integrating Deep Learning and Topology Optimization…" | Same DOI as c-026 | As above |

**Fix:**
1. Correct the title of c-025, and the DOIs of c-027/c-028 (look these up; they were not determined here).
2. Re-import with `python _pythonscripts/import_publications.py`.
3. Rebuild the CV.

---

## High

### H1. 230 Bengali pages link to 7 pages that don't exist
On every Bengali page:
- **6 footer links**, because `layouts/_partials/site_footer.html:117–159` passes English-only sections through `relLangURL`: `/bn/resources/academic/lor/`, `/bn/resources/academic/scientific-typing/`, `/bn/resources/blog/`, `/bn/teaching/`, `/bn/resources/`, `/bn/news/`.
- **The CV icon** links to `/bn/cv.pdf`.

The Bengali homepage also links to `/bn/research/funding/` and `/bn/resources`.

**Fix:** use `relURL` for sections that only exist in English, or add Bengali equivalents.

### H2. Each student has two unconnected person pages
Roster students have a profile at the roster slug, e.g. `/authors/0421062341-purbayan-das/`. Their publications list them by printed name, which creates a second, empty taxonomy page, e.g. `/authors/purbayan-das/`.

As a result, a student's name on a publication links to the empty page, not to their profile. This affects the 11 roster members who appear in publications (Purbayan Das, Ayon Sarker, Puja Das, Md Al Shahriar Shakil, Naved Sadat Yamin, Tanvir Ahmed, Md. Mahfuzul Haque, Shamima Akter Mitu, Md. Ehsanul Karim, Md Asif Hossain Bhuiyan, Soikot Sarkar), and repeats for the Bengali copies.

**Fix:** either make the data slugs equal the urlized publication names (e.g. `purbayan-das`), or map names to slugs during import (`import_publications.py` already rewrites author names for the owner).

### H3. Co-authors are split across several pages by spelling variant
Different spellings in `papers.bib` produce separate author pages:

| Person | Variants on the site |
|---|---|
| M. A. Matin | M. A. Matin (4), MA Matin (2), Md. Abdul Matin (2), M.A. Matin, Md A Matin, Md Matin |
| A. V. Kildishev | Alexander V. Kildishev (8), Alexander V Kildishev (5) |
| V. M. Shalaev | Vladimir M. Shalaev (7), Vladimir M Shalaev (3), Vladimir Shalaev |
| Z. A. Kudyshev | Zhaxylyk A. Kudyshev, Zhaxylyk A Kudyshev, Zhaxylyk Kudyshev |
| M. Gaffar | Md. Gaffar (5), Md Gaffar (3), M. Gaffar |
| M. A. Zaman | Mohammad Asif Zaman (6), MA Zaman (2), M. A. Zaman |
| S. A. Mamun | Sayed Ashraf Mamun, SA Mamun |
| S. I. Bozhevolnyi | Sergey I. Bozhevolnyi, Sergei Bozhevolnyi |
| A. Alù | Andrea Alù (2), Andrea Alu. Both urlize to `andrea-alu`, which is a duplicate output path. |
| Students | Md. Ehsanul Karim / Ehsanul Karim; Md. Mahfuzul Haque / Md Mahfuzul Haque; Md Asif Hossain Bhuiyan / Md. Asif Hossain Bhuiyan |
| **Site owner** | **"SM Choudhury"** in j-002 and j-003 isn't mapped to `me`. It appears as a separate author, `/authors/sm-choudhury/`, and those two papers don't show on your profile. |

**Fix:**
- Normalise the names in `papers.bib`.
- Add `SM Choudhury` to `OWNER_NAMES` in `_pythonscripts/import_publications.py`.
- The CV template already handles all spellings of your name (`\cvselfname`).

### H4. The Bengali profile is outdated and has two diverging data sources
- `data/authors/me.bn.yaml:6–7` gives your role as **সহযোগী অধ্যাপক (Associate Professor)**. Its experience lists Associate and Assistant Professor only, with no Professor appointment.
- `content/bn/authors/me/_index.md` also says Associate Professor. It describes you as currently **Chair** of the IEEE Photonics Society Bangladesh Chapter (the CV says Founding Chair Mar 2021 – Apr 2022, Vice Chair since Apr 2022). It names a role, "IEEE বাংলাদেশ সেকশনের শিক্ষা কার্যক্রমের চেয়ারম্যান" (Chair of Educational Activities, IEEE Bangladesh Section), that isn't in the CV.
- That file has **no front matter**, so the page title falls back to "SAJID Lab".
- `data/authors/me.bn.yaml` and `data/authors/bn/me.yaml` both exist and **differ**.

**Fix:** keep one Bengali data file, update the role and roles list, and add front matter with a title.

### H5. The Bengali homepage statistics are stale
`content/bn/_index.md:56–80` shows "50+" publications, "1298+" citations and "h-index: 13". The CV data generated on 2026-10-04 (`cv/metrics.tex`) has **61** entries, **1,419** citations and **h-index 14**. The English homepage removed these numbers on purpose (`content/_index.md:35`).

**Fix:** remove them, as on the English page, or generate them from `cv/metrics.tex`.

### H6. Appointment and education dates disagree between sources
| Item | CV (`cv/cv-body.tex`) | Website (`data/authors/me.yaml`, `me.bn.yaml`) | Roster (`all-members.xlsx`, PI row) |
|---|---|---|---|
| Current role | Professor (Jul 2025) | Professor | **Associate Professor** |
| Assistant Professor | Jun 2013 – Jul 2022 | **2019-01-01 – 2019-12-31** | — |
| Associate Professor from | Jul 2022 | 2022-06-21 | — |
| M.Sc. | Aug 2011 – 2013 | ends 2011-11-11 | — |
| B.Sc. | Dec 2004 – Aug 2010 | ends 2009-11-11 | — |

The `-11-11` dates look like placeholders. Which source is correct could not be determined.

### H7. Machine-copy files are published as pages
- `content/projects/_index-SAJID-PC.md` and `content/research/funding/_index-SAJID-PC.md` render as `/projects/_index-sajid-pc/` and `/research/funding/_index-sajid-pc/`. Each duplicates its section's title.
- The repository tracks **about 40** other leftovers from syncing between machines or older versions:
  - `*-SAJID-PC.*` copies in `layouts/`, `assets/css/`, `content/` and `docs/`
  - `*.html1` and `*.md1` files (`content/authors/_index.md1`, `content/authors/me/_index.bn.md1`)
  - `_pythonscripts/52447CFB.tmp`, `_pythonscripts/all-members-BAK.xlsx`, `hugo_stats-Sajid-Asus-Laptop.json`

**Fix:** delete them, after diffing each `-SAJID-PC` copy against its original in case it holds newer edits.

### H8. A news post links to a DOI that doesn't exist
`content/news/2024-09-06-synergizing-deep-learning.md:10` links to `https://doi.org/10.1016/j.optlastec.2024.108789`, which doi.org reports as 404. Crossref resolves the correct DOI, `10.1016/j.optlastec.2024.111730`, to this paper ("Synergizing deep learning and phase change materials…"). The publication page already uses it.

---

## Medium

### M1. An old "outreach" graphics page is still published
`content/outreach/templates/graphics/` (index plus 25 logo files) is still built at `/outreach/templates/graphics/`. Phase 5 moved this content to `/resources/templates/graphics/`, which also exists, with a different `_index.md`. Both versions show 11 logo images without `alt` text.

### M2. A stale Bengali publication: `bn/publication/x-04`
English has 61 publications and Bengali has 62. Bengali `x-04` duplicates `x-03` ("HBT Perovskite/CdS Solar Cell…"). In English, x-04 was merged and kept only as an alias on x-03.

### M3. One course appears under two codes
Every page title reads "**EEE 6505** Nanophotonics and Plasmonics", for the 2021, 2022 and 2023 offerings. The 2021 and 2022 files are named `A2021_EEE6405.md` and `A2022_EEE6405.md`, and all three page bodies say "the course on **EEE 6405** Nanophotonics and Plasmonics". The CV uses EEE 6505.

### M4. News doesn't match the roster or CV
- "Ayon **Sarkar** Defends MSc Thesis" (`content/news/2025-07-05-ayon-defends.md`). The roster, CV and publications spell it **Sarker**.
- "Mahfuz Defends Final" is dated **2025-03-05**, but the roster and CV list his graduation as **Jan 2025**. The title is also informal and incomplete.
- `content/news/2024-01-01-vo₂-based-all.md` has a non-ASCII filename (₂). Its URL comes out as `/news/2024-01-01-vo-based-all/`, which no longer matches the filename.

### M5. Domain and lab-name inconsistencies
- `CNAME` is `sajid.bd` (apex), but `baseURL` is `https://www.sajid.bd/` (`config/_default/hugo.yaml:14`). Local builds emit `www` canonicals, while CI overrides the base URL from GitHub Pages.
- `make-all.ps1:158` prints `https://www.sajid.org.bd`. `hugo.yaml:9` records that domain as not resolving.
- The lab name is "Smart **and** Advanced Junction**s** of Intelligent Devices" in `config/_default/params.yaml:26` (the site-wide description). It is "Smart **&** Advanced Junction of Intelligent Devices" in `content/_index.md:21` and `README.md:3`.

### M6. Funding-agency links are swapped
- `content/research/funding/g-02/index.md`: agency **RISE, BUET**, but the URL is `https://www.buet.ac.bd`.
- `content/research/funding/g-03/index.md`: agency **BUET**, but the URL is `https://rise.buet.ac.bd`.

### M7. Deployment configuration has drifted
- The site deploys with GitHub Pages (`.github/workflows/publish.yaml`), yet it still has:
  - `netlify.toml`
  - `wrangler.jsonc` (Cloudflare)
  - the HugoBlox Netlify module (`config/_default/module.yaml`)
  - `outputs.home: [… headers, redirects …]`, Netlify-only files that GitHub Pages ignores
- CI pins **Hugo 0.152.1**, but the local build uses **0.157.0**. The build also warns that `module.mounts.includeFiles` is deprecated (since 0.153.0).

### M8. Languages are configured twice, and the Bengali menu is pre-redesign
- `languages` are defined in both `hugo.yaml` (`languageCode: bn-BD`) and `languages.yaml` (`languageCode: bn`, plus a Bengali site title). The build uses `bn`.
- `config/_default/menus.bn.yaml` still uses the old one-page anchors (`/bn/#about`, `/bn/#teaching`, …). Its "আউটরিচ" (Outreach) item points to `/#outreach`, an anchor that no longer exists on the English homepage.

### M9. Missing translations
- **Bengali:** 18 interface strings have no translation. The templates' English defaults appear instead (e.g. "Skip to main content", "Breadcrumb", DOI button).
- **English:** 34 keys are missing from `i18n/en.yaml`. This only adds build noise, because each template call supplies a `default`.

### M10. One generic meta description on most pages
434 of 608 pages share "Smart and Advanced Junctions of Intelligent Devices. Research Lab of Dr. Sajid Muhaimin Ch…". Search results will show the same snippet for most pages. Teaching archive pages also share their descriptions three at a time.

### M11. Linked files that are missing
- **`/teaching/archive/j2020_eee303/`:** `/courses/EEE_303_2020/Lecture_1.pdf`, `Lecture_2-3.pdf`, `Lecture_4-6.pdf` and `Lecture_7-8.pdf` don't exist.
- **`/teaching/workshops/bracu-arm-workshop/`:** five relative links point to files that don't exist: `files/memfile.dat`, `files/reference/add.c`, `simple_alu.v`, `tb_simple_alu.v` and `simple_sum.s`.

### M12. Raw HTML entities in abstracts
`&#xB5;` (micro sign) appears literally in the abstracts of j-023 and j-028, in both `cv/papers.bib` and the publication pages.

### M13. Deprecated `url_pdf` field
`content/publication/j-001/index.md` (and its Bengali copy) uses `url_pdf`. HugoBlox warns that this is deprecated in favour of `links: [{type: pdf, url: …}]`.

---

## Low

### L1. Accessibility basics
- **Links without an accessible name:**
  - each card on `/news/` (pages 1–3, 21 links) has a second link with no text
  - the six research cards on `/bn/`
- **Images without `alt`:** 11 each on `/outreach/templates/graphics/` and `/resources/templates/graphics/`, plus 5 in three blog posts (Teams Bulk Add 1, Teams BIIS Check 2, CT Admin 2).
- **Bengali research pages** (`/bn/research/*`, 7 pages): **no `<h1>`**, and the `id="section-hero"` appears twice on each page.
- **Heading levels skip** (e.g. h2 → h4) on 14 pages, mostly teaching-archive pages and `/bn/`.

### L2. External links
**Dead or failing:**

| Link | Problem | Found on |
|---|---|---|
| `https://www.lateral.io/` | Domain no longer resolves | `/resources/blog/20230424-ai-tools/` |
| `https://www.bas.org.bd/credits` | 404 | `/resources/personal/hobbies/` |
| `bdsapurdue.org` (10 links) | TLS handshake fails | `/resources/professional/`, `/resources/personal/hobbies/` |
| `https://ab-initio.mit.edu/book/` | Connection refused | 2 teaching-archive pages |

**Could not verify:**
- 17 links returned 403 to an automated client. They are doi.org, RSC, ScienceDirect, ResearchGate, Forbes, BRACU, Waterloo, nih.gov and SourceForge. The doi.org redirects are expected to work in a browser.
- `eee.buet.ac.bd` and `rise.buet.ac.bd` timed out from this network.

### L3. Typo on archived course pages
"This website is not going **to updated**" appears in `content/teaching/Archive/J2020_EEE303.md:9`, `J2021_EEE415.md:9` and `J2021_EEE416.md:9`.

### L4. Repository weight and clutter
- `cv/msedgedriver.exe` (18.5 MB) is the largest tracked file. `cv/pop8query.exe` and `cv/pop8metrics.exe` are also tracked.
- `_vendors/` (14 files) sits next to the real `_vendor/`.
- `cv/PoPCites-bak.csv` and `cv/file.csv` are leftovers.
- `docs/redesign/evidence/` adds about 12 MB of JSON.

### L5. Mixed front-matter conventions
Teaching-archive pages use capitalised keys (`Title`, `Placing`, `Icon`; e.g. `A2023_EEE6505.md:2–4`). Everything else uses lower-case keys. Hugo accepts both.

### L6. Lower-case middle initials on co-author pages
Hugo's title-casing renders "Alexander V Kildishev" as "Alexander **v** Kildishev", and does the same to "George V Eleftheriades", "Zhaxylyk A Kudyshev" and "M A Awal". Normalising names (H3) removes most of these cases.

### L7. Two pages share a title (no action needed)
`/publication/j-013/` and `/research/funding/g-02/` are both titled "Structurally Tunable Gear-Shaped Plasmonic Sensor". This is correct (the grant produced the paper), but they could link to each other.

---

## Suggested order of work

1. **Today:**
   - remove the fake partners block (C1)
   - correct c-025/c-027/c-028 (C3), then re-import and rebuild the CV
   - fix the news DOI (H8)
2. **Structural:** separate the English content directory (C2). This also removes the duplicated Bengali output, and the "Duplicate target paths" warning should disappear.
3. **People data:**
   - one slug per person and normalised author names (H2, H3); add "SM Choudhury" to the owner names
   - resolve the date conflicts (H6)
   - update or retire the Bengali profile and its stats (H4, H5)
4. **Bengali site:** fix the footer links (H1), menu (M8), the stale `x-04` (M2), translations (M9) and accessibility issues (L1). Or decide to limit the Bengali site to the pages it has.
5. **Clean-up:** machine copies (H7), outreach remnant (M1), deployment leftovers (M7), repository clutter (L4).
6. **Polish:** M3–M6, M10–M13, L2, L3, L5–L7.

## Re-running these checks

Build: `hugo --gc --minify --printPathWarnings --printI18nWarnings --destination <dir>`.

The crawler and external-link checker were one-off scripts and are not kept in the repo. Each check is described in the method table above. Checks worth automating in CI:
- fail on `Duplicate target paths`
- check internal links with a tool such as `htmltest` or `lychee` over `public/`
