# SAJID.BD — Visual, Accessibility and Responsive Audit

**Phase:** 1 (audit only — no production code changed)
**Date:** 2026-09-21
**Auditor:** Claude Code session, rendered-browser evidence

---

> ## Status after Phase 2A (2026-09-21)
>
> Phase 2A shipped the visual/accessibility foundation. **Closed:** P0-01, P0-02, P1-03, P1-13, P1-14,
> P2-01, P2-06, P2-16, and the reduced-motion half of P1-05. **Partly closed:** P1-01 (active state now
> works; the menu IA change itself is deferred to Phase 2B), P2-02 (header controls only).
> Everything else stands. See `implementation-roadmap.md` § Phase 2A.
>
> ### Correction to a Phase 1 finding
>
> `information-architecture.md` §4.3 claimed the navbar dropdown trigger has no click or keyboard
> handler and a hardcoded `aria-expanded`. **That was wrong** — it was concluded from the template
> without checking the upstream script. `_vendor/.../blox/assets/js/hb-nav.js` binds click and
> Enter/Space/Escape handlers and updates `aria-expanded`. The corrected, smaller finding is recorded
> in that section.
>
> ### Two new defects found during Phase 2A (both fixed in 2A)
>
> - **The hero logo was redefining a global theme token.** `custom/logo-loader-loop.html` and
>   `logo-loader.html` declared `:root { --color-primary-600: #0c96c8; ... }` inside an inline SVG.
>   Inside an inline SVG, `:root` matches the **document** root, so the hero artwork was silently
>   overriding the site's primary colour on every page that renders it. Now scoped to the SVG.
> - **Desktop navbar wrapped at 1024 px**, growing the header from 64 px to 116 px. Brand width is now
>   stepped down at `lg`.

## 1. Method and coverage

### What was actually rendered

| Item | Value |
|---|---|
| Build | `hugo --gc` → success, 979 pages (603 EN / 376 BN), 13.3 s |
| Local server | `hugo server --disableFastRender --port 1314` |
| Rendering engine | Chrome 1xx headless (`--headless=new`), driven over CDP |
| Browsers present on machine | Chrome, Edge, **Brave** (all Chromium/Blink); **no Firefox installed** |
| Screenshots captured & inspected | 46 full-page + 87 region crops + 15 interaction captures |
| Routes covered | 19 distinct routes (see §1.3) |
| Viewports | 1920×1080, 1440×900, 1280×800, 1024×768, 768×1024, 430×932, 390×844 |
| Themes | light + dark (`prefers-color-scheme` emulation; site `theme.mode: system`) |
| Extra emulations | `prefers-reduced-motion: reduce`; 200 % zoom (640 CSS px); touch emulation |

### 1.1 Tooling note (read this)

The skills named in the brief — `frontend-design` and `frontend-visual-qa` — **are not installed in this
environment**, and no Playwright/Puppeteer install exists. Per the "do not install dependencies without
approval" rule, nothing was installed.

Equivalent capability was built instead, with zero new dependencies:

- A **dependency-free CDP driver** (`evidence/capture-driver.mjs`) using Node 23's built-in global
  `WebSocket` to drive the already-installed Chrome.
- An **in-page audit instrument** (`evidence/audit-instrument.js`) that measures, per route/viewport/theme:
  document overflow and the specific offending elements, heading outline and level skips, landmark counts,
  computed WCAG contrast ratios against the *effective* (alpha-resolved) background, touch-target
  geometry, running `getAnimations()` including infinite ones, `backdrop-filter`/`blur` element counts,
  paragraph measure (characters per line), nav geometry, image intrinsic-vs-displayed size, duplicate IDs,
  and head metadata.
- Real **`Input.dispatchKeyEvent` Tab traversal** and **`Input.dispatchMouseEvent`** hover, rather than
  programmatic `.focus()`/`:hover` assumptions.

Raw machine-readable output is in `evidence/`.

### 1.2 Two corrections this method caught

Recorded deliberately, because both would have been wrong findings:

1. **"Focus indicators are missing."** Programmatic `element.focus()` reported
   `outline-style: none`. Real `Tab` keypresses show `outline: auto 1px` with `:focus-visible` matching.
   Focus *is* visible; the real (smaller) finding is that it is the **unstyled UA default** — see P2-01.
