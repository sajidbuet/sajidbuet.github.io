# SAJID.BD Redesign

| Phase | Status |
|---|---|
| **Phase 1 — Audit & Design** | ✅ Complete. No production code changed. |
| **Phase 2A — Visual Foundation & Application Shell** | ✅ Complete (2026-09-21). Foundation implemented; no content or route touched. |
| **Phase 2B — Navigation IA Migration** | ✅ Delivered across Phases 4–5 (the menu now points at real pages). |
| **Phase 3 — Homepage** | ✅ Complete (2026-09-22). 12,822 → 6,608 px; 0 infinite animations. |
| **Phase 4 — Core content** | ✅ Complete (2026-09-22). Funding → `/research/funding/`, new `/projects/` portfolio. One manual gate: production redirects. |
| **Phase 5 — Supporting content** | ✅ Complete (2026-09-22). `/outreach/` → `/resources/`, Teaching restructured, `/people/` retired. One manual gate: production redirects. |
| **Phase 6 — Detail templates** | ✅ Complete (2026-09-22). Twelve detail types; one `_vendor` shadow. |
| **Phase 7 — Responsive / a11y / cross-browser** | ✅ **PASS WITH MANUAL CHECKS REMAINING** (2026-09-22). See [`phase-7-validation.md`](phase-7-validation.md). |
| **Phase 8 — Polish & performance** | 🟡 In progress. Items 8.14, 8.16, 8.17 and 8.18 delivered; see the roadmap. |

### Phase 8 so far

| # | Item |
|---|---|
| 8.14 | Hero flush under the navbar — the 48 px white band was the block's section padding landing outside the hero's gradient |
| 8.16 | Hero background figure (superseded by 8.18) and hero vertical rhythm |
| 8.17 | Navbar brand hidden at the top of the homepage, revealed once the hero wordmark clears the sticky header |
| 8.18 | **Interactive research-circuit hero** — PCB/waveguide schematic, six research domains on hover/focus/tap, finite pulses, pointer spotlight, reduced-motion and mobile variants |

Homepage hero content changed with 8.18: the old heading and the
publications/citations/h-index strip are gone, replaced by an institutional
eyebrow, a new lede, the PI credit and two CTAs. The wordmark now carries the
page's single `<h1>`.

### Phase 7 at a glance

210 Chromium cells (7 viewports × 2 themes × 15 routes) · 120 Firefox 155 cells ·
120 Brave cells · 32 zoom cells · 597 keyboard tab stops · 24,788 links crawled.

**Zero** contrast failures, **zero** horizontal overflow, **zero** duplicate ids,
**zero** images without dimensions, **zero** infinite animations, **zero** unnamed
interactive elements, **zero** positional drift between Gecko and Blink.
Lighthouse **Accessibility 100** on all five audited routes.

Eleven defects were found and fixed, including two contrast failures that made
course-table headers literally invisible, a site-wide 3.38:1 accent colour, a
duplicate `id="main"` on 67 routes, and 61 invalid zero-size links per publication
listing.

**Still outstanding, and not claimed as passed:**

1. **NVDA screen-reader smoke test** — cannot be operated from an agent session.
   Procedure in `phase-7-validation.md` §11.1. **This blocks the `redesign-phase-7` tag.**
2. Production redirect verification (carried forward from Phases 4–5).
3. Brave + Shields against the production deploy, where Cloudflare injects its
   beacon and `email-decode.min.js` at the edge.
4. Four 2020 course PDFs and six BRACU workshop files that were never committed.

> **Build note.** OneDrive `…-SAJID-PC` conflict copies are present again and add
> two duplicate aliases. They are untracked user files and were not deleted; set
> `$env:HUGO_IGNOREFILES = "-SAJID-PC\.,outreach[\\/]templates"` before building
> until they are cleaned up.

