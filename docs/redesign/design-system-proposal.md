# SAJID.BD — Design System Proposal

**Phase 1 proposal. Not implemented.**
Every contrast ratio below was computed, not estimated — see §4.4 for the method.

---

## 1. Brand direction

### In plain language

The site should read like **well-set instrumentation documentation**: precise, quiet, dense with real
information, and confident enough not to decorate itself. A visitor should be able to tell within three
seconds that this is a working research group in electrical engineering — not a product launch.

The existing identity is already good and is **not being replaced**. The SAJID wordmark, the circuit-trace
letterforms, the Q-PACERS framework and the cyan accent all stay. What changes is the *discipline* around
them: one accent instead of eight gradients, one spacing scale instead of four ad-hoc values, and a dark
mode that is designed rather than inherited.

### The one visual signature

The brief asks for **one or at most two** memorable signatures. The recommendation:

> **The circuit trace.** The SAJID logo already draws letterforms as PCB traces with nodes and vias.
> Extract that vocabulary — thin 1px rules with a small node at the terminus — and use it as the site's
> single structural motif: section dividers, the active-nav indicator, the "read more" affordance,
> and the connector between a research area and its publications.

It is derived from the existing brand rather than imported, it is cheap to render (strokes, not blur),
it carries the engineering identity honestly, and it works identically in light and dark. Everything
else stays plain.

**Second, optional signature:** the `Lab ⇄ .BD` wordmark transition, played **once** on first load and
then settled (see §11). Keep the idea, lose the loop.

### What this explicitly rejects

Gradient meshes, glassmorphism on content surfaces, six unrelated card gradients, glowing borders,
floating decorative shapes, and animated backgrounds. The audit found all six on the current homepage.
They are the reason the site currently reads closer to a product page than a lab.

---

## 2. Design principles

1. **Content density is a feature.** This is an academic site. A publication list that fits 62 entries on
   a scannable page is doing its job. Do not dilute density into cards for their own sake.
2. **Earn every effect.** A visual treatment ships only if it clarifies hierarchy, signals state, or aids
   comprehension. "It looks modern" is not a reason.
3. **One accent, used sparingly.** Cyan means *interactive or brand*. It never means decoration.
4. **Light and dark are one system.** Every token is defined in both modes at definition time. No token
   ships with a single value.
5. **Structure before surface.** Hierarchy comes from type scale, spacing and rules — not from boxes,
   shadows and fills.
6. **Accessible by construction.** Contrast, focus and target size are properties of the tokens and base
   components, so individual pages cannot accidentally fail them.
7. **Motion is feedback, not decoration.** If it does not respond to a user action or communicate a state
   change, it should not move. Nothing loops forever.
8. **Maintainable by a human and an agent.** Semantic tokens, documented components, no one-off CSS in
   content files.

---

## 3. Typography

### 3.1 Families — keep the current approach

The site currently downloads **no webfont**; body text resolves to the system stack. That is a genuine
performance and reliability win, and the brief asks for maintainability and performance. **Keep it.**

| Role | Stack |
|---|---|
| **UI / body** | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif` |
| **Mono** | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace` |
| **Display** | *Same as UI*, at heavier weight and tighter tracking |

**No new font family.** If a single display face is ever wanted, add exactly one variable font,
self-hosted, `font-display: swap`, subset to Latin + Bengali — and only after Phase 8 measures the cost.

> **Must fix regardless:** the logo SVGs set `font-family: Arial-BoldMT, Arial` on live `<text>` elements.
> On Linux/Android the substitute face has different metrics and the wordmark shifts inside a fixed
> `viewBox`. **Convert the logo's text to outlines (paths).** A wordmark should not depend on a font
> being installed.

### 3.2 Type scale

A 1.25 (major third) scale, rounded to whole pixels. The current site jumps 24 px → 48 px → 72 px with
nothing between; this fills the gap.

| Token | Size | Line-height | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `text-2xs` | 12 px | 1.4 | 500 | +0.02em | Badges, metadata — **never body text** |
| `text-xs` | 13 px | 1.5 | 400 | 0 | Captions, footnotes |
| `text-sm` | 14 px | 1.6 | 400 | 0 | Secondary text, card body |
| `text-base` | 16 px | **1.65** | 400 | 0 | Body |
| `text-lg` | 18 px | 1.6 | 400 | 0 | Lede |
| `text-xl` | 20 px | 1.45 | 600 | −0.01em | Card titles, `h4` |
| `text-2xl` | 25 px | 1.35 | 600 | −0.015em | `h3` |
| `text-3xl` | 31 px | 1.25 | 700 | −0.02em | `h2` |
| `text-4xl` | 39 px | 1.15 | 700 | −0.025em | `h1` |
| `text-5xl` | 48 px | 1.1 | 700 | −0.03em | Hero `h1` (desktop only) |
| `text-stat` | 44 px | 1.0 | 700 | −0.02em | Metric figures |

