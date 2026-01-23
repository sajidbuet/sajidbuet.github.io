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
Write-Host '📄  ** DSMC Update Citation Run **'                  -ForegroundColor $Step
Write-Host '🌐  sajid.buet.ac.bd'                       -ForegroundColor $Info
Write-Host ''
Write-Host 'ℹ️   Ensure *papers.bib* is UPDATED with PoPCites.csv +' `
           'SCImago metrics before compiling.'          -ForegroundColor $Warn
Write-Host ''

# No update citation set to 0
$update_citation =1 
# ═════════════════════ 1️⃣  Update citation CSVs ════════════════════════════
if($update_citation ) {
Write-Host '🔍  Step 1: Refresh PoPCites.csv via pop8query.exe' -ForegroundColor $Step
Write-Host 'note- if the pop8query failed above, you can use TamperMonkey and the custom user script the https://github.com/sajidbuet/scholar-profile-exporter/ to download the PoPCites.csv' -ForegroundColor $Step

Write-Host '📝  Note (fallback option): If Step 1 fails (e.g., CAPTCHA / rate-limit / login issue), you can generate PoPCites.csv manually from your browser using Tampermonkey.' -ForegroundColor $Step
Write-Host '👉  Install and enable the userscript from: https://github.com/sajidbuet/scholar-profile-exporter/' -ForegroundColor $Step
Write-Host '✅  Then open your Google Scholar profile → click **Load all (optional)** → click **Export PoPCites.csv**.' -ForegroundColor $Step
Write-Host '📌  Make sure the downloaded file is saved/replaced as: PoPCites.csv in this working folder before continuing to Step 2.' -ForegroundColor $Step
Write-Host '🔄  After the CSV is updated, re-run this PowerShell script to continue the pipeline.' -ForegroundColor $Step

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