2. **"The hero logo is clipped to `SAJID L` on mobile."** It is not clipped. `custom/logo-loader-loop.html`
   runs an infinite **typewriter animation** that retypes the suffix, alternating **`Lab` ⇄ `.BD`**.
   The screenshot caught it mid-word. The real finding is the looping animation itself — see P1-07.

A third would-be finding — "the stats band renders blank" — turned out to be a **scroll-reveal at
`opacity: 0`**, which *is* a genuine issue, but for a different reason than it first appeared (P1-05).

### 1.3 Routes inspected

`/` · `/research/` · `/research/photonics/` · `/publication/` · `/publication/j-029/` · `/authors/` ·
`/authors/me/` · `/teaching/` · `/teaching/jul2025_eee303/` · `/projects/` · `/news/` ·
`/news/2025-09-24-puja-defends/` · `/outreach/` · `/outreach/blog/` ·
`/outreach/blog/20260811-bracu-arm-workshop/` · `/outreach/templates/` · `/people/` · `/tags/` · `/bn/`

### 1.4 Local vs production

Production (`https://www.sajid.bd/`) was fetched and compared against the local build.

| Aspect | Local | Production | Note |
|---|---|---|---|
| `baseURL` | `https://www.sajid.org.bd/` (from config) | `https://www.sajid.bd/` | CI overrides via `actions/configure-pages` |
| canonical | localhost | `https://www.sajid.bd/` ✅ correct | |
| `og:url` / `og:image` | — | `http://www.sajid.bd/…` (**http**) | P2-05 |
| Pagefind search | 404 | **404** | P1-02 — broken in production too |
| Extra third-party JS | none | Cloudflare `email-decode.min.js` + `beacon.min.js` (Insights) | P2-08 |
| CSS | `main.css` 314 KB unminified | minified | dev-only difference |
| Hugo version | 0.158.0 (local) | 0.152.1 (CI + `hugoblox.yaml`) | P2-09 |

No Cloudflare or deployment configuration was changed.

---

## 2. Severity key

| Level | Meaning |
|---|---|
| **P0** | Blocks a user group outright, or breaks a core page function |
| **P1** | Major usability / credibility / correctness problem |
| **P2** | Moderate; degrades quality or maintainability |
| **P3** | Polish |

Findings marked **[DEFECT]** are objectively verifiable. Findings marked **[DESIGN]** are design judgement
and are open to disagreement.

---

## 3. P0 — Critical

### P0-01 [DEFECT] Mobile navigation cannot be opened by keyboard

| | |
|---|---|
| Route | all |
| Viewport | < 1024 px (`lg` breakpoint) |
| Browser | Chromium |
| Evidence | `detail/mobile-closed.jpg`, `detail/mobile-menu-open2.jpg`, `evidence/structure-probe.json` → `keyboardCanOpenMenu` |
| Source | `layouts/_partials/components/headers/navbar.html:27-41` (**project override**) |

The mobile menu is a CSS checkbox hack:

```html
<input id="nav-toggle" type="checkbox" class="hidden" />
<label for="nav-toggle" class="order-3 cursor-pointer flex items-center lg:hidden …">
```

Measured in the live DOM:

```json
{"inputTabIndex":0,"inputDisplay":"none","labelTabIndex":-1,
 "labelIsFocusable":false,"labelRole":null,"ariaExpanded":null}
```

`class="hidden"` resolves to `display: none`, which removes the checkbox from the focus order; `<label>`
is not focusable either. **There is therefore no keyboard path to the primary navigation on any
viewport below 1024 px.** Screen-reader users also get no `aria-expanded` / `aria-controls` state.

Mouse/touch operation works correctly (9 links, 48 px tall — good targets).

**Direction:** replace with a real `<button aria-expanded aria-controls="nav-menu">` plus a small
toggle script, or adopt `<details>`/popover semantics. Keep the existing 48 px link rhythm.

---

### P0-02 [DEFECT] Dark mode makes the entire header illegible

| | |
|---|---|
| Route | all |
| Viewport | all |
| Theme | **dark** |
| Evidence | `detail/dark-header-scrolled.jpg`, `detail/home-1440-dark-y0.jpg` |
| Source | `assets/css/custom.css:1-6` (**custom SAJID.BD CSS**) |

```css
#site-header.header {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(14px) saturate(180%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.18);
}
```

This is unconditional — there is no `.dark` variant. Measured in dark mode:

```json
{"bg":"rgba(255, 255, 255, 0.65)","navLinkColor":"rgb(248, 250, 252)"}
```

