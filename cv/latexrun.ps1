###############################################################################
# 🛠️  DSMC CV — Full LaTeX + Bibliography Build Script (emoji + colour)       #
# ----------------------------------------------------------------------------#
# • Updates citation metrics, regenerates papers.bib, compiles the CV with     #
#   LuaLaTeX+Biber, then cleans auxiliaries.                                   #
# • Requires: pop8query.exe, pop8metrics.exe, Python 3, LuaLaTeX, Biber.       #
###############################################################################

# ─── Console prep: force UTF-8 so emojis render in Windows PowerShell 5 ──────
chcp 65001            > $null                  # Set code-page to UTF-8. :contentReference[oaicite:5]{index=5}
[Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8   # PS output stream. :contentReference[oaicite:6]{index=6}

# ─── Colour palette shortcuts ────────────────────────────────────────────────
$Info  = 'Cyan'
$Step  = 'Yellow'
$Warn  = 'Magenta'
$Error = 'Red'
$Good  = 'Green'

# Fail fast on any non-terminating error
$ErrorActionPreference = 'Stop'

# ─── Config ­─────────────────────────────────────────────────────────────────
$GoogleScholarProfileID = 'Fu8Hkb4AAAAJ'
$texFile = 'dsmc-cv.tex'
$bibFile = 'papers.bib'
$clsFile = 'buetcv.cls'

# ──────────────────────────── BANNER ─────────────────────────────────────────
Write-Host ''
Write-Host '📄  ** DSMC LaTeX Run **'                  -ForegroundColor $Step
Write-Host '🌐  sajid.buet.ac.bd'                       -ForegroundColor $Info
Write-Host ''
Write-Host 'ℹ️   Ensure *papers.bib* is UPDATED with PoPCites.csv +' `
           'SCImago metrics before compiling.'          -ForegroundColor $Warn
Write-Host ''

# No update citation
$update_citation =1 
# ═════════════════════ 1️⃣  Update citation CSVs ════════════════════════════
if($update_citation ) {
Write-Host '🔍  Step 1: Refresh PoPCites.csv via pop8query.exe' -ForegroundColor $Step
.\pop8query.exe --gsprofile --author $GoogleScholarProfileID PoPCites.csv

Write-Host '📈  Step 2: Produce PoPMetrics.csv via pop8metrics.exe' -ForegroundColor $Step
.\pop8metrics.exe --label 'text1' --format csvh PoPCites.csv PoPMetrics.csv

Write-Host '🖊️   Step 3: Inject new citation counts into papers.bib' -ForegroundColor $Step
python pycv_update_citations_bib.py

# ═════════════════════ 2️⃣  Validate PoPAuthYear.csv ════════════════════════
Write-Host '🗂️   Step 4: Check PoPAuthYear.csv completeness' -ForegroundColor $Step
$csvPoPAuthYear = 'PoPAuthYear.csv'
if (-not (Test-Path $csvPoPAuthYear)) {
    Write-Host "❌  File '$csvPoPAuthYear' not found." -ForegroundColor $Error
    exit 1
}

$data = Import-Csv $csvPoPAuthYear
if (-not ($data | Get-Member Year) -or -not ($data | Get-Member Cites)) {
    Write-Host '❌  CSV requires columns Year & Cites.' -ForegroundColor $Error
    exit 1
}

$data | ForEach-Object { $_.Year = [int]$_.Year }
$lastYear         = ($data | Sort-Object Year)[-1].Year
$expectedLastYear = (Get-Date).Year - 1   # expect complete data up to last full year

if ($lastYear -lt $expectedLastYear) {
    Write-Host "⚠️  Missing citation data for $expectedLastYear → update PoPAuthYear.csv!" `
               -ForegroundColor $Warn
    exit 1
} else {
    Write-Host "✅  PoPAuthYear.csv is current (last year: $lastYear)." -ForegroundColor $Good
}

# ═════════════════════ 3️⃣  Generate gscholar.tex ═══════════════════════════
Write-Host '🧮  Step 5: Render gscholar.tex from PoPAuthYear.csv' -ForegroundColor $Step
python pycv_update_gscholar_tex.py

}
else {
    Write-Host 'Update Citation Disabled... Skipping Step 1-5.'
}
# ═════════════════════ 4️⃣  LaTeX compilation ═══════════════════════════════
Write-Host '📚  Step 6: Compiling LaTeX sources…' -ForegroundColor $Step

foreach ($f in @($texFile, $bibFile, $clsFile)) {
    if (-not (Test-Path $f)) {
        Write-Host "❌  Required file '$f' was not found." -ForegroundColor $Error
        exit 1
    }
}

$texDir      = [IO.Path]::GetDirectoryName($texFile)
$texBaseName = [IO.Path]::GetFileNameWithoutExtension($texFile)
$localTex    = if ($texDir) { Push-Location $texDir; "$texBaseName.tex" } else { $texFile }

# 1st pass
Write-Host '🖨️   lualatex — first pass' -ForegroundColor $Info
lualatex $localTex -interaction nonstopmode

# Biber
Write-Host '🔗  biber bibliography pass' -ForegroundColor $Info
biber $texBaseName

# 2nd & 3rd passes
Write-Host '🔄  lualatex — second pass' -ForegroundColor $Info
lualatex $localTex -interaction nonstopmode
Write-Host '🔄  lualatex — third pass'  -ForegroundColor $Info
lualatex $localTex -interaction nonstopmode

if ($texDir) { Pop-Location }

Write-Host '🏁  Compilation complete.' -ForegroundColor $Good

# ═════════════════════ 5️⃣  Verify output PDF ═══════════════════════════════
$outputPdf = if ($texDir) {
    "$texDir/$texBaseName.pdf"      # e.g. 'subfolder/cv.pdf'
} else {
    "$texBaseName.pdf"              # e.g. 'cv.pdf' in the working dir
}

if (Test-Path $outputPdf) {
    Write-Host "✅  cv.pdf created successfully at $outputPdf." -ForegroundColor $Good
} else {
    Write-Host "❌  Build finished but cv.pdf is MISSING!" -ForegroundColor $Error
    exit 1
}

# ═════════════════════ 6️⃣  Clean auxiliary files ═══════════════════════════
Write-Host '🧹  Step 7: Cleaning auxiliaries' -ForegroundColor $Step
Get-ChildItem -Path (Split-Path $texFile -Parent) `
    -Include *.aux,*.bbl,*.bcf,*.xml,*.gz,*.fls,*.fdb_latexmk,*.blg `
    -File -Recurse | Remove-Item -Force
Write-Host '🗑️   Cleanup complete.' -ForegroundColor $Info

Write-Host ''
Write-Host '🎉  End of LaTeX run. Have a productive day!' -ForegroundColor $Step
