# SAJID.BD — Implementation Roadmap

**Phase 1 output. No phase below has been started.**
Nothing here proceeds until `design-system-proposal.md`, `information-architecture.md` and this file
are reviewed and approved.

---

## 0. Ground rules for every phase

### Where changes are allowed

| Layer | Path | Allowed |
|---|---|---|
| Upstream module cache | Hugo cache | ❌ never |
| Vendored upstream | `_vendor/github.com/HugoBlox/kit/**` | ❌ never — **overwritten by `hugo mod vendor`** |
| Project overrides | `layouts/**`, `assets/css/**`, `config/**` | ✅ primary target |
| Custom SAJID.BD | `layouts/_partials/custom/**`, `layouts/_partials/hbx/blocks/<custom>/**` | ✅ fully owned |
| Generated output | `public/`, `resources/` | ❌ never edited by hand |

To change upstream behaviour, **shadow the file** by copying it from `_vendor/` to the matching path
under `layouts/` and editing the copy. Record every new shadow in a table in this file, because each one
is a future merge burden.

### Per-phase protocol

1. Branch: `redesign/phase-N-<name>`.
2. Capture "before" screenshots using `evidence/capture-driver.mjs` at the full viewport matrix.
3. Implement.
4. Capture "after" at the identical matrix.
5. Run the Phase-7 checks from `visual-qa-baseline.md`.
6. **Compare screenshots visually.** A green build is not QA.
7. Commit at the checkpoint; do not squash across phases.

### Rollback

Every phase ends at a tagged commit `redesign-phase-N`. Rollback is `git revert` of the phase range —
which is why phases must not be squashed together. The two content-moving phases (4 and 5) additionally
require a verified-live alias check before the next phase starts.

### Global prerequisite — do this before Phase 2

> **Fix `baseURL`.** `config/_default/hugo.yaml` points at `https://www.sajid.org.bd/`, which **does not
> resolve**. Production is only correct because CI overrides it. Every alias, canonical, sitemap entry
> and OG tag generated in Phases 4–5 depends on this being right. Set it to `https://www.sajid.bd/`
> and confirm the CI override still wins.
>
> One line, near-zero risk, and it de-risks everything downstream.

---

## Phase 2A — Visual Foundation & Application Shell ✅ COMPLETE

**Completed 2026-09-21.** Sequencing was deliberately changed from the original plan: the navigation
**information-architecture migration was split out** into Phase 2B, because `/projects/` still contains
research grants and must not be presented as the new Projects portfolio before that content moves.

**Objective (met):** establish the approved token system, typography, spacing, shell and accessibility
foundation so later phases inherit a stable base. No content moved, no route changed.

### Delivered