Near-white text (`#f8fafc`) on a 65 %-white translucent bar ⇒ **contrast ≈ 1.1 : 1** against a required
4.5 : 1. Every navigation label, the search icon and the theme toggle are effectively unreadable, and the
logo's navy strokes disappear into the light bar. The same white panel is used for the **open mobile
menu** in dark mode.

**Direction:** define the header surface as a semantic token with light and dark values
(`--surface-header` + `--surface-header-border`), not a hardcoded rgba.

---

### P0-03 [DEFECT] The homepage has no `<h1>`

| | |
|---|---|
| Route | `/` (also `/authors/`, `/people/`, `/outreach/`) |
| Evidence | `evidence/structure-probe.json` → `h1Scan` |
| Source | `layouts/_partials/hbx/blocks/hero-with-stats/block.html` (**custom block**) |

```json
{"p":"/","h1":0,"h1txt":[],"main":0,"firstH":"H3:No results found"}
```

`content/_index.md` sets `content.title: "SAJID Lab"` on the `hero-with-stats` block, but the template
**never renders `content.title`** — the hero outputs only the logo SVG inside an `<a>`. The document's
first heading is an `<h3>` belonging to the hidden search modal.

Four routes ship zero `<h1>`: `/`, `/authors/`, `/people/`, `/outreach/`.

**Direction:** render a real `<h1>` in the hero (visually hidden if the wordmark must carry the visual
role) and add `<h1>` to the three landing pages.

---

### P0-04 [DEFECT] Bengali content is built twice (duplicate output paths)

| | |
|---|---|
| Evidence | Hugo build warning, ~140 duplicate paths |
| Source | `config/_default/hugo.yaml:19-30` |

```yaml
languages:
  en: { contentDir: content }
  bn: { contentDir: content/bn }
```

`content/bn` is a **subdirectory of** the English `contentDir`, so every Bengali page is rendered twice —
once as an English-site page at `/bn/...` and once as the Bengali-language page at the same path:

```
WARN  Duplicate target paths: \bn\index.html (2), \bn\publication\j-001\index.html (2),
      \bn\research\photonics\index.html (2), … (≈140 paths)
```

Which of the two wins is not guaranteed, and it inflates the build (376 BN pages). This also risks
duplicate-content signals.

**Direction:** move Bengali content to a sibling directory (`content.bn/`) and point
`languages.bn.contentDir` at it. This is a **content move + one config line**, with no URL change —
verify `/bn/...` URLs are byte-identical before and after.

---

## 4. P1 — Major

### P1-01 [DESIGN] Navigation is a nine-item anchor list to one 12,728 px page

| | |
|---|---|
| Evidence | `detail/home-1440-light-y0.jpg`; `evidence/page-audit-chromium.json` → `nav.visibleLinks`, `layout.docHeight` |

Every primary nav item is an in-page anchor:

```
Home /#about · Research /#research · Funding /#projects · Team /#team · Publications /#publication
Teaching /#teaching · News /#news · Outreach /#outreach · Contact /#contact
```

Consequences measured:

- The homepage is **12,728 px tall** at 1440×900 — roughly 14 screens.
- Rich standalone pages exist (`/research/`, `/publication/`, `/teaching/`, `/authors/`, `/news/`,
  `/outreach/`) but **are not reachable from the primary navigation at all**.
- Nine equal-weight items leave no room for a Contact action and no room to grow (Projects, Books).
- Because `$active := eq $menuURL $pageURL` compares an anchor URL to a page URL
  (`navbar.html:54`), **no nav item is ever marked active** — verified: zero `.active` in the rendered DOM.

**Direction:** see `information-architecture.md`. This is the single highest-leverage change.

---

### P1-02 [DEFECT] Site search is present in the UI but non-functional, in production

| | |
|---|---|
| Route | all |
| Evidence | console error (local); `https://www.sajid.bd/pagefind/pagefind.js` → **404** |

```
Failed to initialize Pagefind: TypeError: Failed to fetch dynamically imported module: /pagefind/pagefind.js
```

`params.yaml` sets `header.search: true` (renders the magnifier button and the search modal) but
`search.enable: false`, and **`.github/workflows/publish.yaml` never runs Pagefind** — only the unused
`netlify.toml` does. GitHub Pages is the live deployment (CNAME `sajid.bd`), so the index is never built.

Two secondary effects: the always-present search modal contributes the **first heading on every page**
(`<h3>No results found`), and its input is the site's one unlabelled form control.

