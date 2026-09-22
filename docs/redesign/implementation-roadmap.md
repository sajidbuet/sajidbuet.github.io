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

## Phase 5 — Supporting Content ✅ COMPLETE (one manual gate outstanding)

**Branch:** `redesign/phase-5-supporting-content` · **Base:** `2fe07ba` · **Date:** 2026-09-22
**Hugo:** 0.157.0 extended · **Browser evidence:** Chrome 153 headless over CDP

Full migration record: `docs/redesign/phase-5-url-migration.md`.
Review set: `docs/redesign/screenshots/phase-5/review/`.

### Resources migration

`/outreach/**` → `/resources/**`, with `/outreach/` itself aliased to `/resources/`.
**21 aliases** generated and verified three ways (alias file exists → points at the
intended canonical URL → target exists and is not itself an alias). PASS 21 / FAIL 0.

| Old | New |
|---|---|
| `/outreach/` | `/resources/` |
| `/outreach/lor/` | `/resources/academic/lor/` |
| `/outreach/scientific-typing/` | `/resources/academic/scientific-typing/` |
| `/outreach/templates/` | `/resources/templates/` |
| `/outreach/graphics/` | `/resources/templates/graphics/` |
| `/outreach/blog/` + 9 posts | `/resources/blog/` + 9 posts |
| `/outreach/professional/` | `/resources/professional/` |
| `/outreach/songs/`, `/poetry/`, `/hobbies/` | `/resources/personal/…` |
| `/outreach/blog/20260811-bracu-arm-workshop/` | `/teaching/workshops/bracu-arm-workshop/` |
| `/people/` | `/authors/` |

`content/outreach/_index.md` — the verbatim copy of the homepage outreach block
(audit item 6) — is **deleted**, replaced by a real section index driven by the
content tree (`layouts/resources/overview.html`). Groups render only when they
have content, so there are no empty shelves. Personal material (music, poetry,
hobbies) is preserved under **Beyond Research**, not discarded.

### Teaching

Restructured **without moving a single course URL** (roadmap §22 — the flat
`/teaching/<course>/` routes are stable and meaningful). New landing at
`layouts/teaching/overview.html`:

```
Teaching
├── Current & Recent Courses   4 courses, from the section's own pages
├── Curriculum & Laboratory Development   /teaching/curriculum/   (new)
├── Books & Lecture Notes                 /teaching/notes/        (new, honest placeholder)
├── Workshops & Tutorials                 /teaching/workshops/    (new)
└── Archive                               28 past offerings, linked by count
```

- **Curriculum & Lab Development** is written *only* from material already in the
  repository — the EEE 416 ground-up redesign and the lab development proposal
  described in `Archive/Jan2022_EEE416.md`. No achievement was invented; the page
  says so explicitly and links its four EEE 416 offerings as evidence.
- **Books & Lecture Notes** is a placeholder with no fake chapters.
- **Workshop** moved out of the blog with its 11 asset files, history preserved.

### Teaching content repairs

| Issue | Files | Fix |
|---|---|---|
| `<style>` block declaring `:root` custom properties and unscoped `table:not(.no-stripe)` rules from inside page content | `EEE400.md`, `Jul2025_EEE303.md`, `Jul2025_EEE304.md` | Removed; rules moved to `assets/css/phase5.css`, scoped via a new `sj-section-<section>` body class and re-expressed in semantic tokens. The originals hardcoded `#ffffff` row backgrounds, which inverted badly in dark mode — now fixed |
| `<span style="color:red">…</style>'` — a span closed with `</style>` plus a stray quote | same 3 files | Replaced with a semantic `> **Course announcements:** …` blockquote. Also removes colour-only emphasis |
| Content-level `#` H1 duplicating the template H1 | 10 files | Demoted to `##` |
| `##Heading` with no space — rendered as literal text, not a heading | 68 occurrences across Teaching + Resources | Space inserted. Fenced code and preprocessor directives skipped |
| Blog post with **no front matter at all** and 7 content H1s | `20260224-Word-Lakh-Taka-BDT` | Title/summary/date/alias added; headings demoted |

