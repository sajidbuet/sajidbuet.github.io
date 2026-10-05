# Visual polish captures (2026-10)

The JPEGs in `before/` and `after/` stay on disk and are **not committed**,
following the repository convention in `.gitignore` ("Redesign Artifacts").
The measurements behind every claim are committed in
`../../evidence/visual-polish-qa-{before,after}.json`.

## Regenerate

```powershell
$env:HUGO_IGNOREFILES = "-SAJID-PC\.,outreach[\/]templates"
git switch main;          hugo --minify -d $env:TEMP\vp-before
git switch visual-polish; hugo --minify -d $env:TEMP\vp-after
# Serve each folder on its own port with any static server, then:
node docs/redesign/evidence/visual-polish-shots.mjs http://127.0.0.1:<port> before
node docs/redesign/evidence/visual-polish-shots.mjs http://127.0.0.1:<port> after
node docs/redesign/evidence/visual-polish-qa.mjs    http://127.0.0.1:<port> after
```

The QA driver writes `visual-polish-qa-<tag>.json` next to itself.

## Set

17 captures per side, identical viewport, theme and scroll:

| Kind | Captures |
|---|---|
| Homepage | 1440 light/dark, 390 light/dark |
| Section pages | research overview, research area, projects, publications (light/dark), team, blog listing, news listing, resources |
| Article | 1440 and 390 |
| Footer | 1440 light/dark |

Full-page captures are JPEG q55; viewport captures are q72.