**Direction:** either add a Pagefind step to the Pages workflow, or set `header.search: false` until it
is wired up. Do not ship a control that does nothing.

---

### P1-03 [DEFECT] The brand link announces raw CSS to screen readers

| | |
|---|---|
| Route | all |
| Evidence | `evidence/interaction-probe.json` → `tabOrder[0]` |
| Source | `layouts/_partials/custom/logo.html:1-55` (**custom SAJID.BD asset**) |

First Tab stop on every page:

```json
{"tag":"A","cls":"navbar-brand …","txt":":root { --logo-navy: var(--hb-"}
```

The navbar logo is an inline SVG containing a `<style>` block. Its CSS text is part of the `<a>`'s
text content and therefore of its **accessible name**. The SVG also has **no `role="img"`, no `<title>`,
no `aria-label`**.

Two further problems in the same file:

- The `<style>` declares `:root { --logo-navy: … }`. Inside an inline SVG, `:root` matches the **document**
  root, so the logo leaks three custom properties into global scope on every page.
- `--hb-color-header-fg` — which `--logo-navy` is defined from — **is not defined anywhere**
  (measured: empty string). The navy fill resolves to an invalid value.

Note the *hero* logo (`logo-loader-loop.html`) does carry `role="img" aria-label="SAJID Lab loading logo"`,
so only the navbar copy is affected — but "loading logo" is a poor accessible name.

**Direction:** move the SVG's CSS to a class-based stylesheet or presentation attributes, add
`role="img"` + `aria-label="SAJID Lab — home"`, and define `--hb-color-header-fg`.

---

### P1-04 [DEFECT] The accent colour fails WCAG AA for normal text, system-wide

| | |
|---|---|
| Evidence | `evidence/page-audit-chromium.json` → `contrast.fails` (every route) |

`primary-600` = `rgb(12, 150, 200)`. Measured contrast:

| Usage | Pair | Ratio | Required |
|---|---|---|---|
| Body/UI links ("Explore Research", "View Details", "Cite", "URL", "DOI") | `#0c96c8` on white | **3.38 : 1** | 4.5 : 1 |
| Filled buttons ("Meet the Team", "View All Research Activities", "Email Dr. Sajid") | white on `#0c96c8` | **3.38 : 1** | 4.5 : 1 |
| Status badge "Emerging" | `#ca8a04` on white | **2.94 : 1** | 4.5 : 1 |
| Status badge "Active" | `#16a34a` on white | **3.30 : 1** | 4.5 : 1 |
| Dark-mode dates | `#71717a` on `#0f172a` | **3.69 : 1** | 4.5 : 1 |

12 distinct failing text/background pairs in light mode, 4 in dark. This is not one component — the
accent is the link colour and the button fill across the whole site, so it recurs on every page.

**Direction:** keep the cyan as the *brand* colour, but introduce a darker **interactive** token
(≥ 4.5 : 1 on the page background, ≥ 3 : 1 for the button fill carrying white text) and a lighter
dark-mode counterpart. Treated in `design-system-proposal.md`.

---

### P1-05 [DEFECT] Key content is `opacity: 0` until scrolled into view

| | |
|---|---|
| Route | `/` |
| Evidence | `evidence/interaction-probe.json` → `statsBeforeScroll` / `statsAfterScroll`; `detail/home-1440-light-y780.jpg` (blank band) vs `detail/home-1440-scrolled-900.jpg` (revealed) |

Before scroll, the wrapper of each stat card measures:

```
DIV.group relative bg-white dark:bg-gray-800 rounded-2… = opacity 0
```

After scrolling, `opacity: 1`. The four headline credibility figures — *50+ publications, 1,299+
citations, 7 MSc theses, 6 research domains* — are therefore **invisible in any non-scrolling context**:
print, PDF export, full-page capture, and any client where the reveal script does not run.

**Direction:** scroll-reveal should animate `transform`/`opacity` **from a visible base state**, or be
gated so the content is visible by default and only animated when the observer is available.

---

### P1-06 [DEFECT] The hero's configured secondary action is silently dropped

| | |
|---|---|
| Route | `/` |
| Evidence | `detail/home-1440-light-y0.jpg` (one button only) |
| Source | `layouts/_partials/hbx/blocks/hero-with-stats/block.html` (**custom block**) |

`content/_index.md` configures:

```yaml
secondary_action:
  text: View Publications
  url: '#publication'
  icon: hero/academic-cap
```

