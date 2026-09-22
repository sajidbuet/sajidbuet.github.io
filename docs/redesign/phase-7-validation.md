# Phase 7 — Responsive, Accessibility & Cross-Browser Validation

| | |
|---|---|
| Status | **PASS WITH MANUAL CHECKS REMAINING** |
| Branch | `redesign/phase-7-responsive-accessibility-cross-browser` |
| Base revision | `e17a415` (after Phase 6) |
| Date | 2026-09-22 |
| Raw evidence | `docs/redesign/evidence/phase7-*.json` |
| Drivers | `docs/redesign/evidence/phase7-*.mjs` |
| Captures | `docs/redesign/screenshots/phase-7/` (not tracked) |

Phase 7 is a qualification gate, not a redesign phase. Every source change below
exists because a measurement failed; none is a preference. Where a fix was
considered and rejected, the reason is recorded with the numbers that decided it.

---

## 1. Environment

| | |
|---|---|
| OS | Windows 11 Education, 10.0.26200 |
| Hugo | 0.158.0 extended (CI pins 0.152.1) |
| Node | v23.9.0 · npm 10.9.2 |
| Chromium | Chrome 153.0.8010.53, headless, driven over CDP |
| Brave | 153.1.95.104, headless, driven over CDP |
| Firefox | **155.0** (Playwright build) — see §9 |
| Playwright | 1.63.0, added as a repo `devDependency` |
| Lighthouse | 13.5.0 via `npx --yes` (**not** a repo dependency) |
| NVDA | **not installed / not operable from this session** — see §11 |

### Build commands

```powershell
# OneDrive conflict copies are quarantined at build time, not deleted — see §2
$env:HUGO_IGNOREFILES = "-SAJID-PC\.,outreach[\\/]templates"

hugo --destination public_p7                       # production build
hugo server --disableFastRender --bind 127.0.0.1 --port 1337 --renderToMemory
```

Build result: **626 EN pages / 380 BN**, 51 EN aliases, **0 errors**, **0 duplicate
target paths**. The only build warnings are the pre-existing upstream
`module.mounts.includeFiles` deprecation and the `doi`/`url_pdf` front-matter
deprecations in the **Bengali** publication mirror (Phase 4 migrated the English
tree only; `content/bn` is Phase 8 item 8.9).

---

## 2. A working-tree hazard, handled without touching user files

The repository is inside OneDrive, and OneDrive had again produced
`…-SAJID-PC` conflict copies — the exact failure Phase 5 §"A Phase 4 regression"
documents. It had also restored a pre-Phase-5 copy of
`content/outreach/templates/graphics/`.

Measured effect on the build:

| | Pages | Aliases |
|---|---|---|
| With the conflict copies | 642 | 53 |
| Quarantined | **626** | **51** |

The extra two aliases were duplicates of `/projects/g-0*` and
`/research/funding/*` emitted by `content/projects/_index-SAJID-PC.md` and
`content/research/funding/_index-SAJID-PC.md` — the same alias-collision class
that broke Phase 4's redirects once already. The restored `content/outreach/`
copy published a stale `/outreach/templates/graphics/` page that shadowed the
Phase 5 alias of the same path.

**These files are untracked user work and were not deleted or moved.** They are
excluded at build time by `HUGO_IGNOREFILES`, which touches nothing on disk. The
variable is not committed anywhere; it must be set in any shell that builds this
repository until the copies are cleaned up. Phase 7 was measured against the
626-page build, which matches the page count Phase 5 recorded.

> **Action for the author:** delete the 27 `…-SAJID-PC` files and the
> `content/outreach/` directory once you have confirmed you do not want them.
> `git status` lists them all.

---

## 3. Responsive matrix — 7 viewports × 2 themes × 15 routes

`docs/redesign/evidence/phase7-matrix.mjs` → `phase7-matrix-chromium.json`.
**210 cells**, each one audited with the Phase 1 instrument
(`evidence/audit-instrument.js`, unchanged, per roadmap 7.3) plus a Phase 7
extension, and each one captured.

Routes are the full `visual-qa-baseline.md` §1 list with its "and" pairs expanded
— 15 rather than the stated minimum of 12. No route was substituted.

| Viewport | | Routes |
|---|---|---|
| 1920×1080 · 1440×900 · 1280×800 · 1024×768 | desktop | `/` · `/research/` · `/research/photonics/` · `/publication/` · `/publication/j-029/` · `/projects/` · `/projects/ctadmin/` · `/teaching/` · `/teaching/jul2025_eee303/` · `/authors/` · `/authors/me/` · `/news/` · `/news/2024-05-09-new-pg-course/` · `/resources/` · `/resources/blog/20260124-citation-count/` |
| 768×1024 · 430×932 · 390×844 | touch emulation + `pointer: coarse` | as above |

### Result — every cell, both themes

| Criterion | Baseline (Phase 1) | Start of Phase 7 | End of Phase 7 |
|---|---|---|---|
| L1 document-level horizontal overflow | ✅ 0 | 0 | **0 / 210** |
| L3 overlapping content | — | 0 | **0 / 210** |
| T4 exactly one `<h1>` | ✗ 5 routes | 0 fails | **0 / 210** |
| T5 heading-level skips | ✅ | 0 | **0 / 210** |
| T9 raw LaTeX in `<title>` | ✗ | 0 | **0 / 210** |
| X1 contrast failures (light **and** dark) | ✗ 12 / 4 | **8 unique** | **0 / 210** |
| X5 landmarks (`main` = 1) | ✗ 13 of 16 routes | 0 fails | **0 / 210** |
| X13 duplicate `id` / positive `tabindex` | ✅ | **70 cells** | **0 / 210** |
| M4 `<img>` without `width`/`height` | ✗ 6 of 7 | **42 cells** | **0 / 210** |
| M6 `<img>` without `alt` | ✗ | 0 | **0 / 210** |
| A1 infinite animations | ✗ 14 | 14 cells | **0 / 210** |
| Tables overflowing the document | — | 0 | **0 / 210** |
| Footer overflow | — | 0 | **0 / 210** |
| L10 home height @1440 (budget 7,000 px) | 12,728 px | 6,905 px | **6,905 px** |

