# Visual Polish / Aesthetic Audit — 5 October 2026

**Scope:** the rendered site as built from `main` at `79938e9`, English and Bengali, light and dark.
**Branch:** `visual-polish`.
**Baseline:** [`redesign/design-system-proposal.md`](redesign/design-system-proposal.md). Its tokens are
already implemented in `assets/css/tokens.css`. This audit measures where the **rendered** site still
departs from them. It does not propose a second design system.

**Status:** findings, then implementation on the same branch. The status of each finding is in §5.

## 1. Method

| Check | Method | Coverage |
|---|---|---|
| Build | `hugo --minify` (Hugo 0.157.0 extended) into a folder outside OneDrive, served by a no-cache static server | 556 EN + 334 BN pages |
| Visual review | Playwright 1.63 driving the local Chrome; viewport slices of every section, plus full-page captures | 15 routes at 1440×900, home and article at 390×844, both themes |
| Heading census | Computed `font-size`, `font-weight`, `text-align` and x position of every `main h1, h2` | 9 routes |
| Rendered-style census | Every visible element: non-`none` `box-shadow`, `border-radius` > 12 px (avatars excluded), `font-weight` ≥ 800 or ≤ 300 on text, gradient backgrounds, transitions > 400 ms | 19 routes × 2 themes |
| Contrast + overflow | The Phase 1 instrument `redesign/evidence/audit-instrument.js`, unchanged: WCAG 2.x ratio against the alpha-resolved background. Plus `scrollWidth > innerWidth` | 15 routes × {1440, 390} × 2 themes = 60 cells |
| Scroll-spy | Scripted scroll to bottom, back to `#team`, back to top; read `.nav-link.active` | `/` |

Before-captures are in `redesign/screenshots/visual-polish/before/`. The driver is
`redesign/evidence/visual-polish-shots.mjs`.

**Baseline results:**
- Horizontal overflow: **0 of 60 cells**.
- Contrast failures: **2 of 60 cells**. Both are the same element on `/bn/` (see VP-01).
- Body font: system stack. No webfont requests.
- Infinite animations: none. The Phase 8 result still holds.

## 2. What is already right — keep it

- The **token layer** (`tokens.css`): brand and interactive colours are already split, dark mode is a
  designed palette, and focus, motion and radius tokens exist.
- The **hero** (Phase 8.18 research circuit) is restrained in both themes. It is the only expressive
  surface on the page, which is correct.
- The **navbar** is 64 px, opaque, unblurred, and carries the circuit-trace active marker.
- The **Research and Projects card sections** match the proposal §10 card anatomy exactly: 1 px border,
  8 px radius, 3 px accent rule, no shadow.
- **Teaching, Resources and the article template** are calm, rule-separated and dense. They are the
  best-executed pages on the site and the reference for the rest.
- **Publication rows** are a dense citation list, not cards.

## 3. Summary

| Severity | Count | Meaning |
|---|---|---|
| **P0** | 3 | Accessibility or readability defect |
| **P1** | 10 | Significant visual inconsistency |
| **P2** | 9 | Polish opportunity |
| **P3** | 3 | Optional enhancement |

The single biggest finding is that **the site has two visual systems.** The redesign's sections use
the tokens. The HugoBlox blocks it reuses (contact, partners, team, collection, listing cards, footer)
still carry upstream Tailwind styling: 48 px centred headings, `shadow-xl`, `rounded-2xl`,
`hover:-translate-y-2`, tinted icon discs and pill tags. Most P1 findings are instances of this one
cause, and most are fixed by moving those blocks onto the existing section and card primitives.

---

## 4. Findings

Fields for each finding: **Where** · **Now** · **Why it matters** · **Fix** · **Files** ·
**Risk** · **Changes identity?**

### P0 — accessibility / readability

**VP-01 · `/bn/` research-area status badge fails AA**
- **Now:** "Active" is `text-green-600` `#16a34a` on white, 12 px: **3.30 : 1**. Measured at 1440 and
  390.
- **Why it matters:** it is below the 4.5 : 1 required for normal text, and it is the only remaining
  contrast failure on the site.
- **Fix:** use the `--sj-success` token (`#15803d`, 5.02 : 1). In dark mode the token is `#4ade80`.
- **Files:** `layouts/_partials/hbx/blocks/research-areas/block.html`.
- **Risk:** none. **Changes identity?** No.

**VP-02 · Publication filter focus indicator is effectively invisible**
- **Now:** `.pub-filter-button`, `.pub-clear-btn`, `.pub-filter-option` and `.pub-pill-remove` set
  `outline: none` and draw a 3 px ring at an 18 % accent mix: **1.29 : 1** against the page in light
  mode and **1.46 : 1** in dark.