The template reads only `primary_action` — there is no `secondary_action` code path. It also ignores
`content.title` (see P0-03) and `content.announcement`. The author has configured content that never
appears and gets no warning.

---

### P1-07 [DESIGN] The wordmark never settles — an infinite typewriter loop

| | |
|---|---|
| Route | `/` |
| Evidence | `detail/home-1440-light-y0.jpg` (mid-state `SAJID .|`), `detail/mobile-menu-open2.jpg` (`SAJID .BD`) |
| Source | `layouts/_partials/custom/logo-loader-loop.html:227-247` |

The hero logo continuously retypes its suffix, alternating **`Lab`** and **`.BD`** with a blinking
cursor, forever. Plus three further infinite SVG animations (`pulseS` 1.8 s, `wifiPulse` 1.6 s,
`jNodePulse` 1.4 s).

The concept — one identity with two names — is genuinely good and worth keeping. The *execution* has
costs: the brand name is never stable, a visitor arriving mid-cycle sees a half-typed word, and any
screenshot, print or social capture catches an incomplete wordmark. For a "precise, mature, scholarly"
identity, a wordmark that types itself on a loop reads as restless.

To its credit, this partial **does honour `prefers-reduced-motion`** (`:30-37`, and a JS check at `:247`).

**Direction:** play the transition **once** on first load, then settle on `SAJID Lab`; or make `.BD`/`Lab`
a deliberate, slow crossfade with a long dwell. Never leave it mid-character.

---

### P1-08 [DEFECT] `/projects/` is the funding archive but is titled "Projects"

| | |
|---|---|
| Route | `/projects/` |
| Evidence | `detail/funding-1440-light-y0.jpg` |
| Source | `content/projects/g-01..g-03/index.md` |

The page renders `<h1>Projects</h1>` above three **research grants** (G01–G03), formatted as
bibliographic citations. Meanwhile the navbar labels the same content **"Funding"** and points at the
homepage anchor `/#projects`, where it is titled **"Research Grants"** and uses a proper `grant` view.

So one body of content has three names (*Projects* / *Funding* / *Research Grants*) and two very
different presentations. This is the exact collision the redesign brief anticipates, and it currently
occupies the `projects` namespace that the new portfolio needs.

Additionally: all three grants carry `date: '2008-01-01'` — a placeholder — so the list renders
"(2008)" for grants whose real `start_date`/`end_date` are 2021–2022. Sorting by date is therefore wrong.

**Direction:** see `information-architecture.md` §6–§7.

---

### P1-09 [DEFECT] Raw LaTeX leaks into titles, headings and `<title>`

| | |
|---|---|
| Route | `/publication/j-029/`, `/publication/` |
| Evidence | `detail/publications-1440-light-y0.jpg` |

`content.math.enable: false` in `params.yaml`, but publication titles contain TeX:

```
Steane $[[7,1,3]]$ outer coding for loss-tolerant one-way quantum repeaters
```

This renders verbatim in the listing, in the `<h1>`, and in the browser `<title>` / `og:title`.

**Direction:** enable math rendering for publication titles, or store a plain-text title variant.

---

### P1-10 [DEFECT] Duplicate publication entries

| | |
|---|---|
| Route | `/publication/` |
| Evidence | `detail/publications-1440-light-y0.jpg` |

`[X04]` and `[X03]` are identical records — same authors, same year, same title
("HBT Perovskite/CdS Solar Cell Reaching Efficiency Over 35% Using Periodic Triangular Gratings").

Separately, `Andrea Alu` and `Andrea Alù` both appear in publication front matter; with
`removePathAccents: true` both slug to `andrea-alu`, producing the build warning
`Duplicate target paths: \authors\andrea-alu\index.html (2)`.

---

### P1-11 [DEFECT] `/authors/` and `/people/` are the same page at two URLs

| | |
|---|---|
| Evidence | `evidence/structure-probe.json` → `h1Scan`; `detail/team-1440-light-y0.jpg`, `detail/people-1440-light-y0.jpg` |

Both render `<title>Our Team | SAJID Lab</title>` with near-identical bodies (3,603 px vs 3,559 px tall)
and **neither has an `<h1>`**. The homepage Team CTA points at `/authors`. Duplicate content, split
inbound-link value, and an ambiguous canonical target.

---

### P1-12 [DEFECT] `/outreach/` duplicates the homepage `#outreach` block verbatim

