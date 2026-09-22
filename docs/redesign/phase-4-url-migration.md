# Phase 4 — URL Migration Report

**`/projects/` changes meaning in this phase.** This document is the record of
how the old grant URLs were preserved while the route was repurposed.

| | |
|---|---|
| Date | 2026-09-22 |
| Branch | `redesign/phase-4-core-content` |
| Base revision | `cf77135` (origin/main after Phase 3) |
| Hugo | 0.158.0 (CI pins 0.152.1) |
| Deployment | GitHub Pages (`.github/workflows/publish.yaml`), Cloudflare in front |

---

## 1. Why a migration was needed

`/projects/` held **research grants** (`g-01`…`g-03`). The redesign needs that
route for the **software/engineering portfolio**. Grants therefore moved to
`/research/funding/`, and every old deep URL had to keep resolving.

## 2. Redirect mechanism

GitHub Pages ignores Netlify's `_redirects`, so the only working mechanism here
is **Hugo alias stubs** — an HTML page with `<meta http-equiv=refresh>` plus a
`<link rel=canonical>` pointing at the destination.

`config/_default/hugo.yaml` had **`disableAliases: true`**, which suppresses
front-matter `aliases:` entirely. It is now `false`.

> **Checked before flipping it.** The build already reported 24 EN / 11 BN
> "Aliases". Those are Hugo's automatic paginator (`…/page/1/`) and `/en/`
> stubs, which are emitted regardless of the flag. No content anywhere in the
> repository declared front-matter `aliases:`, so enabling the flag introduced
> **no unintended redirects** — only the three added deliberately.

## 3. Migration table

### Grant pages — old URL preserved

| Current (old) URL | Content | New canonical URL | Alias generated | Local build verified | Browser verified |
|---|---|---|---|---|---|
| `/projects/g-01/` | Grant — CASR Basic Research Grant | `/research/funding/g-01/` | ✅ yes | ✅ yes | ✅ yes |
| `/projects/g-02/` | Grant — RISE Basic Research Grant | `/research/funding/g-02/` | ✅ yes | ✅ yes | ✅ yes |
| `/projects/g-03/` | Grant — BUET Internal Research Grant | `/research/funding/g-03/` | ✅ yes | ✅ yes | ✅ yes |

### Root — deliberate semantic change

| URL | Before | After | Alias | Rationale |
|---|---|---|---|---|
| `/projects/` | Grant landing ("Projects", listing 3 grants) | **Projects portfolio** | ❌ none, on purpose | A page cannot both redirect to Funding *and* be the portfolio. Aliasing the root to `/research/funding/` would collide with `content/projects/_index.md` and produce a duplicate output path. Only the **root** changes meaning; every deep grant URL still resolves. |
| `/projects/page/1/` | Hugo paginator alias | gone | n/a | Paginator artifact of the old grant list, never a content URL |

### New URLs introduced

| URL | Content |
|---|---|
| `/research/funding/` | Funding & Grants landing |
| `/research/funding/g-01..03/` | Grant detail (canonical) |
| `/projects/` | Projects portfolio landing |
| `/projects/ctadmin/` | Project detail |
| `/projects/scholar-profile-exporter/` | Project detail |
| `/project_categories/…`, `/technologies/…` | New taxonomy terms |

### Unchanged (verified still resolving)

`/research/` · `/research/{quantum,photonics,antenna,computing,embedded,renewable}/` ·
`/publication/` · `/publication/<id>/` · `/authors/` · `/teaching/` · `/news/` ·
`/outreach/`

### Publication consolidation

| URL | Action |
|---|---|
| `/publication/x-04/` | Removed — byte-identical duplicate of `x-03` apart from a generated `publishDate`. Aliased to `/publication/x-03/`. |

---

## 4. Verification

### Gate A — inventory ✅
Enumerated from the generated build, not from memory: `/projects/`,
`/projects/g-01..03/`, `/projects/page/1/`. No `/bn/projects/` routes existed.