- **Why it matters:** these are the only controls on the site that opt out of the global focus token.
  A ring this faint fails the 3 : 1 non-text contrast a focus indicator needs, so keyboard users
  cannot see where they are.
- **Fix:** use the global focus treatment: `2px solid var(--sj-focus-ring)` with a 2 px offset.
- **Files:** `layouts/publication/list.html` (its inline `<style>`).
- **Risk:** none. **Changes identity?** No.

**VP-03 · Homepage section titles are not headings**
- **Now:** "Selected Publications", "Teaching" and "Latest News" are `<div class="text-3xl font-bold">`.
  The same applies to "Papers on …" on all twelve research-area pages. The cause is upstream
  `blox/collection/block.html`.
- **Why it matters:** a screen-reader user's heading list shows Research, Projects, Team, Partners and
  Contact, but skips three sections.
- **Fix:** shadow the collection block and render the title as `<h2 class="sj-section__title">`.
- **Files:** new `layouts/_partials/hbx/blocks/collection/block.html`.
- **Risk:** low. The block is used by the homepage (EN/BN) and the twelve research-area pages; all were
  re-checked.
- **Changes identity?** No.

### P1 — significant inconsistency

**VP-04 · Four different section-heading treatments on one page**
- **Now:** on `/` the section `h2`s render as follows:

  | Sections | Size | Alignment | Notes |
  |---|---|---|---|
  | Research, Projects | 31 px | Left at x=144 | |
  | Publications, Teaching, News | 30 px | Left at x=352 | In a 736 px column, misaligned with their own lists |
  | Team, Partners, Contact | **48 px** | Centred | |

  The 48 px titles outrank the page's own wordmark-level hierarchy and match the proposal's *hero* size.
  `/authors/` ("Meet Our Team") and `/research/` ("Collaborations") repeat the 48 px centred pattern.
- **Why it matters:** it is the most visible inconsistency on the site. Structure should come from one
  rhythm.
- **Fix:** one section header everywhere: `.sj-section__head` / `.sj-section__title` (31 px/700,
  left-aligned, in `.sj-container-content`).
- **Files:** `hbx/blocks/{collection,logos,contact-info,team-showcase-admin}/block.html`.
- **Risk:** low. **Changes identity?** No.

