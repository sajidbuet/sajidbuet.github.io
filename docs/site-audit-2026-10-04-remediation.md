# Site Audit Remediation — 4 October 2026

Remediation of [`site-audit-2026-10-04.md`](site-audit-2026-10-04.md) on branch
`audit-fix`, based on `main` at `cb15c5d` (the audit report commit; the audit
itself examined `94cd8cf`). Not merged into `main`.

Status key: **FIXED** · **VERIFIED CLEAN** (no change needed) · **OWNER** (requires
owner decision) · **EXTERNAL** (could not verify externally) · **OPTIONAL** (follow-up).

## Status by finding

| ID | Status | What was done |
|---|---|---|
| C1 | FIXED | Template "partners" (MIT, Stanford, Google, NSF, Microsoft, NIH, "Become a Partner") on `/bn/` replaced by the four organisations on the English homepage. |
| C2 | FIXED | English content moved to `content/en/` (git renames); languages defined once in `languages.yaml`. No duplicate target paths. English URLs unchanged. |
| C3 | FIXED | c-025 title, c-027 DOI `…11276357`, c-028 DOI `…11276528`, each checked against Crossref (title and authors match). Pages re-imported. CV PDFs **not rebuilt** (see Owner actions). |
| H1 | FIXED | `functions/lang_url` replaces `relLangURL` in the footer, navbar and overridden HugoBlox blocks; no `/bn/` link points at a missing page. |
| H2 | FIXED | Publications list lab members by profile slug (`data/author_aliases.yaml`); old `/authors/<name>/` URLs redirect to the profiles. |
| H3 | FIXED | Co-author spellings normalised through the same table; "SM Choudhury" → `me`. Grants g-02/g-03 also used the owner's name, now `me`. |
| H4 | FIXED | One Bengali profile data file (`data/authors/bn/me.yaml`); rank Professor; profile page has front matter; roles follow the current CV. |
| H5 | FIXED | Stats block removed from `/bn/`. |
| H6 | OWNER | Current rank fixed everywhere (incl. roster PI row). Historical dates left as they are, see below. |
| H7 | FIXED | 43 sync/backup files removed after diffing (none held newer edits); `.gitignore` rules added. |
| H8 | FIXED | News DOI → `10.1016/j.optlastec.2024.111730` (Crossref-verified). |
| M1 | FIXED | Old outreach graphics page removed; URL redirects to `/resources/templates/graphics/`. |
| M2 | FIXED | `bn/publication/x-04` removed; `/bn/publication/x-04/` redirects to x-03. |
| M3 | OWNER | EEE 6405 vs 6505 not resolvable from the repository; not changed. |
| M4 | FIXED / OWNER | "Sarkar" → "Sarker" (news + alumni). Mahfuz title clarified; date left (see below). VO₂ file renamed to ASCII, URL kept via `slug`. |
| M5 | FIXED | Canonical host `https://www.sajid.bd/` everywhere (Pages custom domain; apex 301s to it); CI no longer overrides `baseURL`; `CNAME` updated; lab expansion "Smart & Advanced Junction of Intelligent Devices". |
| M6 | FIXED | g-02 → `https://rise.buet.ac.bd`, g-03 → `https://www.buet.ac.bd`. |
| M7 | FIXED | Netlify config/module/outputs and `wrangler.jsonc` removed; CI Hugo 0.157.0; `includeFiles` deprecation fixed in the vendored module (local patch, marked). |
| M8 | FIXED | Single language config, `bn-BD`; Bengali menu rebuilt on the English structure. |
| M9 | FIXED | 35 EN + 19 BN keys added (+5 for descriptions); no missing-translation warnings. |
| M10 | FIXED | `functions/page_description` fallback chain; site-wide description shared by 0 pages (was 434). |
| M11 | FIXED | Files never existed in history; links removed / marked unavailable. No dummy files. |
| M12 | FIXED | Entities replaced at source in `papers.bib`. |
| M13 | FIXED | Importer converts `url_*` to `links: [{type, url}]`. |
| L1 | FIXED | BN research pages: one `<h1>`, unique ids; research-card links named; alt text written for 19 images; heading levels repaired on 13 pages. News-card image links were already `aria-hidden` + `tabindex=-1` (VERIFIED CLEAN). |
| L2 | FIXED | lateral.io removed (domain gone); bas.org.bd/credits → home page; bdsapurdue.org and ab-initio.mit.edu switched to HTTP (HTTPS broken on those hosts, HTTP pages verified). |
| L3 | FIXED | Typo corrected on 3 pages. |
| L4 | FIXED / OWNER | `_vendors/`, `cv/file.csv` removed; `msedgedriver.exe` and generated logs untracked. `pop8*.exe` kept (required by `cv/latexrun.ps1`). |
| L5 | FIXED | Capitalised front-matter keys lower-cased (39 files); output unchanged. |
| L6 | FIXED | Root cause was the humanised-slug fallback plus `title`; templates now use the profile name or the name as written. |
| L7 | VERIFIED CLEAN | Not linked: j-013 (2020) predates grant g-02 (2023–24), so the metadata does not establish the relationship. |

