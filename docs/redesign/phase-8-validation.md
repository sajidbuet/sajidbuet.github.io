# Phase 8 — Final Polish, Performance, Accessibility & Integration

---

## A. Phase 8 status

```text
COMPLETE WITH NON-BLOCKING LIMITATIONS
```

**Rationale.** Every functional, accessibility and regression gate passes: the
22-item manual checklist is **22/22 PASS**, the Phase 1–7 regression suite shows
**no regressions** (and an improvement in touch targets), search works in all four
required content categories, KaTeX renders everywhere it is needed and loads
nowhere it is not, and there are **zero console errors** across 44 viewport cells
and every route exercised.

The single limitation is Lighthouse Performance on two of three measured routes:
homepage **90** and `/publication/` **75** against a target of 95. A
KaTeX-free interior page reaches **94**. Both shortfalls have been measured to
their cause, and the remaining cost in each is legitimate:

* A control build with the Q-PACERS mark **removed entirely** — the absolute
  ceiling of any optimisation of it — scores **92 against 91** on the same
  harness. One point. Optimising or externalising the artwork cannot buy more
  than that, and would cost theme fidelity.
* `/publication/` carries 117 KB of KaTeX because its publication titles contain
  real mathematics. 18 of KaTeX's 20 font faces are already never fetched, there
  is no duplication, and the only removable part is the 69 KB engine itself —
  removable only by moving to build-time maths rendering, which §4 of the brief
  explicitly rules out as a maintenance risk.

Per §12, all four conditions for this classification are met: causes measured,
low-risk optimisation exhausted, no functional failures, no accessibility
failures, no regressions.

---

## B. Changes made

### Hero

* **8.21** — the homepage Q-PACERS mark is decorative. `qpacer.html` is the
  *interactive* research map (seven `<a>` elements); reusing it verbatim as an
  84 px decoration put seven tab stops on the homepage measuring 33.9×13.2,
  29.8×25.6, 15.1×34.6, 17.9×35.3, 30.9×26.8, 31.8×19.5 and **11×11** CSS px —
  all under WCAG 2.5.5's 44×44, six of seven under 2.5.8's 24×24, identical at a
  coarse pointer. The decorative instance now strips its anchors and is
  `aria-hidden`; the full-size interactive instance on the research pages is
  untouched (verified: 6 domain links still present there).
* **8.27** *(this pass)* — `pointer-events: none` on the decorative mark. 8.21
  removed the anchors but not the artwork's own `cursor: pointer` and
  `:hover { fill-opacity: 1 }`, so an 84 px decoration still showed a hand cursor,
  lit up on hover, and repainted ~137 shapes on every mouseover, with nothing to
  activate.

### Navbar

* No behavioural change in this pass. The brand scroll-reveal (8.17) and the
  hero-flush fix (8.14) are preserved and re-verified — checklist items 1–4.
* **8.25** — a WCAG 2.5.3 finding was recorded and **not** fixed; see §E.

### Search

* **8.20** — site search had **never worked**. `header.search: true` shipped the
  modal and its JavaScript on every page, and that script dynamically imports
  `/pagefind/pagefind.js`, which nothing ever generated. Every route 404'd and
  logged `Failed to initialize Pagefind: TypeError: Failed to fetch dynamically
  imported module`. This was also the only console error on the site and the sole
  reason Best Practices sat at 96.
  1. The index is now built — `npx --yes pagefind@1.4.0 --site public` in
     `publish.yaml` with a `test -f` guard, and `pnpm run search-index` locally.
     Pagefind is a self-contained binary, pinned by version, so the lockfile is
     untouched.
  2. Coverage went from **65 pages to 489**. Pagefind indexes only elements
     marked `data-pagefind-body`, and only the three prose templates had one, so
     publications, people, projects and grants were invisible. The attribute was
     added to `publication/single.html`, `projects/single.html`,
     `grant/single.html` and `authors/term.html`.
  3. Pagefind initialises on first open rather than on every page load
     (TBT 87 ms → 306 ms when a real index first existed).
* **8.24** — Alpine loads on first search intent. It has exactly **one** `x-data`
  root site-wide and it is the search modal. Both entry points are preserved by
  an inline bootstrap, necessary because the bindings that normally provide them
  (`@keydown.ctrl.k.window`) cannot fire before Alpine exists: a click on any
  `[data-search-toggle]` including its `data-search-query` pre-fill, and
  Ctrl/Cmd+K, after which the bootstrap detaches its own listener so Alpine's
  binding does not double-toggle. `hb-search.js` is no longer shipped at all —
  that pre-fill handler was its entire job.

### Responsive polish