**Phase 2A closed:** P0-01 (mobile nav keyboard), P0-02 (dark-mode header), P1-03 (logo accessible
name), P1-13 (`<main>` + skip link), P1-14 (reduced motion), P2-01 (focus ring), P2-06 (`baseURL`),
P2-16 (SVG namespace), plus the reduced-motion half of P1-05 — and two defects found during 2A itself
(a global theme-token leak from the hero logo SVG, and the navbar wrapping at 1024 px).

Phase 2A evidence: `screenshots/phase2a/` (39 captures + 6 inspectable crops),
`evidence/phase2a-qa.json`, `evidence/phase2a-qa-driver.mjs`.

---

## Documents

| Document | What it is |
|---|---|
| [`visual-audit.md`](visual-audit.md) | Findings P0–P3 with rendered-browser evidence, method, and prod-vs-local comparison |
| [`current-design-inventory.md`](current-design-inventory.md) | Measured inventory of the existing system + the upstream/vendor/override/custom boundary |
| [`information-architecture.md`](information-architecture.md) | Current and proposed IA, Funding→Research migration, new Projects area, URL risk |
| [`design-system-proposal.md`](design-system-proposal.md) | Brand direction, principles, tokens, type, colour, layout, motion, navigation |
| [`implementation-roadmap.md`](implementation-roadmap.md) | Phases 2–8: objectives, files, validation, rollback |
| [`visual-qa-baseline.md`](visual-qa-baseline.md) | Acceptance criteria every later phase must pass, with Phase-1 baselines |
| [`phase-4-url-migration.md`](phase-4-url-migration.md) | Funding → `/research/funding/` move record and alias verification |
| [`phase-5-url-migration.md`](phase-5-url-migration.md) | `/outreach/` → `/resources/` move record and alias verification |
| [`phase-6-detail-template-map.md`](phase-6-detail-template-map.md) · [`phase-6-detail-template-qa.md`](phase-6-detail-template-qa.md) | Detail-template inventory and QA |
| [`phase-7-validation.md`](phase-7-validation.md) | **Phase 7 gate report** — responsive matrix, keyboard, contrast, motion, zoom, touch, Chromium/Firefox/Brave, Lighthouse, and what remains manual |

**Read in this order for review:** `visual-audit` → `information-architecture` →
`design-system-proposal` → `implementation-roadmap`.

## Evidence

| Path | Contents |
|---|---|
| `screenshots/current/*.jpg` | 46 full-page captures — `<page>-<W>x<H>-<theme>-<browser>.jpg` |
| `screenshots/current/detail/*.jpg` | 34 region crops and interaction captures cited by specific findings |
| `evidence/page-audit-chromium.json` | Per-route/viewport/theme measurements (contrast, overflow, headings, motion, targets, network) |
| `evidence/interaction-probe.json` | Real Tab traversal, scroll-reveal, sticky header, hover, 200 % zoom |
| `evidence/structure-probe.json` | `h1`/`main` coverage across 16 routes, mobile-menu keyboard reachability, dark-header state |
| `evidence/audit-instrument.js` | The in-page measurement function — **reusable in Phase 7** |
| `evidence/capture-driver.mjs` | Dependency-free CDP driver — **reusable in Phase 7** |

Nothing was installed to produce these. The driver uses Node 23's built-in `WebSocket` to control the
Chrome already on the machine.

---

## The five things that matter most

1. **Dark mode makes the header unreadable** — white text on a hardcoded white translucent bar,
   ~1.1 : 1 contrast, every page. (P0-02)
2. **Mobile navigation cannot be opened by keyboard** — `display:none` checkbox, unfocusable label.
   Below 1024 px there is no keyboard path to the nav at all. (P0-01)
3. **The navbar points at nothing.** All nine items are anchors into one 12,728 px homepage, while a
   good page tree (`/research/`, `/publication/`, `/teaching/`, `/authors/`, `/news/`) is unreachable
   from primary navigation. (P1-01)
4. **The accent colour fails AA everywhere** — `#0c96c8` at 3.38 : 1 is both the link colour and the
   button fill site-wide. (P1-04)
5. **`/projects/` holds funding grants**, blocking the namespace the new portfolio needs, under three
   different names. (P1-08)

