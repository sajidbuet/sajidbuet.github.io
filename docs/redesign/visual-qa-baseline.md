# SAJID.BD — Visual QA Baseline

The acceptance criteria every implementation phase must satisfy before its checkpoint tag.

**Principle:** a green build is not QA. A generated screenshot is not an inspected screenshot. An element
present in the DOM is not an element that renders correctly. Where source reasoning and rendered evidence
disagree, **the rendered evidence wins** — and the source is re-read to find out why.

---

## 1. Test matrix

### Viewports (mandatory)

| Label | Size | Notes |
|---|---|---|
| Desktop XL | 1920 × 1080 | |
| Desktop | 1440 × 900 | **Primary reference** |
| Laptop | 1280 × 800 | |
| Small laptop | 1024 × 768 | Nav breakpoint boundary — highest risk |
| Tablet | 768 × 1024 | touch emulation on |
| Phone L | 430 × 932 | touch emulation on |
| Phone | 390 × 844 | touch emulation on |

### Themes
`light` **and** `dark`, via `prefers-color-scheme` emulation (site is `theme.mode: system`).
**Dark mode is not optional coverage** — the worst defect found in Phase 1 (P0-02) was dark-only.

### Routes (minimum 12)

```
/                                   home (landing)
/research/                          section landing
/research/photonics/                research area
/publication/                       long filtered list
/publication/j-029/                 publication detail
/projects/                          project list          (from Phase 4)
/projects/<slug>/                   project detail        (from Phase 4)
/teaching/                          section landing
/teaching/<course>/                 course detail
/authors/ and /authors/me/          team list + profile
/news/ and /news/<item>/            archive + article
/resources/ and /resources/blog/<post>/                   (from Phase 5)
```

### Browsers

| Engine | Requirement |
|---|---|
| **Chromium** (Chrome/Edge) | Automated, every phase |
| **Firefox** (Gecko) | **Required from Phase 7.** Not installed today — needs a manual pass or an approved Playwright install |
| **Brave** | **Manual pass required** with Shields **on** — Chromium engine, but different network and fingerprinting behaviour |
| Safari/WebKit | Best-effort; not available on the build machine |

---

## 2. Layout

| # | Criterion | How to verify |
|---|---|---|
| L1 | **No unintended horizontal scrolling** at any matrix viewport | `document.documentElement.scrollWidth <= innerWidth + 1` |
| L2 | No clipped controls — every interactive element fully within its container | Rect containment check + visual inspection |
| L3 | No overlapping content | Visual inspection at every viewport |
| L4 | Grids reflow predictably: 3-up `lg` → 2-up `md` → 1-up below | Column-count check per breakpoint |
| L5 | Mobile reflow correct at 390 px — no two-column text, no fixed widths | Visual |
| L6 | **Content is not lost at 1024 px** (the nav breakpoint boundary) | Visual + nav link count |
| L7 | Sticky header does not obscure anchor targets | Scroll to each `#id`, confirm heading visible |
| L8 | Footer sits at the bottom on short pages, no floating gap | Visual on `/downloads/` or any short route |
| L9 | Section spacing follows the scale (48/72/96) — no ad-hoc values | Computed `padding-top`/`bottom` |
| L10 | Page heights within budget: home ≤ 7,000 px @1440 | `scrollHeight` |

**Baseline (Phase 1):** L1 ✅ already passes at every viewport **and at 200 % zoom** — do not regress it.

---

## 3. Typography

| # | Criterion | Threshold |
|---|---|---|
| T1 | Body measure 65–75 characters per line | `width / (fontSize × 0.5)` — **currently 96, must improve** |
| T2 | No clipped or truncated headings; long titles wrap, never overflow | Test with the longest real publication title |
| T3 | No orphaned single-word columns in card grids | Visual |
| T4 | Exactly **one `<h1>` per route** | `document.querySelectorAll('h1').length === 1` |
| T5 | No heading-level skips | Sequential level walk |
| T6 | Body ≥ 16 px; no interactive text below 14 px | Computed `fontSize` |
| T7 | Line-height ≥ 1.5 for body prose | Computed |
| T8 | Type scale values only — no arbitrary sizes | Computed sizes ∈ scale |
| T9 | No raw LaTeX/markup in `<title>`, `<h1>`, or listings | Regex `\$.*\$` over titles |
| T10 | Weights limited to 400/600/700 | Computed |

**Baseline:** T4 fails on `/`, `/authors/`, `/people/`, `/outreach/` (0 `h1`) and
`/teaching/jul2025_eee303/` (4 `h1`). T5 ✅ passes. T1 fails at ~96 cpl. T9 fails on `/publication/`.

---

## 4. Navigation