The three `<style>` tags in the EEE 416 files were **left alone** — they sit inside
inline `<svg><defs>`, where they are legitimately SVG-scoped, not a global leak.
The Word-pasted course-outcome tables (270 inline `style=` attributes each) were
also left as-is: converting them risks losing course-outcome data for no
rendering benefit. They now scroll rather than overflow on narrow screens.

### Team

- `/people/` **deleted** — it differed from `/authors/_index.md` by one line
  (`subtitle`), verified with `diff` before removal. Aliased to `/authors/`.
- The **`authors` taxonomy is not renamed** (IA §16). Navbar says "Team", route
  stays `/authors/`. No author URL changed.
- `/authors/` had **zero `<h1>`** (visual-audit P1-11): `type: landing` never
  renders `.Content`, so the old `# Meet Our Research Team` body copy was silently
  dropped. Fixed with a leading `markdown` block — no `_vendor` override needed.
- `/authors/alumni/` had the same zero-`h1` problem; same fix.
- `/authors/me/` shipped `<title>SAJID Lab</title>` with no name — the file had **no
  front matter at all**. Added `title` + `description`.
- Removed a link to `/opportunities`, which has never existed.

### News

**News was already absent from the navbar after Phase 4** — the roadmap item was
stale. Verified it stays discoverable: homepage "View all news" collection, a new
footer **News Archive** link, and `/news/index.xml` (15 KB). `/news/` was given a
unique meta description; it had been inheriting the generic site one.

### Navigation

`Home · Research · Publications · Projects · Teaching · Team · Resources · Contact`

**`Home` deliberately kept.** IA §4.1 requires the mobile menu to expose Home, and
`navbar.html` renders desktop and mobile from a single `range site.Menus.main` —
removing the item would strip it from both. Site-wide breadcrumbs, the other
stated precondition, are also still not enabled. Recorded in `menus.yaml`.

### Metadata

All **15** section landings now carry exactly one `<h1>`, a unique `<title>`, a
unique meta description and OG description. Before: `/authors/`, `/authors/alumni/`
had no `h1`; `/authors/me/` had no title; `/news/` had the generic site description.

### QA

- **0** responsive anomalies across 15 routes × 7 viewports = **105 combinations** (1920/1440/1280/1024/768/430/390).
- **0** `h1 != 1` and **0** heading-level skips across all 105 combinations, light and dark.
- **0** horizontal overflow at 200 % zoom (640 px) on Teaching, Resources, Team.
- Light **and** dark verified on every audited route; no literal colours introduced.
- Keyboard focus: **66/66** tab stops across Resources, Teaching and Team show the
  2 px `--sj-focus-ring` outline. (An earlier probe reporting 15/16 missing was
  measuring programmatic `.focus()`, which by design does not match
  `:focus-visible` — `custom.css:83` suppresses the ring for exactly that case.)
- Mobile menu opens, `aria-expanded` toggles, all 8 items present including Home.
- Internal-link crawl: **41,748** links over **599** pages — **0** resolving via an
  alias, **0** broken attributable to Phase 5.
- Production build passes, no new warnings.

### A Phase 4 regression caught and fixed

The first build after the move sent `/projects/g-03/` to
`/research/funding/g-03-sajid-pc/`. OneDrive had left untracked `…-SAJID-PC`
conflict copies inside `content/`, which Hugo published as real pages carrying
duplicate `/projects/g-0*/` aliases (631 pages vs 626). All 11 were verified
byte-identical to `HEAD`, backed up and removed; the Phase 4 aliases resolve
correctly again.

### A `.gitignore` trap caught before commit

`.gitignore` had an unanchored `resources/`, which matched `layouts/resources/`
and `content/resources/` as well as Hugo's generated root `resources/`. Four
newly created Phase 5 files — the Resources landing, two group indexes and the
section template — were invisible to git and would have been left out of the
commit while their aliases still redirected traffic to them. Anchored to
`/resources/`. Details in `phase-5-url-migration.md` §11.

### Overrides created