| # | Item | Closes |
|---|---|---|
| 2A.1 | `assets/css/tokens.css` — 17 semantic tokens × light/dark, plus radii, spacing, type scale, motion and container tokens. All 27 colour pairs verified by computation before writing. | — |
| 2A.2 | Header surface moved to `--sj-surface-header`; hardcoded `rgba(255,255,255,.65)` and `backdrop-filter` removed | **P0-02** |
| 2A.3 | Mobile menu rebuilt as a real `<button>` with `aria-expanded` / `aria-controls`, Enter/Space open, Escape close, focus into menu and back to trigger | **P0-01** |
| 2A.4 | `<main id="main" tabindex="-1">` in the shell, conditional so no page gets two landmarks; verified = 1 on all 19 routes | **P1-13** |
| 2A.5 | Skip link, first in tab order, visible on focus, token-styled | **P1-13** |
| 2A.6 | Designed focus ring (`2px solid var(--sj-focus-ring)`, 2px offset) via `:focus-visible` only | **P2-01** |
| 2A.7 | Navbar logo `<style>` removed (it was the brand link's accessible name), `role="img"` + `<title>`, `aria-label` on the brand link, SVG namespace corrected | **P1-03**, P2-16 |
| 2A.8 | **Hero logo `:root` leak scoped.** `logo-loader-loop.html` / `logo-loader.html` were redefining `--color-primary-600` for the whole document from inside an inline SVG | *(new, found in 2A)* |
| 2A.9 | Active nav state fixed (path-prefix match server-side + IntersectionObserver scroll-spy for anchor items) with the circuit-trace indicator | P1-01 (partial) |
| 2A.10 | Global `prefers-reduced-motion` contract; `.stats-item` reveal forced to its end state so content is never left at `opacity: 0` | **P1-14**, P1-05 *(reduced-motion case only)* |
| 2A.11 | Header/search/theme/nav controls raised to 44×44 px | P2-02 (header only) |
| 2A.12 | `baseURL` corrected to `https://www.sajid.bd/` (was an NXDOMAIN host) | **P2-06** |
| 2A.13 | Footer brought onto tokens (surface, border, link, focus) | — |
| 2A.14 | Button/link primitives (`.sj-btn--primary/secondary/tertiary`), prose links always underlined | — |
| 2A.15 | Header height 81 px → **65 px**; brand stepped down at `lg` so the desktop menu no longer wraps at 1024 px (was 116 px tall) | *(new, found in 2A)* |

### Correction pass (post-review)

Two issues were raised on review. Neither root cause was what the symptom suggested, so both were
diagnosed before being changed.

| Reported | Actual root cause | Fix |
|---|---|---|
| "Mobile active Home state uses long cyan rules spanning the menu width" | **The focus ring, not the active state.** `outline: 2px` with `outline-offset: 2px` on a 366×48 *block* link drew a ring **outside** the row, reading as two long rules across the panel. The active state was already a restrained 3 px left edge. | Mobile active → short 20 px trace + 6 px terminal node + accent label (desktop vocabulary, rotated to the leading edge). Mobile focus → `outline-offset: -2px` + `--sj-accent-soft` tint, contained within the row. Verified visually distinct from active. |
| "'Research Focus Areas' appears behind the sticky header — anchor/offset problem" | **Not an anchor bug.** All 8 homepage anchors already landed correctly (`secTop == headerBottom`, heading never behind the header). The heading was *showing through* the header because `--sj-surface-header` was 92 % opaque. The screenshot that prompted this was a mid-scroll capture at `y=1500`, not an anchor landing. | `--sj-surface-header` made **opaque** in both themes — a sticky header must occlude. Plus the reusable scroll-offset architecture below. |

**Third issue, found while diagnosing:** opening the mobile menu **cleared** the active state.
`first.focus()` scrolled the page enough to push the current section out of the scroll-spy band.
Fixed with `focus({ preventScroll: true })`, plus `render()` now holds the previous selection when no
section occupies the band instead of blanking the nav.

**Scroll-offset architecture** (replaces reliance on `hb-nav.js` setting `scrollPaddingTop` imperatively):

```css
html { scroll-padding-top: var(--sj-header-height); }          /* anchor jumps, hash, history restore */
:target, main [id], section[id], .page-body [id] {
  scroll-margin-top: var(--sj-space-2);                        /* comfort gap; covers scrollIntoView() */
}
```

Both derive from tokens, so changing the shell height is a one-line edit. They **stack** — total offset
is header-height + 8 px — which is why the margin is a small gap rather than a second copy of the header
height (setting it to the full 64 px landed anchors 129 px down with dead space above the heading).
Verified: all 8 anchors land at `secTop: 73` with the heading fully clear, JS enabled or not.

### Deliberately NOT done in Phase 2A

Funding migration · Projects portfolio · new menu IA · Resources migration · Books/Notes ·
homepage redesign · any content move · any route change · search architecture ·
logo text-to-outlines conversion.

### Overrides created

**None.** Every file changed was already a project-level override or a project-owned custom file.
No file was copied out of `_vendor/`. See the register at the end of this document.

### Deviations from `design-system-proposal.md`

| Proposal | Shipped | Why |
|---|---|---|
| `text-tertiary` dark = `#64748b` | `#8b9bb0` | `#64748b` measures **3.75:1** on `#0f172a` and fails AA. `#8b9bb0` measures 6.30:1. |
| Stat figures 44 px | Not applied | Stats are a homepage block; restyling belongs to Phase 3. Token `--sj-text-stat` is defined and unused for now. |
| Section rhythm 72 px desktop | Tokens defined, not yet applied to blocks | Applying it means editing homepage blocks — Phase 3. |
| `--color-primary-600` retired | Retained at `#0c96c8` | Declared deliberately in `tokens.css` to keep appearance identical after scoping the SVG leak. Components using `*-primary-600` for **text** still measure 3.38:1 and migrate in Phase 3. |

### Known issues remaining after 2A (all pre-existing, all scoped to later phases)

- Contrast failures inside page blocks: 12 on `/` (light), 4 (dark) — all from `*-primary-600` text and
  the status badges. **Phase 3.**
- `/` still has **no `<h1>`**; `/authors/`, `/people/`, `/outreach/` likewise. **Phase 3 / 5.**
- Scroll-reveal still starts at `opacity: 0` when motion is *not* reduced (no-JS case). **Phase 3.**
- Raw LaTeX in publication titles; duplicate `[X03]`/`[X04]`. **Phase 4.**
- Pagefind still 404s; the search control is still rendered. Left exactly as found, per instruction.
- `content/bn` nested in the EN `contentDir` (≈140 duplicate target paths). **Phase 8.**
- Dimensions badge renders outside the type system on `/publication/`. **Phase 8.**

---

## Phase 2B — Navigation Information-Architecture Migration

**Not started. Runs with, or immediately after, the content migrations in Phases 4–5 — never before.**

The navbar *component* is already built for six items plus a Contact action. What remains is the
**menu data change**, which must not happen until the destinations exist:

| Step | Depends on |
|---|---|
| `menus.yaml` → Research / Publications / Projects / Teaching / Team / Resources | Phase 4 (Projects namespace freed) + Phase 5 (Resources exists) |
| Enable `header.cta` for Contact | A real `/contact/` page |
| Remove the textual `Home` item | The three preconditions in `information-architecture.md` §4.1 |
| Remove `News` from the navbar | Footer link + homepage feed in place |

> **Blocking constraint carried forward:** do not label `/projects/` as the Projects portfolio while it
> still holds grants. This is the reason Phase 2 was split.

---

## Phase 2 — Foundation *(superseded by Phase 2A + 2B)*

**Objective:** establish tokens, typography, spacing and navigation so every later phase inherits them.
No page is redesigned in this phase.

### Files likely affected

```
assets/css/custom.css                                    rewrite → token definitions
assets/css/tokens.css                                    new
config/_default/params.yaml                              header.cta, search, radius/spacing
config/_default/menus.yaml                               6 items + Contact
layouts/_partials/components/headers/navbar.html         mobile toggle, active state, a11y
layouts/_partials/custom/logo.html                       remove <style>, add role/aria-label
layouts/baseof.html                                      <main>, skip link
layouts/_partials/site_footer.html                       primary destinations
```

### Work

| # | Task | Fixes |
|---|---|---|
| 2.1 | Define semantic tokens (light + dark) as CSS custom properties + Tailwind `@theme` | — |
| 2.2 | Replace hardcoded `#site-header.header` rgba with `surface-header`; **remove `backdrop-filter`** | **P0-02** |
| 2.3 | Apply the type scale, weights 400/600/700, body line-height 1.65 | P2-03 |
| 2.4 | Apply the spacing scale; section default 96 → 72 px | P2-04 |
| 2.5 | Container widths incl. `68ch` prose | P2-03 |
| 2.6 | Replace mobile checkbox toggle with `<button aria-expanded aria-controls>` + focus trap + `Esc` | **P0-01** |
| 2.7 | Fix nav active state (compare section, not anchor); add accent underline | P1-01 |
| 2.8 | `menus.yaml` → 6 real page links; enable `header.cta` Contact; **style the mobile CTA** | P1-01 |
| 2.9 | Add `<main>` to `baseof.html` + skip link | **P1-13** |
| 2.10 | Logo: remove `<style>`, add `role="img"` + `aria-label`, define `--hb-color-header-fg`, fix `xmlns` | **P1-03**, P2-16 |
| 2.11 | Designed focus ring token, applied globally via `:focus-visible` | P2-01 |
| 2.12 | Global `prefers-reduced-motion` block (`iteration-count: 1`, not `none`) | P1-14 |
| 2.13 | Accent `#0c96c8` → `#0e7490` / `#22d3ee` for interactive; brand keeps `#0c96c8` | **P1-04** |
| 2.14 | Button/link hierarchy; min target 44 px | P2-02 |
| 2.15 | Decide Pagefind: wire into `publish.yaml` **or** set `header.search: false` | **P1-02** |
| 2.16 | Convert logo `<text>` to outlines | §3.1 |

### Expected screenshots
`home` · `publication` · `research` · `teaching` at 1440 / 768 / 390, light **and** dark;
`nav-open-mobile-390` light + dark; `focus-tab-1..8` at 1440.

### Validation
- Zero contrast failures from `audit-instrument.js` on 6 sample routes, both themes.
- `mobile menu opens and closes by keyboard alone`; focus returns to the trigger.
- `<main>` and skip link present on **all** routes.
- Header legible in dark mode (the P0-02 regression test).
- No `iteration-count: infinite` under reduced motion.
- No horizontal overflow at any matrix viewport.

### Checkpoint
Tag `redesign-phase-2`. **This phase alone closes both P0s and five P1s** — it is the highest-value
phase and should ship before anything visual.

---

## Phase 3 — Homepage ✅ COMPLETE

**Completed 2026-09-22** on `redesign/phase-3-homepage`.

### Homepage height

| | Height @1440 | |
|---|---|---|
| Phase 1 baseline | 12,728 px | |
| Pre-Phase-3 (after 2A) | **12,822 px** | measured baseline for this phase |
| **After Phase 3** | **6,608 px** | **−48.5 %** |

Target was ≤ 7,000 px. No viewport overflows; 390 px mobile is 9,254 px (from 19,322 px, −52 %).

### Section-by-section

| Section | Before | After | Note |
|---|---|---|---|
| Hero (`about`) | 709 | **631** | −11 % on its own, but it now also carries the stats |
| Stats (`section-stats`) | 576 | **0** | folded into the hero strip |
| *Hero + stats combined* | *1,285* | ***631*** | ***−51 %*** |
| Research | 1,937 | **890** | −54 %; flat cards replace 192 px gradient headers |
| Grants (`projects`) | 1,852 | **removed** | grants stay at `/projects/` until Phase 4 |
| Team | 914 | **604** | −34 %; 290 px portrait → 112 px, horizontal layout |
| Publications | 752 | **822** | +9 %; now 4 *curated* entries with links, was 3 recent |
| Orphan CTA | 288 | **removed** | replaced by inline section links |
| Teaching | 1,153 | **794** | −31 % |
| News | 1,212 | **815** | −33 % |
| Partners | 718 | **462** | −36 % |
| Contact | 949 | **667** | −30 % |
| Outreach duplicate | 1,108 | **removed** | `/outreach/` unchanged |
| Projects portfolio | — | **270** | new, placeholder only |
| **Blocks on page** | **12** | **9** | |

### Other before/after

| | Before | After |
|---|---|---|
| `<h1>` count | **0** | **1** |
| Infinite animations | **14** | **0** |
| Animations of any kind (settled) | 14 | **0** |
| Grant entries rendered | 3 (full list) | **0** |
| Duplicated Outreach section | present | **removed** |
| Contrast failures, light / dark | 12 / 4 | **0 / 0** |
| Interactive targets < 24 px | 48 | 38 |
| DOM nodes | 1,525 | 1,271 |

### What was done

- **Hero:** real `<h1>` carrying the positioning (the wordmark states the name, so
  the h1 no longer repeats it); `secondary_action` now renders; lede cut to
  ~58ch; static radial wash replaced the animated gradient mesh.
- **Wordmark:** one-shot. Plays `Lab → .BD → Lab` once, settles on **SAJID Lab**
  and **removes the caret** (its CSS blink was `infinite`). Under reduced motion
  the complete wordmark renders immediately with no caret. The three decorative
  SVG pulses (`pulseS`, `wifiPulse`, `jNodePulse`) were `infinite`; now 3 iterations.
- **Stats:** rule-separated `<dl>` inside the hero, 44 px figures (was 72 px/900),
  plain markup with no reveal class — visible without JS and under reduced motion.
- **Research:** flat surfaces, 1 px border, 8 px radius, 3 px accent rule.
  The six per-item `gradient` values are deliberately ignored. Status is a dot +
  text label, and `past` uses a hollow dot so state is not colour-only.
- **Publications:** curated via `featured: true`, not most-recent.
- **Projects:** placeholder block, see below.
- **Removed:** full grant list, duplicated Outreach block, orphan CTA section.
- **Section rhythm:** 96 px → 72 px desktop, set per block.

### Selected-publications mechanism

No `featured` flag existed anywhere in the publication content model, so the
smallest maintainable mechanism was used: `featured: true` in the front matter of
four bundles, consumed by `filters.featured_only` (already supported upstream).

Seeded set — **chosen for topical breadth, and the user's to change**:

| ID | Area |
|---|---|
| `j-028` | Photonics / metasurfaces (2026) |
| `j-026` | Computing & AI + phase-change photonics (2025) |
| `j-024` | Renewable / photovoltaics (2025) |
| `j-021` | Photonic topological insulator / integrated optics (2024) |

`j-029` (the newest paper) was **excluded on purpose**: its title contains raw
LaTeX (`$[[7,1,3]]$`) which renders verbatim because `content.math.enable` is
false. Featuring it would put visual-audit **P1-09** on the homepage. Re-include
it once Phase 4 enables math rendering.

> A YAML note for whoever edits these next: several publication titles are
> **line-wrapped** across two lines. Inserting a key immediately after the
> `title:` line corrupts the scalar. Add front-matter keys before the closing
> `---`. This was hit and fixed during Phase 3.

### Projects placeholder strategy

`layouts/_partials/hbx/blocks/projects-featured/block.html` is data-driven and
**cannot** display grants:

```go
{{ $portfolio := where site.RegularPages "Params.project_category" "!=" nil }}
{{ $portfolio = where $portfolio "Section" "projects" }}
```

Grant bundles in `content/projects/` do not declare `project_category`, so they
never match. With no portfolio content the block renders one compact editorial
line (270 px, no cards, no empty grid) and **no link to `/projects/`** — the
configured `cta` is only emitted when real items exist. Phase 4 needs no template
change: create content with `project_category` set and the cards appear.

### Deviations from the Phase 3 brief

| Brief | Shipped | Why |
|---|---|---|
| Hero 35–45 % shorter | Hero block −11 %; hero **+ stats** −51 % | The stats section was folded in. Measured honestly both ways rather than claiming the narrow target. |
| Separate "View all …" CTA blocks | Used the collection block's own `archive.text` | Avoided three extra 108 px sections and a duplicate CTA per section. |
| — | Added `sj-home` body class | Lets Phase 3 fix `*-primary-600` contrast on the homepage without touching `/publication/`, `/authors/` or `/research/`, which are Phases 4–5. |

### Overrides created

**None.** No file was copied out of `_vendor/`. One new project-owned block
(`projects-featured`) and one new stylesheet were added; everything else edited
was already a project override or project-owned custom code.

### Remaining homepage defects (deferred)

- Teaching/News are ~800 px for three ~110 px rows; the remainder is the shared
  collection block's wrapper chrome. Changing it affects other pages → Phase 5.
- Dimensions citation badges sit outside the type system → Phase 8.
- Search modal still contributes the first `H3` in the DOM and Pagefind still
  404s → untouched by instruction.
- 38 interactive targets remain under 24 px, mostly citation actions and footer
  social icons → Phase 7.

---

## Phase 3 — Homepage *(original plan, superseded by the record above)*

**Objective:** turn the 12,728 px index into a curated landing page.

### Files likely affected
```
content/_index.md                                        section order, remove 3 blocks
layouts/_partials/hbx/blocks/hero-with-stats/block.html   h1, secondary action, stats strip
layouts/_partials/hbx/blocks/research-area-qpacers/block.html  remove gradients
layouts/_partials/views/{card-basic,card-noimage,citation}.html
```

### Work

| # | Task | Fixes |
|---|---|---|
| 3.1 | Hero: render a real `<h1>`; render `secondary_action`; cut height ~40 % | **P0-03**, P1-06, P2-04 |
| 3.2 | Wordmark transition plays **once**, then settles on `SAJID Lab` | P1-07 |
| 3.3 | Replace the animated gradient mesh with a static two-stop wash | P1-14, P2-11 |
| 3.4 | Fold stats into the hero as a rule-separated strip, **visible by default** | **P1-05** |
| 3.5 | Research cards: flat surface + 3 px accent rule; drop six gradients; status badges get a non-colour cue | P2-11 |
| 3.6 | Reorder: Hero → Research → Publications → Projects → Team → Teaching → News → Collaborators → Contact | IA §15 |
| 3.7 | **Remove** the full grant list, the duplicated outreach block, and the orphan CTA section (≈ 3,200 px) | P1-12, IA §15 |
| 3.8 | Selected (curated) publications, not most-recent | IA §15 |
| 3.9 | Featured Projects placeholder section (populated in Phase 4) | — |

### Expected screenshots
Full-page `home` at all 7 viewports, light + dark; hero crop at 1440/768/390.

### Validation
- Homepage ≤ **7,000 px** at 1440 (from 12,728).
- Exactly one `<h1>`.
- Stats visible with JS disabled and under reduced motion.
- Zero infinite animations.
- Both hero CTAs present.

### Checkpoint `redesign-phase-3`.

---

## Phase 4 — Core Content ✅ COMPLETE (one manual gate outstanding)

**Completed 2026-09-22** on `redesign/phase-4-core-content`.
Full migration record: [`phase-4-url-migration.md`](phase-4-url-migration.md).

### Funding migration — staged and gated

| Gate | Result |
|---|---|
| A — inventory old `/projects/` routes from the build | ✅ 3 grant URLs + root + paginator |
| B — `git mv` bundles, add aliases, fix dates | ✅ |
| C — alias files exist in generated output | ✅ byte-inspected |
| D — browser follows each legacy URL to the right page | ✅ against a **localhost-baseURL** build |
| E — create `/projects/` portfolio | ✅ only after D passed |
| **Production redirect verification** | ❌ **not possible — no branch preview exists.** Manual gate after first deploy |

`/projects/g-01..03/` → `/research/funding/g-01..03/`, all verified.
The `/projects/` **root** deliberately changes meaning and is not aliased —
aliasing it would collide with the new portfolio's output path.

### Configuration changes

| Setting | Was | Now | Why |
|---|---|---|---|
| `disableAliases` | `true` | `false` | Alias stubs are the only redirect mechanism that works on GitHub Pages. Verified no content declared `aliases:` beforehand, so nothing unintended was introduced |
| `taxonomies` | author, tag, publication_type | **+ project_category, technology** | Category as taxonomy, not directory, so re-categorising never changes a URL |
| `content.math.enable` | `false` | `true` | Publication titles contain TeX that rendered raw |

### Projects content model

Page bundles at `content/projects/<slug>/`, category by taxonomy.
Status vocabulary: `active · maintained · prototype · planned · archived`.
Status is never colour-only — each carries a dot glyph and a text label, and
inactive states use a hollow dot.

**Categories started at two**, not five: `software`, `research-software`.
`hardware`, `educational` and `automation` are deliberately absent until each
can hold ~3 credible items.

### Project entries created — real content only

| Project | Category | Evidence |
|---|---|---|
| **CTAdmin** | software | `github.com/sajidbuet/CTAdmin` (verified 200, description "Class Test Seat Plan and Timing") + the author's own blog post |
| **Scholar Profile Exporter** | research-software | `github.com/sajidbuet/scholar-profile-exporter` (verified 200, "Scholar Profile Exporter (CSV + BibTeX Link)") + the author's own blog post |

Nothing was invented. Both descriptions draw only on the author's blog posts
and the repositories' own GitHub descriptions.

**Candidates that still need authoring by the user** (identified, not created,
because no published artefact backs them):
- Microsoft Teams bulk-add and BIIS-check PowerShell tooling (blog posts exist; no repo link)
- `_pythonscripts/student-author-page-creator.py` and the author-YAML generator (in-repo, unpublished)
- The Publish-or-Perish → BibTeX pipeline referenced in the citation-count post

### Publications

| Item | Outcome |
|---|---|
| URL | **Unchanged** at `/publication/` — deliberately not renamed |
| Pagination | **Deferred, deliberately.** The filter renders all 62 entries into the DOM and toggles `.pub-hidden`; static pagination would leave filters searching only the current page. Correct behaviour beat the roadmap wording (§39) |
| Filters | tag / type / year all intact, 63 rows in DOM |
| Math | KaTeX enabled; 0 raw `$…$` visible in the rendered list |
| `<title>` / `og:title` | Sanitised in `site_head.html` — KaTeX cannot reach plain-text metadata |
| Duplicate `x-04` | Removed; byte-identical to `x-03` apart from a generated `publishDate`. Aliased |
| Author normalisation | `Andrea Alu` → `Andrea Alù`; the `andrea-alu` duplicate-target-path warning is gone |
| **DOI links** | **Fixed a pre-existing bug**: 100 files used the deprecated top-level `doi:`, which emitted `href="10.1007/..."` with no scheme — broken on every publication. Migrated to `hugoblox.ids.doi`; now `https://doi.org/…`. Also silenced ~100 build warnings |

### Navigation

Now: `Home · Research · Publications · Projects · Teaching · Team · Outreach · Contact`,
all pointing at real pages instead of homepage anchors. **`Funding` removed**
as a primary item.

**Deferred to Phase 5:** `Outreach` → `Resources` (route does not exist yet).
**Deferred:** removing the textual `Home` item and moving Contact to the header
CTA — breadcrumbs are still not enabled site-wide, which was a stated precondition.

### Overrides created

**None from `_vendor`.** New project-owned files only:
`layouts/projects/{list,single}.html`, `layouts/grant/{list,single}.html`
(the latter moved from `layouts/projects/single.html`),
`layouts/project_categories/term.html`, `layouts/technologies/term.html`,
`layouts/_partials/views/project-card.html`,
`layouts/_partials/hbx/blocks/grants-summary/block.html`, `assets/css/phase4.css`.

### Two collisions found and resolved

1. **`links:` front-matter key** — the proposed project schema used `links:`,
   which is a reserved HugoBlox param expecting a *list*. A map broke the build
   on taxonomy term pages. Renamed to **`project_links:`**.
2. **`collection` block folder filter** — it filters on `.Section`, and the
   grants' Section is `research`, so `folders: [research/funding]` matched
   nothing and the Funding page rendered empty. Replaced with type-based
   templates (`type: grant`) and a small `grants-summary` block.

### QA

0 contrast failures and 0 heading skips on `/research/`, `/research/funding/`,
`/projects/`, `/projects/ctadmin/`, `/publication/`, in both themes.
0 responsive anomalies across 7 viewports × 2 themes × 5 routes.
0 stale `/projects/g-*` links in a 269-link crawl over 14 routes.
Production build passes.

### Deferred

Pagination · ~296 sub-24 px targets on `/publication/` (Phase 7) ·
Pagefind search · `content/bn` nesting (Phase 8) · Resources migration (Phase 5).

---

## Phase 4 — Core content: Research, Projects, Publications *(original plan)*

⚠ **This phase moves URLs. Highest-risk phase in the programme.**

### Files likely affected
```
content/projects/            → content/research/funding/      (move)
content/projects/                                              (new — portfolio)
config/_default/hugo.yaml    taxonomies, disableAliases: false
layouts/projects/{list,single}.html                            new
layouts/_partials/views/{project-card,grant}.html
content/research/_index.md
```

### Work — strictly ordered

| # | Task | Notes |
|---|---|---|
| 4.1 | Export inbound links for `/projects/*` from Search Console | **Before touching anything** |
| 4.2 | Set `disableAliases: false`; verify alias stubs generate **on GitHub Pages** via a branch deploy | `_redirects` is Netlify-only and will not work here |
| 4.3 | Rename label only: `Funding → /research/#funding`; retitle the page | Zero URL change — ships independently |
| 4.4 | Move `content/projects/` → `content/research/funding/`; add `aliases:` to each grant | |
| 4.5 | Update both `collection` blocks' `filters.folders` | |
| 4.6 | Fix grant `date: '2008-01-01'` → real `start_date` | P1-08 |
| 4.7 | Grant list view `citation` → `grant` | P3-08 |
| 4.8 | **Verify `/projects/g-01/` redirects live.** Do not proceed otherwise | Gate |
| 4.9 | *Separate deploy:* add `project_category` + `technology` taxonomies; create `content/projects/` portfolio | Never same deploy as 4.8 |
| 4.10 | Build project list + detail templates, card component, category filter | IA §7 |
| 4.11 | Publications: paginate or virtualise the 62-item list; keep the filter toolbar | P2-12 |
| 4.12 | Enable math rendering for publication titles | **P1-09** |
| 4.13 | Merge duplicate `[X03]`/`[X04]`; normalise `Andrea Alu`/`Alù` | P1-10 |
| 4.14 | Research landing: Overview / Areas / Funding / Collaborations / Opportunities | IA §6 |

### Expected screenshots
`research`, `research-funding`, `projects` (list), `project-detail`, `publication`, `publication-detail`
at 1440 / 390, light + dark.

### Validation
- **Every old `/projects/*` URL returns a working redirect** (checked against production, not locally).
- Sitemap valid; no 404 in the internal link crawl.
- No raw LaTeX in any `<title>` or `<h1>`.
- Project cards legible at 390 px.

### Checkpoint `redesign-phase-4`. **Rollback here requires reverting content moves — take a tag before 4.4.**

---

## Phase 5 — Supporting areas: Teaching, Team, Resources, News

⚠ **Also moves URLs** (`/outreach/**` → `/resources/**`).

### Files likely affected
```
content/outreach/            → content/resources/              (move, 9 subsections)
content/people/                                                 (delete)
content/teaching/**                                             restructure
layouts/_partials/views/compact-teaching.html
layouts/authors/*, layouts/people/term.html
```

### Work

| # | Task | Fixes |
|---|---|---|
| 5.1 | `/outreach/` → `/resources/`, aliases on **every** moved page | IA §9 |
| 5.2 | Replace the duplicated `/outreach/_index.md` block with a real section index | **P1-12** |
| 5.3 | Group Resources: Academic / Templates / Blog / Professional / Beyond Research | IA §9 |
| 5.4 | Delete `/people/`, alias → `/authors/`; add `<h1>` to `/authors/` | **P1-11**, P0-03 |
| 5.5 | Teaching: Courses / Curriculum / Notes / Workshops | IA §8 |
| 5.6 | Strip inline `<style>` from teaching Markdown; fix the `</style>`-closed `<span>`; move table styling into the design system | **P2-10** |
| 5.7 | Fix multi-`h1` in course content (`#` → `##`) | P2-13 |
| 5.8 | Move the BRACU ARM workshop from blog → `/teaching/workshops/` | IA §8 |
| 5.9 | Remove News from nav; keep homepage feed + footer link + RSS | IA §10 |
| 5.10 | Add `<h1>` + unique meta descriptions to all section landings; fix `/authors/me/` `<title>` | P0-03, **P2-07** |

### Expected screenshots
`teaching`, `teaching-course`, `team`, `team-profile`, `resources`, `blog`, `blog-post`, `news`
at 1440 / 390.

### Validation
- All `/outreach/*` redirects live.
- Exactly one `<h1>` per route.
- No `<style>` in any content file.
- Every section landing has a unique meta description.

### Checkpoint `redesign-phase-5`.

---

## Phase 6 — Detail templates

**Objective:** the pages people actually land on from Google.

### Files likely affected
```
layouts/publication/single.html
layouts/projects/single.html
layouts/authors/term.html
layouts/_partials/page_header_teaching.html
layouts/_partials/breadcrumbs.html          (enable)
layouts/_default/single.html
content/teaching/notes/**                   (new: book structure)
```

### Work

| # | Task |
|---|---|
| 6.1 | Publication detail: citation block, abstract, figures, BibTeX, DOI/PDF, related work |
| 6.2 | Project detail: motivation → problem → features → screenshots → architecture → status → tech → links → docs → related publications (IA §7) |
| 6.3 | Course page: outline, outcomes, materials, schedule, announcements |
| 6.4 | Team profile: bio, interests, publications, projects, supervision |
| 6.5 | Article/news template on `68ch` prose width |
| 6.6 | Books & Notes: book index, chapter template, sidebar, prev/next, downloads |
| 6.7 | **Enable breadcrumbs** for depth ≥ 2 (partial already exists, unused) |
| 6.8 | Set `width`/`height` on all images | P2-15 |

### Card-vs-detail split (Projects)

| Listing card | Detail page only |
|---|---|
| Thumbnail (16:9) | All screenshots |
| Title | Motivation, problem statement |
| 1-sentence summary | Full feature list |
| Category + status | Architecture / technical detail |
| Top 3 technologies | Full tech stack |
| Repo + demo icons | Docs, releases, downloads, licence, collaborators, related publications |

Rule: a card answers *"is this relevant to me?"* in under three seconds. Everything else is detail.

### Validation
Each detail type renders correctly with **minimal** front matter (no missing-field crashes) and with
**maximal** front matter (no overflow). Long titles, long author lists and missing images all tested.

### Checkpoint `redesign-phase-6`.

---

## Phase 7 — Responsive, accessibility, cross-browser

**No new features. Verification only.**

| # | Task |
|---|---|
| 7.1 | Full matrix: 7 viewports × light/dark × 12 routes, captured **and inspected** |
| 7.2 | Keyboard-only traversal of every interactive component; document tab order |
| 7.3 | Re-run `audit-instrument.js` across all routes; contrast must be zero-fail |
| 7.4 | Reduced-motion pass — confirm content remains visible |
| 7.5 | 200 % and 400 % zoom reflow |
| 7.6 | Touch targets ≥ 44 px on every control |
| 7.7 | **Firefox (Gecko)** — requires either a manual pass or approval to install Playwright |
| 7.8 | **Brave** manual pass with Shields on (Cloudflare beacon, `backdrop-filter`, fingerprint protection) |
| 7.9 | Screen-reader smoke test (NVDA on Windows): landmarks, headings, nav, forms |
| 7.10 | Lighthouse a11y + best-practices on 5 representative routes |

> **7.7 is a decision point.** No Firefox is installed on this machine and no Playwright. Gecko-specific
> risk is concentrated in `backdrop-filter`, `:focus-visible` rendering, the nav toggle, and SVG `<text>`
> metrics. Either approve a Playwright + Firefox install, or schedule a manual pass.

### Validation
`visual-qa-baseline.md` passes in full, on Chromium **and** Firefox.

### Checkpoint `redesign-phase-7`.

---

## Phase 8 — Polish and performance

| # | Task | Fixes |
|---|---|---|
| 8.1 | Motion audit: durations/easing to spec; zero infinite animations | §13 |
| 8.2 | Micro-interactions: hover, focus, active, loading, empty states |
| 8.3 | Audit `backdrop-filter` and `blur` usage (19 + 4 currently) | P2-14 |
| 8.4 | Tailwind output size review; strip unused custom CSS |
| 8.5 | Image formats (AVIF/WebP), responsive `srcset`, correct eager/lazy |
| 8.6 | Font loading (only if a webfont was introduced — the recommendation is none) |
| 8.7 | Fix `og:url`/`og:image` to `https`; **replace the SVG `og:image` with a PNG**; `og:locale` → `en_US` | **P2-05** |
| 8.8 | Decide on Cloudflare Insights/email-decode; document it | P2-08 |
| 8.9 | Resolve `content/bn/` nesting → `content.bn/` | **P0-04** |
| 8.10 | Remove `.html1` dead files; confirm and remove vestigial `_vendors/` | P3-10 |
| 8.11 | Fix `rel="noopener"`, generic "Read more" link texts, `lang` attribute | P3-01…03 |
| 8.12 | Style the Dimensions badge into the type system | P3-05 |
| 8.13 | Record the Hugo 0.152.1 → 0.158+ upgrade path (`.Site.LanguageCode` deprecation is **upstream**, in `_vendor/`) | P2-09 |

### Validation
Lighthouse ≥ 95 performance / ≥ 95 a11y / 100 best-practices on 5 routes.
Zero console errors. Zero build warnings other than the known upstream deprecation.

### Checkpoint `redesign-phase-8`.

---

## Sequencing notes

- **Phase 2 is independently shippable** and closes both P0s plus P1-03, P1-04, P1-13, P1-14 and P2-01.
  If only one phase ever ships, this is the one.
- **Phases 4 and 5 move URLs.** They should not run in the same week, and each needs a live redirect
  verification gate before the next begins.
- **Phase 3 can run before or after Phase 4.** Running it first gives the visible win sooner; running it
  after means the Featured Projects section has real content instead of a placeholder.
- **Phases 7 and 8 must not be skipped or merged.** Phase 7 is where the rendered-evidence discipline of
  this audit gets re-applied.

---

## New override register

Every file copied out of `_vendor/` into `layouts/` is permanent maintenance cost. Record them here as
they are created:

| File | Phase | Reason | Upstream version shadowed |
|---|---|---|---|
| _(none — Phase 1 created no overrides)_ | 1 | | |
| _(none — Phase 2A created no new overrides)_ | 2A | Every file touched was already a project override or project-owned custom code | — |

### Files changed in Phase 2A, by category

**New project-owned files (2):**
```
assets/css/tokens.css
assets/js/sajid-nav.js
```

**Existing project overrides modified (5):**
```
layouts/baseof.html                                 skip link + conditional <main>
layouts/_partials/site_head.html                    tokens+custom CSS concat; nav JS into bundle
layouts/_partials/components/headers/navbar.html    button toggle, active state, spacing, a11y
assets/css/blox/navbar.css                          dead checkbox selectors removed; shadow removed
assets/css/custom.css                               rewritten as the foundation layer
```

**Existing project-owned custom files modified (3):**
```
layouts/_partials/custom/logo.html                  <style> removed, role/title added, xmlns fixed
layouts/_partials/custom/logo-loader-loop.html      :root leak scoped, xmlns + aria-label fixed
layouts/_partials/custom/logo-loader.html           :root leak scoped, xmlns + aria-label fixed
```

**Config (1):**
```
config/_default/hugo.yaml                           baseURL -> https://www.sajid.bd/
```

**Housekeeping (1):**
```
assets/css/custom-fonts.css   duplicate hardcoded header rule removed
                              (file appears unreferenced — flagged, not otherwise changed)
```

### Asset cost of Phase 2A

| | Before | After | Note |
|---|---|---|---|
| Project stylesheet | `custom.min.css` ~0.6 KB | `sajid-foundation.min.css` **10.8 KB** | Same request count (tokens + custom concatenated) |
| JS bundle (en) | ~19.4 KB | **21.2 KB** | `sajid-nav.js` added to the existing bundle — no new request |
| HTTP requests | unchanged | unchanged | 2 stylesheets + 1 deferred bundle |

No webfont, icon library, animation library, CSS framework or JS dependency was added.
