# 01 — Visual Design: Layout, Typography, Colour

Page references are to the 10-page `cv/dsmc-cv.pdf` built 2026-10-04.

## 1. Page format and grid

| | Now | Suggested |
|---|---|---|
| Paper | US Letter (`buetcv.cls:38`) | **A4.** Standard for BUET, UGC and most non-US submissions. Printing Letter on A4 clips or shrinks it. |
| Margins | 2 cm on all sides | 2.2 cm left/right, 2 cm top, 2.2 cm bottom (room for the footer) |
| Grid | Full-width paragraphs. A right-aligned 4.5 cm date column (`twocolentry`). A 2 cm left label column only in Education (`threecolentry`). | **One consistent two-column grid** for every dated section. A 2.6 cm left column holds dates or labels and the rest holds content; prose sections use the same content column. |

The current layout mixes three grids:
- dates on the right (Experience)
- labels on the left with dates on the right (Education)
- no grid at all (Research, Teaching, Memberships, where dates are inline in parentheses)

A single left-hand date column is the usual academic CV convention. It lets a reader scan the chronology down one edge, and it shortens the text measure (§2).

```
 ┌────────────┬──────────────────────────────────────────────┐
 │ 2025–now   │ Professor                                    │
 │ 2022–2025  │ Associate Professor                          │
 │ 2013–2022  │ Assistant Professor                          │
 │ 2010–2013  │ Lecturer                                     │
 │            │ Dept. of EEE, BUET, Dhaka                    │
 │ 2009–2010  │ Lecturer, Institute of ICT (IICT), BUET      │
 └────────────┴──────────────────────────────────────────────┘
   2.6 cm        content column ≈ 13.8 cm on A4
```

## 2. Line length (measure)

On page 2 the prose lines average **103 characters** (max 113, measured from the PDF): 10 pt type across a 17.6 cm measure. That is well above the 45–75 characters usually recommended for continuous reading, which is why the Research and Teaching pages read as a wall of text.

Options, in order of effect:
1. **Cut the prose.** Doc 02 §1 suggests moving most of it out of the CV. Bullets of 1–2 lines don't suffer from a long measure.
2. **Put prose in the content column** of the §1 grid (about 13.8 cm). At 10.5 pt that is roughly 80 characters, an estimate from average glyph width that should be checked after a test build.
3. Increase body size to 10.5–11 pt (also §3).

## 3. Typography

**Now:** Latin Modern Roman everywhere, at 10 pt body, 14.3 pt (section), 12 pt (subsection) and 19.9 pt (name). DOIs and URLs are in Latin Modern Mono. Latin Modern is the Computer Modern look: thin strokes, high contrast, and immediately recognisable as "default LaTeX". On screen at 100 % zoom it renders light and spindly.

**Suggested:** keep LuaLaTeX and fontspec (already in use) and switch to a sturdier face. All of these are on CTAN, so MiKTeX can install them on demand:

| Option | Text | Headings/meta | Character |
|---|---|---|---|
| A (conservative) | Libertinus Serif | Libertinus Sans | Classic, warm, excellent small caps for headings |
| B (modern academic) | Source Serif 4 | Source Sans 3 | Clean on screen; matches the website's sans-serif UI. The class already has a commented-out `sourcesanspro` line (`buetcv.cls:100`). |
| C (sans throughout) | Source Sans 3 or Fira Sans | the same | Most "modern CV"; denser and less traditional for a professor's dossier |

**Suggested scale** (one ratio, five sizes):

| Role | Size/leading | Style |
|---|---|---|
| Name | 22 pt | Bold |
| Title line ("Professor, Dept. of EEE, BUET") | 12 pt | Regular, grey |
| Section heading | 12 pt | Bold small caps or bold, accent colour, 0.4 pt rule |
| Body | 10.5/13.5 pt | Regular |
| Meta (dates, venues, metrics, footer) | 9 pt | Regular, grey `#475569` |

The current section headings are `\Large` bold (14.3 pt) with a 0.8 pt rule. Against 10 pt body that is the loudest element on every page after the name. A 12 pt heading with a hairline rule keeps the structure clear without shouting.

**Remove monospace from the publication list.** Every DOI and URL is set in Latin Modern Mono via `\nolinkurl` and the default `\url` style (about 1,800 monospace characters across pages 5–9). That is the main source of visual noise in the list. Use `\urlstyle{same}` and a proportional `doi:` prefix (doc 03 §4).