Two matrix signals were investigated and are **measurement artefacts, not defects**:

- *"Nav wraps to 2 rows at ≥1024 px" (N6).* The probe counts distinct `top`
  values of links inside `header nav`, and the brand link sits on a different
  baseline from the eight menu items. Inspected at 1024×768: all eight items are
  on one line with the logo beside them. N6 passes.
- *"Grid columns under 150 px."* `div.grid.grid-cols-1` reported 12 columns of
  ~107 px on `/research/`. It is a 12-column Tailwind span grid with two
  children that span 8 and 4; column width is meaningless for it.

### Page-shell inspection

Captures were reviewed, not merely generated. Full-page JPEGs at 1440×900 and
390×844 (both themes, every route); above-the-fold captures at the other five
viewports. What the inspection confirmed beyond the counters: the sticky header
occludes correctly in both themes, the 390 px course page keeps its wide table
inside a scroll container while the document does not scroll, breadcrumbs wrap
rather than truncate, and card grids reflow 3-up → 2-up → 1-up without orphaned
columns.

---

## 4. Defects found and fixed

Eleven defects. Each is stated with what was measured, the root cause, and the
smallest change that closed it.

### D1 — Course-table column header invisible (contrast 1.05:1, both themes)

**Route/viewport/theme:** `/teaching/jul2025_eee303/`, all 7 viewports, light *and* dark.

`<th>` "CO No." rendered `#ffffff` on `#f8fafc` in light and `#0f172a` on
`#0b1220` in dark. Confirmed in the rendered capture: the column heading was
literally not visible.

**Root cause — a specificity split between two phases.**
`phase6.css` had `.sj-prose thead th, .sj-prose table th:first-child:not(:only-child)`
at (0,3,2); `phase5.css` had `.sj-section-teaching table:not(.no-stripe) th` at
(0,2,2). The first cell of the thead matched both, so it took its **background**
from Phase 6 and its **colour** from Phase 5.

**Fix:** `assets/css/phase6.css` — the row-header selector is scoped to `tbody`
(its actual purpose) and now sets `color` alongside `background`, so the pair can
never split again. Measured after: **5.36:1 light, 9.88:1 dark.**

### D2 — `--color-primary-600` failed AA site-wide (3.38:1)

**Routes:** `/authors/` ("View Group Alumni", white on `bg-primary-600`),
`/authors/me/` (language pills), `/news/` ("Read more"). All viewports, both themes.

`#0c96c8` measures 3.38:1 both as text on the page background and as a fill under
white text. `tokens.css` already carried the note that `*-primary-600` consumers
"are migrated to `--sj-accent` in Phase 3"; Phase 3 only did the homepage, scoped
under `.sj-home`.

**Fix:** `assets/css/tokens.css` — `--color-primary-600` → `#0e7490` (the accent
already approved in `design-system-proposal` §2.13) and `--color-primary-700` →
`#155e75`. 700 had to move with it: `#0e7490` *is* Tailwind cyan-700, so leaving
it would have collapsed `hover:bg-primary-700` to no visible change. Dark mode
already used `*-primary-400` (`#22d3ee`, 9.88:1) and is untouched.
`--sj-brand: #0c96c8` is unchanged and is what the logo uses.
Measured after: **5.36:1** in both directions.

### D3 — News card metadata failed AA in dark mode (3.69:1)

`text-zinc-500` on the dark card surface, for the date and read-time strings on
`/news/`. **Fix:** `dark:text-zinc-400` (6.97:1) in
`layouts/_partials/views/card.html` and `card-noimage.html`. Light unchanged.

### D4 — Duplicate `id="main"` on 67 routes (regression against a ✅ baseline)

Phase 2A put `id="main" tabindex="-1"` on the shell wrapper `<div>` because the
inner `<main>` came from `_vendor` and had none. Phase 6 gave every new detail
template its own `<main id="main" tabindex="-1">`. Both fired.

**Fix:** `layouts/baseof.html` — the wrapper is presentational again. That
exposed two page templates whose `<main>` had no id (`publication/single.html`,
`grant/single.html`), which would have left the skip link with no target; the
attributes moved onto those real landmarks. Measured after: **597 of 597 pages
have exactly one `<main>` carrying exactly one `id="main"`.**

### D5 — Nested `<main>` landmarks on `/teaching/notes/`

`layouts/notes/list.html` emitted its own `<main>`, but it serves branch kinds,
for which `baseof.html` already supplies one. **Fix:** plain `<div>` wrapper.

### D6 — Duplicate `id="team"` on `/authors/`

Phase 5's markdown intro block auto-generated `<h1 id="team">` from its `# Team`
heading, colliding with the team block's `<section id="team">`.
**Fix:** `# Team {#team-intro}` in `content/authors/_index.md`. The section keeps
`#team`, so no existing anchor changes.

### D7 — 61 invalid, unnamed, zero-size links per publication listing

`layouts/_partials/views/citation.html` emitted, on every citation row:

```html
<a class="btn btn-page-header btn-sm" href="{{ $item.Params.doi }}" target="_blank" rel="noopener">
  <span class="__dimensions_badge_embed__" data-doi="{{ $item.Params.doi }}">…
```

Three measured defects:
1. `.Params.doi` is empty for **every** English publication (Phase 4 moved DOIs to
   `hugoblox.ids.doi`; Phase 6 fixed the detail template but missed this shared
   listing view) → `href=""`, a link to the current page. **61 on `/publication/`.**
2. Where a DOI *was* present — the Bengali mirror shares the English taxonomy
   terms — it emitted `href="10.1364/…"` with no scheme: **90 broken links across
   29 taxonomy pages.**
3. With the badge script never activating, the anchor stayed **0×0 and focusable
   with no accessible name**. Chromium's accessibility tree: 61 unnamed links on
   `/publication/`, 1 on the detail page, 3 on `/`.

**Both candidate fixes were built and measured before choosing.**