| | |
|---|---|
| Evidence | `content/outreach/_index.md` vs `content/_index.md` (last block) |

The two files contain the **same `sajid-general-links-blog` block with the same content**, copy-pasted.
Any edit must be made twice or the two drift apart. `/outreach/` also has no `<h1>`.

---

### P1-13 [DEFECT] `<main>` landmark missing on 13 of 16 routes

| | |
|---|---|
| Evidence | `evidence/structure-probe.json` → `h1Scan[].main` |

Only `/publication/j-029/`, `/teaching/jul2025_eee303/` and `/news/…` emit `<main>`. Every
`type: landing` page (the homepage, all research areas, `/publication/`, `/teaching/`, `/authors/`,
`/news/`, `/outreach/`, `/projects/`) has `header` + `footer` but **no main landmark**, so
"skip to main content" and screen-reader landmark navigation have no target.

There is also **no skip link** anywhere on the site.

---

### P1-14 [DEFECT] Hero decorative animation ignores `prefers-reduced-motion`

| | |
|---|---|
| Evidence | `evidence/page-audit-chromium.json` → compare `home-1440x900-light` (`runningAnimations: 14`) with `home-reduced-motion` (`runningAnimations: 3`) |

Under `prefers-reduced-motion: reduce`, 11 of 14 infinite animations correctly stop. The **three that
keep running** are the hero gradient-mesh layers:

```json
{"target":"div.absolute.left-0.right-0.h-64","dur":2000,"iter":"inf","name":"pulse"}
```

configured by `design.background.gradient_mesh.animation: "pulse"` in `content/_index.md`.

---

## 5. P2 — Moderate

### P2-01 [DESIGN] Focus rings are the browser default, not a design token
Real Tab traversal gives `outline: auto 1px rgb(16,16,16)`, `outline-offset: 1px`, no box-shadow, on every
nav link and the brand. It is visible and `:focus-visible` matches correctly — so this is not an
accessibility failure — but it is undesigned, thin, and its contrast against the dark-mode header is
untested (and moot while P0-02 stands). Some components *do* define a proper ring (the hero button has
`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`) — the system
is simply inconsistent.

### P2-02 [DEFECT] 39 interactive targets below 24 × 24 px
Measured on `/`: 39 links/buttons under 24 px in either dimension, including the header **search toggle
(40 × 16)** and **theme toggle (24 × 18)**, and the publication row actions `URL` / `CITE` / `DOI`
(≈ 102 × 20). WCAG 2.2 SC 2.5.8 (Target Size, Minimum) requires 24 × 24 px. The mobile nav links, by
contrast, are a well-judged 48 px.

### P2-03 [DESIGN] Measure runs to ~96 characters per line
Measured paragraph widths on `/`: 768 px at 16 px ⇒ **≈ 96 characters per line** in the research and
outreach sections; the hero sits at ≈ 78. Comfortable academic reading measure is 60–75. Card body text
(352 px ⇒ ≈ 44 cpl) is at the other extreme.

### P2-04 [DESIGN] Section rhythm is uniform and very loose
Section padding on `/` is `96 / 96` px for most blocks, `80`, `64` and `48` for others — four values with
no system, and no relationship to content density. Combined with `design.spacing: '6rem'`, the page
reaches 12,728 px. The hero alone is 709 px for one paragraph and one button, with ~200 px of dead space
below the CTA (`detail/home-1440-light-y0.jpg`).

### P2-05 [DEFECT] Production Open Graph tags are wrong in three ways
From `https://www.sajid.bd/`:

```html
<meta property="og:url"   content="http://www.sajid.bd/">
<meta property="og:image" content="http://www.sajid.bd/media/logo.svg">
<meta property="og:locale" content="en-us">
<meta property="twitter:card" content="summary">
```

1. `og:url` / `og:image` use **`http://`** while `<link rel=canonical>` correctly uses `https://` — mixed signalling.
2. `og:image` is an **SVG**. Facebook, LinkedIn and X do not render SVG Open Graph images; the site has no social preview.
3. `og:locale` should be `en_US`, not `en-us`.

### P2-06 [DEFECT] `baseURL` in config points at a domain that does not exist
`config/_default/hugo.yaml` sets `baseURL: 'https://www.sajid.org.bd/'`. That host **does not resolve**
(`NXDOMAIN`, verified). Production is saved only because
`.github/workflows/publish.yaml:84` overrides it with `--baseURL "${{ steps.pages.outputs.base_url }}/"`.