**None from `_vendor`.** New project-owned files only:
`layouts/resources/overview.html`, `layouts/teaching/overview.html`,
`assets/css/phase5.css`.
Modified existing project-owned files: `layouts/baseof.html` (one body class),
`layouts/_partials/site_head.html` (one CSS line), `layouts/_partials/site_footer.html`.

### Deferred

Site-wide breadcrumbs and removal of the textual `Home` item (needs the mobile
menu to be split from the desktop loop) · full Books/Notes chapter engine (Phase 6) ·
author profile detail templates (Phase 6) · sub-24 px targets, incl. 75 on the
workshop handout (Phase 7) · Pagefind search still 404s · `/bn/resources/` and BN
section nesting (Phase 8) · 6 files referenced by the workshop handout that were
never committed (needs the author) · `content/authors/_index.md1` and
`content/authors/me/_index.bn.md1`, stray tracked files Hugo ignores.

### Outstanding manual gate

**Production redirect verification.** Local alias files and localhost browser
redirects both pass, but GitHub Pages behaviour cannot be proven locally. After
deploy, check the five URLs listed in `phase-5-url-migration.md` §7 (allow for a
Cloudflare purge).

---

## Phase 5 — Supporting areas: Teaching, Team, Resources, News *(original plan, superseded by the record above)*

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

## Phase 6 — Detail Templates ✅ COMPLETE

**Branch:** `redesign/phase-6-detail-templates` · **Base:** `6b518eb` · **Date:** 2026-09-22
**Hugo:** 0.157.0 extended · **Browser evidence:** Chrome 153 headless over CDP

Full QA report: `docs/redesign/phase-6-detail-template-qa.md`.
Template inventory: `docs/redesign/phase-6-detail-template-map.md`.
Review set: `docs/redesign/screenshots/phase-6/review/`.

### The finding that shaped the phase

**Six of the twelve detail types had no project-owned template at all** —
courses, archived courses, workshops, blog articles, news posts and personal
pages all fell through to `_vendor/.../blox/layouts/single.html`. That is where
the missing breadcrumbs and the unbounded reading width both came from, and it
is why `layouts/single.html` is the one `_vendor` shadow this phase created.

### Publication detail (6.1)

**The action row had been dead since Phase 4.** The template read `.Params.doi`,
`.Params.url` and `.Params.pdf`; no publication carries any of those — Phase 4
moved DOIs to `hugoblox.ids.doi`, publisher links live in `links:`, the one PDF
is `url_pdf`. Every publication page shipped with **zero** external actions.

| | Before | After |
|---|---|---|
| DOI button | 0 | **52** |
| Publisher URL button | 0 | **8** |
| PDF button | 0 | **1** |
| No external action | 61 | **4** (correctly — they have no such data) |

Also: two empty `<p>` elements removed; the inline `<style>` block moved to
`assets/css/phase6.css` and re-expressed in Phase 2A tokens (its dark rule ended
in `rgba(255,255,255,1)`, painting a white band across the hero); figure support
with explicit dimensions and non-cropping `Fit`; breadcrumb. **No publication
bundle contains an image**, so figure support is capability only.

### Project detail (6.2)

Phase 4's layout already covered the sequence, so this repaired rather than
rewrote it. The screenshot loop read its caption from `$.file` — the *page's*
File object, always nil — and emitted `alt=""` for every image; both fixed.
Breadcrumb upgraded from a hardcoded single link.

Narrative sections stay author-written Markdown. Neither project has body
content or screenshots, and inventing an architecture section from a repository
name is what the brief forbids.

### Course detail (6.3)

New `layouts/teaching/single.html`. Across 33 course files there are **zero**
uses of `outcomes`, `schedule`, `materials`, `announcement` or `assessment` in
front matter — that structure is authored in Markdown. The template therefore
supplies the header, metadata strip, archived notice, TOC and table treatment,
and renders the body as written. `instructor:` is supported and set by no course.

**Page weight:** the vendor template's `page_related` partial emitted a link to
*every publication in both languages* on every course page.
`/teaching/jul2025_eee303/` went from **250 internal links to 23**.

### Team profile (6.4)

Publications and Projects sections added; profiles gained breadcrumbs.
`/authors/me/` lists 8 of **59** papers with a count link. 146 of 164 author
pages gained a related section, **0** with an empty list.