**VP-05 · Page-title (`h1`) scale ranges from 31 to 60 px, at three weights**
- **Now:**

  | Size / weight | Routes |
  |---|---|
  | 31 px/700 | `/projects/`, `/teaching/`, `/resources/`, `/research/funding/` |
  | 48 px/700, centred | `/publication/` |
  | 48 px/700 | `/resources/academic/`, `/resources/templates/` |
  | 56 px/**800** | `/authors/` |
  | 60 px/700, −3 px tracking | `/research/`, research areas |
  | 60 px/**800** | `/resources/blog/`, `/news/` |

  "Writing & Tutorials" wraps to two lines at 1440 px.
- **Why it matters:** sibling pages in the same navigation look as if they come from different sites.
  The 800 weight is outside the approved 400/600/700 set.
- **Fix:** one page-title token, 39 px/700 (`--sj-text-4xl`, proposal §3.2), left-aligned, for every
  interior page. Research pages keep a larger 48 px display title (`--sj-text-5xl`) because their
  header is a two-column hero with the Q-PACERS figure, and 39 px beside a 500 px figure reads as
  undersized. Their tracking goes from −3 px (−0.05em) to −0.03em.
- **Files:** `assets/css/phase4.css` (`.sj-page-title`), `resources-category.css`,
  `publication/list.html`, `layouts/list.html`, `authors/taxonomy.html`, `research-area.html`.
- **Risk:** low. **Changes identity?** No.

**VP-06 · Listing cards on `/resources/blog/` and `/news/` are the old "floating card"**
- **Now:** `shadow-lg`, `hover:shadow-xl`, `hover:-translate-y-2`, `backdrop-blur-sm`,
  `bg-white/90`, a 16 px radius and a cyan-filled pill tag, all in a 65 ch single column.
- **Why it matters:** it is the exact pattern proposal §10 rejects ("no lift, no scale, no shadow
  bloom") and visibly unlike the card on `/projects/`.
- **Fix:** the project card anatomy (surface, 1 px border, 8 px radius, no shadow, border-colour
  hover). Tags use the `.sj-tag` style. The author name is no longer truncated to
  "Dr. Sajid Muhaimin C…".
- **Files:** `layouts/_partials/views/card.html`, `card-noimage.html`.
- **Risk:** low. **Changes identity?** No.

**VP-07 · `/news/` shows a fake image on every item**
- **Now:** no news item has a featured image. Each card therefore renders a 16:9 blue-to-purple
  gradient with a generic "image" glyph: 315 px of decoration per item, about 10 per page.
- **Why it matters:** placeholder imagery is the clearest AI-template tell on the site. It also
  pushes the actual headline below the fold.
- **Fix:** omit the media block when there is no image.
- **Files:** `layouts/_partials/views/card.html`.
- **Risk:** none. **Changes identity?** No.

**VP-08 · Footer is a third major section, not a quiet footer**
- **Now:**
  - Two `rounded-2xl` `shadow-sm` cards sit on a white band.
  - That band sits inside a subtle band, separated by `mt-20`. This leaves an **empty 80 px strip with
    two hairlines** above every footer on every page.
  - The BUET logo lifts and scales on hover.
  - In dark mode the footer is `slate-950` `#020617`, darker than the page. That is the
    near-black the proposal rules out.
- **Why it matters:** the footer competes with the content it closes, and the empty strip reads as a
  layout bug.
- **Fix:** one subtle band (`--sj-background-subtle`) with one top border and no cards or shadows. The
  same two-column content, the same links and the same accessible names. The hover transform is
  removed.
- **Files:** `layouts/_partials/site_footer.html`, `assets/css/custom.css`.
- **Risk:** low. **Changes identity?** No.

**VP-09 · Contact block: `shadow-xl` cards and tinted icon discs**
- **Now:**
  - The cards use `shadow-xl`, `hover:shadow-2xl` and a 16 px radius.
  - The icons sit in 48 px primary-tinted discs.
  - In dark mode the cards are `gray-800` `#1f2937`, which is off-palette.
  - The section adds its own 48–80 px padding on top of the block's 48 px.
- **Fix:**
  - Flat surface cards: border, 8 px radius, no shadow.
  - A plain 20 px accent icon.
  - The standard section header.
  - No internal padding.
- **Files:** `hbx/blocks/contact-info/block.html`.
- **Risk:** low. **Changes identity?** No.

**VP-10 · Team cards on `/authors/` use `shadow-lg` and a 16 px radius**
- **Now:**
  - 12 cards with `shadow-lg hover:shadow-xl`.
  - The PI portrait has `ring-4` plus `shadow-lg`.
  - The homepage overrides this through `.sj-team-compact`; `/authors/` does not.
- **Fix:** card anatomy with no shadow and an 8 px radius, applied to the block rather than per page.
- **Files:** `hbx/blocks/team-showcase-admin/block.html`.
- **Risk:** low. **Changes identity?** No.

**VP-11 · Publication page runs a parallel token system**
- **Now:**
  - `publication/list.html` defines `--pub-bg`, `--pub-border`, `--pub-text-muted` and others from
    `Canvas`/`CanvasText` colour-mix. Muted text is `CanvasText` at 58 % opacity.
  - The filter panel has `shadow-sm` and a 16 px radius.
  - The filter buttons and Clear are 9999 px pills.
  - The menus use `backdrop-filter: blur(10px)` and a 1 rem radius.
- **Why it matters:**
  - It is a second design system on the busiest page.
  - Opacity-derived text colour is what proposal §10 warns about.
  - Pills are reserved for avatars by the radius scale.
- **Fix:** point the `--pub-*` variables at `--sj-*` tokens. Buttons get `--sj-radius-md`. The panel
  gets no shadow and an 8 px radius. The menus become an overlay (`--sj-shadow-overlay`, no blur).
- **Files:** `layouts/publication/list.html`.
- **Risk:** low; the JS is untouched. **Changes identity?** No.

**VP-12 · Hero closes with a double hairline**
- **Now:** the hero's `border-bottom`, then 32 px of bare section padding, then the Research band's
  `border-top`. At every width this renders two parallel rules with a white strip between them.
- **Fix:** remove the hero section's bottom padding. The band that follows already provides its own
  spacing.
- **Files:** `content/en/_index.md`, design front matter only (`spacing.padding`).
- **Risk:** none. **Changes identity?** No.

**VP-13 · Scroll-spy leaves "Contact" active for the rest of the visit**
- **Now:** once the Contact section has been in view, "Contact" stays active, next to "Home", at every
  scroll position. Measured: after a visit, the active set at the top of the page is `Home+Contact`.
- **Why it matters:** two circuit-trace markers in the navbar means the active state stops meaning
  anything.
- **Fix:**
  - Hold the previous selection only while its section still intersects the viewport.
  - While a scroll-spy item is active, suppress the static "Home" marker. It stays
    `aria-current="page"`, which is still true.
- **Files:** `assets/js/sajid-nav.js`, `assets/css/custom.css`.
- **Risk:** low. **Changes identity?** No.

### P2 — polish

**VP-14 · "More" links use three treatments**
- **Now:**
  - Projects uses `.sj-more-link`, a trace-prefixed tertiary link at x=144.
  - Teaching and News use plain links at x=372, floating away from their lists.
  - Team uses a filled primary button with a hover shadow, which competes with the hero's single
    primary action.
  - Research areas use a bordered "See all" button.
- **Fix:** `.sj-more-link` everywhere. It is the circuit-trace "read more" affordance the proposal
  calls for.
- **Files:** the collection shadow and `team-showcase-admin`.

**VP-15 · Partners band is 458 px tall for four 40 px logos**
- **Now:** the logos block adds `py-16 sm:py-20 lg:py-24` inside the 48 px section padding, plus a
  48 px heading.
- **Fix:** no internal padding and the standard header. The band shrinks by about 200 px at 1440.
- **Files:** `hbx/blocks/logos/block.html`.

**VP-16 · Teaching/News row summaries run 1,100 px wide**
- **Now:** compact rows span the full container, so a one-line summary reaches about 150 characters.
- **Fix:** cap row text at `--sj-container-prose`. The rows and their rules stay full width.
- **Files:** `assets/css/homepage.css`.

**VP-17 · `/research/` intro sets the Q-PACERS initials at weight 900**
- **Now:** the Q-PACERS initials in the intro are `font-weight: 900`.
- **Fix:** use 700. The emphasis is kept and is now inside the weight set.
- **Files:** `assets/css/phase4.css`.

**VP-18 · Footer "IMPORTANT LINKS" uses 0.18–0.2 em tracking and uppercase in two places**
- **Fix:** a single small-caps label style (12 px/600, 0.06em). The heading stays a heading.
- **Files:** `site_footer.html`.

**VP-19 · Contact and footer social links are filled grey discs**
- **Now:** `bg-gray-100 rounded-full` discs.
- **Fix:** 1 px border and transparent fill, matching the PI card's icon row. Target sizes are
  unchanged at 40 px, above the 24 px floor.
- **Files:** `contact-info`, `site_footer.html`.

**VP-20 · `/resources/blog/` and `/news/` listings are a 560 px column in a 1440 px page**
- **Fix:** put the page header in `.sj-container-content`, matching Teaching and Resources. Cards stay
  one column at ≤ 72 ch, so each card stays a readable unit, but now left-aligned under the title.
- **Files:** `layouts/list.html`.

**VP-21 · `/authors/` intro uses 20 px text at 512 px width, centred on the page**
- **Fix:** page-title token and standard lede, aligned with every other interior page.
- **Files:** `layouts/authors/taxonomy.html`.

**VP-22 · Contact subtitle is 20 px and centred**
- **Fix:** it becomes `.sj-section__subtitle` (16 px, secondary), left-aligned (part of VP-04).

### P3 — optional, not implemented

**VP-23 · Bengali homepage still runs the pre-redesign block set**
- **Now:** `/bn/` keeps the old `research-areas` block, with six saturated gradient card headers
  (indigo→purple, blue→cyan, green→emerald …). It also has gradient section washes,
  `font-light` hero copy and `shadow-lg` cards.
- **Why left:** fixing it means replacing the block list in `content/bn/_index.md`, which is a content
  and IA migration rather than a polish change. Only its one contrast defect (VP-01) is fixed here.
- **Recommendation:** a dedicated task that ports the EN block list and translates the new strings.

**VP-24 · IBM Plex Sans experiment**
- **Now:** not tried.
- **Cost estimate:**
  - Latin variable `wght` woff2 is about 90–110 KB.
  - Plex has **no Bengali**, so Bengali would still fall back to the system face, giving a mixed-face
    page.
  - It adds one render-blocking-adjacent request and swap-induced CLS risk.
- **Recommendation:** keep the system stack. The type problems found here are scale and weight, not
  face.

**VP-25 · Circuit-trace divider between homepage sections**
- **Idea:** a 1 px rule with a terminal node could replace the plain band borders.
- **Why left:** the motif already appears in the nav, the card accent rule and "more" links. Adding it
  to section boundaries would push it towards overuse.

---

## 5. Disposition

| ID | Status |
|---|---|
| VP-01 – VP-22 | Implemented on `visual-polish`; see the commit log and the validation section of `redesign/README.md` |
| VP-23 – VP-25 | Documented and intentionally not implemented |
