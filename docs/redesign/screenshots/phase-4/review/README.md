# Phase 4 — Research, Funding, Projects, Publications — review set

| | |
|---|---|
| **Date** | 2026-09-22 |
| **Branch** | `redesign/phase-4-core-content` |
| **Base revision** | `cf77135` (origin/main after Phase 3); Phase 4 not yet committed |
| **Hugo** | 0.158.0 local (CI pins 0.152.1) |
| **Browser** | Chrome headless (Chromium), DPR 1, zoom 100 % |
| **Server** | `hugo server --disableFastRender --port 1330` |

## Files

| File | Page | Viewport | Theme |
|---|---|---|---|
| `01-research-1440-light.png` | `/research/` | 1440 | light |
| `02-funding-1440-light.png` | `/research/funding/` | 1440 | light |
| `03-projects-1440-light.png` | `/projects/` | 1440 | light |
| `04-project-detail-1440-light.png` | `/projects/ctadmin/` | 1440 | light |
| `05-publications-1440-light.png` | `/publication/` | 1440 | light |
| `06-projects-390-light.png` | `/projects/` | 390 | light |
| `07-project-detail-390-light.png` | `/projects/ctadmin/` | 390 | light |
| `08-research-390-light.png` | `/research/` | 390 | light |
| `09-projects-1440-dark.png` | `/projects/` | 1440 | dark |
| `10-research-1440-dark.png` | `/research/` | 1440 | dark |

`09`/`10` included because dark mode differs materially — alternating
`--sj-background-subtle` bands and inverted accent fills.
No `11-review-issue-*`: no unresolved migration or responsive defect.

## Redirect verification status

| Gate | Status |
|---|---|
| Alias files generated | ✅ verified in generated output |
| Browser follows each legacy URL to the right page | ✅ verified against a localhost-baseURL build |
| Internal links updated (0 stale `/projects/g-*`) | ✅ 269-link crawl across 14 routes |
| **Deployed / production redirect** | ❌ **not verified — no branch preview exists** |

## Is `/projects/` safe to publish?

**Yes, with one post-deploy check.** Grants no longer live there, all three old
deep URLs have verified alias stubs, and nothing on the site links a grant
under a "Projects" label. The one thing local testing cannot prove is
production behaviour, because this repository has no preview deployment —
GitHub Pages builds only on push to `main`.

Run the five URL checks in `docs/redesign/phase-4-url-migration.md` §6
immediately after the first deploy, and purge the Cloudflare cache for
`/projects/*` if a stale grant listing appears.

## Post-review correction pass (2026-09-22)

Two visual corrections after review. Routing, aliases, taxonomies, publication
behaviour, project content and navigation semantics are unchanged; the
migration conclusions above still stand and were re-verified.

**1. `/projects/` trailing whitespace.** The page wrapper used symmetric
`padding-block: 72px`, and the shell adds `.page-body.my-10` (40px top and
bottom) around non-landing pages. The two stacked to a **112px** gap between
the last card and the footer. Padding-bottom reduced to 32px, giving a **72px**
gap — inside the intended 64–96px. No card dimensions, column counts or
responsive breakpoints changed (3-col ≥1024, 2-col ≥640, 1-col below).

**2. Research → Collaborations.** This was a **rendering bug, not sparse
data** — four collaborators are defined and all four assets exist. Two causes:

- The partner logos were styled `width: auto; max-height: 44px`, so each
  logo's width depended on its decoded intrinsic size. The images are
  lazy-loaded and below the fold, so until they decoded their computed width
  was **0px** — only the one nearest the viewport appeared. Replaced with an
  explicit box (`width: 100%; height: 40px; object-fit: contain`), which
  reserves space up front, preserves aspect ratio and stretches nothing.
  **All four logos now render, no JavaScript or animation required.**
- The logos block carries its own `py-16 sm:py-20 lg:py-24` wrapper — 96px top
  and bottom at desktop — stacking on the section spacing, so 192px of padding
  surrounded 168px of content. Overridden to 32px, scoped to `#collaborations`
  so the homepage partner band is untouched.

Section height **462px → 290px** (−37%), with 4/4 logos visible.

Re-verified after the corrections: production build passes; all three legacy
`/projects/g-*` aliases still redirect correctly (browser-followed); 0 stale
`/projects/g-*` links across 1,089 links on 13 routes; Funding still lists 3
grants on both `/research/funding/` and `/research/`; no horizontal overflow at
1440 or 390 in either theme.

Screenshots `01`, `03`, `06`, `08`, `09`, `10` were regenerated from the
corrected build; the rest of the review set is unchanged.

## Known issues (not Phase 4 scope)

- **Publications are not paginated** — deliberate. The filter renders all 62
  entries into the DOM and toggles `.pub-hidden`; static pagination would
  silently break filtering. See the roadmap for the trade-off.
- **~296 sub-24 px targets on `/publication/`** — the dense citation actions.
  Reduced from ~420 by giving them a 32 px hit area; full WCAG 2.5.8
  compliance is Phase 7.
- **Pagefind search still 404s** — untouched, pre-existing.
- `content/bn` remains nested inside the EN `contentDir`, so the build still
  warns about duplicate `/bn/...` target paths. Pre-existing, Phase 8.
- KaTeX renders math into both visual HTML and an accessible MathML copy, so
  reading `h1.textContent` shows the expression repeated. That is normal KaTeX
  output, not a visual defect — the page displays it once.

## Regenerate

```powershell
hugo server --disableFastRender --port 1330
node docs/redesign/evidence/phase4-qa-driver.mjs
```