* No layout changes were needed. The seven-width × two-theme matrix and ten
  interior routes at three widths were measured and were already clean; see §D.

### Accessibility

* **8.21** — seven sub-44 px tab stops removed from the homepage (above).
* **8.26** — 24 px target floor for standalone list links, the residue Phase 7
  measured and recommended closing. Seven of the twelve are links inside running
  prose and are covered by the Inline exception in WCAG 2.5.5/2.5.8; the other
  five are the whole content of their row in the homepage teaching and news
  lists, at 131×21 to 245×21, and get no exception. `assets/css/phase8.css` adds
  2 px of block padding at coarse pointer — padding rather than `min-height`
  (which does nothing to an inline element) or a display change (which would
  alter wrapping), because block padding grows the box target size is measured
  against without touching the line box. **Under-24 actionable: 36 → 21.**
* New driver `phase8-svg-targets.mjs`: Phase 7's touch audit walked HTML
  interactive elements and never descended into `<svg>`, which is why 8.21 went
  unnoticed. 56 SVG links across 5 routes × 2 viewports are now measured.

### Performance

* **8.19** — KaTeX gated per page. `site.Params.hugoblox.content.math.enable` is
  a site-wide boolean, on since Phase 4 because some publication titles carry
  real TeX, so all 602 pages downloaded 270 KB of JS + 23 KB of CSS and spent
  ~420 ms evaluating it. The homepage renders **zero** KaTeX spans.
  `functions/needs_katex.html` probes each page: explicit opt-in, its own
  title/abstract/summary/body, and the titles it *borrows* (list, section and
  taxonomy pages render other pages' titles). Author term pages needed their own
  branch because `authors/term.html` does not render `.Pages`. Pagination is free,
  since `.Pages` is the unpaginated set. **77 of 599 pages load KaTeX; 0 render
  TeX without it.**
* **8.22** — theme bootstrap inlined. `hb-head.js` must run before first paint,
  so it blocks by design; upstream also shipped it as a separate file, making the
  block a whole round trip — Lighthouse charged 302 ms to 1,387 bytes.
* **8.23** — three render-blocking stylesheets merged into one, in the exact
  order the three `<link>` elements produced. Verified style-identical:
  **142,940 computed values across 12 routes × 2 themes, 0 cascade differences.**

### Code cleanup

* **8.28** *(this pass)* — a **document-wide CSS leak** fixed. `qpacer.html`
  carries a `<style>` block inside `<defs>`, and a `<style>` inside an *inline*
  SVG is a document stylesheet, not a scoped one. It declared
  `.dark { fill: #d1d5db; }`; no element in the diagram has `class="dark"` (the
  class is on `<html>`), so that selector only ever matched the document root,
  and `fill` is inherited. Measured on the built site: in dark mode, on the
  homepage and all seven research pages, `<html>`, `<body>` **and** `<header>`
  all computed `fill: rgb(209, 213, 219)`; on pages without the diagram they
  correctly computed `rgb(0, 0, 0)`. Scoping it to `.dark .qpacer` keeps the
  effect identical inside the SVG and removes it from everything else — verified
  by sampling the computed fill of all 216 shapes in both themes and both
  instances. This is the same class of defect Phase 2A fixed in `custom/logo.html`.
* **8.29** *(this pass)* — `xmlns` on that SVG was `https://www.w3.org/2000/svg`.
  The SVG namespace is an opaque identifier spelled `http://`. An HTML parser
  ignores `xmlns` on inline SVG, which is why it rendered anyway, but the value
  was wrong, the same mistake was already fixed in `logo.html` in Phase 2A, and
  it would have to be right before the file could ever be served as a standalone
  `.svg`.
* Two upstream `console.log` calls removed (one was a render-blocking inline
  `<script>` in `<head>` whose only effect was console noise), plus four inside
  the search component that fired on every keystroke.
* `.gitignore` now matches `/public_*/`; `public/` alone never matched the
  per-phase scratch build destinations. See §G.

---

## C. Existing Phase 8 work preserved

Explicitly inspected and **left unchanged** because it was already correct:

| Area | State |
|---|---|
| Pagefind index generation and the CI step | Unchanged from the previous pass; re-verified, 489 pages indexed |
| Expanded Pagefind coverage (`data-pagefind-body` on 4 templates) | Unchanged; re-verified across all four required content categories |
| Conditional KaTeX loading (`needs_katex.html`) | Unchanged; re-verified, 77/599 pages, 0 false negatives |
| Theme bootstrap inlining | Unchanged; re-verified across 4 routes × 2 schemes |
| Stylesheet consolidation | Unchanged; the 142,940-value parity comparison stands |
| Deferred Alpine loading | Unchanged; re-verified, Alpine fetched exactly once, on intent |
| SVG touch-target improvements (8.21) | Unchanged; re-verified, 56 links, 0 failing |
| Hero design — research-circuit, entrance, spotlight, domains | Unchanged. Only `pointer-events` on the **decorative** mark was touched |
| Navbar behaviour — brand scroll-reveal, sticky header, mobile menu | Unchanged |
| Responsive behaviour | Unchanged; no CSS was altered for layout in this pass |
| All Phase 1–7 guarantees | Unchanged; regression suite re-run, see §D |

No broad refactoring was performed. The three code changes in this pass
(8.27, 8.28, 8.29) are each one or two lines, and two of them fix defects that
the investigation uncovered rather than anything chosen for its own sake.

---

## D. Validation results

### Method

Production build (`hugo --minify`) served over a local static server that
compresses responses and sends realistic cache headers, because GitHub Pages does
both. Lighthouse 13.5.0 via `npx`, desktop form factor,
`--throttling-method=simulate`, median of 5 runs (3 where noted).

> **Measurement note, stated because it matters.** The repository lives inside a
> OneDrive-synced folder. Every build writes ~700 files that OneDrive then
> uploads, and its sync process was observed at 2.2 GB resident with 43,814 s of
> cumulative CPU. On the *identical* final build this drove Performance readings
> of 91, 85, 78 and 54 in successive runs, with TBT swinging 1–830 ms, while
> FCP, LCP, Speed Index and transfer stayed constant to within a few percent.
> **The figures below were therefore taken with both builds written to and served
> from a directory outside the synced tree, on a settled machine, back to back.**
> Everything else about the harness is unchanged.

### Production Hugo build

```text
Pages 626 (EN) | Paginator pages 28 | Total in ~17 s | 0 errors
```

### Pagefind

`phase8-search-qa.mjs` — **16/16 PASS**. Indexed after the final build:
**489 pages, 2 languages, 8,491 words** (was 0 — the index did not exist).

| Check | Result |
|---|---|
| Idle page load requests nothing from `/pagefind/` | PASS — 0 requests |
| Idle page load does not download Alpine | PASS — 0 requests |
| Search modal opens (Ctrl+K) and loads Alpine | PASS — 1 Alpine request |
| Opening the modal loads Pagefind | PASS — 4 requests |
| Alpine downloaded exactly once | PASS |
| Input takes focus on open | PASS |
| Query finds a **publication** | PASS — `metasurface` → `/publication/j-008/` |
| Query finds a **person** | PASS — `Purbayan` → `/authors/purbayan-das/` |
| Query finds a **project** | PASS — `CTAdmin` → `/projects/ctadmin/` |
| Query finds a **grant / funding item** | PASS — `biosensors` → `/research/funding/g-01/` |
| Query finds a teaching page | PASS — `digital electronics`, 9 hits |
| Result navigation works | PASS — followed a result, landed on it, h1 "EEE 303 (July 2021)" |
| No Pagefind 404 | PASS — 43 Pagefind requests, none failed |
| No console exception | PASS |

### KaTeX

* Static scan of the built site: **599 pages scanned, 77 load KaTeX, 47 render
  TeX, 0 FALSE NEGATIVES** — no route contains TeX without the resources to
  render it.
* Browser run `phase8-katex-qa.mjs`: **18/18 routes** behave as specified —
  renders where maths exists, absent where it does not, **0 KaTeX errors, 0 raw
  `$…$` delimiters left visible** anywhere.
* The 30 pages that load KaTeX without showing any are benign: sibling pages of a
  paginated term whose maths lands on another page (correct — which title lands
  on which page is a pagination detail), and three pages whose `$` characters are
  PowerShell variables inside `<code>`, which KaTeX ignores by design.
* Asset audit on `/publication/`: one JS (69 KB transfer / 270 KB decoded), one
  CSS (3 KB / 23 KB), one renderer (2 KB), **two** font files. The other **18 of
  20 KaTeX font faces report `unloaded`** — the browser fetches only what the
  formulas use. No duplication, no unnecessary JavaScript, no removable CSS.

### Console

**0 errors** across every navigation in the checklist run — 44 viewport cells,
reduced-motion, 5 dark-mode routes, the mobile menu, and the full search session.

### Responsive testing

Homepage at **375, 430, 768, 1024, 1280, 1440, 1920** × light and dark (14 cells),
plus 10 interior routes at 390 / 768 / 1440 (30 cells) = **44 cells**.

| Criterion | Result |
|---|---|
| Horizontal overflow | **0 of 44** |
| Clipped navigation items | **0 of 44** |
| Hero colliding with the header | **0** |
| Content overlap / footer overflow | **0** |
| Unexpected navbar height change | **none** — header is 65 px at every width, and identical before and after the brand reveal |

| Width | Header | Hero gap | Nav items | Lede | Wordmark |
|---|---|---|---|---|---|
| 375 | 65 px | 0 px | 3 | 16 px | 293×80 |
| 430 | 65 px | 0 px | 3 | 16 px | 335×92 |
| 768 | 65 px | 0 px | 3 | 18 px | 380×104 |
| 1024 | 65 px | 0 px | 10 | 18 px | 380×104 |
| 1280 | 65 px | 0 px | 10 | 18 px | 380×104 |
| 1440 | 65 px | 0 px | 10 | 18 px | 380×104 |
| 1920 | 65 px | 0 px | 10 | 18 px | 380×104 |

### Keyboard / accessibility

* 25 consecutive Tab stops on the homepage: **25 with a visible focus indicator,
  0 without**. Skip link is the first stop.
* Mobile (390 px) menu toggle is focusable, `aria-expanded` false→true, menu
  opens with 8 links.
* Dark-mode contrast, WCAG 1.4.3, computed for every leaf text node on 5 routes:
  **0 below threshold**.
* SVG link target sizes: **56 measured, 0 tabbable-and-exposed under 24×24**.

### Reduced motion

`prefers-reduced-motion: reduce` honoured; **0 infinite animations, 0 running
animations**, and every hero part — wordmark, eyebrow, lede, actions — remains
**visible**, not merely still.

### Touch targets

| | Phase 7 | Phase 8 |
|---|---|---|
| Targets measured | 3,861 | 3,876 |
| Under 44 px, actionable | 112 | **111** |
| Under 24 px, actionable | 36 | **21** |

The 21 remaining are 7 unique links inside running prose, covered by the Inline
exception.

### Regression suite

Phase 7's own drivers re-run and diffed against their committed results:

| Gate | Phase 7 | Phase 8 | |
|---|---|---|---|
| Zoom cells with horizontal scroll (1.4.10) | 0 of 32 | 0 of 32 | ✅ |
| Reduced-motion cells with infinite animation | 0 of 14 | 0 of 14 | ✅ |
| Routes with `h1 !== 1` | 0 of 17 | 0 of 17 | ✅ |
| Routes with `main !== 1` | 0 of 17 | 0 of 17 | ✅ |
| Duplicate ids | none | none | ✅ |
| Unnamed interactive elements | none | none | ✅ |
| Keyboard tab stops walked | 597 | 597 | ✅ |
| … with a visible focus ring | 597 | 597 | ✅ |
| DOM-order inversions | none | none | ✅ |
| Skip link first on every route | yes | yes | ✅ |

**`regression on the Phase 7 gates: NONE`**

### Lighthouse / performance

Before = the pre-Phase-8 build; after = final. Both measured back to back on the
clean harness described above.

| Homepage | Before | After |
|---|---|---|
| **Performance** | 81 | **90** |
| **Accessibility** | 100 | **100** |
| **Best Practices** | 96 | **100** |
| First Contentful Paint | 1,508 ms | **1,208 ms** |
| Largest Contentful Paint | 2,463 ms | **1,730 ms** |
| Speed Index | 1,508 ms | **1,208 ms** |
| Total Blocking Time | 43 ms | **9 ms** |
| Cumulative Layout Shift | 0.0027 | 0.0027 |
| **Transferred** | 207 KB | **115 KB** |

Final, all three required route types:

| Route | Performance | Accessibility | Best Practices | Transferred |
|---|---|---|---|---|
| `/` (homepage) | **90** | 100 | 100 | 115 KB |
| `/publication/` (KaTeX) | **75** | 100 | 100 | 269 KB |
| `/teaching/jul2025_eee303/` (no KaTeX) | **94** | 100 | 100 | 64 KB |

### The 22-item manual checklist

Executed in a real browser by `phase8-checklist.mjs` and `phase8-checklist-b.mjs`.
**22/22 PASS.**

```text
[PASS] No white band between navbar and hero
[PASS] Navbar logo hidden at homepage top
[PASS] Navbar logo appears after scrolling
[PASS] Navbar does not shift when logo appears
[PASS] Hero metrics absent
[PASS] Redundant hero logo absent
[PASS] Generic old hero headline absent
[PASS] "Sajid Lab" retained
[PASS] "Department of EEE, BUET" retained
[PASS] "Led by Prof. Sajid Muhaimin Choudhury, PhD" retained
[PASS] Research imagery subdued while idle
[PASS] Research imagery becomes prominent on interaction
[PASS] Relevant research label appears/emphasizes on interaction
[PASS] PCB traces respond appropriately
[PASS] Hero remains readable at all tested viewport sizes
[PASS] Touch/mobile experience does not depend on hover
[PASS] Reduced-motion mode works
[PASS] No horizontal overflow
[PASS] No new console errors
[PASS] Dark mode remains legible
[PASS] Keyboard navigation works
[PASS] No Phase 1–7 URL/IA regressions
```

Evidence for each:

| # | Item | Measured |
|---|---|---|
| 1 | No white band | header bottom 65 px, hero top 65 px, **gap 0.00 px** |
| 2 | Logo hidden at top | scrollY 0: `visibility: hidden`, opacity 0, **and removed from the tab order** |
| 3 | Logo appears on scroll | scrollY 1400: `visibility: visible`, opacity 1 |
| 4 | No shift when it appears | header 65 px both states, **delta 0.00 px**; the 240×44 brand box is reserved while hidden |
| 5 | Hero metrics absent | 0 `.sj-stats*` elements; no publication/citation/h-index wording |
| 6 | Redundant hero logo absent | exactly 1 wordmark in the hero (the `<h1>`), navbar brand simultaneously visible = false |
| 7 | Generic old headline absent | hero copy contains no generic headline |
| 8 | "Sajid Lab" retained | `<h1>` accessible name begins "SAJID Lab — …" |
| 9 | "Department of EEE, BUET" retained | eyebrow reads "DEPARTMENT OF EEE · BUET" |
| 10 | PI credit retained | "Led by Prof. Sajid Muhaimin Choudhury, PhD" |
| 11 | Imagery subdued when idle | base layer opacity **0.13**, spotlight layer 0, `data-active` null, 78 traces, 6 controls |
| 12 | Imagery prominent on interaction | reached "Photonics" by **real Tab ×15**: base layer **0.13 → 0.42** |
| 13 | Label emphasises | label "Photonics" opacity **1** while active |
| 14 | Traces respond | traces tagged `photonics` at opacity 1, non-active groups dimmed to **0.55** |
| 15 | Hero readable at all sizes | 14 cells: lede 16–18 px and visible, wordmark 293–380 px and inside the viewport, eyebrow + both CTAs unclipped everywhere |
| 16 | Touch does not need hover | 390×844, `pointer: coarse`, `any-hover: none`; **synthesised tap** on the 62×51 px "photonics" control: `data-active` null → "photonics" |
| 17 | Reduced motion | honoured; 0 infinite, 0 running; **0 hero parts hidden** |
| 18 | No horizontal overflow | **0 of 44** cells |
| 19 | No console errors | **0** across the whole run |
| 20 | Dark mode legible | **0** contrast failures on 5 routes |
| 21 | Keyboard navigation | 25/25 stops with a focus ring, skip link first, mobile menu operable |
| 22 | No URL/IA regressions | 19 canonical Phase 1–7 routes + 8 distinct primary-nav destinations, **all 200** |

> Two instruments were corrected during this run, and both corrections are worth
> recording because the first readings were wrong, not the site.
> **Item 20** initially reported 127 contrast failures: Tailwind v4 emits
> `oklch()` / `color(srgb …)`, and the probe was reading the first three numbers
> of `oklch(0.872 0.01 258.338)` as 0–255 RGB, scoring slate-300-on-slate-900 at
> 2.12:1 when it is about 11:1. Colours are now resolved by painting them on a
> 1×1 canvas and reading the pixel back, with alpha composited in order. The
> WCAG thresholds themselves are unchanged at 4.5:1 and 3:1.
> **Items 12–14** initially reported the keyboard path as broken: in a headless
> session the page does not hold system focus, so `HTMLElement.focus()` moves
> `document.activeElement` without dispatching a `focus` event, and the circuit
> binds `focus`. Driving real Tab presses shows the keyboard path works.

---

## E. Remaining limitations

### E.1 Performance below 95 on two routes — measured, and legitimate

**Homepage: 90.** The dominant remaining cost is style, layout and paint, not
bytes or JavaScript. Script evaluation totals 265 ms, and `unused-css-rules` and
`unused-javascript` both score 1.0 with **0 bytes** of savings. Nearly half the
homepage DOM is SVG: 1,292 elements, 621 of them inside `<svg>`, 343 `<path>`
elements across 61 SVGs.

The largest single contributor is the Q-PACERS mark — 226 nodes, 144 paths,
53.6 KB of markup, rendered at 84×77 px. It was investigated in the order the
brief specifies:

* **Option 1, optimise the SVG.** Measured: **no** metadata, **no** comments,
  **no** `data-name`, **no** Inkscape/Sodipodi attributes, **no** hidden
  elements, **no** duplicate defs. Repeated transforms total **294 bytes**.
  Coordinate precision is already 2 decimals (5,518 of 6,228 numbers; only 12
  have 3+). Two unreferenced ids. The only meaningful reduction would be
  rounding 2 decimals to 1, worth ~5.5 KB raw and far less compressed, for a
  fraction of one Lighthouse point — and it would not reduce the 226 DOM nodes
  or the paint cost, which is where the time actually goes.
* **Options 2 and 3, serve it as an image / as light+dark variants.** Ruled out
  on evidence. The artwork is themed two ways an `<img>` cannot follow: 74 of its
  216 shapes fill from `var(--hb-color-header-fg)`, and its dark palette comes
  from a scoped `.dark .qpacer` rule plus per-class dark overrides. Externalising
  would mean freezing a design token into two separate files that silently drift
  when the token changes — the "fragile hack" the brief says to avoid.
* **The ceiling.** A control build with the mark **removed entirely** scores
  **92 against 91** on the same harness: FCP 1,206 → 1,057 ms, LCP 1,629 →
  1,579 ms, transfer 115 → 97 KB. **One point.** No optimisation of the artwork
  can beat deleting it, so no optimisation of it can be worth more than one
  point.

**Retained inline, unchanged.**

**`/publication/`: 75.** 117 KB of its 269 KB is KaTeX, required because the
publication titles contain real mathematics (`$\mu$`, `$\mathrm{Sb_2S_3}$`, the
`$[[7,1,3]]$` Steane code). Its LCP of 3,511 ms is KaTeX rewriting those titles
after load, which creates a late LCP candidate. The integration is already
minimal — one JS, one CSS, one renderer, two font files, 18 of 20 font faces
never fetched, no duplication. The only removable piece is the 69 KB engine, and
only by rendering mathematics at build time. That is possible (`transform.ToMath`,
Hugo ≥ 0.132) but the maths here lives in **front-matter titles** rendered by many
templates, so it would require a custom TeX-extraction partial plus changes to
every template that prints a title — precisely the "custom or partial KaTeX
implementation that creates maintenance risk" §4 rules out.

**Retained, with the upgrade path recorded rather than taken.**

### E.2 Finding 8.25 — WCAG 2.5.3 Label in Name, navbar brand

`label-content-name-mismatch` fires on the brand link on every route where it is
visible. The wordmark draws two real SVG `<text>` elements — the "Smart &
Advanced Junction of Intelligent Devices" tagline and "Lab" — so those glyphs are
the link's *visible* text, while its accessible name is
`aria-label="SAJID Lab — Home"`, which does not contain the tagline.

`aria-hidden` on the wrapper **does not fix it** — 2.5.3 compares the accessible
name against what is rendered on screen, precisely so that hiding something from
assistive technology cannot paper over it. This was tried, verified to still
fail, and reverted. The two real fixes both change brand artwork: convert those
`<text>` elements to outlines (which would also end the wordmark's dependency on
Arial being installed, deferred since Phase 2A), or stop rendering the tagline at
navbar scale where it is ~6 px tall and illegible. **Left as documented, by the
owner's decision.** Lighthouse weights this audit 0, so Accessibility still reads
100 — the finding is real, the score does not show it.

### E.3 Smaller items

| Item | Status |
|---|---|
| Research-area pages absent from search | They are `type: landing`, composed of blocks with no prose body to mark. Not fixed. |
| Centre SVG link 40.7×40.7 px at 390 px | Passes 2.5.8 (AA), misses 2.5.5 (AAA) by 3.3 px. Fixing it means changing artwork geometry. |
| Unscoped class names in `qpacer.html` | `.home`, `.Q`, `.P`, `.A`, `.C`, `.E`, `.R`, `.arrow` are global names in a document stylesheet. None currently matches anything outside the SVG — verified on five routes — so this is a latent collision risk, not a live defect. The one that *was* live (`.dark`) is fixed. |
| CI builds Hugo **0.152.1**, local is **0.158.0** | Every shadow was validated on 0.158.0. Nothing added uses post-0.152 template features, but the mismatch is worth closing deliberately (roadmap 8.13). |
| Build output inside OneDrive | Not a site defect, but it makes local performance measurement unreliable; see the measurement note in §D. |

Carried forward unchanged from Phase 7: NVDA screen-reader smoke test (cannot be
operated from an agent session, and still blocks the `redesign-phase-7` tag),
production redirect verification, Brave + Shields against the production edge,
and Safari/WebKit.

---

## F. Files modified

### Modified

```text
.github/workflows/publish.yaml                              Pagefind index step
.gitignore                                                  /public_*/ scratch builds
package.json                                                search-index script
layouts/_partials/site_head.html                            inline theme bootstrap; one stylesheet
layouts/_partials/libraries.html                            per-page KaTeX gate; lazy Alpine/search
layouts/_partials/qpacer.html                               .dark leak scoped; xmlns corrected
layouts/_partials/components/search-modal.html              lazy Pagefind; console noise removed
layouts/_partials/components/headers/navbar.html            8.25 finding recorded (no behaviour change)
layouts/_partials/hbx/blocks/research-area-qpacers/block.html  decorative mark: anchors stripped
layouts/authors/term.html                                   data-pagefind-body
layouts/grant/single.html                                   data-pagefind-body
layouts/projects/single.html                                data-pagefind-body
layouts/publication/single.html                             data-pagefind-body
docs/redesign/README.md                                     status
docs/redesign/implementation-roadmap.md                     items 8.19-8.29
docs/redesign/evidence/phase7-a11y.json                     re-run (regression evidence)
docs/redesign/evidence/phase7-keyboard.json                 re-run (regression evidence)
docs/redesign/evidence/phase7-touch.json                    re-run (regression evidence)
```

### Added

```text
assets/css/phase8.css                                       24px target floor; decorative mark inert
layouts/_partials/functions/needs_katex.html                per-page maths probe
docs/redesign/phase-8-validation.md                         this report
docs/redesign/evidence/phase8-checklist.mjs                 checklist items 1-14
docs/redesign/evidence/phase8-checklist-b.mjs               checklist items 15-22 + viewport matrix
docs/redesign/evidence/phase8-checklist.json                checklist results
docs/redesign/evidence/phase8-katex-qa.mjs / .json          KaTeX gate, in-browser
docs/redesign/evidence/phase8-search-qa.mjs / .json         Pagefind, in-browser
docs/redesign/evidence/phase8-svg-targets.mjs / .json       target size inside inline SVG
docs/redesign/evidence/phase8-css-parity.mjs                cascade comparison
docs/redesign/evidence/phase8-css-parity-before.json        142,940 computed values, before
docs/redesign/evidence/phase8-css-parity-after.json         142,940 computed values, after
docs/redesign/evidence/phase8-lighthouse-clean-*.json       final before/after on the clean harness
docs/redesign/evidence/phase8-lighthouse-closure-*.json     Q-PACERS A/B control
docs/redesign/evidence/phase8-lighthouse-route-*.json       per-route sweep
docs/redesign/evidence/phase8-lighthouse-p8-*.json          step-by-step optimisation trail
```

`hugo_stats.json` is listed by `git status` as modified. It is in `.gitignore`
but is currently **tracked**, so it keeps reappearing. It is build output and is
deliberately excluded from the commands in §H.

---

## G. Git diff summary

```console
$ git status --short
 M .github/workflows/publish.yaml
 M .gitignore
 M docs/redesign/README.md
 M docs/redesign/evidence/phase7-a11y.json
 M docs/redesign/evidence/phase7-keyboard.json
 M docs/redesign/evidence/phase7-touch.json
 M docs/redesign/implementation-roadmap.md
 M hugo_stats.json                                   <-- generated, do not commit
 M layouts/_partials/components/headers/navbar.html
 M layouts/_partials/components/search-modal.html
 M layouts/_partials/hbx/blocks/research-area-qpacers/block.html
 M layouts/_partials/libraries.html
 M layouts/_partials/qpacer.html
 M layouts/_partials/site_head.html
 M layouts/authors/term.html
 M layouts/grant/single.html
 M layouts/projects/single.html
 M layouts/publication/single.html
 M package.json
?? assets/css/phase8.css
?? docs/redesign/phase-8-validation.md
?? docs/redesign/evidence/phase8-*.{mjs,json}
?? layouts/_partials/functions/needs_katex.html
```

```console
$ git diff --stat
 .github/workflows/publish.yaml                     |  15 +
 .gitignore                                         |   8 +-
 docs/redesign/README.md                            |  20 +-
 docs/redesign/evidence/phase7-a11y.json            | 539 +++++++++++++------
 docs/redesign/evidence/phase7-keyboard.json        | 580 ++++++++++-----------
 docs/redesign/evidence/phase7-touch.json           | 360 ++++++-------
 docs/redesign/implementation-roadmap.md            |   8 +
 hugo_stats.json                                    |   2 +-
 layouts/_partials/components/headers/navbar.html   |  24 +
 layouts/_partials/components/search-modal.html     |  60 ++-
 .../hbx/blocks/research-area-qpacers/block.html    |  23 +-
 layouts/_partials/libraries.html                   | 136 ++++-
 layouts/_partials/qpacer.html                      |  41 +-
 layouts/_partials/site_head.html                   | 108 ++--
 layouts/authors/term.html                          |   5 +-
 layouts/grant/single.html                          |   3 +-
 layouts/projects/single.html                       |   3 +-
 layouts/publication/single.html                    |   7 +-
 package.json                                       |   5 +-
 19 files changed, 1207 insertions(+), 740 deletions(-)
```

**Review of the diff for unrelated or generated files:**

* `hugo_stats.json` — generated by Hugo, gitignored but tracked. **Excluded below.**
* `public_p8b/` — a scratch build. Now covered by the `/public_*/` rule added to
  `.gitignore`, so it no longer appears as untracked.
* The three `phase7-*.json` files are **re-run measurement output**, not code.
  They are the regression evidence: diffing them against their committed versions
  is what proves no Phase 1–7 gate moved. Included deliberately.
* **`HEAD` (`efebb36`) contains 1,464 generated files** under `public_p8/`,
  committed before this pass alongside 8 legitimate source files. It is **not
  pushed** — the branch has no upstream and `git branch -r --contains HEAD` is
  empty. You chose to leave it; the commands to undo it are kept in §H.0 in case
  you change your mind. `.gitignore` now prevents a recurrence.

---

## H. Git commands for me

**Nothing has been committed and nothing has been pushed.**

### H.0 Optional — undo the stray generated-file commit

Only if you want it gone. Every file stays on disk; the old commit stays in
`git reflog`.

```bash
git reset --soft HEAD~1
git restore --staged public_p8
git status --short
```

### H.1 Review

```bash
git status --short
git diff --stat
git diff .gitignore package.json .github/workflows/publish.yaml
git diff layouts/
```

### H.2 Stage explicitly

```bash
git add .gitignore package.json .github/workflows/publish.yaml
git add assets/css/phase8.css
git add layouts/_partials/functions/needs_katex.html
git add layouts/_partials/libraries.html
git add layouts/_partials/site_head.html
git add layouts/_partials/qpacer.html
git add layouts/_partials/components/search-modal.html
git add layouts/_partials/components/headers/navbar.html
git add layouts/_partials/hbx/blocks/research-area-qpacers/block.html
git add layouts/authors/term.html
git add layouts/grant/single.html
git add layouts/projects/single.html
git add layouts/publication/single.html
git add docs/redesign/phase-8-validation.md
git add docs/redesign/README.md docs/redesign/implementation-roadmap.md
git add docs/redesign/evidence/phase8-checklist.mjs docs/redesign/evidence/phase8-checklist-b.mjs
git add docs/redesign/evidence/phase8-checklist.json docs/redesign/evidence/phase8-checklist-partial.json
git add docs/redesign/evidence/phase8-katex-qa.mjs docs/redesign/evidence/phase8-katex-qa.json
git add docs/redesign/evidence/phase8-search-qa.mjs docs/redesign/evidence/phase8-search-qa.json
git add docs/redesign/evidence/phase8-svg-targets.mjs docs/redesign/evidence/phase8-svg-targets.json
git add docs/redesign/evidence/phase8-css-parity.mjs
git add docs/redesign/evidence/phase8-css-parity-before.json docs/redesign/evidence/phase8-css-parity-after.json
git add docs/redesign/evidence/phase8-lighthouse-clean-after-home.json
git add docs/redesign/evidence/phase8-lighthouse-clean-before-home.json
git add docs/redesign/evidence/phase8-lighthouse-clean-after-publication.json
git add docs/redesign/evidence/phase8-lighthouse-clean-after-interior.json
git add docs/redesign/evidence/phase8-lighthouse-closure-with-mark.json
git add docs/redesign/evidence/phase8-lighthouse-closure-control-no-mark.json
git add docs/redesign/evidence/phase7-a11y.json
git add docs/redesign/evidence/phase7-keyboard.json
git add docs/redesign/evidence/phase7-touch.json
```

Deliberately **not** staged:

```text
hugo_stats.json                       generated; gitignored but still tracked.
                                      To stop it reappearing: git rm --cached hugo_stats.json
public_p8b/                           scratch build, now gitignored
docs/redesign/evidence/phase8-lighthouse-{p8-*,route-*,final-*,recheck-*}.json
                                      the step-by-step optimisation trail. Add them
                                      if you want the full record; the four
                                      `clean-*` files are the ones the report cites.
```

### H.3 Commit

```bash
git commit -m "Phase 8: finalize site polish, accessibility and performance"
```

### H.4 Do not push

No push command has been run. When you are ready:

```bash
git push -u origin redesign/phase-7-responsive-accessibility-cross-browser
```

Do **not** create the `redesign-phase-7` tag yet — the NVDA smoke test still
blocks it.
