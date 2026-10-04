# CV Redesign — Review and Suggestions

**Status (2026-10-04):** implemented. The review below describes the CV *before* the redesign; `cv/readme.md` describes the new template.

| Implemented | Not implemented / changed from the suggestion |
|---|---|
| All P0 corrections · A4, Libertinus, one accent colour, date-column grid · new header/footer · own name bold and supervised students † (automatic) · metrics panel from generated `metrics.tex` · one-line grey metrics per entry, DOI in text face, no duplicate URL · vendored biblatex-ext removed · two builds: short CV (`/cv.pdf`) and full dossier (`/cv-dossier.pdf`), both linked from the profile page · Research Grants and Ongoing Supervision sections | Website/CV date mismatches (doc 02 §7) left for the owner to resolve; the CV dates were kept. · `ext-extra.dbx` turned out to be XML rather than a biblatex data model, so it was replaced by `cv/buetcv.dbx`. · Single YAML source (doc 03 §6b) not started. · Awards, invited talks and courses-taught sections not added (no source data). |

**Reviewed (2026-10-04):**

- `cv/dsmc-cv.tex` (content)
- `cv/buetcv.cls` (class/template)
- `cv/gscholar.tex` (metrics figure)
- `cv/ext-standard.bbx`, `cv/ext-numeric.bbx`, `cv/ext-numeric.cbx`, `cv/ext-extra.dbx` (bibliography style)
- `cv/latexmk.log` (build log)
- the rendered `cv/dsmc-cv.pdf` (10 pages, built 2026-10-04 14:08)

**How it was reviewed:** each page was rendered to an image (70–140 dpi) and inspected visually. Fonts, sizes, line lengths and repeated strings were extracted from the PDF with PyMuPDF and checked against the source and the build log. Every line number below refers to the file as it was on 2026-10-04.

| Document | Covers |
|---|---|
| [01-visual-design.md](01-visual-design.md) | Page layout, typography, colour, header, metrics figure, publication entries, a proposed page plan |
| [02-content-and-readability.md](02-content-and-readability.md) | Structure, length, tone, missing sections, the error list, data mismatches with the website |
| [03-latex-template.md](03-latex-template.md) | Class and bibliography code: bugs, maintainability, and code sketches for the suggestions |

## The CV today

| Aspect | Measured |
|---|---|
| Length | 10 pages, US Letter, 2 cm margins, 17.6 cm text width |
| Page budget | p1 header, biography, experience, education · p2 research narrative · p3–4 teaching narrative and theses · p5–9 publications · p9–10 memberships |
| Narrative prose | About 2.7 pages (Research Initiative and Teaching Plan) |
| Line length on prose pages | Mean 103 characters, max 113 (page 2). The commonly recommended range is 45–75 (Bringhurst, *The Elements of Typographic Style*). |
| Typeface | Latin Modern Roman 10 pt throughout, with Latin Modern Mono 10 pt for every DOI and URL (about 1,800 monospace characters) |
| Colour | Black headings and text. Three unrelated accents elsewhere: blue (citation counts), teal (SJR), red (the page-count link in the footer) |
| Build log | 3 overfull boxes (10–12 pt into the margin, Education) and 6 underfull boxes (Experience, Memberships), each repeated over the three LaTeX passes; deprecated `firstinits`; 2 legacy `month` fields |

## Priorities

### P0 — Visible errors (fix whether or not you redesign)

1. **Typos:**
   - "Engine**e**ing" ×2 (`dsmc-cv.tex:90`, `:99`)
   - "avaiable" (`:149`)
   - "availabilty" (`:151`)
   - "Vice -Chair" (`:227`)
   - "Shamima Akter Mitu M.Sc." with no comma (`:178`)
2. **"Bangladesh's" prints as "Bangladeshś"** (page 2). `\'` is LaTeX's acute-accent command; the source needs a plain apostrophe (`:129`).
3. **Footer:** it reads "CV of Dr. Sajid Muhaimin Choudhury**-** Page 1 of **10**". The macro swallows the space before the hyphen, and the total page count prints in red (hyperref's default link colour). See `buetcv.cls:112`.
4. **The header subtitle is meant to be 20 pt but renders at 10 pt.** `\fontsize` has no effect without `\selectfont` (`dsmc-cv.tex:13`). Decide the size you actually want; doc 01 proposes one.
5. **"Last updated in October 4, 2026"** should read "Last updated 4 October 2026" (`buetcv.cls:212`).
6. **Bibliography glitches:**
   - The DOI prints twice when the `url` field is just the doi.org address (J29).
   - "SJR Q2**(**IF 2.4)" is missing a space.
   - Patent P1 runs straight into "…/en**Citations**: 13".
7. **Overfull boxes in Education:** the PhD thesis line and both BUET degree lines run 10–12 pt into the right margin (log, source lines 83–84, 90–91, 99–100).
8. **X3 says "Accepted for publication"** but sits under *Preprint / Manuscript Under Preparation*.
9. **The 2026 bar in the citations chart is year-to-date** but is drawn like a full year.
10. **Dates disagree with the website** (`data/authors/me.yaml`), and this needs your check. See doc 02, §6.

### P1 — Highest-impact redesign moves

1. **Split the document.** Keep a concise CV and move the 2.7 pages of narrative into separate Research and Teaching statements, or a "dossier" build of the same source (doc 02 §1, doc 03 §9). Target: about 4 pages before the publication list.
2. **One accent colour.** Use the website's `accent` `#0e7490` (contrast 5.36:1 on white, from `docs/redesign/design-system-proposal.md`) for section rules, links and the metrics chart. Use one neutral grey for metadata. Drop blue, teal and red.
3. **Publication entries:**
   - bold your own name
   - mark student co-authors
   - one quiet metrics line ("Cited 20 · SJR Q1 · IF 8.1")
   - DOI as a short proportional-font link; no raw URL
4. **Experience as a timeline under one employer heading.** "Bangladesh University of Engineering and Technology (BUET)" currently repeats 5 times in bold.
5. **Header:** add ORCID and Google Scholar (both in `me.yaml`; the `academicons` package is already loaded). Fix the size hierarchy.
6. **A4 paper.** It's standard for Bangladeshi and most international submissions; the class hard-codes `letterpaper`.

### P2 — Polish

- Bring line length into the 45–75 range: larger type, wider margins, or a narrow date column (doc 01 §2).
- Pick a modern text face: Libertinus, Source Serif/Sans or TeX Gyre Pagella (doc 01 §3).
- Make the metrics block an inline panel rather than a float with "(a)/(b)" captions, and label its source and date (doc 01 §6).
- Use one date format everywhere ("Jul 2025 – present"), en dashes, and no tab characters in the source.

### P3 — Template architecture

- **Stop shadowing biblatex-ext.** Move the citation/SJR macros into a small style file and delete the 1,457-line vendored `ext-standard.bbx` (doc 03 §3).
- **Separate data from layout:**
  - generate `metrics.tex` as plain `\def` values rather than regex-editing a figure
  - longer term, one YAML source shared with `data/authors/me.yaml` (doc 03 §6)
- **Clean up the class:**
  - options are declared but never processed
  - the header is still RenderCV/"Buffalo Bill" boilerplate
  - `\href` is redefined globally
  - redundant packages
  - the bibliography resource is added twice (doc 03 §1–2)