Any build that does *not* override — a local `hugo`, the `pnpm build` script (`hugo --minify`), or a
Netlify build with `$URL` unset — emits canonical, hreflang, sitemap, RSS and OG URLs pointing at a dead
domain. This is a live landmine, not a current outage.

### P2-07 [DEFECT] Meta descriptions are generic on most section pages
`/research/`, `/publication/`, `/teaching/`, `/projects/`, `/news/`, `/outreach/` all inherit the same
site description ("Smart and Advanced Junctions of Intelligent Devices…"). `/authors/me/` has the
generic `<title>SAJID Lab</title>` with no person name — the PI's own profile page is the worst-titled
page on the site.

### P2-08 [DEFECT] Production loads two Cloudflare third-party scripts
`/cdn-cgi/scripts/…/email-decode.min.js` (email obfuscation) and
`static.cloudflareinsights.com/beacon.min.js` (analytics beacon). Neither is in the repo; both are
Cloudflare-injected. Worth a conscious decision given `privacy.enable: false` and all analytics IDs empty
— the site is currently collecting Cloudflare analytics without a stated policy.

### P2-09 [DEFECT] Hugo version drift and deprecation warnings
`hugoblox.yaml` / CI pin **0.152.1**; the local toolchain is **0.158.0**. Building locally emits ~110×:

```
deprecated: .Site.LanguageCode was deprecated in Hugo v0.158.0 … Use .Site.Language.Locale instead.
```

The call sites are in the **vendored upstream** `_vendor/github.com/HugoBlox/kit/modules/blox`, so this
is not fixable at project level — it is an upgrade blocker to record, not a bug to patch.

### P2-10 [DEFECT] Per-page `<style>` blocks inside Markdown content
`content/teaching/Jul2025_EEE303.md` embeds a `<style>` block that sets a **global** `:root { --brand: #ac1f24 }`
plus table-striping rules. The same file contains broken markup:

```html
<span style="color:red">For latest announcements … </style>'
```

— a `<span>` closed with `</style>` and a stray apostrophe. One-off page CSS with a hardcoded second
brand colour is precisely the maintenance pattern the redesign should eliminate.

### P2-11 [DESIGN] Research cards use six unrelated decorative gradients
`content/_index.md` assigns each research area its own gradient: `from-indigo-400 to-purple-600`,
`from-blue-400 to-cyan-600`, `from-green-400 to-emerald-600`, `from-purple-400 to-pink-600`,
`from-yellow-400 to-orange-600`, `from-amber-400 to-red-500`. Six saturated two-stop gradients with no
relationship to the brand cyan — the strongest "generic AI landing page" signal on the site
(`detail/dark-header-scrolled.jpg`). The `status` badges (Emerging / Active / Past / Planning) are a
genuinely good idea carried on low-contrast colour alone.

### P2-12 [DEFECT] `/publication/` renders 62 publications on one 8,469 px page
No pagination. The filter toolbar (Tag / Type / Year / "62 shown" / Clear) is good and should be kept,
but the unpaginated default is heavy on mobile.

### P2-13 [DEFECT] Heading hierarchy is inconsistent inside content
`/teaching/jul2025_eee303/` emits **four `<h1>`** elements ("EEE 303 (Jul 2025)", "Course Outcomes",
"Textbooks", "Additional Resources") because the Markdown uses `#` for section headings under a title
that is already an `<h1>`.

### P2-14 [DEFECT] 19 `backdrop-filter` elements and 231 transition-bearing elements per page
Measured on `/`. `backdrop-filter` is expensive to composite, particularly on mobile GPUs, and 19
instances on one page is well past useful. Also 6 inline `<script>` blocks and 8 external scripts.

### P2-15 [DEFECT] Six images ship without intrinsic dimensions
`images.noDims: 6` of 7 on `/` — no `width`/`height` attributes, so layout shift is possible before
images resolve. No oversized or distorted images were found (`oversized: []`, `distorted: []`) — image
processing itself is healthy.

### P2-16 [DEFECT] Wrong SVG namespace throughout custom partials
`custom/logo.html`, `custom/logo-loader-loop.html` and the navbar icons declare
`xmlns="https://www.w3.org/2000/svg"`. The correct namespace URI is **`http://`**. Inline in HTML this is
ignored by the parser (which is why it renders), but the markup is invalid and would break if any of
these were ever served as a standalone `.svg`.

---

## 6. P3 — Polish