Changes from today: body line-height 1.5 → **1.65** (better for long academic prose); stat figures
**72 px/900 → 44 px/700** (the current treatment is the loudest thing on the page and outweighs the
section headings); `h2` **48 px → 31 px**.

### 3.3 Weights

**400 / 600 / 700 only.** Today's 900 is used once and should go. Never use 300 or lighter — it fails
legibility at small sizes and reads as fashion.

### 3.4 Measure

| Context | Target | Max |
|---|---|---|
| Body prose | **65–72 ch** | 75 ch |
| Lede | 55–65 ch | 70 ch |
| Card body | 40–55 ch | 60 ch |

Implemented as `max-width: 68ch` on prose containers. Today's research and outreach body text measures
**≈ 96 characters per line** — the single biggest readability defect in the type system.

### 3.5 Heading rules

- Exactly **one `<h1>` per page**, always. Four routes currently have zero and one has four.
- Never skip levels.
- Markdown content starts at `##`. The page title supplies the `h1`.
- Visual size is a **token**, not a level — a visually small `h2` is fine; an `h3` standing in for an
  `h2` is not.

---

## 4. Colour

### 4.1 Semantic tokens

Tokens are **semantic**, never literal. Components reference `--color-accent`, never `--cyan-700`.

| Token | Light | Dark | Role |
|---|---|---|---|
| `background` | `#ffffff` | `#0f172a` | Page |
| `background-subtle` | `#f8fafc` | `#0b1220` | Alternating bands |
| `surface` | `#ffffff` | `#111c2e` | Cards, panels |
| `surface-raised` | `#ffffff` | `#18263c` | Hover / elevated |
| `surface-header` | `#ffffffe6` | `#0f172ae6` | **Header — fixes P0-02** |
| `text-primary` | `#0f172a` | `#f8fafc` | Body |
| `text-secondary` | `#475569` | `#94a3b8` | Meta, captions |
| `text-tertiary` | `#64748b` | `#64748b` | De-emphasised |
| `border` | `#e2e8f0` | `#1e293b` | Hairlines |
| `border-strong` | `#cbd5e1` | `#334155` | Dividers, inputs |
| `accent` | `#0e7490` | `#22d3ee` | **Interactive** — links, active state |
| `accent-hover` | `#155e75` | `#67e8f9` | Hover |
| `accent-contrast` | `#ffffff` | `#0f172a` | Text on a filled accent |
| `brand` | `#0c96c8` | `#0c96c8` | **Logo and graphics only — never text** |
| `focus-ring` | `#0e7490` | `#22d3ee` | Focus outline |
| `success` | `#15803d` | `#4ade80` | Status: active |
| `warning` | `#a16207` | `#fbbf24` | Status: emerging |
| `danger` | `#b91c1c` | `#f87171` | Errors |

### 4.2 The central colour decision

**Split the brand colour from the interactive colour.**

The current `primary-600` `#0c96c8` is used both as the logo colour *and* as every link and button fill.
It measures **3.38 : 1 on white** — it fails AA for normal text in both roles simultaneously
(visual-audit P1-04).

| Colour | on white | on `#0f172a` | white on it |
|---|---|---|---|
| `#0c96c8` (current) | **3.38** ✗ | 5.28 ✓ | **3.38** ✗ |
| `#0e7490` (proposed light accent) | **5.36** ✓ | 3.33 | **5.36** ✓ |
| `#22d3ee` (proposed dark accent) | 1.81 | **9.88** ✓ | — |
| `#475569` (proposed light secondary text) | **7.58** ✓ | — | — |
| `#94a3b8` (proposed dark secondary text) | — | **6.96** ✓ | — |
| `#71717a` (current dark muted) | — | **3.69** ✗ | — |

So: **`#0c96c8` stays as the brand colour** in the logo, illustrations and non-text graphics — where the
3 : 1 requirement for non-text contrast is met. **`#0e7490` / `#22d3ee` become the interactive colour.**
The brand is visually unchanged; the text becomes readable.