| # | Criterion |
|---|---|
| N1 | **Fully keyboard accessible at every viewport** — including the mobile menu toggle |
| N2 | Focus visible on every nav item, in both themes, meeting 3 : 1 against its background |
| N3 | Active state renders on the current section |
| N4 | Mobile menu: `aria-expanded` updates, `aria-controls` points at the panel, `Esc` closes, focus moves in and returns to the trigger |
| N5 | No mobile menu overflow; panel scrolls if taller than the viewport |
| N6 | Nav does not wrap to two lines at any viewport ≥ 1024 px |
| N7 | Logo links home and has a real accessible name (**not CSS text**) |
| N8 | Contact CTA visually distinct and styled on **both** desktop and mobile |
| N9 | Skip link present, first in tab order, visible on focus |
| N10 | Breadcrumbs on depth ≥ 2 routes |
| N11 | Touch targets ≥ 44 px in the mobile menu |

**Baseline:** N1 **fails** (P0-01), N2 fails in dark mode (P0-02), N3 fails (never fires), N4 fails,
N7 fails (P1-03), N9 fails (no skip link), N10 fails (partial unused). N5, N6, N11 ✅ pass.

---

## 5. Media

| # | Criterion |
|---|---|
| M1 | Correct aspect ratios; no stretched or squashed images |
| M2 | No distorted logos — partner logos height-normalised optically |
| M3 | Responsive `srcset`/`sizes` on content images |
| M4 | `width`/`height` present on every `<img>` (no layout shift) |
| M5 | Below-fold images lazy; hero image eager |
| M6 | Alt text on every meaningful image; `alt=""` on decorative |
| M7 | No image wider than 2× its displayed CSS width |
| M8 | Logos and diagrams legible in **both** themes (invert or provide a dark variant) |
| M9 | `og:image` is a **raster** format (PNG/JPEG), absolute **https** URL, ≥ 1200 × 630 |

**Baseline:** M1, M2, M7 ✅ pass (`distorted: []`, `oversized: []`). M4 fails (6 of 7 images).
M9 fails (SVG, `http://`).

---

## 6. Motion

| # | Criterion |
|---|---|
| A1 | **Zero `animation-iteration-count: infinite`** on content or brand elements |
| A2 | All durations ≤ 400 ms |
| A3 | Animation limited to `transform` and `opacity` |
| A4 | Under `prefers-reduced-motion: reduce`, `document.getAnimations()` returns **no infinite animations** |
| A5 | **Under reduced motion, all content remains visible** — no element stuck at `opacity: 0` |
| A6 | Content visible with JavaScript disabled |
| A7 | Hover effects do not shift layout (no reflow on hover) |
| A8 | No scroll-jank: 60 fps scroll on the homepage |
| A9 | Wordmark transition plays once and settles; never left mid-character |

**Baseline:** A1 **fails** (14 infinite). A4 **fails** (3 hero mesh animations survive). A5 **fails**
(stats at `opacity: 0`). A9 fails (infinite loop).

> A5 is the subtle one and the reason it is listed separately from A4. A reveal that is disabled must
> leave content *shown*. Verify by loading with reduced motion **and** by loading with JS disabled.

---

## 7. Accessibility

| # | Criterion | Threshold |
|---|---|---|
| X1 | Text contrast | ≥ 4.5 : 1 (≥ 3 : 1 large) — **in both themes** |
| X2 | UI component / focus-ring contrast | ≥ 3 : 1 |
| X3 | Focus visible on every interactive element | designed token, not UA default |
| X4 | Full keyboard operability; no traps | manual tab traversal |
| X5 | Landmarks: `header`, `nav`, `main`, `footer` on **every** route | count = 1 each |
| X6 | Logical heading outline | see §3 |
| X7 | Touch targets ≥ 44 × 44 px | rect measurement |
| X8 | 200 % zoom: no horizontal scroll, no content loss | 640 CSS px |
| X9 | 400 % zoom: content reflows to a single column | 320 CSS px |
| X10 | All form controls labelled | `aria-label` / `<label for>` |
| X11 | Status conveyed by more than colour | visual |
| X12 | `lang` correct on `<html>`; `lang` on foreign-language passages | |
| X13 | No duplicate `id`, no positive `tabindex` | DOM scan |
| X14 | Link text meaningful out of context (no bare "Read more") | link-text scan |
| X15 | `target="_blank"` carries `rel="noopener"` | DOM scan |
| X16 | Screen-reader pass (NVDA): landmarks, headings, nav, forms | manual |

**Baseline:** X1 fails (12 light / 4 dark). X3 partial. X4 **fails** (mobile menu). X5 **fails**
(13 of 16 routes lack `main`; no skip link). X7 fails (39 targets < 24 px). X10 fails (search input).
X11 fails (status badges are colour-only). X14 fails (3). X15 fails (1).
X8 ✅ **passes**. X13 ✅ **passes**.