| Option | Measured outcome |
|---|---|
| Resolve the DOI properly (which also reactivates `badge.js`) | Fixed the links, but introduced a **new dark-mode contrast failure** (`.__db_score`, `#222` on `#0f172a` = 1.12:1, third-party markup), **37 injected `<img>` with no dimensions**, ~90 extra tab stops, and nested `<a>` inside `<a>` because `badge.js` injects its own anchor |
| Remove the badge block from the listing view | 61 + 3 invalid tab stops gone, zero visible change (the badge has rendered nothing since Phase 4), DOI still reachable via the existing "DOI" button from `page_links` |

The second was taken: Phase 7 is verification, and switching on a dormant
third-party widget is a feature change with regressions. Re-enabling it properly
is now folded into roadmap item **8.12**, which already owns the Dimensions badge.

### D8 — 40 focus stops with no visible ring on `/publication/`

The DOI / URL / PDF / Cite controls computed `outline: none 2px rgb(14,116,144)`
— the ring's colour was inherited from the Phase 2A focus system but
`outline-style` had been forced to `none`. `:focus-visible` matched throughout,
so this was paint suppression, not focus detection.

**Root cause:** upstream
`_vendor/…/assets/css/views/attachments.css` applies Tailwind's `outline-none`
**and** `focus:outline-none` to `.hb-attachment-link`. `_vendor` is never edited.

**Fix:** `assets/css/phase7.css` restores `outline-style` from a later
stylesheet; width, colour and offset still come from the design tokens.
Measured after: **597 of 597 tab stops across 9 route/viewport/theme walks show
the ring — zero without.**

### D9 — Partner logos shipped with no intrinsic dimensions

4 images on `/` and 4 on `/research/`. The upstream logos block guards
`width`/`height` behind `{{ if not $isSVG }}`, and all four partner logos are SVG.

**Fix:** new `layouts/_partials/functions/svg_dimensions.html` reads the numbers
from each file's own `viewBox` (Phase 6 solved the same problem for the footer
logo by hardcoding one file's values; this generalises it, and a file with no
parseable `viewBox` yields nothing rather than a guess), consumed by a shadow of
the logos block. Measured after: **0 images without dimensions on any of the 210
cells.**

### D10 — Six accessibility defects Lighthouse caught that the in-house instrument did not

| Audit | What it was | Fix |
|---|---|---|
| `color-contrast` | A **second** `<th>` case: row headers in `tbody`, white on `#f8fafc` = 1.04:1. The in-house instrument de-duplicates by tag + colour + size and had already recorded a passing `<th>`, so it never looked at this one | `phase6.css` — background and colour now always set together |
| `aria-prohibited-attr` | The six research-map SVG links took `aria-label` while computing to role `generic` | `role="link"` on each in `qpacer.html` |
| `label-content-name-mismatch` | The three `/publication/` filter `<summary>` elements had `aria-label="Filter by topic tag"` while showing "Tag / All tags / (63)" — WCAG 2.5.3, a speech-input user saying the visible word could not activate them | `aria-label` removed; the name now comes from the visible content |
| `label-content-name-mismatch` | The brand link's accessible name did not contain the logo's rendered `<text>` | The two `<text>` runs marked `aria-hidden` — the SVG is `role="img"` with its own `<title>`, so they were always artwork rather than a label |
| `link-in-text-block` | The footer "HugoBlox" link sat in a sentence and was distinguished by colour alone (WCAG 1.4.1) | Underlined |
| `target-size` | The `/authors/me/` icon rail measured 20×16 to 24×16 at desktop form factor | 24 px floor at all pointer types, 44 px at coarse |

### D11 — Link text and dead links

- **15 generic link texts** (`Click here to read more` ×8, `Click here`,
  `[here]`, `[click here]` ×5) across `content/news/**`,
  `content/authors/me/_index.md`, `content/resources/blog/**` and five teaching
  files — WCAG 2.4.4 / baseline X14. All replaced with text that is meaningful
  out of context. Measured after: **0 generic link texts site-wide.**