### 4.3 Gradients

Permitted in exactly one place: **the hero background**, as a single near-neutral wash of at most two
stops, both derived from `background`/`background-subtle`, **static** and at ≤ 8 % effective saturation.

Prohibited: the six research-card gradients, the animated mesh, and per-section gradient bands.
Replace the card gradients with a **flat surface plus a 3 px accent rule** at the top edge, and
distinguish research areas by *icon and label*, not by hue.

### 4.4 Contrast requirements

| Element | Minimum |
|---|---|
| Body text | 4.5 : 1 |
| Large text (≥ 24 px, or ≥ 18.66 px bold) | 3 : 1 |
| UI component boundaries, focus rings, icons | 3 : 1 |
| Status indicators | 4.5 : 1 **and** a non-colour cue (shape or label) |

Ratios computed with the WCAG 2.x relative-luminance formula against the **alpha-resolved effective
background**, not the nearest declared `background-color`. The instrument is
`evidence/audit-instrument.js`; it should be reused in Phase 7 as a regression check.

---

## 5. Layout

| Token | Value | Use |
|---|---|---|
| `container-prose` | **68ch** (≈ 640 px) | Articles, news, notes, chapters |
| `container-content` | **1120 px** | Standard sections |
| `container-wide` | **1280 px** | Publication lists, grids, team |
| `container-full` | 100 % | Hero band, footer band |

### Gutters

| Viewport | Gutter |
|---|---|
| < 640 px | 16 px |
| 640–1023 px | 24 px |
| ≥ 1024 px | 32 px |

Matches today's `px-4 / sm:px-6 / lg:px-8`. It works — keep it.

### Grid philosophy

12-column on `≥ lg`, 6-column on `md`, single column below. Components declare a column span; they never
set their own width. Card grids: 3-up at `lg`, 2-up at `md`, 1-up below — **except** publications, which
stay a single-column list at every size (a two-column citation list is harder to scan, not easier).

### Section spacing

| Token | Value | Use |
|---|---|---|
| `section-sm` | 48 px | Dense/utility sections |
| `section-md` | **72 px** | Default |
| `section-lg` | 96 px | Hero, major transitions |

Today four values (48/64/80/96) are applied with no rule, and `design.spacing: '6rem'` makes 96 px the
default. Making **72 px** the default, with 96 px reserved for real transitions, removes roughly 20 % of
the homepage height on its own.

Mobile: scale to 32 / 48 / 64 px.

---

## 6. Spacing scale

A 4 px base. **Use only these values.**

```
0 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128
```

| Token | px | Typical use |
|---|---|---|
| `space-1` | 4 | Icon/label gap |
| `space-2` | 8 | Tag padding, tight stacks |
| `space-3` | 12 | Button padding-y |
| `space-4` | 16 | Card padding (compact), paragraph gap |
| `space-6` | 24 | Card padding (default), grid gap |
| `space-8` | 32 | Card padding (roomy), heading margin-top |
| `space-12` | 48 | Sub-section gap |
| `space-16` | 64 | Section padding (mobile) |
| `space-24` | 96 | Section padding (desktop, large) |

**Vertical rhythm:** heading `margin-top` is always ≥ 1.5× its `margin-bottom`, so headings bind to the
content below them.

---

## 7. Borders and radii

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 4 px | Tags, badges, inputs |
| `radius-md` | **8 px** | Cards, buttons, panels — **the default** |
| `radius-lg` | 12 px | Modals, large media |
| `radius-full` | 9999 px | Avatars only |

Today components hardcode `rounded-2xl` (16 px) while config says `radius: "md"`. 16 px on a
900 px-wide card reads soft and consumer-grade. **8 px is the recommendation** — it reads engineered
without being severe.

Borders: **1 px only.** The 3 px accent rule on cards is a *rule*, not a border. No glowing borders,
no gradient borders.

---

## 8. Shadows

**Near-zero.** Shadows are the least convincing part of a "premium academic" aesthetic and the current
site leans on them (`shadow-sm → hover:shadow-lg` on every card and button).

| Token | Value | Permitted on |
|---|---|---|
| `shadow-none` | none | **Default for all surfaces** |
| `shadow-overlay` | `0 8px 24px -8px rgb(15 23 42 / .18)` | Only genuinely floating layers: dropdowns, modals, the open mobile menu |

Elevation on cards and panels is expressed with `border` + `surface`, not shadow. In dark mode shadows
are invisible anyway — which is exactly why border-based elevation is the more honest system.