## 4. Colour

**Now:** headings and text are black (`primaryColor` = 0,0,0; the BUET red is commented out at `buetcv.cls:63`). Three unrelated accents appear:
- **blue** `Citations:` in each entry
- **teal** `SJR`/`IF`
- **red** for the total page count in every footer (hyperref's default `linkcolor`)

**Suggested:** one accent and one neutral, reused from the website design system (`docs/redesign/design-system-proposal.md`), so the CV and sajid.bd look like one identity.

| Token | Value | Use |
|---|---|---|
| accent | `#0e7490` (5.36:1 on white) | Section headings and rules, links, chart bars |
| text-secondary | `#475569` | Dates, venues, metrics line, footer, "last updated" |
| text | `#0f172a` (or pure black for print) | Body |

Leave all metrics in the neutral grey, as small text rather than coloured badges, so the titles stay the most prominent thing in each entry. If BUET red (172, 31, 24) is preferred for institutional documents, use it *instead of* the teal accent, never alongside it.

## 5. Header and footer

**Header now** (page 1):
- the name at 19.9 pt
- a 10 pt subtitle; the code asks for 20 pt but it doesn't take effect, see README P0-4
- a contact row with location, email, website and LinkedIn
- "Last updated in October 4, 2026" floating top-right in italic grey

**Suggested header:**

```
Sajid Muhaimin Choudhury, PhD                                  Last updated 4 October 2026
Professor · Department of Electrical and Electronic Engineering · BUET, Dhaka
✉ sajid@eee.buet.ac.bd   ⌂ sajid.bd   ORCID 0000-0002-0216-7125   Google Scholar   in sajidmc
───────────────────────────────────────────────────────────────────────────────────────────
```

- Left-aligned or centred: either works. Left-aligned lines up with the §1 grid and frees the right corner for the date.
- Write "Sajid Muhaimin Choudhury, PhD", or keep "Dr." but not both forms in different places. "Dr." also appears in the PDF title metadata and the footer.
- Add **ORCID** and **Google Scholar** from `data/authors/me.yaml`. `academicons` is already loaded (`buetcv.cls:67`) but is only used for the Scholar glyph in the metrics block.
- The location ("Dhaka, Bangladesh") can merge into the title line.

**Footer now:** "CV of Dr. Sajid Muhaimin Choudhury- Page 1 of **10**", in italic grey with a red 10.

**Suggested footer:** "S. M. Choudhury — Curriculum Vitae · page 1 of 10", 9 pt grey, upright, with no coloured link: use `\pageref*` or set `linkcolor`.

## 6. Section headings and spacing

- Headings use `\needspace{4\baselineskip}` (good). The 0.3 cm space above them is tight relative to their 14.3 pt size, so sections run into one another on pages 1 and 9–10. With smaller headings (§3), use about 14 pt before and 6 pt after.
- Sub-bullets in the Teaching section start with a bold label and then a forced line break (`\textbf{Core hardware:} \\`, `dsmc-cv.tex:145–151`). That spends a whole line per label. Run the label into the text: "**Core hardware.** STM32 Nucleo… ".
- Avoid `\\` at the end of paragraphs (`dsmc-cv.tex:50–75`, `:249–253`). These cause the underfull-box warnings and add uneven gaps.

## 7. Experience and education entries

- **Experience:** the same institution line, "**Bangladesh University of Engineering and Technology (BUET)**", is printed 5 times in bold, so the bold — meant to be the anchor — carries no information. Use one employer heading with the roles as a timeline (§1 sketch). The role, not the institution, should be the emphasised text.
- **Education:**
  - The PhD thesis title is in ALL CAPS (`:83`). Set it in italic title case like the other theses.
  - The co-supervisor names wrap through a forced `\\` (`:84`). Remove it.
  - The degree labels in the left column (Ph.D./M.Sc./B.Sc./H.S.C./S.S.C.) are a good pattern; extend that column to the whole CV (§1).
- **Dates:** mixed formats ("July 2025 – to date", "Aug 2011 – 2013", "Jan 2010 – June 2013", "(April 2022 – to date)", "May 2022 – to date" with no parentheses). Use one form: "Jul 2025 – present" (abbreviated month, en dash, "present").

## 8. Publication entries

**Now** (page 5, J29), for example:

> [J29] Subhan Zawad Bihan, Anindya Kishore Choudhury, and Sajid Muhaimin Choudhury. "Steane [[7,1,3]] outer coding…". In: *Quantum Information Processing* 25.9 (Aug. 2026), p. 301. `10.1007/s11128-026-05327-6` ↗. URL: `https://doi.org/10.1007/s11128-026-05327-6`. SJR **Q2**.

**Problems:**
- Your name isn't distinguished. On a long author list (J10 has 30+ authors) the reader has to hunt for it. The class has commented-out underline code for this (`buetcv.cls:290–302`).
- The DOI appears twice (as a DOI and again as a doi.org URL), both in monospace, the first with an external-link icon.
- The metrics are coloured badges in two colours, with spacing errors ("Q2(IF 2.4)", patent P1 "…/enCitations: 13").
- "In:" before the journal is a biblatex default that most CVs drop.

**Suggested entry:**

> **J29** Subhan Zawad Bihan†, Anindya Kishore Choudhury, **Sajid Muhaimin Choudhury**. "Steane [[7,1,3]] outer coding for loss-tolerant one-way quantum repeaters." *Quantum Information Processing* 25(9), 301, 2026.
> doi:10.1007/s11128-026-05327-6 · SJR Q2 *(this line in 9 pt grey)*

- **Bold own name.** † marks a student you supervised, with a one-line legend at the top of the list. This turns the publication list into evidence of supervision as well.
- **One grey metrics line:** `doi · Cited N · SJR Qn · IF x`, using · as the separator. Omit missing parts rather than leaving gaps.
- **Labels:** keep the reverse numbering (J29 … J1). It's a good choice for a CV and the counter trick already works. The labels can drop the brackets and use the accent colour.
- **Optional:** group journal articles under year sub-headings (2026, 2025, …) instead of repeating the year in each entry.
- **Move X3** ("Accepted for publication") into Journal Articles as "in press", or rename the section "Preprints and Manuscripts in Review".

## 9. Metrics block

**Now** (page 5, top):
- a floating `figure[ht]` with two subfigures captioned "(a) [glyph] Google Scholar Metrics" and "(b) [glyph] Google Scholar Citations per Year"
- the table has an empty header row with `\midrule` but no `\toprule`
- the bar chart uses grey bars with a y-axis in steps of 55
- 2026 is drawn as a normal bar
- the Scholar glyph inside the rotated y-label reads as a stray character
- because it is a float, it leaves a large blank band below it before "Journal Articles"

**Suggested:** an inline (non-float) panel the full width of the content column:

```
 1,419 citations      h-index 14      i10-index 18          ▁▃▄▅▄▄▅▄  2019–2026*
 ───────────────────────────────────────────────────────────────────────────────
 Google Scholar, retrieved 4 Oct 2026 via Publish or Perish. *2026 to date.
```

- Three large figures (14–16 pt) with small grey labels: the summary a reader actually wants.
- A compact bar chart (about 2.5 cm tall) in the accent colour, with the current year in a lighter tint or hatched and marked "to date".
- Y ticks at round numbers (0/100/200), or no y-axis at all and values printed above the bars. The step of 55 is hard-coded in `cv/pycv_update_gscholar_tex.py:68–69`.
- No "(a)/(b)" captions; this is a CV, not a paper figure.
- A source and date line, because the numbers change monthly.

## 10. Proposed page plan

| Page | Content |
|---|---|
| 1 | Header · Profile (3–4 lines) · Research interests (one line of keywords) · Appointments (timeline) · Education |
| 2 | Research grants/projects · Awards and honours · Postgraduate supervision (completed / ongoing) · Teaching: courses developed (bullets, 1–2 lines each) |
| 3 | Professional service and leadership (IEEE, Optica, NYAB; one compact two-column list) · Selected invited talks (if any) |
| 4–8 | Publications: metrics panel, Journal Articles, Conference Proceedings, Patents, Preprints |

The headings on page 2 are suggestions for sections the CV currently lacks; see doc 02 §4. Include them only where you have content to show. The long Research Initiative and Teaching Plan narrative would move to a separate statement, or into a `dossier` build of the same source (doc 03 §9).