- `/news/2024-02-17-call-for-research/` linked to `/research/RISE-Metalens`,
  which has never existed. Repointed at `/research/funding/`.
  > **Needs your confirmation:** `g-03` ("Synergizing Deep Learning and Topology
  > Optimization for Tunable Meta-lens Design", Apr 2024 – Oct 2025) looks like
  > the RISE-Metalens project, but that is an inference, so the link was not
  > pointed at it. If it is the right grant, change the link to
  > `/research/funding/g-03/`.

---

## 5. Accessibility results

### Keyboard (`phase7-keyboard.mjs`) — real `Input.dispatchKeyEvent` traffic, not `.focus()`

9 walks: `/`, `/publication/`, `/teaching/jul2025_eee303/`, `/authors/me/`,
`/projects/ctadmin/`, `/resources/` at 1440; `/` and the course page at 390; `/`
at 1440 dark.

| Check | Result |
|---|---|
| Tab stops walked | **597** |
| Stops showing a visible focus ring | **597 / 597** |
| Focus order vs DOM order | **0 inversions** on every route |
| Skip link first in tab order | **yes, on all 9** |
| Skip link activates | moves focus to `<main id="main">`, `location.hash = #main` |
| Keyboard traps | **none** — see below |
| Mobile menu, light **and** dark | toggle reached in 3 tabs, 44×44, ring visible; `Enter` opens; `aria-expanded` false→true; panel 401 px, does not overflow; focus moves to the first item ("Home"); all 8 items present; **0** sub-44 px targets inside; `Escape` closes and returns focus to the trigger; `Space` also opens |

`ringsNotCompletedWithinStepLimit` in the JSON lists `/` and `/publication/`.
That is the walk hitting its step cap, not a trap. Both were re-walked without a
cap: `/` has 104 focusable elements, tabs through all of them, returns to "Skip
to main content" and then leaves the document into browser chrome;
`/publication/` has 538 and likewise cycles back to the skip link. **No trap
exists.**

#### Documented tab order — `/` at 1440

```
 1. <a>      Skip to main content        → #main
 2. <a>      SAJID Lab — Home            → /
 3. <a>      Home                        → /
 4. <a>      Research                    → /research/
 5. <a>      Publications                → /publication/
 6. <a>      Projects                    → /projects/
 7. <a>      Teaching                    → /teaching/
 8. <a>      Team                        → /authors/
 9. <a>      Resources                   → /resources/
10. <a>      Contact                     → /#contact
11. <button> Search
12. <button> Toggle light and dark appearance
… then main content in reading order, then the footer.
```

Full orders for all nine walks are in `phase7-keyboard.json` under `tabOrder.*.order`.

### Contrast

`audit-instrument.js` over all 210 cells, light and dark: **0 failures**, from 8
unique defects at the start of the phase. Firefox, independently: **0**.
Lighthouse `color-contrast`: **pass on all 5 routes**. The audit threshold was
not changed.

### Reduced motion (`prefers-reduced-motion: reduce`)

7 routes × {normal, reduced} at 1440 light, plus reduced at 390 dark.

| Criterion | Result |
|---|---|
| A4 infinite animations under reduced motion | **0** |
| A1 infinite animations under **normal** motion | **0** |
| A5 content stuck at `opacity: 0` | none — visible text length is identical normal vs reduced on all 7 routes (home differs by 2 characters: the wordmark caret) |
| Navigation operable | yes, in both states |

The one infinite animation found at the start of the phase was `blink` on
`#brand-cursor`. The Phase 3 script removes the caret when the wordmark settles,
but the sequence runs for ~5 s, and if the script never completes — blocked
inline script, CSP, a JS error — it blinks forever. `phase7.css` now bounds the
animation in CSS as well, so "zero infinite animations" no longer depends on
JavaScript finishing.

### Zoom 200 % and 400 %

Emulated faithfully: browser zoom at *Z* % on a 1280 px window is
`width = 1280/Z` with `deviceScaleFactor = Z`, which reproduces both the CSS-pixel
count the reflow criterion is written against (640 and 320) and the rendered
scale. 8 routes × 2 zoom levels × 2 themes = **32 cells**.

| Criterion | 200 % (640 px) | 400 % (320 px) |
|---|---|---|
| Horizontal scrolling | **0 cells** | **0 cells** |
| Header / main / footer present and reachable | 32 / 32 | 32 / 32 |
| Content loss | none | none |
| Zoom disabled? | no — `<meta name=viewport>` is `width=device-width, initial-scale=1`, with no `maximum-scale` and no `user-scalable=no` |

Two cells report an element extending past the viewport at 400 % on `/`:
`div.absolute.bottom-full.left-1/2`, the partner-logo hover tooltip. It renders at
`opacity: 0` until hover, causes no document scrolling, and is not visible. Not a
defect.

At 400 % the homepage stat strip stays two columns (2 × 144 px) rather than one.
The numbers are short ("50+", "13"), nothing truncates and nothing scrolls
horizontally, so WCAG 1.4.10 is satisfied; `visual-qa-baseline` X9's stricter
"single column" wording is not met for that one component. Recorded rather than
forced, because collapsing it would have been a layout change in a verification
phase.

### Touch targets

`phase7-touch.mjs`, 15 routes × {768×1024, 430×932, 390×844}, with
`pointer: coarse` emulated. (`setDeviceMetricsOverride({mobile: true})` alone does
**not** flip the pointer media features — the first pass silently never exercised
the rules.)

| | Start of Phase 7 | End of Phase 7 |
|---|---|---|
| Total undersized instances | 2,028 | **1,034 (901 of them inline-exempt)** |
| Distinct undersized **controls** (buttons, icon-only links, `<summary>`) | 130 incl. all controls | **0** |
| Distinct undersized targets, all kinds | 130 | **38** |
| … of those, under 24 px (WCAG 2.5.8 AA) | 70 | **12** |

**Everything the roadmap §13 enumerates now measures ≥ 44 × 44 at a coarse
pointer:** navbar toggle (44×44, already), search and theme controls (already),
social icon rails, footer icon rail, publication actions (DOI / URL / PDF / Cite /
BibTeX), pagination prev/next, breadcrumb links, language pills, card action rows
("Code ↗", "Demo ↗"), card and list titles, disclosure summaries ("On this page",
chapter sidebar), and every item inside the open mobile menu.

The fixes are padding and `min-height` under `@media (pointer: coarse)` only, so
the desktop layout is unchanged; icons keep their drawn size.

**The 38 that remain are all `<a>` text links** whose height is set by the
line-height of the text around them — author names inside a citation sentence,
prose links, related-item headlines. 26 of them are ≥ 24 px and pass WCAG 2.5.8
AA; 12 are 19–21 px. All 38 fall under the **"Inline" exception** that WCAG 2.5.5
and 2.5.8 both grant to targets "in a sentence or … constrained by the
line-height of non-target text". They are listed individually in
`phase7-touch.json → uniqueActionable`. Forcing 44 px onto them would be the
interface inflation the brief rules out; a 24 px floor for the 12 is a reasonable
Phase 8 polish item.

### Semantics and ARIA (`phase7-a11y.mjs` + `phase7-axtree.mjs`)

Accessible names are taken from **Chromium's own accessibility tree**
(`Accessibility.getFullAXTree`), not a hand-rolled heuristic — the first version
of that heuristic treated an icon-only link's whitespace `textContent` as a name
and never reached the `<img alt>` / `<svg><title>` fallback, producing false
positives on `/authors/` and `/news/`.

| Check | Start | End |
|---|---|---|
| Interactive elements with **no accessible name** | 14 `/` · 7 `/research/` · 12 `/research/photonics/` · **61 `/publication/`** · 10 `/news/` · 1 detail | **0 / 0 / 0 / 0 / 0 / 0** — 0 across all 17 route+viewport combinations, 1,264 interactive elements |
| `<main>` per route | 1 (but 67 pages had a duplicate `id`) | **1**, unique id |
| `header` / `nav` / `footer` landmarks | present | present; both `<nav>` now labelled ("Primary", "Footer") |
| Heading outline | 0 skips | **0 skips**, exactly one `<h1>` per route |
| Duplicate `id` | 2 (`main`, `team`) | **0** |
| Positive `tabindex` | 0 | **0** |
| `<input>` without a label | **1 on every route** (the search field) | **0** |
| Invalid / broken ARIA references | 0 | **0** |
| Redundant ARIA roles | 0 | **0** |
| `target="_blank"` without `rel="noopener"` | 0 | **0** |
| Generic link text | 15 | **0** |
| `<html lang>` | `en-us` | `en-us` |
| `<title>` unique per route | 15 / 15 | **15 / 15** |
| Expandable state | `aria-expanded` + valid `aria-controls` | unchanged, verified |

Native semantics were preferred throughout: the filter `<summary>` fix *removes*
ARIA rather than adding it, and the redundant news-card image link is taken out
of the accessibility tree rather than given a synthetic name.

### Lighthouse — 5 representative routes

`npx lighthouse 13.5.0`, categories Accessibility and Best Practices, desktop
form factor.

| Route | Accessibility | Best Practices |
|---|---|---|
| `/` | 93 → **100** | 96 |
| `/publication/` | 96 → **100** | 96 |
| `/publication/j-029/` | 97 → **100** | 96 |
| `/teaching/jul2025_eee303/` | 93 → **100** | 96 |
| `/authors/me/` | 93 → **100** | 96 |

Two audits still report:

- **`errors-in-console`** — the single pre-existing Pagefind 404
  (`/pagefind/pagefind.js` is not generated). This is the only console error on
  the site and it is what holds Best Practices at 96. Roadmap item 2.15 left the
  decision (wire Pagefind into `publish.yaml`, or set `header.search: false`) to
  the author; it was not taken in Phase 7.
- **`label-content-name-mismatch`** on the navbar brand link. This audit has
  **weight 0** in Lighthouse's accessibility category, which is why the score is
  100. After the logo `<text>` runs were marked `aria-hidden`, axe still finds
  some text inside the link that is not in its accessible name. Cosmetic;
  recorded rather than chased further.

Phase 6's explicit image dimensions were re-verified and hold: `image-size-responsive`
and "image elements do not have explicit width and height" both pass.

---

## 6. Long-content stress cases

Tested on real content, not fixtures, at 390 px in both themes:

| Case | Route | Result |
|---|---|---|
| Wide course table (6 columns, Word-pasted inline widths) | `/teaching/jul2025_eee303/` | scrolls inside its own container; document `scrollWidth == innerWidth`; columns usable; no text overlap |
| 17-word publication title + long author list + long journal name | `/publication/j-023/` | wraps, no overflow |
| Title containing TeX (`Steane $[[7,1,3]]$`) | `/publication/j-029/` | KaTeX renders; **0** raw `$…$` in `<title>` or `<h1>` |
| BibTeX block | publication details | pre-formatted, scrolls locally |
| DOI URLs | listings and details | wrap; no document overflow |
| Long breadcrumbs | `/teaching/archive/<course>/` | wrap to a second line, do not truncate |
| Long course titles | `/teaching/` | wrap |
| Long designation + multiple profile links + biography | `/authors/me/` | no overflow at any viewport |
| Long news headings, inline images, nested headings, lists | `/news/…`, `/resources/blog/…` | no overflow, heading order intact |
| Long project title + funding metadata + external links | `/projects/ctadmin/` | no overflow |

**Sparse vs rich front matter.** Phase 6 validated this with `qa-fixture-*`
bundles that were deleted at the end of that phase. No new fake content was
created for Phase 7. Instead the sparsest and richest **real** pages were used:
`/publication/x-03/` (no DOI, no PDF, no abstract) and `/authors/0421062344-ayon-sarker/`
(no portrait) for the minimal case; `/publication/j-023/` and `/authors/me/` for
the maximal. No template crashed, rendered a stray separator, produced an empty
panel or printed a literal `null`. The one genuinely empty state,
`/teaching/notes/`, renders its honest placeholder — and its nested-`<main>`
defect (D5) was found exactly there.

---

## 7. Internal links and routes

`phase7-links.mjs` over the whole generated build — static, so it covers every
page rather than a crawlable subset. `<script>` and `<template>` blocks are
stripped first (JS template literals such as `href="result.url"` produced 2,496
false positives in the first pass).

| | |
|---|---|
| Pages scanned | 599 (alias stubs excluded) |
| Links checked | 24,788 — 17,592 internal, 5,352 external |
| Broken internal links, **English** | 90 → **10** |
| Broken internal links, `/bn/` | 1,610 |
| Broken image paths | **0** |
| Broken anchors (`#fragment`) | **0** |
| Links to obsolete paths (`/outreach/`, `/people/`, `/projects/g-*`, `/opportunities`) | **0** |
| Alias stubs verified (exists → resolves → target is not itself an alias) | **62 / 62 pass** |

All 15 legacy routes from Phases 4–5 still redirect:

```
/projects/g-01..03/   → /research/funding/g-01..03/
/outreach/            → /resources/
/outreach/lor/        → /resources/academic/lor/
/outreach/scientific-typing/ → /resources/academic/scientific-typing/
/outreach/templates/  → /resources/templates/
/outreach/graphics/   → /resources/templates/graphics/
/outreach/blog/       → /resources/blog/
/outreach/professional/ → /resources/professional/
/outreach/songs|poetry|hobbies/ → /resources/personal/…
/outreach/blog/20260811-bracu-arm-workshop/ → /teaching/workshops/bracu-arm-workshop/
/people/              → /authors/
```

**The 10 remaining English breaks are all missing binary assets, not broken
pages**, and need files only the author has:

| Page | Missing |
|---|---|
| `/teaching/archive/j2020_eee303/` | `/courses/EEE_303_2020/Lecture_{1,2-3,4-6,7-8}.pdf` |
| `/teaching/workshops/bracu-arm-workshop/` | `files/memfile.dat`, `files/reference/{add.c,simple_alu.v,tb_simple_alu.v,simple_sum.s,memfile.dat}` |

The workshop six are the same files Phase 5 recorded as "never committed (needs
the author)". The 1,610 `/bn/` breaks are the known `content/bn` nesting problem,
roadmap item **8.9**.