**Supervision was not built — no supervision data exists** in any of the 19
author files, and inferring it from co-authorship is not permitted.

Two data quirks were worked around template-side rather than silently changed:
all 59 publications write `' me'` with a leading space (minting a phantom
`/authors/-me/`), and student profiles live at `/authors/<id>-<name>/` while
their credits create `/authors/<name>/`. Fixing either at source means editing
59 files or renaming the author taxonomy — the latter an explicit stop condition.

### Article / news (6.5)

New `layouts/single.html`. Measured reading width **68 ch** on article, news,
workshop and chapter pages; figures, tables, code and display math break out
wider. Six blog articles began at `###`/`####` and produced an `h1 → h3` skip —
all now start at `##`.

### Books & Notes (6.6)

Architecture and templates complete and validated; **content deliberately not
created**. `layouts/notes/list.html` serves both the shelf and a book landing;
`layouts/notes/single.html` gives the chapter view with sidebar and prev/next
ordered by page `weight`. `type: notes` is **cascaded** from the section index —
without it, chapters inherit `type: teaching` and render as courses.

Validated against a temporary 3-chapter fixture (first chapter has no previous,
last has no next, sidebar marks the current entry), which was **deleted before
completion**. `/teaching/notes/` shows an honest empty state. **Full-book PDF
export is not implemented and is not claimed** — no PDF engine was added.

### Breadcrumbs (6.7)

`layouts/_partials/breadcrumbs.html` rewritten as `<nav aria-label>` + `<ol>`,
current page unlinked with `aria-current="page"`, wrapping at 390 px, depth ≥ 2
only. Two inadequate implementations already existed: the project one was unused
and emitted a `◎` glyph plus a non-existent icon; the vendor one is a `<div>`
with `whitespace-nowrap overflow-hidden` gated behind a flag no page sets.
**13/13** real detail routes pass all structural checks.

### Images (6.8)

**0 of 354** `<img>` tags across 316 detail pages lack `width`/`height`. The one
offender was the footer `BUET_LOGO.svg`; Hugo cannot report SVG dimensions, so
its intrinsic size came from the file's own `viewBox` rather than a guess.

### QA

18 routes × 3 viewports + dark at 1440. **0** horizontal overflow, **0**
`h1 != 1`, **0** heading skips, **0** images without dimensions, **0** empty
lists. Focus: **26/26** tab stops ringed. Mobile chapter sidebar collapses
52 px / 259 px. Crawl: 27,872 links over 599 pages, **0 stale**, 0 new breakage.
Production build passes. One console error, pre-existing (Pagefind 404).

### Overrides created

**One `_vendor` shadow:** `layouts/single.html`. Other new project-owned files:
`layouts/teaching/single.html`, `layouts/notes/{list,single}.html`,
`assets/css/phase6.css`.

### Deferred

`' me'` leading-space cleanup across 59 publications and the resulting
`/authors/-me/` duplicate · author identity consolidation (needs taxonomy work) ·
supervision data model · full-book PDF export · real book/notes content ·
missing student portraits · Pagefind · `/bn/` detail routes (Phase 8) ·
sub-24 px targets (Phase 7).

---

## Phase 6 — Detail templates *(original plan, superseded by the record above)*

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

## Phase 7 — Responsive, accessibility, cross-browser ✅ COMPLETE (NVDA outstanding)

**Branch:** `redesign/phase-7-responsive-accessibility-cross-browser` · **Base:** `e17a415` · **Date:** 2026-09-22
**Hugo:** 0.158.0 extended · **Chromium:** Chrome 153 · **Gecko:** Firefox 155 (Playwright) · **Brave:** 153.1.95.104
**Lighthouse:** 13.5.0 via `npx`

Full report: [`phase-7-validation.md`](phase-7-validation.md).
Raw evidence: `docs/redesign/evidence/phase7-*.json`. Drivers: `evidence/phase7-*.mjs`.

**Status: PASS WITH MANUAL CHECKS REMAINING.** Every automatable criterion passes.
**Do not create the `redesign-phase-7` tag until the NVDA smoke test (7.9) has been run.**

