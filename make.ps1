chcp 65001            # switch console to UTF-8 code page
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding       = [Console]::OutputEncoding   # keeps > redirection UTF-8
################################################################################
# 🛠️  FULL COMPILATION TOOLCHAIN – Q-PACERS
################################################################################

# ─── 🎨  Colour palette ───────────────────────────────────────────────────────
$Info     = 'Cyan'
$Step     = 'Yellow'
$Warning  = 'Magenta'
$ErrorCol = 'Red'

Write-Host ' HUGO Blox QPACERS RG ' -ForegroundColor $Info
Write-Host '🔧  Full Compilation Toolchain' -ForegroundColor $Step
Write-Host '🌐  https://sajid.buet.ac.bd'   -ForegroundColor $Info
Write-Host ''
Write-Host '📝  Compiles CV, refreshes publications, rebuilds Hugo site, and zips /public.' `
           -ForegroundColor $Step
Write-Host ''

# ───────────────────────────── 1️⃣  CV + BibTeX update ───────────────────────
$updatelatex = 0          # set to 1 when you modify cv/*.tex or *.bib
if ($updatelatex) {

    Write-Host '📄  Running LaTeX in /cv (log → latexmk.log)…' -ForegroundColor $Step
    cd cv
    ./latexrun.ps1 > latexmk.log
    cd ..

    # ── copy fresh PDF to author folder ──────────────────────────────────────
    $sourceFile        = 'cv\dsmc-cv.pdf'
    $destinationFolder = 'content\authors\admin'
    $destinationFile   = Join-Path $destinationFolder 'cv.pdf'

    Write-Host "📂  Copying $sourceFile → $destinationFolder" -ForegroundColor $Info
    if (!(Test-Path $destinationFolder)) {
        Write-Host '📁  Destination missing – creating it…' -ForegroundColor $Warning
        New-Item -ItemType Directory -Path $destinationFolder -Force | Out-Null
    }
    Copy-Item -Path $sourceFile -Destination $destinationFile -Force
    Write-Host '✅  CV updated.' -ForegroundColor $Info
    Write-Host ''

    # ── export BibTeX ────────────────────────────────────────────────────────
    Copy-Item -Path 'cv\papers.bib' -Destination 'papers.bib' -Force
    $bibFile = 'papers.bib'
    $pubEn   = 'content/publication/'
    $pubBn   = 'content/bn/publication/'

    foreach ($locale in @(
            @{ Path = $pubEn; Lang = 'en' },
            @{ Path = $pubBn; Lang = 'bn' }
        )) {

        if (-not (Test-Path $locale.Path)) {
            Write-Host "📁  Creating ${($locale.Path)}…" -ForegroundColor $Warning
            New-Item -ItemType Directory -Path $locale.Path | Out-Null
        }

        Write-Host "🔄  academic import → $($locale.Lang)…" -ForegroundColor $Info
        academic import $bibFile $locale.Path --compact --overwrite
        Write-Host "✅  Import complete for $($locale.Lang)." -ForegroundColor $Info
    }

    Remove-Item 'papers.bib'
    Write-Host ''
}
else {
    Write-Host 'ℹ️  CV not updated – set $updatelatex = 1 to enable.' -ForegroundColor $Warning
}

# ───────────────────────────── 2️⃣  User-page rebuild ────────────────────────
Write-Host ''
Write-Host '👥  Re-generating author pages from all-members.xlsx…' -ForegroundColor $Step
cd _pythonscripts
python student-page-creator.py all-members.xlsx --img-dir ./photos
cd ..
Write-Host '✅  Author pages refreshed.' -ForegroundColor $Info

# ───────────────────────────── 3️⃣  Hugo site build ──────────────────────────
Write-Host ''
Write-Host '🚀  Hugo-1: Clean & rebuild static site…' -ForegroundColor $Step

$publicFolder = 'public'
if (Test-Path $publicFolder) {
    Write-Host '🗑️   Removing previous /public…' -ForegroundColor $Warning
    Remove-Item $publicFolder -Recurse -Force
}

Write-Host '⚙️   Running hugo --gc --minify…' -ForegroundColor $Info
hugo --gc --minify
Write-Host '✅  Hugo build finished.' -ForegroundColor $Info

# ───────────────────────────── 4️⃣  Zip /public ──────────────────────────────
Write-Host ''
Write-Host '🗜️  Hugo-2: Packaging /public into ZIP…' -ForegroundColor $Step

$folderToZip = 'public'
if (-not (Test-Path $folderToZip)) {
    Write-Host '💥  /public missing – aborting.' -ForegroundColor $ErrorCol
    exit 1
}

$timestamp   = Get-Date -Format 'yyyy-MM-dd-HH-mm'
$zipFileName = "public-$timestamp.zip"

Write-Host "📦  Compressing → $zipFileName…" -ForegroundColor $Info
Compress-Archive -Path "$folderToZip\*" -DestinationPath $zipFileName -Force
Write-Host '✅  ZIP ready for deployment.' -ForegroundColor $Info

Write-Host ''
Write-Host '🎯  Build pipeline complete. Have a productive day! ✨' -ForegroundColor $Step
Write-Host ''
Write-Host "📤  Deploy:"
Write-Host "        1. Upload the generated $zipFileName to *public_html*" -ForegroundColor $Step
Write-Host "        2. Remove all previous files of *public_html* files"  -ForegroundColor $Step
Write-Host "        3. Unzip *public_html*\$zipFileName" -ForegroundColor $Step
Write-Host "        4. Delete the *public_html*\$zipFileName" -ForegroundColor $Step
Write-Host ''
Write-Host '🌐  All done!  Your refreshed site should now be online.' -ForegroundColor $Info