---

## 8. Themes

Every responsive, contrast, semantic and motion check above ran in **both**
`prefers-color-scheme: light` and `dark` — 105 light + 105 dark matrix cells, 60 +
60 in Firefox, both themes in the zoom, keyboard and Brave passes. No check
passes in one theme and fails in the other. No third theme was introduced.

Specifically verified in dark mode: the header is opaque (`rgb(15,23,42)`, the
P0-02 regression test) in Chromium, Firefox and Brave; cards remain distinguishable
from the page; code blocks and table headers stay legible; focus rings remain
visible; SVG icon colours follow `currentColor`.

---

## 9. Browsers

Reported separately. Nothing is merged into a generic "cross-browser passed".

### Chromium — Chrome 153.0.8010.53

Automated, **210 cells**. Results in §3. All gate criteria pass.

### Firefox / Gecko — 155.0 (Playwright build)

Neither Firefox nor Playwright was present. Following your decision, **Playwright
was added as a repo `devDependency`** and its Firefox build downloaded with
`npx playwright install firefox` (into the user-level browser cache, not the
repo). `playwright@1.63.0` declares **no install scripts**, so CI's
`pnpm install --frozen-lockfile` gains about 2 MB and does not download browsers.
Both lockfiles were regenerated and `pnpm install --frozen-lockfile` was verified
to succeed, so the GitHub Pages workflow is unaffected.