---

## 8. Cross-browser

| # | Criterion |
|---|---|
| B1 | Layout matches Chromium in Firefox — no > 4 px positional drift |
| B2 | Fonts render with equivalent metrics (logo must not depend on Arial being installed) |
| B3 | `backdrop-filter` / `filter: blur()` degrade acceptably where unsupported |
| B4 | `:focus-visible` renders a visible ring in Firefox |
| B5 | Nav toggle works in Firefox |
| B6 | **Brave with Shields on:** no broken layout or missing content when the Cloudflare beacon and `email-decode.min.js` are blocked |
| B7 | Brave fingerprint protection does not break `backdrop-filter` or canvas-dependent rendering |
| B8 | CSS Grid / Flex gap behave identically |

### Flagged for manual validation in Brave
1. Cloudflare Insights beacon and `email-decode.min.js` are injected **at the edge** and appear only in
   production. Brave Shields will block both — confirm no visible breakage, particularly of any
   obfuscated email address.
2. `backdrop-filter` on the header (19 instances per page) under Brave's fingerprint protection.
3. Dark-mode header rendering — the P0-02 regression, once fixed.

### Flagged for Firefox
1. `backdrop-filter` header (differs from Blink historically).
2. The nav toggle mechanism, whichever implementation replaces the checkbox hack.
3. SVG `<text>` metrics in the logo — **the reason §3.1 recommends converting the wordmark to outlines**.
4. `:focus-visible` ring rendering and `outline-offset`.

---

## 9. Performance

| # | Criterion | Threshold |
|---|---|---|
| P1 | Lighthouse Performance | ≥ 95 |
| P2 | Lighthouse Accessibility | ≥ 95 |
| P3 | Cumulative Layout Shift | < 0.1 |
| P4 | Largest Contentful Paint | < 2.5 s |
| P5 | DOM nodes per page | < 2,000 (currently 1,528 ✅) |
| P6 | `backdrop-filter` elements per page | ≤ 2 (currently **19**) |
| P7 | Zero console errors | (currently 1: Pagefind) |
| P8 | Zero failed network requests | (currently 1: `pagefind.js`) |
| P9 | No render-blocking third-party resources | |

---

## 10. Content & SEO regression guards

Changes here are silent and expensive. Check every phase that touches content or config.

| # | Criterion |
|---|---|
| S1 | Every previously-published URL resolves or **redirects** (verified against **production**, not locally) |
| S2 | `<title>` unique and descriptive on every route |
| S3 | `<meta name="description">` unique per section (no inherited site default) |
| S4 | `<link rel="canonical">` absolute, **https**, correct host |
| S5 | `og:*` and `twitter:*` complete, absolute, https, raster image |
| S6 | JSON-LD present and valid |
| S7 | `sitemap.xml` valid and complete |
| S8 | RSS feeds valid |
| S9 | `hreflang` alternates correct and reciprocal |
| S10 | `robots.txt` unchanged unless deliberate |
| S11 | **No duplicate target paths in the Hugo build log** |
| S12 | `baseURL` resolves to a real host |

**Baseline:** S3 fails (6 routes share the site description). S5 fails (http + SVG).
S11 **fails** (≈ 140 duplicate `/bn/` paths). S12 **fails** (`www.sajid.org.bd` is NXDOMAIN).
S4, S7, S8, S10 ✅ pass in production.

---

## 11. How to run the automated portion

The Phase-1 instruments in `evidence/` are reusable and dependency-free:

```powershell
# 1. Serve the site
hugo server --disableFastRender --port 1314

# 2. Capture + audit (uses installed Chrome; nothing is installed)
$env:CDP_BROWSER = "C:\Program Files\Google\Chrome\Application\chrome.exe"
node docs/redesign/evidence/capture-driver.mjs <job.json>
```

A job file is `{ "report": "<out.json>", "shots": [ { name, url, w, h, dpr, mobile, theme,
reducedMotion, file, fullPage, clip } ] }`. `evidence/audit-instrument.js` is injected into each page
and returns the measurements behind §2–§7. `.jpg` file extensions produce JPEG at q82; `.png` produces PNG.

**What automation cannot decide:** whether the result looks right. Every phase still requires a human (or
the agent) to open the captures and inspect them. Phase 1 produced three would-be findings that only
visual inspection plus source reading resolved correctly — see `visual-audit.md` §1.2.

---

## 12. Definition of done, per phase

A phase is complete when **all** hold:

1. Every criterion in the sections relevant to that phase passes, or is explicitly waived in writing.
2. Before/after screenshots captured at the full matrix **and inspected**.
3. No regression against any ✅ baseline item in this document.
4. Build produces no new warnings.
5. Checkpoint tag created.
6. Any new `_vendor` override recorded in the roadmap's override register.
