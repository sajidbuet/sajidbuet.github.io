# 03 — LaTeX Template and Code

Covers `cv/buetcv.cls`, `cv/dsmc-cv.tex`, `cv/gscholar.tex` and the vendored `cv/ext-*.bbx`/`.cbx`/`.dbx` files, plus how `cv/pycv_update_gscholar_tex.py` feeds them.

> **All code below is an untested sketch.** It shows the shape of a change, not a drop-in patch. Build and compare the PDF after each step.

## 1. Class hygiene (`buetcv.cls`)

| Line(s) | Issue | Suggestion |
|---|---|---|
| 1–35 | Header still says "buetcv.sty", "this is my first package", "(c) Buffalo Bill", "Example LaTeX class". The MIT notice credits RenderCV, from which the layout environments are derived. | Keep the RenderCV MIT notice (required by its licence) and replace the rest with a real description and version: `\ProvidesClass{buetcv}[2026/10/04 v2.0 CV class for S. M. Choudhury]`. |
| 38 | `letterpaper` hard-coded | `a4paper` (doc 01 §1), or pass it through as a class option. |
| 71–81 | `\cvauthor` is hard-coded. The `docdate`/`cvauthor` keys are declared with `\define@key` but never processed, so `\documentclass[cvauthor={…}]{buetcv}` (`dsmc-cv.tex:3`) has no effect. `\docauthorname` is never used. | Delete the keys and let the document set `\newcommand\cvauthor{…}`, or process them properly with `kvoptions`/`\ProcessKeyvalOptions`. |
| 83, 243 | `\usepackage` inside a class | `\RequirePackage` |
| 86 | `pdfcreator={LaTeX with RenderCV}` | Drop it (LuaTeX fills in the producer); or "LuaLaTeX, buetcv". |
| 88 | hyperref sets only `urlcolor`, so internal links (the footer's `\pageref{LastPage}`) use the default **red** | Add `linkcolor=accent, citecolor=accent`, and use `\pageref*` in the footer so it isn't a link at all. |
| 56–58 | `subcaption`, `longtable` are loaded for one figure and nothing, respectively | Drop both once the metrics panel is no longer a float (§4). |
| 111 | `\patchcmd` comes from `etoolbox`, which is only loaded indirectly | `\RequirePackage{etoolbox}` explicitly, before use. |
| 112 | `\cvauthor - Page`: the control word eats the following space, hence "Choudhury- Page" | `\cvauthor{} --- page \thepage{} of \pageref*{LastPage}`, or build the footer with `fancyhdr` (already loaded but unused) instead of patching `\ps@plain`. |
| 200–204 | `header` environment: `\linespread{1.5}` without `\selectfont` | Like the `\fontsize` calls in `dsmc-cv.tex:9,13`, it only takes effect at the next font change. Add `\selectfont`, or set sizes in a `\cvheader{…}` macro (§7). |
| 206–215 | "Last updated **in** \today". Its position is computed from hard-coded `2 cm`/`0.2 cm` offsets that repeat the geometry settings. | "Last updated \today" with `babel` British (§8), positioned from `\oddsidemargin`/`\textwidth`, or simply put it in the header grid. |
| 218–221 | `\href` is redefined **globally** to append an external-link icon, so every bibliography link gets one too | Leave `\href` alone and define `\extlink{url}{text}` for the few places the icon is wanted. |
| 224–231 | `\AND`/`\ANDbox`: a RenderCV separator whose box is empty, so the header uses `\kern 0.25cm \AND \kern 0.25cm` pairs | Replace with a `\cvsep` macro (e.g. `\quad\textperiodcentered\quad` in grey). |
| 233–241, 287–311 | Commented-out sourcemap and the "arcpubs" underline-author code | Delete. §3 replaces both. |

## 2. Bibliography setup

| Where | Issue | Suggestion |
|---|---|---|
| `dsmc-cv.tex:5` + `buetcv.cls:265` | `\bibliography{papers}` **and** `\addbibresource{papers.bib}`: the resource is declared twice (`\bibliography` is biblatex's legacy alias) | Keep only `\addbibresource`, in the document rather than the class, so the class is reusable. |
| `buetcv.cls:246` | `firstinits=false` is deprecated (build log: *"'firstinits' option is deprecated"*) | `giveninits=false` |
| `buetcv.cls:252` | `datamodel=ignore`, commented "allow unknown fields". The `datamodel` option names a `.dbx` file to load; it is not an "ignore" switch. The custom fields currently come from `\DeclareDatamodel…` lines placed in the vendored `ext-numeric.bbx`. | The repo already has `ext-extra.dbx` declaring exactly `citationnos`, `sjr` and `jif`, so use `datamodel=ext-extra`, then delete the declarations from the `.bbx`. |
| `dsmc-cv.tex:191–217` | The same 5-line block repeated four times, each with its own `\nocite{*}` | A `\pubsection{<type>}{<prefix>}{<title>}` macro (sketch below); `\nocite{*}` once. |
| `papers.bib` | Biber: *legacy month field 'May'/'Aug' … not an integer* (J023, J028) | `month = {5}` / `{8}` |

```latex
% Sketch: one macro per publication list (keeps the existing reverse-numbering trick)
\newcommand*{\pubsection}[3]{%
  \subsection{#3}%
  \csnumgdef{entrycount}{0}%
  \newrefcontext[labelprefix=#2]%
  \printbibliography[env=counter,type=#1,heading=none]%
  \printbibliography[type=#1,heading=none]}
% in the document:
\nocite{*}
\pubsection{article}{J}{Journal Articles}
\pubsection{inproceedings}{C}{Conference Proceedings}
\pubsection{patent}{P}{Patents}
\pubsection{unpublished}{X}{Preprints and Manuscripts}
```

## 3. Stop vendoring biblatex-ext

`cv/` contains full copies of `ext-standard.bbx` (1,457 lines), `ext-numeric.bbx` and `ext-numeric.cbx` from **biblatex-ext v0.19**. Because the working directory comes first in TeX's search path, they shadow the installed package. MiKTeX here already has **v0.20** (`…/MiKTeX/tex/latex/biblatex-ext/`), so the copies have drifted.

A diff against v0.20 shows the local changes are small:

1. Two new macros, `printcites` and `printjournalmetrics` (`ext-standard.bbx:18–53`).
2. `\usebibmacro{printcites}` inserted before `\usebibmacro{finentry}` in six drivers, plus `printjournalmetrics` in the `article` driver only. `\newunit\newblock` is replaced by `\newunitpunct\space` in two of them.
3. Three `\DeclareDatamodel…` lines in `ext-numeric.bbx`.
4. `ext-numeric.cbx` is identical apart from the version line.

All of this fits in about 30 lines in the class. Then the three vendored files can be deleted:

```latex
% Sketch, in buetcv.cls after loading biblatex with style=ext-numeric, datamodel=ext-extra
\newbibmacro*{pubmetrics}{%
  \setunit{\addspace}\newblock
  {\footnotesize\color{cvgrey}%
   \iffieldundef{doi}{}{\printfield{doi}}%
   \ifnumgreater{\thefield{citationnos}}{0}
     {\setunit{\addspace\textperiodcentered\addspace}\printtext{Cited \thefield{citationnos}}}{}%
   \iffieldundef{sjr}{}
     {\setunit{\addspace\textperiodcentered\addspace}\printtext{SJR \thefield{sjr}}}%
   \iffieldundef{jif}{}
     {\setunit{\addspace\textperiodcentered\addspace}\printtext{IF \thefield{jif}}}}}
\renewbibmacro*{doi+eprint+url}{}        % printed by pubmetrics instead
\renewbibmacro*{finentry}{\usebibmacro{pubmetrics}\finentry}
```

`\ifnumgreater` on an undefined `citationnos` needs an `\iffieldundef` guard in practice; it is omitted above for brevity.

**Why the current output has spacing glitches.** In biblatex, `\setunit{…}` only inserts its punctuation before the next `\print…` command.
- In `printjournalmetrics`, the separator before `\mkbibparens{IF …}` is never printed because `\mkbibparens` isn't a print command. Hence "SJR Q2**(**IF 2.4)".
- In `printcites`, the label "Citations:" is raw text, so the pending space after a URL is lost. Hence patent P1's "…/en**Citations**: 13".

Wrapping each piece in `\printtext{…}`, as in the sketch, fixes both.

## 4. DOI, URL and link formatting

| Now | Effect | Suggestion |
|---|---|---|
| `\DeclareFieldFormat{doi}` prints `\nolinkurl{#1}` (`buetcv.cls:255–261`) | Monospace DOI, plus the global `\href` icon | `\urlstyle{same}`; format as `doi:\,` + link text in the text face |
| Entries with both `doi` and a doi.org `url` (e.g. J29) | DOI printed twice | Biber sourcemap: drop `url` when `doi` exists (below) |
| `url` printed in full (e.g. `https://opg.optica.org/…cfm?URI=…`) | Long monospace strings, awkward breaks | Keep URLs only for entries without a DOI (patents, arXiv) |

```latex
% Sketch: drop url when a doi exists, and set link text in the body font
\DeclareSourcemap{\maps[datatype=bibtex]{%
  \map{\step[fieldsource=doi, final]\step[fieldset=url, null]}}}
\urlstyle{same}
\DeclareFieldFormat{doi}{doi\addcolon\,\hrefWithoutArrow{https://doi.org/#1}{#1}}
```

## 5. Highlighting your name and student co-authors

```latex
% Sketch: bold own name via name hashes. Read the two hashes for
% "Sajid Muhaimin Choudhury" and "Sajid Choudhury" (the patents use the
% short form) from dsmc-cv.bbl after one build.
\newcommand*{\cvselfhashes}{}
\forcsvlist{\listadd\cvselfhashes}{{<hash-full>},{<hash-short>}}
\renewcommand*{\mkbibnamegiven}[1]{\ifinlist{\thefield{hash}}{\cvselfhashes}{\mkbibbold{#1}}{#1}}
\renewcommand*{\mkbibnamefamily}[1]{\ifinlist{\thefield{hash}}{\cvselfhashes}{\mkbibbold{#1}}{#1}}

% Sketch: dagger for supervised students via biblatex data annotations
% in papers.bib:  author+an = {1=student},
\renewcommand*{\mkbibcompletename}[1]{#1\ifitemannotation{student}{\textsuperscript{\dag}}{}}
```

The second needs annotations added to `papers.bib`. That file is also read by bibtexparser 1.x, both in the website's publication import (`academic`) and in `pycv_update_citations_bib.py`. Check that both accept a field name containing `+` before relying on it. If they don't, a `keywords = {student-1}` convention plus a sourcemap is the fallback.

## 6. Data versus layout

### 6a. Metrics (`gscholar.tex`)

`cv/pycv_update_gscholar_tex.py` regex-edits a hand-written figure: it rewrites `Total Citations & \d+`, `h.?index`, `xticklabels`, `ymax=\d+`, the `ytick` list and the coordinates. This is fragile. Any layout change to the figure (re-ordering rows, renaming a label, a second plot) silently stops the regexes from matching, and the old numbers stay in the CV.

Suggestion: the script **writes a data file from scratch**, and the layout lives in the class.

```latex
% cv/metrics.tex — generated, never edited by hand
\def\gsCitations{1419}\def\gsHindex{14}\def\gsIten{18}
\def\gsRetrieved{2026-10-04}
\def\gsYears{2019,2020,2021,2022,2023,2024,2025,2026}
\def\gsCoords{(2019,67)(2020,151)(2021,171)(2022,207)(2023,168)(2024,184)(2025,194)(2026,169)}
```

```latex
% buetcv.cls — layout only
\newcommand*{\metricspanel}{…uses \gsCitations, \gsCoords …}
```

The script also hard-codes a y-tick step of 55 (`pycv_update_gscholar_tex.py:68–69`). It could pick from {50, 100, 200}, or emit no axis and label the bars instead (doc 01 §9).

### 6b. One source for CV and website

Appointments and education exist twice, in `dsmc-cv.tex` and `data/authors/me.yaml`, and already disagree (doc 02 §7). The class descends from RenderCV, whose model is exactly "YAML in, LaTeX out". Two options:

1. **Light:** a small Python script (same pattern as `sync_authors.py`) reads `me.yaml`'s `experience`/`education` and writes `cv/generated-entries.tex` with `\cventry{…}` calls. The CV `\input`s it, so the website becomes the source of truth.
2. **Full:** adopt RenderCV itself with a custom theme matching doc 01. This is more work, and you would trade LaTeX control for its schema.

Option 1 fits the existing toolchain (`make-all.ps1` → `latexrun.ps1` → Python generators).

## 7. Cleaner entry and header macros

The RenderCV environments (`onecolentry`, `twocolentry`, `threecolentry`) use `paracol` for every entry. It works, but `paracol` columns don't break gracefully and are the source of most underfull warnings. For the single grid in doc 01 §1, a simple hanging layout is enough:

```latex
% Sketch: date/label column + content, one macro for every dated item
\newlength{\cvdatewidth}\setlength{\cvdatewidth}{2.6cm}
\newcommand*{\cvitem}[2]{%  #1 = date/label, #2 = content
  \par\noindent\hangindent\cvdatewidth\hangafter1
  \makebox[\cvdatewidth][l]{\small\color{cvgrey}#1}#2\par\smallskip}
% \cvitem{2025 -- present}{\textbf{Professor}, Dept.\ of EEE, BUET}
```

A matching `\cvheader{name}{title}{contacts}` macro would replace the hand-kerned header in `dsmc-cv.tex:8–35`, including its `\fontsize`-without-`\selectfont` bug.

## 8. Language and small typographic settings

- **Spelling is mixed:** British "organised", "specialised", "analysers" (`dsmc-cv.tex:145–147`) next to American "optimizing", "modernization", "emphasizes". Choose one. Load `\usepackage[british]{babel}` (or `american`) for matching hyphenation, and so `\today` gives "4 October 2026".
- **`microtype`** (protrusion and expansion with LuaLaTeX) reduces the rivers and underfull lines in justified text at almost no cost.
- **Tabs in the source** (`dsmc-cv.tex:225–230, 236–237, 243–245, 250, 258–259`) are harmless to TeX but caused the stray "(AAAB) ," spacing. An editor setting to show whitespace will catch these.

## 9. Two outputs from one source (`cv` and `dossier`)

The simplest mechanism that works with the existing `latexrun.ps1`:

```latex
% dsmc-cv.tex      → \newif\ifdossier \dossierfalse \input{cv-body}
% dsmc-dossier.tex → \newif\ifdossier \dossiertrue  \input{cv-body}
% cv-body.tex:
\ifdossier \input{sections/research-statement} \else \input{sections/research-summary} \fi
```

`latexrun.ps1` would gain a `-Dossier` switch that selects the `.tex` file. `make-all.ps1` keeps copying only the short `cv` PDF to `content/cv.pdf`.

## 10. Suggested order of work

1. **P0 fixes** (README): typos, footer, `\selectfont`, spacing glitches, duplicate DOI, overfull boxes. Small, safe, visible.
2. **Replace the vendored biblatex-ext** with the in-class macros (§3) and `datamodel=ext-extra`. Compare the PDF output before and after.
3. **Colour and typography tokens** (doc 01 §3–4): A4, face, scale, one accent.
4. **New grid and entry macros** (§7), then the header and metrics panel (§6a, doc 01 §5, §9).
5. **Content restructuring** (doc 02): condensed sections, new sections, the `dossier` split (§9).
6. **Optional:** a single YAML source shared with the website (§6b).