**120 cells** — 15 routes × {1440×900, 1024×768, 768×1024, 390×844} × {light, dark}.

| Check | Result |
|---|---|
| Evaluation errors | 0 |
| L1 horizontal overflow | **0 / 120** |
| Exactly one `<h1>` · heading skips · `<main>` = 1 | **0 failures** |
| Images without `width`/`height` | **0** |
| **Contrast failures, both themes** | **0** |
| **B1 — positional drift vs Chromium** | **0 of 120 cells** exceed 4 px header drift or 4 % height drift |
| B2 — logo SVG `<text>` metrics | renders; logo box 240×44; "Lab" run 56×38 in Gecko vs 54×36 in Blink — a 2 px difference, inside the 4 px tolerance |
| B3 — `backdrop-filter` | supported; header is opaque in both themes, so the P0-02 fix does not depend on it |
| B4 — `:focus-visible` | supported; **0 of 12** sampled stops lack a ring (8 use the 2 px token outline, 4 use a box-shadow ring on `<select>`) |
| B5 — nav toggle | reached in 3 tabs, ring visible, `Enter` opens (panel 401 px, focus moves inside), `Escape` closes and returns focus to the trigger |
| B8 — grid/flex `gap` | identical to Chromium in the sampled containers |
| Console | the same single Pagefind failure; no Gecko-only errors |

One genuine Gecko difference surfaced in the harness itself: `document.body` was
momentarily null on `/projects/`, where Blink's was not, and
`document.createTreeWalker` threw. That is a driver robustness issue, not a site
defect, and the driver now guards it.

**Gecko baseline passes.**

### Brave — 153.1.95.104, with Shields

`navigator.brave.isBrave()` confirmed true, so this is Brave's build, not Chrome
with a different name. **120 cells** (15 routes × {1440×900, 390×844} × 2 themes),
run twice: once normally, once with the hosts Shields blocks cut off at the
network layer (`cloudflareinsights.com`, `/cdn-cgi/scripts/*`,
`email-decode.min.js`, analytics, `badge.dimensions.ai`).

| Check | Result |
|---|---|
| Horizontal overflow, unblocked / blocked | **0 / 0** |
| Page scale | `devicePixelRatio` 1 — no cached-zoom or scale artefact |
| Navbar, hero, grids, cards, detail pages, course tables | render as in Chrome; captures in `screenshots/phase-7/brave/` |
| Dark theme | header opaque, cards distinguishable |
| SVGs | render; no fingerprint-protection breakage |
| `backdrop-filter` | supported, 21 elements — Phase 8 item 8.3, not a Brave defect |
| Animations | 0 infinite |
| Cells whose content changed when blocking was on | 8, and in every case the change is **more** images loaded in the second pass (lazy-loaded partner logos) plus the 2-character wordmark caret. Nothing was lost |
| Obfuscated e-mail | 80 `mailto:` links present and unobfuscated; **0** `/cdn-cgi/l/email-protection` artefacts |

**Honest limit:** the Cloudflare Insights beacon and `email-decode.min.js` are
injected **at the edge** and exist only on the production deploy. They cannot be
reproduced against a local Hugo server. What is proven is that no layout or
content depends on those hosts. The production-only confirmation is listed in §11.

### Safari / WebKit

Not available on Windows. Not tested. Not claimed.

---

## 10. Regression checks against Phases 1–6

Re-verified after every fix:

| Area | Result |
|---|---|
| Homepage | 6,905 px @1440 (budget 7,000); 1 `<h1>`; 0 infinite animations; both hero CTAs present |
| Navbar | 8 items on one line at 1024 px; active state; mobile menu keyboard-operable in both themes |
| `/research/`, `/research/funding/` | render; grants list intact; `type: grant` templates unaffected |
| `/projects/`, `/projects/ctadmin/` | portfolio and detail intact |
| `/publication/`, detail pages | 61 rows in the DOM; filters intact; DOI/URL/PDF actions still render (52/8/1); KaTeX titles clean |
| `/authors/`, `/authors/me/` | one `<h1>`; related publications and projects intact |
| `/teaching/`, course and archive pages | overview groups, TOC, wide tables |
| `/resources/`, blog posts | groups render only when populated |
| `/news/`, news detail | feed and article |
| Redirects / aliases | 62/62 pass; 15/15 legacy routes redirect |
| Light / dark | every check run in both |
| Desktop / mobile | 7 viewports |
| Production build | passes, no new warnings |

