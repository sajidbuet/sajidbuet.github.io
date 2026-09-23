# SAJID Lab — sajid.bd

Research group website for **SAJID Lab** (Smart & Advanced Junction of Intelligent
Devices), Department of EEE, BUET. Built with [Hugo](https://gohugo.io/) and
[HugoBlox](https://hugoblox.com/), deployed to GitHub Pages.

> This README did not exist before; it is new. Redesign history, acceptance
> criteria and per-phase evidence live in [`docs/redesign/`](docs/redesign/) —
> start with [`docs/redesign/README.md`](docs/redesign/README.md).

## Running locally

```bash
hugo server --disableFastRender
# → http://localhost:1313
```

Production build:

```bash
HUGO_ENVIRONMENT=production hugo --minify
```

Node dependencies (Tailwind, and Playwright for the QA drivers):

```bash
pnpm install --frozen-lockfile     # what CI runs
```

## Interactive research-circuit hero

The homepage hero renders an abstract PCB / photonic-waveguide schematic behind
the central SAJID Lab identity. Six research domains — photonics, quantum,
embedded systems, antennas, computing and energy — feed traces toward the centre,
which is the "junction" the lab is named after.

**Idle is deliberately almost invisible.** Traces sit at 13% opacity (16% in dark
mode), domain icons at 12–16%, domain titles at ~32%, and the descriptive lists
are fully hidden. The wordmark, institutional line, lede, PI credit and CTAs are
the only things meant to read at a glance.

**Hover, focus or tap a domain** and that one domain rises: the icon goes to 88%
with a 3% scale, the title becomes solid, its three descriptive lines fade in,
and only that domain's traces brighten to the accent colour while the rest stay
subdued. One domain is dominant at a time. A single signal pulse runs from the
domain toward the centre.

**Pointer proximity** brightens traces within about 190px of the cursor, using a
radial CSS mask over a second copy of the network — no per-path distance maths
and no layout reads.

**Idle pulses** send one signal along a randomly chosen trace every 3–7 seconds,
with jitter so it never reads as a loop. Every animation is finite; nothing on
the page runs an infinite animation.

### Responsive behaviour

| | Domains shown | Labels | Descriptions |
|---|---|---|---|
| Desktop ≥ 1200px | 6 | yes | on hover / focus |
| Tablet 768–1199px | 4 | yes | on hover / focus |
| Mobile < 768px | 3 symbols | on tap only | hidden |

On mobile there is no cursor interaction; tapping a symbol reveals its label and
tapping elsewhere clears it. The hero is content-height on phones rather than a
fixed tall block.

### Accessibility

Decorative circuitry is `aria-hidden` and `pointer-events: none`, so it never
appears in the accessibility tree and never intercepts a click meant for a CTA.
Each domain is a real `<button>` with an explicit accessible name, reachable by
keyboard, showing the Phase 2A focus ring, and revealing the same information on
focus as on hover. Disclosure semantics (`aria-expanded` / `aria-controls`) are
attached only at widths where a description actually exists.

### Reduced motion

Under `prefers-reduced-motion: reduce` the travelling pulses, the pointer
spotlight, the entrance animation and every transform are disabled. The static
schematic remains, and hover/focus still reveals a domain — instantly, because
that state change is information rather than decoration.

### Principal files

| Path | Role |
|---|---|
| `layouts/_partials/custom/hero-circuit.html` | SVG trace network, domain icons, domain list |
| `layouts/_partials/hbx/blocks/hero-with-stats/block.html` | hero block that renders it |
| `assets/css/homepage.css` | circuit styling, density tiers, states, dark mode, reduced motion |
| `assets/js/sajid-hero-circuit.js` | domain activation, pulses, spotlight, viewport gate |
| `content/_index.md` | hero copy and domain-independent content |

QA drivers and recorded results: `docs/redesign/evidence/phase8-circuit-*.mjs`
and the matching `.json` files.