### Gate B — migration ✅
`git mv` of all three bundles (history preserved), per-grant `aliases:`, and
`date:` corrected from the placeholder `2008-01-01` to each grant's real
`start_date` (2021-01-01, 2023-01-01, 2024-04-01) so ordering is correct.

### Gate C — alias files generated ✅
Inspected generated files, not console output:

```
public/projects/g-01/index.html
  <meta http-equiv=refresh content="0; url=https://www.sajid.bd/research/funding/g-01/">
  <link rel=canonical href=https://www.sajid.bd/research/funding/g-01/>
```

### Gate D — browser-followed redirects ✅

`docs/redesign/evidence/verify-redirects.mjs` serves the built output the way
GitHub Pages does (directory → `index.html`, no rewrite rules) and drives
headless Chrome through each legacy URL.

```
LEGACY REDIRECTS
PASS  /projects/g-01/  -> /research/funding/g-01/   lands on: Design and Low-cost Fabrication of Optical Biosensors…
PASS  /projects/g-02/  -> /research/funding/g-02/   lands on: Structurally Tunable Gear-Shaped Plasmonic Sensor
PASS  /projects/g-03/  -> /research/funding/g-03/   lands on: Synergizing Deep Learning and Topology Optimization…
CANONICAL PAGES … 14/14 PASS
ALL CHECKS PASSED
```

> **A false pass was caught and fixed here, and it matters.** Hugo writes alias
> stubs with an **absolute** `baseURL`. Run against a production-baseURL build,
> the browser left localhost entirely and loaded `https://www.sajid.bd/...` —
> the *live* site. `location.pathname` still matched, so the check reported
> PASS while having verified nothing. The script now also asserts
> `location.host`, and the verification build is made with
> `--baseURL http://127.0.0.1:8099/`. Anyone re-running this must do the same.

```powershell
hugo --minify -d ./public-verify --baseURL "http://127.0.0.1:8099/"
node docs/redesign/evidence/verify-redirects.mjs ./public-verify
```

### Gate E — portfolio created ✅
Only after Gate D passed.

---

## 5. Summary against the required questions

| Question | Answer |
|---|---|
| **Old grant URLs** | `/projects/g-01/`, `/projects/g-02/`, `/projects/g-03/` |
| **New canonical URL** | `/research/funding/g-01..03/` |
| **Alias generated** | Yes — all three, verified in generated output |
| **Local build verification** | Yes — file inspection **and** browser-followed redirect against a localhost build |
| **Deployed / branch verification** | **No — not available.** See §6 |
| **Internal references updated** | Yes — 0 stale `/projects/g-*` links found in a 269-link crawl across 14 routes |
| **Remaining risk** | Production redirect behaviour is unverified until deployed. See §6 |

---

## 6. Remaining risk — the one open item

**There is no branch-preview deployment for this repository.**
`.github/workflows/publish.yaml` builds and deploys **only on push to `main`**;
there is no PR preview, and `netlify.toml` is unused. So production redirect
behaviour cannot be verified before it is live.

Local evidence is as strong as it can be made without deploying: the stubs are
byte-inspected, and a real browser follows each one to the correct destination
over HTTP with GitHub-Pages-equivalent path resolution. The mechanism is plain
`<meta http-equiv=refresh>` in a static file, which GitHub Pages serves
verbatim — there is no server-side behaviour that could differ.

**Required manual gate after the first deploy:**

```
https://www.sajid.bd/projects/g-01/   -> must land on /research/funding/g-01/
https://www.sajid.bd/projects/g-02/   -> must land on /research/funding/g-02/
https://www.sajid.bd/projects/g-03/   -> must land on /research/funding/g-03/
https://www.sajid.bd/projects/        -> must show the Projects portfolio
https://www.sajid.bd/publication/x-04/ -> must land on /publication/x-03/
```

Cloudflare sits in front of the domain; if a stale edge cache serves the old
`/projects/` grant listing, purge the cache for that path.

**Inbound-link data could not be checked.** No Google Search Console export
exists in the repository and no API access is configured, so which external
sites link to the old grant URLs is unknown. This does not block the migration
because every old URL is preserved — but it is stated rather than assumed.