Phase 6's breadcrumbs, reading measure, figure handling, chapter prev/next and
sidebar behaviour are unchanged. Phase 6.1's rule that course tables may be wider
than prose and scroll inside their own container is preserved — the fix in D1
changed colours, not widths.

---

## 11. Outstanding manual verification

Nothing below was run. None of it is claimed as passed.

### 11.1 NVDA screen-reader smoke test — **MANUAL VERIFICATION REQUIRED**

NVDA is not installed, and a screen reader cannot be driven or its speech heard
from this session. Installing it would not change that. Everything statically
checkable was automated instead (§5: landmarks, heading outline, accessible names
from the real accessibility tree, ARIA state, table semantics, `lang`, decorative
icons hidden) — but **that is not a screen-reader test.**

Procedure, ~20 minutes:

1. Install NVDA (nvaccess.org). Start it. `Insert+N` opens the menu.
2. Open `/` in Firefox or Chrome.
3. **Landmarks** — `D` cycles landmarks. Expect: banner → navigation "Primary" →
   main → contentinfo → navigation "Footer". Each should be announced once.
4. **Headings** — `H` cycles headings; `Insert+F7` opens the elements list.
   Expect exactly one level-1 and no jump from 1 to 3.
5. **Skip link** — `Insert+Space` for focus mode, then `Tab` from the top. The
   first stop must announce "Skip to main content, link". `Enter` should land you
   in main.
6. **Navigation** — `Tab` through the header. Every item should announce its own
   text. At 390 px (or a narrow window) the toggle should announce
   "Open menu, button, collapsed", and "expanded" after `Enter`.
7. **Links** — `K` cycles links. Listen for anything announced as just "link",
   "click here" or a URL. Expect none.
8. **Buttons and icons** — on `/publication/`, `B` cycles buttons: "Cite",
   "BibTeX", "DOI", "URL". On `/authors/me/` the icon rail should announce
   "Linkedin", "Google Scholar", "Orcid" — not "brands slash linkedin".
9. **Images** — `G` cycles graphics. Partner logos should announce their
   institution; decorative icons should not be announced at all.
10. **Breadcrumbs** — on `/teaching/jul2025_eee303/`, the breadcrumb should
    announce as a navigation landmark with a list, and the current page should
    not be a link.
11. **Tables** — on the same page, `T` then `Ctrl+Alt+arrows` to move by cell.
    Row and column headers should be announced as you move.
12. **Search** — open the search modal. The input must announce a label, not just
    "edit". (Note: Pagefind 404s, so it will return nothing — that is item 2.15,
    not an NVDA defect.)

Record anything announced as "clickable", "unlabelled", "graphic" with no name,
or a heading level out of order.

### 11.2 Production redirect verification — carried forward from Phases 4 and 5

Still outstanding, and Phase 7 could not close it: GitHub Pages behaviour cannot
be proven locally. After the first deploy from this branch, check (allowing for a
Cloudflare purge):

```
https://www.sajid.bd/projects/g-01/      → /research/funding/g-01/
https://www.sajid.bd/outreach/           → /resources/
https://www.sajid.bd/outreach/lor/       → /resources/academic/lor/
https://www.sajid.bd/outreach/graphics/  → /resources/templates/graphics/
https://www.sajid.bd/people/             → /authors/
```

### 11.3 Brave with Shields, in production

Local Brave testing (§9) proves the layout does not depend on the blocked hosts.
It cannot exercise the Cloudflare beacon or `email-decode.min.js`, which are
injected at the edge. After deploy, open the site in Brave with Shields **on**
and confirm: no visible breakage, the shields panel shows the beacon blocked, and
any obfuscated e-mail address still renders.

### 11.4 Missing files (author)

The four 2020 EEE 303 lecture PDFs and the six BRACU workshop reference files
(§7). Until they exist those ten links 404.

### 11.5 `/news/2024-02-17-call-for-research/`

Confirm whether RISE-Metalens is grant `g-03` (§4, D11).

---

## 12. Deliberately not done