| # | Task | Result |
|---|---|---|
| 7.1 | Matrix 7 viewports × light/dark × routes | ✅ **210 cells**, 15 routes (the baseline's 12 with its "and" pairs expanded), captured **and** inspected |
| 7.2 | Keyboard traversal; document tab order | ✅ **597/597** stops show the focus ring, 0 order inversions, 0 traps, skip link first on all 9 walks; orders recorded in `phase7-keyboard.json` |
| 7.3 | `audit-instrument.js`, contrast zero-fail | ✅ **0 failures** across all 210 cells, both themes (8 unique defects at the start of the phase) |
| 7.4 | Reduced motion | ✅ **0** infinite animations under reduced *and* normal motion; visible text identical in both states |
| 7.5 | 200 % / 400 % zoom | ✅ 32 cells, **0** horizontal scrolling; zoom not disabled |
| 7.6 | Touch targets ≥ 44 px | ✅ **every control** ≥ 44×44 at coarse pointer; the 38 remaining targets are inline-exempt text links |
| 7.7 | **Firefox (Gecko)** | ✅ Playwright installed as a devDependency (approved). Firefox 155, **120 cells**, 0 overflow, 0 contrast failures, **0 positional drift vs Chromium** |
| 7.8 | **Brave + Shields** | ✅ 120 cells in Brave itself (`navigator.brave` confirmed), run with and without the blocked hosts; nothing depends on them. Production edge injections remain manual |
| 7.9 | **NVDA smoke test** | ⬜ **MANUAL VERIFICATION REQUIRED** — NVDA cannot be operated from an agent session. Static equivalents automated; procedure in `phase-7-validation.md` §11.1 |
| 7.10 | Lighthouse a11y + best practices, 5 routes | ✅ **Accessibility 100 on all five**; Best Practices 96, held there solely by the pre-existing Pagefind 404 |

### Defects found and fixed

Eleven. The four that mattered most:

1. **Course-table column headers were invisible** — `#ffffff` on `#f8fafc` (1.05:1) in light and
   `#0f172a` on `#0b1220` in dark, caused by a specificity split where the background came from
   `phase6.css` (0,3,2) and the colour from `phase5.css` (0,2,2). A second instance in `tbody` row
   headers was caught later by Lighthouse, which the in-house instrument had missed because it
   de-duplicates by tag + colour + size.
2. **`--color-primary-600` still failed AA site-wide** at 3.38:1 — the migration `tokens.css` promised
   for Phase 3 had only been applied to the homepage. Remapped to the accent already approved in
   `design-system-proposal` §2.13 (`#0e7490`, 5.36:1), with 700 moved to `#155e75` so the hover step
   survives. `--sj-brand` is unchanged.
3. **67 routes shipped a duplicate `id="main"`** — a regression against the X13 ✅ baseline, created
   when Phase 6 gave every detail template the `id`/`tabindex` that Phase 2A had put on the shell
   wrapper. `/teaching/notes/` additionally had two nested `<main>` landmarks.
4. **61 invalid, unnamed, zero-size links per publication listing** — `views/citation.html` still read
   `.Params.doi`, empty since Phase 4, emitting `href=""` and, on taxonomy pages, scheme-less
   `href="10.1364/…"` (90 broken links over 29 pages). Repairing the href also reactivated the
   Dimensions badge, which measurably introduced a dark-mode contrast failure, 37 dimensionless
   images and nested anchors — so the dormant block was removed instead and folded into item 8.12.

### Overrides created

**Four new `_vendor` shadows** — the first since Phase 6. Each is a verbatim copy with one commented,
minimal change. See the register at the end of this document.

### Deferred (and why)

Pagefind 404 (item 2.15 — the author's decision; it is the only console error and the only thing
holding Best Practices below 100) · `backdrop-filter` × 21 (8.3; supported in all three engines) ·
animation durations > 400 ms (8.1) · the logo's Arial dependency (2.16 — a brand-asset change) ·
`/bn/` link breakage (8.9) · the Dimensions badge (8.12) · 12 inline text links at 19–21 px ·
the `/news/` single-column card grid.

### Outstanding manual gates

1. **NVDA smoke test** — blocks the checkpoint tag.
2. **Production redirect verification** — carried forward from Phases 4 and 5; GitHub Pages behaviour
   still cannot be proven locally.
3. **Brave + Shields in production** — the Cloudflare beacon and `email-decode.min.js` are injected at
   the edge and do not exist on a local build.
4. Four 2020 course PDFs and six BRACU workshop files that were never committed (needs the author) —
   the only 10 remaining broken English links.
5. Confirm whether `/news/2024-02-17-call-for-research/` should point at grant `g-03`.

### A working-tree hazard

OneDrive had again produced `…-SAJID-PC` conflict copies and restored a pre-Phase-5
`content/outreach/templates/graphics/`. Together they added 16 pages and **2 duplicate aliases** —
the same collision class that broke Phase 4's redirects once already. The files are untracked user
work and were **not** deleted; they are excluded at build time with

```powershell
$env:HUGO_IGNOREFILES = "-SAJID-PC\.,outreach[\\/]templates"
```

which touches nothing on disk. Any shell building this repository needs it until they are cleaned up.

### Validation
`visual-qa-baseline.md` passes in full on Chromium **and** Firefox, except X16 (screen reader), which
is outstanding, and X9's "single column at 400 %" for the homepage stat strip, which stays two short
numeric columns with no scrolling or truncation — recorded rather than forced.

### Checkpoint `redesign-phase-7` — **not yet created.** Blocked on 7.9.

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
| 8.14 | ✅ **Done** — homepage hero flush under the navbar. See below |
| 8.15 | Remove the committed OneDrive conflict copies. See below |
| 8.16 | ✅ **Done** — hero research-field background + hero rhythm. See below |

### 8.14 — Hero/navbar gap (done)

A blank white band sat between the navbar's bottom border and the top of the hero gradient: **48 px,
at every viewport, in both themes**.

**Root cause.** `content/_index.md` gave the `hero-with-stats` block
`design.spacing.padding: ['3rem', 0, '2rem', 0]`. HugoBlox emits that as an inline style on the outer
`<section class="hbb-section blox-hero-with-stats">`, but the gradient lives on the inner `.sj-hero`
div, and `.sj-hero__inner` had no vertical padding of its own. So the 48 px rendered as bare page
background *above* the gradient. The `.home-section-bg` layer inside the section is transparent for
this block, so nothing filled the band.

Not a header-compensation problem, not a margin collapse, not an empty wrapper. No negative margin
was used.

**Fix.** The 48 px moved from outside the gradient to inside it:

```yaml
# content/_index.md — hero block
css_class: 'sj-hero-section'
spacing:
  padding: [0, 0, '2rem', 0]
```
```css
/* assets/css/homepage.css */
.sj-hero-section .sj-hero__inner { padding-block-start: 3rem; }
```

`sj-hero-section` scopes the internal padding to that one block instance, so the pairing is explicit
and cannot leak. The section's `2rem` bottom padding is deliberately kept: it is spacing *between*
the hero and the next section, and the hero's own `border-bottom` already closes the band.

**Verified.** Gap 0 at 1440 / 768 / 390, light and dark. The wordmark does not move — it stays at
`y = 113` at every viewport, exactly where it was; only the gradient extends up to `y = 65`. Homepage
height unchanged at 6,905 px. Sticky header still sticks and stays opaque after scrolling. `#contact`
and the other anchors still land clear of the header (`secTop 73`, heading below the header bottom).
`/research/`, `/publication/`, `/teaching/<course>/`, `/authors/me/` and `/resources/` are untouched
(`.sj-hero-section` is absent from all of them). Phase 7 gates re-run on the homepage across 7
viewports × 2 themes: 0 overflow, 0 contrast failures, 0 duplicate ids, 0 overlaps, 0 infinite
animations.

**Still open:** the Bengali homepage has the same defect (96 px gap) but a different hero
configuration — it keeps the default section padding and still enables the `gradient_mesh` background
that Phase 3 removed from the English hero. It was deliberately left alone; it belongs with 8.9.

### 8.16 — Hero research-field background (done)

A sparse quantum-photonics / device-network figure behind the hero: nodes, thin curved
connections, wavefront arcs and circuit traces. Inline SVG plus project-owned CSS and ~30 lines of
vanilla JS. No video, no Three.js, no WebGL, no particle library, no raster asset, no third-party
dependency.

**Files:** `layouts/_partials/custom/hero-field.html` (new), `assets/css/homepage.css`,
`layouts/_partials/hbx/blocks/hero-with-stats/block.html`.

**Density by breakpoint** — three authored tiers, `display: none` on the ones that do not belong at a
width, so hidden shapes are never painted. Not a scaled-down copy of the desktop artwork.

| | Nodes | Connections | Arcs | Traces |
|---|---|---|---|---|
| Mobile `<768px` | **7** | 4 | 1 | 0 |
| Tablet `≥768px` | **12** | 9 | 2 | 1 |
| Desktop `≥1024px` | **21** | 15 | 3 | 2 |

`viewBox` is `1200×600` with `xMidYMid slice`, so the crop tightens as the viewport narrows; each
tier's shapes are authored inside the band that survives at its breakpoint (measured: x 442–758 at
390px, x 227–973 at 768px).