**Phase 2 alone closes items 1, 2 and 4.**

---

## Recommendation: a project-specific skill

**Recommended — but after Phase 2, not now.**

A `sajid-website-design` skill would improve consistency in future Claude Code sessions, for a specific
reason visible in this audit: the failure modes here are **repo-specific and non-obvious**, and a fresh
agent would rediscover them slowly or trip over them. Examples from this session that cost real time:

- `_vendor/` is live (all four modules resolve `+vendor`) — editing there looks like it works and is
  destroyed by the next `hugo mod vendor`.
- `disableAliases: true` means `aliases:` front matter emits nothing — the obvious redirect mechanism
  silently does nothing.
- `_redirects` is generated but the site deploys to **GitHub Pages**, which ignores it.
- The homepage hero silently drops `content.title` and `secondary_action` — configured content that
  never renders and never warns.
- Reduced motion is honoured by the logo partials but not the gradient mesh, so "it respects reduced
  motion" is true and false at the same time.

### What it should contain

| Section | Content |
|---|---|
| Brand rules | Keep SAJID wordmark, Q-PACERS, cyan; brand vs interactive colour split |
| Tokens | The semantic token table, with the rule that components never reference literals |
| Typography | Scale, weights 400/600/700, 65–75 ch measure, one `h1` per page |
| Motion limits | ≤ 400 ms, no infinite animation, reduced-motion must leave content **visible** |
| Prohibited patterns | Gradient meshes, glassmorphism on content, everything-is-a-card, decorative badges, hover lift+scale+shadow |
| HugoBlox rules | The four-layer boundary; how to shadow a partial; never touch `_vendor/`; the override register |
| Repo gotchas | `disableAliases`, GitHub Pages vs Netlify configs, nested `content/bn`, the dead `baseURL` |
| Responsive QA matrix | 7 viewports × 2 themes, plus how to run `evidence/capture-driver.mjs` |
| Accessibility floor | Contrast, focus token, 44 px targets, landmarks, keyboard nav |
| Card patterns | When a card, when a list — with publications explicitly excluded from cards |
| Navbar behaviour | 6 items + CTA, no dropdowns until the component is rebuilt |
| Project page patterns | Card-vs-detail split |

### Why after Phase 2

The skill should encode the **target** system, not the current one. Written now it would document
tokens that do not exist yet. Written after Phase 2, it documents shipped reality — and Phases 3–8
become materially more consistent.

`docs/redesign/` serves the same purpose in the meantime.

---

## Constraints observed in Phase 1

- No production layout, partial, CSS, JS, config, content, taxonomy, menu, route or image was modified.
- No dependency, plugin, browser or system software was installed.
- No commit, push, reset, checkout, amend, rebase or history rewrite.
- Pre-existing uncommitted work (`cv/papers.bib`, four untracked logo assets) left exactly as found.
- All new files are confined to `docs/redesign/`.

### Known limitations *(as recorded in Phase 1 — most are now closed; see the Phase 7 column)*

| Phase 1 limitation | Now |
|---|---|
| **Firefox was not tested** — Gecko not installed, Playwright not authorised | ✅ Closed in Phase 7. Playwright added as a devDependency; Firefox 155 driven over 120 cells, 0 drift vs Chromium |
| **Brave was not separately driven** | ✅ Closed in Phase 7. 120 cells in Brave itself, with and without the hosts Shields blocks. The production edge injections remain a manual check |
| **Safari/WebKit** unavailable on Windows | ⬜ Still untested, still not claimed |
| Screen-reader behaviour **inferred from the accessibility tree** | ⬜ Still inferred. Phase 7 automated every static equivalent and reads names from Chromium's real AX tree, but NVDA cannot be operated from an agent session — procedure in `phase-7-validation.md` §11.1 |
| **Lighthouse was not run** | ✅ Closed in Phase 7. Lighthouse 13.5.0 via `npx` on 5 routes: Accessibility 100 ×5, Best Practices 96 ×5 |