**Remove `backdrop-filter` from the header** (19 instances per page measured; expensive to composite and
the direct cause of the dark-mode failure). Use an opaque-enough `surface-header` token instead.

---

## 9. Images

| Type | Treatment |
|---|---|
| **Project screenshots** | 16:9, `object-fit: cover`, `radius-md`, 1 px `border`. Show real UI — no device mockups, no perspective tilts |
| **Research visuals** | Native aspect ratio, `background-subtle` matte, never cropped (a figure cropped is a figure falsified) |
| **Portraits** | 1:1, `radius-full`, consistent crop and eye-line, neutral background |
| **Publication figures** | Native aspect, full content width, always captioned, always click-to-enlarge |
| **Partner logos** | Height-normalised to the same **optical** size (not the same box), monochrome in light mode, inverted in dark — currently they are not |

Rules for all:
- `width`/`height` always set — 6 of 7 homepage images currently omit them (layout-shift risk).
- `loading="lazy"` below the fold; **eager** for the hero.
- Hugo's pipeline (lanczos, q90) is working well — no change needed.
- Alt text describes function, not appearance. Decorative images get `alt=""`.
- **Never an SVG for `og:image`** — social platforms reject it (visual-audit P2-05).

---

## 10. Cards — and when not to use one

The brief warns against "everything is a card". This is the rule:

> **A card is for a heterogeneous, independently-navigable item that needs a picture.**
> If the items are homogeneous and text-only, use a list. If there is one item, use a section.

| Use a card | Use a list/row | Use neither |
|---|---|---|
| Project (thumbnail + status + tech) | **Publications** — dense citation rows | Research area overview on `/research/` |
| Team member (portrait + role) | News items (date + headline) | Contact details |
| Featured course (image + term) | Courses on `/teaching/` | Stats — a rule-separated strip, not four boxes |
| Book / lecture-note set | Grants (structured rows: agency, amount, period) | Section intros |

**Card anatomy:** `surface` · 1 px `border` · `radius-md` · `space-6` padding · optional 3 px top accent
rule · **no shadow**. Hover: `border` → `border-strong` and the accent rule brightens. **No lift, no
scale, no shadow bloom** — the current `hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg`
across three component types is the "everything floats" pattern.

Explicitly **do not** convert the publication list into cards. Its density is the best thing about it.

---

## 11. Buttons and links

### Hierarchy

| Level | Style | Use |
|---|---|---|
| **Primary** | Filled `accent`, `accent-contrast` text, `radius-md`, 12/24 px padding | One per view. The single most important action |
| **Secondary** | 1 px `border-strong`, `text-primary`, transparent | Supporting actions |
| **Tertiary** | Text + `accent`, underline on hover | Inline actions |
| **Inline link** | `accent`, `text-decoration` with `underline-offset: 2px` | Prose |
| **Quiet link** | `text-secondary`, underline on hover | Metadata (DOI, URL, Cite) |

### Rules

- **Minimum target 44 × 44 px** including padding — mobile nav already meets this; the header search
  (40 × 16) and theme toggle (24 × 18) do not, nor do the publication row actions.
- Links in prose are **always underlined**. Colour alone is not an affordance.
- Never more than one primary button in a viewport.
- Focus: `outline: 2px solid var(--focus-ring); outline-offset: 2px` — a **designed token**, applied
  uniformly. Today it is the browser default in most places and a proper ring in a few.
- `:focus-visible`, not `:focus`, so mouse users don't see rings.

---

## 12. Icons

- **One set.** The site already uses Heroicons (`hero/*`) plus Academicons for scholarly links — that
  pairing is correct and should be the whole vocabulary. No third set.
- Outline style at 1.5 px stroke, `currentColor`, sizes 16 / 20 / 24 px only.
- Icons are **decorative by default**: `aria-hidden="true"`, with the adjacent text carrying meaning.
  An icon-only control needs `aria-label`.
- Optical alignment: icons sit on the text baseline, sized to the cap height of the adjacent label.
- Never an icon in place of a label for a primary navigation item.
- **Fix:** all custom SVGs declare `xmlns="https://www.w3.org/2000/svg"` — the correct URI is `http://`.

---

## 13. Motion

### Durations

| Token | Duration | Use |
|---|---|---|
| `duration-instant` | 80 ms | Colour, opacity on hover |
| `duration-fast` | 150 ms | Small transforms, focus |
| `duration-base` | 240 ms | Menus, disclosure, tooltips |
| `duration-slow` | 400 ms | Page-level transitions (rare) |