| ID | Finding |
|---|---|
| P3-01 | 3 generic link texts ("Read more") on `/` — ambiguous out of context for screen-reader link lists. |
| P3-02 | 1 `target="_blank"` link without `rel="noopener"`. |
| P3-03 | `<html lang="en-us">` — prefer `en` or correctly-cased `en-US`. |
| P3-04 | The navbar logo tagline ("Smart & Advanced Junction of Intelligent Devices") renders at ≈ 5 px — present but unreadable at every viewport. Either drop it from the navbar lockup or give the navbar a wordmark-only variant. |
| P3-05 | The Dimensions citation badge renders as a small unstyled box in its own `dimensions-badge` font, breaking the typographic system on `/publication/`. |
| P3-06 | `content/_index.md` states `50+` publications and `1300+` citations; the page renders `1,299+`. Worth confirming which is authoritative. |
| P3-07 | Stats-card icons are pale cyan on pale cyan — decorative to the point of invisibility. |
| P3-08 | `/projects/` grants render in the `citation` view (author-year-title), which reads as a paper, not a grant; the homepage uses the correct `grant` view. |
| P3-09 | Q-PACERS emblem is a dense black-and-white circular graphic sitting beside body copy with no size relationship to it. |
| P3-10 | `_vendors/` (plural, containing `HugoBlox/all-access`) sits beside the real `_vendor/`. Appears vestigial — confirm before removing. |

---

## 7. What is *not* broken

Verified clean, so the redesign should not disturb these:

- **No horizontal overflow at any tested viewport**, including 390 px and at **200 % zoom** (640 CSS px,
  `scrollWidth 625 ≤ 640`). Reflow behaviour is sound.
- **No image distortion, no oversized images.** Hugo's image pipeline (`lanczos`, q90, 155 processed
  images) is working well.
- **Mobile menu link targets are 48 px** — above the 44 px guideline.
- **No duplicate `id`s, no positive `tabindex`** on any inspected route.
- **Heading level *skips* are absent** (`headings.skips: []`) — the problems are missing `h1`s and
  too many `h1`s, not skipped levels.
- **Structured data present**: `WebSite` + `Organization` JSON-LD on the homepage.
- **Publication filtering** (Tag / Type / Year, live count, Clear) is genuinely good UX.
- **`prefers-reduced-motion` is honoured by the custom logo partials** — the pattern already exists in
  the codebase and just needs applying to the gradient mesh.
- **DOM weight is modest** (1,528 nodes on the homepage) despite the page length.

---

## 8. Cross-browser status

| Engine | Status |
|---|---|
| **Chromium** (Chrome) | Fully audited — all findings above |
| **Brave** | Not separately driven. Brave is Chromium/Blink, so layout/typography findings transfer. **Needs manual validation** for: Brave Shields blocking the Cloudflare beacon and `email-decode.min.js` (P2-08), and `backdrop-filter` under Brave's fingerprint-protection settings (P0-02, P2-14). |
| **Edge** | Present, not driven; same engine as Chrome. |
| **Firefox (Gecko)** | **Not installed — not tested.** Must be validated manually or by approving a Playwright install. Highest-risk items for Gecko: `backdrop-filter` on the header (P0-02), `:focus-visible` outline rendering (P2-01), the CSS-checkbox mobile menu (P0-01), and SVG `<text>` metrics in the logo (which depend on Arial being present — a Linux/Android Firefox will substitute a different face and shift the wordmark). |
| **Safari/WebKit** | Not available on Windows; not tested. |

---

## 9. Finding index by area

| Area | Findings |
|---|---|
| Navigation & IA | P0-01, P1-01, P1-08, P1-11, P1-12, P3-04 |
| Accessibility | P0-01, P0-02, P0-03, P1-03, P1-04, P1-13, P1-14, P2-01, P2-02, P2-13, P3-01, P3-03 |
| Dark mode | P0-02, P1-04 |
| Motion | P1-07, P1-14, P2-14 |
| Content model / data | P0-04, P1-08, P1-09, P1-10, P1-12, P3-06, P3-08 |
| SEO / metadata | P1-11, P2-05, P2-06, P2-07, P3-03 |
| Performance | P2-08, P2-14, P2-15 |
| Maintainability | P1-03, P2-09, P2-10, P2-16, P3-10 |
| Visual design | P1-07, P2-03, P2-04, P2-11, P3-04, P3-05, P3-07, P3-09 |