Additional problems found and fixed while working:
- All 122 `cite.bib` downloads listed the owner as author "me" (importer side effect).
- `papers.bib` J019 carried J020's abstract; replaced with the Crossref abstract.
- `/bn/research/quantum/` listed photonics papers (wrong tag filter).

## Owner decisions

1. **Appointment and degree dates (H6).** `cv/cv-body.tex` (unchanged between the 2025 and 2026 CVs) says Assistant Professor Jun 2013 – Jul 2022, Associate Professor from Jul 2022, M.Sc. Aug 2011 – 2013, B.Sc. Dec 2004 – Aug 2010. `data/authors/me.yaml` (added in one commit, 2026-03-19) says Assistant Professor 2019-01-01 – 2019-12-31, Associate from 2022-06-21, M.Sc. ends 2011-11-11, B.Sc. ends 2009-11-11. Confirm the dates; the website copies the website values.
2. **EEE 6405 vs EEE 6505 (M3).** Titles and CV say 6505; file names and page bodies of the 2021–2023 pages say 6405, from the first commit. Confirm whether the course was renumbered. The BUET EP course list (`eee.buet.ac.bd/academics/postgraduate/courses/202206240335_EP_courses.pdf`) was unreachable from here.
3. **Mahfuzul Haque (M4).** News dated 2025-03-19 ("defends MSc thesis"); roster and CV say graduated Jan 2025. Confirm what each date means.
4. **"Tanvir Ahmed" on j-018 (2023).** Crossref lists BUET EEE / BRAC CSE affiliations; the lab member of that name has a RUET BSc and enrolled in Oct 2024. Left unlinked (`_not_mapped` in `data/author_aliases.yaml`).
5. **Google Scholar key shared by C025 and C028** (`citation_for_view=…:SP6oXDckpogC`); one of them is wrong, so citation counts may be attributed to the wrong paper.
6. **CV PDFs.** Not rebuilt: local MiKTeX lacks `unicode-math` (and possibly the Libertinus fonts). After installing, run `.\make-all.ps1 -Cv -CvCompileOnly` so the CVs pick up C3, M12 and J019.
7. **`pop8query.exe` / `pop8metrics.exe`.** Required by `cv/latexrun.ps1`, so still tracked. Untracking them would delete them on other machines at the next pull; also check the Publish or Perish licence for redistribution in a public repository.
8. **GitHub Pages "Enforce HTTPS"** is off (`https_enforced: false`).

## Optional follow-up

- Old co-author variant URLs (e.g. `/authors/ma-matin/`) and Bengali student term URLs now 404; only the roster students' and owner's English URLs redirect.
- `layouts/_partials/hbx/blocks/hero/block.html` is an unused local override containing `errorf "LOCAL HERO OVERRIDE LOADED"` and "AAAAA" debug text.
- Publication abstracts with mangled LaTeX (`backslashepsilon` in j-029, `μmathrmm` in j-011) come from `academic`'s LaTeX handling.
- `--printUnusedTemplates` reports 149 templates (157 before), including ones that are in use (e.g. `publication/single.html`).
- Git history still contains the removed binaries (`msedgedriver.exe`, 18.5 MB); history was not rewritten.
- `docs/redesign/evidence/` (~12.7 MB JSON) kept as redesign evidence.

## Checks

```bash
hugo --gc --minify --printPathWarnings --printI18nWarnings --printUnusedTemplates > hugo-build.log 2>&1
python _pythonscripts/check_site.py --public public --build-log hugo-build.log
python -m unittest discover -s _pythonscripts -p "test_*.py"
```

Final results on `audit-fix`: build exit 0; 0 duplicate targets, 0 i18n
warnings, 0 deprecations; `check_site.py` 0 errors, 0 warnings; 10 unit tests
pass. Hugo 0.157.0 and 0.158.0 produce the same file set.