Nothing exceeds 400 ms. The current site runs 300 ms transitions on 231 elements.

### Easing

| Token | Curve | Use |
|---|---|---|
| `ease-out` | `cubic-bezier(.2,.8,.3,1)` | Entering — default |
| `ease-in` | `cubic-bezier(.4,0,.8,.2)` | Leaving |
| `ease-standard` | `cubic-bezier(.4,0,.2,1)` | Moving between states |

Philosophy: elements decelerate into place. Nothing bounces, nothing overshoots.

### Acceptable

- Hover/focus colour and border transitions
- Menu open/close
- One-shot entrance on first paint, **from a visible base state**
- The `Lab ⇄ .BD` wordmark transition — **once**, then settled

### Prohibited

- Any `iteration-count: infinite` on a content or brand element — **14 currently run on the homepage**
- Animated gradient backgrounds
- Parallax
- Scroll-reveal that starts at `opacity: 0` (P1-05)
- Hover lift + scale + shadow combinations
- Animation of `width`/`height`/`top`/`left` — `transform` and `opacity` only

### `prefers-reduced-motion`

The **global** rule — the logo partials already do this correctly; extend it to everything:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Critically:** content must be *visible* when motion is reduced. A reveal that never fires must leave
content shown, not hidden. This is the failure mode behind P1-05, and the reason the rule above sets
`iteration-count: 1` rather than `animation: none`.

---

## 14. Navigation

### Desktop (≥ 1024 px)

```
[logo]   Research  Publications  Projects  Teaching  Team  Resources     🔍  ☾  [ Contact ]
```

- Sticky, `surface-header`, 1 px `border` bottom, **no backdrop blur**.
- Height 64 px (down from 75 px).
- Active state: 2 px `accent` rule under the label — the circuit-trace motif. **Must actually work**;
  today `$active` never evaluates true because it compares an anchor to a page URL.
- Logo is the Home link, with a real `aria-label`.
- Contact is the CTA (secondary button style), visually separated.

### Tablet (768–1023 px)

Same as mobile — the `lg` (1024 px) breakpoint for the menu switch is correct. Six items plus a CTA will
not fit at 768 px. Do not try.

### Mobile (< 768 px)

- Logo + search + theme + **a real `<button>`** hamburger.
- Full-width panel, 48 px rows (already correct — keep).
- `aria-expanded`, `aria-controls`, focus moves into the panel on open and returns to the button on
  close, `Esc` closes.
- Home appears **inside** the panel (the logo alone is not sufficient at this size).
- Contact CTA at the bottom of the panel, styled — currently the mobile CTA renders with `class=""`.

### Dropdowns

**Avoid in Phase 2.** The existing dropdown component is hover-only with a hardcoded
`aria-expanded="false"` and no key handler. Prefer flat top-level links into section landing pages that
carry their own sub-navigation. If dropdowns become necessary later, they must be rebuilt as
button-triggered disclosures with full keyboard support — budget that separately.

---

## 15. Token implementation note

Tokens should be defined **once**, as CSS custom properties on `:root` with a `.dark` override, in a
project-level stylesheet — and consumed via Tailwind v4's `@theme`. That keeps a single source of truth
readable by both a human and a future coding agent.

Three things to avoid, all of which the current code does:

1. Hardcoded colour in a component (`custom.css` `rgba(255,255,255,0.65)`) — no mode can override it.
2. `:root` declarations inside an inline SVG (`custom/logo.html`) — leaks into global scope.
3. `<style>` blocks inside Markdown content (`Jul2025_EEE303.md` sets a global `--brand: #ac1f24`) —
   invisible to the design system and unreviewable.

---

## 16. Open questions for review

1. **Accent shift.** `#0c96c8 → #0e7490` for interactive elements is slightly deeper and less bright.
   The logo keeps `#0c96c8`. Acceptable?
2. **Stat figures 72 px → 44 px.** Deliberately quieter. Or keep them loud as the credibility hook?
3. **Publications stay a list, not cards.** Agreed?
4. **Shadows removed almost entirely** in favour of borders. This is the biggest single aesthetic shift.
5. **Circuit-trace motif** as *the* signature — or is the `Lab ⇄ .BD` wordmark transition the stronger
   one to build around?
6. **Logo text → outlines.** Loses the ability to recolour text via CSS; gains cross-platform fidelity.