- **No new layouts, components, navigation, animations or content sections.**
- **Pagefind** left exactly as found (roadmap 2.15 is the author's decision). It
  is the only console error on the site and the only thing holding Lighthouse
  Best Practices at 96.
- **`backdrop-filter`** — 21 elements per page, against a budget of 2. Roadmap
  item **8.3**, and confirmed supported in all three engines, so it is a
  performance item rather than a correctness one.
- **Animation durations over 400 ms** — the hero SVG pulses run 1.4–1.8 s. They
  are bounded (3 iterations), suppressed under reduced motion, and duration is
  roadmap item **8.1**.
- **The logo's dependence on Arial** — measured in all three engines
  (`Arial-BoldMT, Arial, sans-serif`). Converting the wordmark to outlines is
  roadmap item 2.16 / §3.1 and is a brand-asset change, not a Phase 7 fix.
- **`/bn/` anything** — roadmap item 8.9.
- **The `/news/` single-column card grid at 1440 px** — the shared collection
  block's own behaviour; no criterion fails. Phase 8 if it is to change.
- **The Dimensions badge** — see D7; folded into item 8.12.
- **12 text links at 19–21 px** — inline-exempt under WCAG 2.5.5/2.5.8; a 24 px
  floor for them is a reasonable Phase 8 polish item.

---

## 13. Files changed

### Source — CSS (3)

```
assets/css/phase7.css                   NEW — focus ring restoration, touch targets,
                                        bounded caret animation
assets/css/tokens.css                   --color-primary-600 -> #0e7490, 700 -> #155e75
assets/css/phase6.css                   table header/row-header colour + background
                                        always set together
```

### Source — project-owned templates (8)

```
layouts/baseof.html                                   duplicate id="main" removed
layouts/notes/list.html                               nested <main> -> <div>
layouts/publication/single.html                       skip-link target onto the real <main>
layouts/grant/single.html                             same
layouts/publication/list.html                         filter <summary> aria-label removed
layouts/_partials/views/citation.html                 Dimensions badge block removed
layouts/_partials/views/card-noimage.html             dark metadata contrast, "Read more" context
layouts/_partials/custom/logo.html                    logo <text> marked aria-hidden
layouts/_partials/qpacer.html                         role="link" + aria-label on 7 SVG links,
                                                      <title> on the research map
layouts/_partials/site_footer.html                    footer <nav> labelled, icon names,
                                                      HugoBlox link underlined
layouts/_partials/hbx/blocks/team-showcase-admin/block.html   readable icon names
layouts/_partials/functions/svg_dimensions.html       NEW — intrinsic size from an SVG viewBox
layouts/_partials/site_head.html                      phase7.css added to the bundle
```

### Source — new `_vendor` shadows (4)

Each is a verbatim copy of the upstream file with a commented, minimal change.
Recorded in the roadmap's override register.

| Shadow | Upstream | Why |
|---|---|---|
| `layouts/_partials/components/search-modal.html` | `_vendor/…/blox/layouts/_partials/components/search-modal.html` | The search input had no label, no `aria-label` and no `<label for>` on all 626 routes (X10); decorative SVGs were exposed to AT; `type="text"` on a search field |
| `layouts/_partials/hbx/blocks/logos/block.html` | `_vendor/…/blox/blox/logos/block.html` | `width`/`height` were guarded behind `{{ if not $isSVG }}`, so all four partner logos shipped without dimensions (M4) |
| `layouts/_partials/hbx/blocks/contact-info/block.html` | `_vendor/…/blox/blox/contact-info/block.html` | Three icon-only social links with no accessible name |
| `layouts/_partials/views/card.html` | `_vendor/…/blox/layouts/_partials/views/card.html` | The image-placeholder link was unnamed and a redundant tab stop (10 on `/news/`); plus the same dark metadata contrast and "Read more" context as `card-noimage.html` |

### Content (17)

```
content/authors/_index.md                       heading anchor -> #team-intro
content/news/2024-02-17-call-for-research.md    dead /research/RISE-Metalens link
content/news/*.md                       (8)     generic "Click here to read more"
content/authors/me/_index.md                    generic "[Click here](cv.pdf)"
content/resources/blog/20250407-Microsoft-Teams-BulkAdd/index.md   generic "[here]"
content/teaching/Jul2025_EEE303.md              generic "[click here]"
content/teaching/Archive/{J2020,Jan2024,Jul2021,Jul2022}_EEE303.md  same
```

### Dependencies (3)

```
package.json        + playwright ^1.63.0 (devDependencies)
pnpm-lock.yaml      regenerated; `pnpm install --frozen-lockfile` verified
package-lock.json   regenerated
```

### Evidence and documentation (11)

```
docs/redesign/evidence/phase7-cdp.mjs           shared CDP helper, path-independent
docs/redesign/evidence/phase7-matrix.mjs        7 x 2 x 15 responsive matrix
docs/redesign/evidence/phase7-a11y.mjs          zoom, reduced motion, semantics
docs/redesign/evidence/phase7-keyboard.mjs      tab order, traps, mobile menu
docs/redesign/evidence/phase7-touch.mjs         touch targets, inline classification
docs/redesign/evidence/phase7-axtree.mjs        accessible names from the AX tree
docs/redesign/evidence/phase7-links.mjs         static link + alias crawl
docs/redesign/evidence/phase7-firefox.mjs       Gecko, via Playwright
docs/redesign/evidence/phase7-brave.mjs         Brave + simulated Shields blocking
docs/redesign/evidence/phase7-lighthouse.mjs    Lighthouse on 5 routes
docs/redesign/evidence/phase7-report.mjs        matrix rollup
docs/redesign/evidence/phase7-ff-report.mjs     Firefox rollup + Chromium diff
docs/redesign/phase-7-validation.md             this document
docs/redesign/README.md                         status table
docs/redesign/implementation-roadmap.md         Phase 7 record + override register
```

The Phase 6 driver could not be re-run: it hardcodes `D:\Sajid\…` paths from a
different machine. All Phase 7 drivers resolve paths from their own location and
take the browser, port and base URL from the environment.

---

## 14. Exit criteria

| Roadmap requirement | Status |
|---|---|
| Responsive matrix inspected (7 × 2 × 12+) | ✅ 210 cells, 15 routes, captured and inspected |
| Chromium baseline passes | ✅ |
| Firefox / Gecko baseline passes | ✅ Firefox 155, 120 cells, 0 drift vs Chromium |
| Light and dark themes pass | ✅ every check run in both |
| Keyboard traversal passes | ✅ 597/597 stops ringed, 0 traps, 0 order inversions |
| Contrast audit — **zero failures** | ✅ 0 in Chromium, 0 in Firefox, Lighthouse `color-contrast` passes |
| Reduced motion passes | ✅ 0 infinite animations, no content hidden |
| 200 % / 400 % zoom usable | ✅ 0 horizontal scrolling in 32 cells; zoom not disabled |
| Mobile touch targets | ✅ every control ≥ 44 × 44 at coarse pointer; residue is inline-exempt text links |
| Brave + Shields checked | ✅ engine + blocking simulated; production edge injections → §11.3 |
| NVDA smoke test | ⬜ **outstanding manual validation** (§11.1) |
| Lighthouse a11y + best practices on 5 routes | ✅ a11y 100 ×5; best practices 96 ×5 (Pagefind 404) |
| No document-level horizontal overflow | ✅ 0 / 210 Chromium, 0 / 120 Firefox, 0 / 120 Brave |
| No regressions to Phases 1–6 | ✅ §10 |
| Evidence complete | ✅ this document + `phase7-*.json` |

**Phase 7 is PASS WITH MANUAL CHECKS REMAINING.** Every automatable criterion
passes. The NVDA smoke test is genuinely outside this environment's reach and is
recorded as outstanding rather than assumed; the production redirect and Brave
edge-injection checks were already carried forward from Phases 4–5 and remain so.

The checkpoint tag `redesign-phase-7` should **not** be created until §11.1 has
been performed.