**Animation.** CSS transitions only — there is no `animation` property anywhere in the feature, so it
cannot leave an infinite animation running. `pathLength="1"` on every stroked path normalises the dash
geometry so the draw-on is one rule rather than per-path JS measurement. Intro completes in ~0.8–1.2 s
and settles; measured `document.getAnimations()` at rest: **0 running, 0 infinite**.

**Idle JS.** None. A rAF is scheduled only in response to a pointer event; the return to equilibrium is
a CSS transition. Parallax is mouse-only (`pointer: fine`), maximum displacement measured 1.98 px
(back layer) / 2.98 px (mid) / 4.96 px (front), returning to exactly 0 on `pointerleave`.

**Reduced motion.** The inline script declines to arm the animation at all, so the settled field
renders immediately with no draw-on, no node sequence and no parallax. A second CSS guard covers the
preference changing after load.

**A bug this surfaced.** Phase 3's `@media (prefers-reduced-motion: reduce) { .sj-hero * { opacity: 1
!important } }` — which exists so no hero *content* is left invisible — also caught the decorative
field and rendered it at full strength. The field's resting opacities are now re-asserted at higher
specificity inside its own reduced-motion block; the content guarantee is untouched.

**Performance.** Measured with Lighthouse 13.5.0 against a static server over `hugo --minify`, median
of 3 runs, desktop form factor.

| Build | Perf | A11y | Best practices | Observed LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| No field (first measurement) | 61 | 100 | 96 | 247 ms | 18 ms | 0.0027 |
| No field (same bytes, re-measured later) | **58** | 100 | 96 | — | 19 ms | 0.0027 |
| Empty field element, 0 shapes, no script | **57** | 100 | 96 | — | 88 ms | 0.0027 |
| **With the field (shipped)** | **58** | **100** | **96** | 267 ms | 17 ms | 0.0027 |

The first no-field run scored 61 and a later run of **the identical bytes** scored 58, and a control
build containing an *empty* field element scored 57 — so the 61 is an outlier and the score difference
is inside this machine's noise floor, not a regression. Isolation runs also ruled out the CSS mask
(58), the inline script (58 with it stripped) and CSS containment (58) as causes.

The deterministic cost, which does not vary: **+4,269 B of HTML (+1,122 B gzipped, +2.4 % of the
document)**, +4,620 B of minified CSS, 41 SVG elements, and **+20 ms of observed LCP element render
delay** (239 → 261 ms). CLS and TBT are unchanged.

One structural fix came out of that measurement: the field is emitted **after** the hero content in the
DOM, not before. It is `position: absolute` with `z-index: 0` against the content's `z-index: 1`, so
stacking is identical either way — but with it first, the hero lede's render delay rose to 410 ms
because 41 SVG shapes had to be parsed and styled before the hero text could paint.

**Hero rhythm**, tightened in the same pass: mark→h1 20→16 px, support→CTAs 32→24 px, CTAs→stats
48→32 px. Hero 599 → 571 px at 1440; homepage 6,905 → 6,877 px.

**QA.** 1440 / 1024 / 768 / 430 / 390, light and dark, Chromium 153 and Firefox 155: density correct,
0 document overflow, 0 infinite animations, 0 tab stops inside the field, navbar→hero gap 0. Reduced
motion correct in both engines. Keyboard: 14 stops walked, none inside the field, all ringed. Zoom
200 % (720 CSS px) and 400 % (360 CSS px): 0 overflow, h1 and CTA visible.

### 8.15 — Committed OneDrive conflict copies

The `redesign-phase-7` commit (`29b0db6`) included 29 `…-SAJID-PC` conflict copies and the restored
pre-Phase-5 `content/outreach/` directory. They were excluded from the Phase 7 measurements via
`HUGO_IGNOREFILES` and were not in the recommended `git add` list, but they are now tracked and will
deploy. Effect on the production build:

| | Pages | Aliases |
|---|---|---|
| Expected (Phase 5–7 baseline) | 626 | 51 |
| Current `main` | **642** | **53** |

Three stale routes are published that should not exist — `/outreach/templates/graphics/` (the
pre-Phase-5 page, shadowing the Phase 5 alias target), `/projects/_index-sajid-pc/` and
`/research/funding/_index-sajid-pc/` — plus two duplicate `/projects/g-0*` aliases, the same collision
class that broke Phase 4's redirects once already. `assets/css/{homepage,phase4}-SAJID-PC.css` are
dead copies that no template references.

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
| _(none — Phase 4 created no `_vendor` shadows)_ | 4 | New project-owned templates only | — |
| _(none — Phase 5 created no `_vendor` shadows)_ | 5 | New project-owned templates only: `layouts/resources/overview.html`, `layouts/teaching/overview.html`, `assets/css/phase5.css` | — |
| `layouts/single.html` | 6 | Shadows `_vendor/github.com/HugoBlox/kit/modules/blox/layouts/single.html`. Six detail types (courses, workshops, blog articles, news, personal pages) had no project template and fell through to it. The upstream version gates breadcrumbs behind `show_breadcrumb`, which no page sets, and renders prose in a `max-w-6xl` column with no reading measure. | HugoBlox kit, vendored copy at `6b518eb` |
| `layouts/_partials/components/search-modal.html` | 7 | Shadows `_vendor/…/blox/layouts/_partials/components/search-modal.html`. The search input had no label, no `aria-label` and no `<label for>` — an unlabelled form control on all 626 routes (baseline X10). Also marks eight decorative SVGs `aria-hidden`, names the close button, and corrects `type="text"` to `type="search"`. Nothing else changed. | HugoBlox kit, vendored copy at `e17a415` |
| `layouts/_partials/hbx/blocks/logos/block.html` | 7 | Shadows `_vendor/…/blox/blox/logos/block.html`. All five `<img>` sites guard `width`/`height` behind `{{ if not $isSVG }}`, and every partner logo is an SVG, so four images on `/` and four on `/research/` shipped with no intrinsic dimensions (M4). Adds an `{{ else }}` branch delegating to `functions/svg_dimensions`. Nothing else changed. | HugoBlox kit, vendored copy at `e17a415` |
| `layouts/_partials/hbx/blocks/contact-info/block.html` | 7 | Shadows `_vendor/…/blox/blox/contact-info/block.html`. The three social links contain only an inline SVG and carried no accessible name — confirmed unnamed in Chromium's accessibility tree. Adds a derived `aria-label` and hides the icon. Nothing else changed. | HugoBlox kit, vendored copy at `e17a415` |
| `layouts/_partials/views/card.html` | 7 | Shadows `_vendor/…/blox/layouts/_partials/views/card.html`. The image-placeholder anchor had no name and duplicated the card title's destination — 10 unnamed, redundant tab stops on `/news/`. Also fixes `dark:text-zinc-500` metadata (3.69:1) and gives "Read more" its item title for assistive technology. Nothing else changed. | HugoBlox kit, vendored copy at `e17a415` |

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
