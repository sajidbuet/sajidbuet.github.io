# Phase 3 — Homepage redesign, review set

| | |
|---|---|
| **Date captured** | 2026-09-22 |
| **Branch** | `redesign/phase-3-homepage` |
| **Base revision** | `a604aaf` (`origin/main` after Phase 2A) — Phase 3 not yet committed |
| **Build** | local `hugo server --disableFastRender`, Hugo 0.158.0 |
| **Browser** | Chrome headless (Chromium), device scale factor 1, zoom 100 % |
| **Wordmark state** | **Settled.** All captures taken 6.5 s after load; the one-shot `Lab → .BD → Lab` transition completes at ≈4.3 s. Every screenshot shows the complete wordmark and the caret removed. |

## Files

| File | Viewport | Theme | Content |
|---|---|---|---|
| `01-home-1440-light-full.png` | 1440 wide, full page | light | Complete redesigned homepage (6,608 px) |
| `02-home-1440-light-top.png` | 1440 × 900 | light | Navbar + full hero + start of Research |
| `03-home-390-light-full.png` | 390 wide, full page | light | Complete homepage, mobile (9,254 px) |
| `04-home-390-light-top.png` | 390 × 844 | light | Mobile header + full hero + start of next section |
| `05-home-1440-dark-top.png` | 1440 × 900 | dark | Included because dark mode differs materially — surfaces alternate via `--sj-background-subtle` bands, and filled accent buttons switch to dark-on-cyan |
| `06-home-390-dark-top.png` | 390 × 844 | dark | Mobile dark, same reason |

`05` and `06` are the conditional dark-mode pair from §32.4. No `07-review-issue-*` files: no unresolved responsive defect was found.

## Known issues remaining (not Phase 3 scope)

- **Dimensions citation badges** on Selected Publications render in their own
  third-party font and box, outside the type system. Pre-existing P3-05, Phase 8.
- **Search control** in the header is still non-functional (Pagefind index is
  never built). Pre-existing P1-02; left exactly as found, per instruction.
- **Teaching and News sections** are ~800 px each for three rows. The rows
  themselves are ~110 px; the remainder is the shared collection block's own
  header and wrapper chrome. Reducing it further means changing a block used by
  other pages, which belongs to Phase 5.
- The first heading in the DOM is still `H3: No results found` from the
  always-present search modal. Pre-existing, tied to the search item above.

## Full evidence

The complete matrix (7 viewports × 2 themes, full-page + viewport, per-section
crops, reduced-motion, 200 % zoom, focus state) is in `../full-qa/`.
Screenshots are gitignored; regenerate with:

```
hugo server --disableFastRender --port 1323
node docs/redesign/evidence/phase3-qa-driver.mjs
```
