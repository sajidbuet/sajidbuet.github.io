################################################################################
# 🛠️  FULL CONTENT TOOLCHAIN – SAJID Lab (HugoBlox)
# ----------------------------------------------------------------------------
# Regenerates the content that is derived from other sources, then (optionally)
# builds the site locally. Deployment itself is done by GitHub Actions
# (.github/workflows/publish.yaml) on every push to main.
#
#   1. CV        cv\dsmc-cv.pdf → content\cv.pdf   (recompile first with -Cv)
#   2. Papers    cv\papers.bib  → content\publication + content\bn\publication
#   3. People    _pythonscripts\all-members.xlsx → data\authors, content\authors
#   4. Build     hugo + pagefind into public\        (only with -Build / -Zip)
#   5. Zip       public\ → public-<timestamp>.zip    (only with -Zip)
#
# Usage:
#   .\make-all.ps1                     steps 1–3 (no LaTeX, no Hugo build)
#   .\make-all.ps1 -Cv                 recompile the CV first (cv\latexrun.ps1)
#   .\make-all.ps1 -Cv -CvCompileOnly  …without refreshing citation counts
#   .\make-all.ps1 -Build              also run a local production build
#   .\make-all.ps1 -Zip                build + zip public\ for a manual upload
#   .\make-all.ps1 -SkipPublications -SkipAuthors   skip individual steps
################################################################################

[CmdletBinding()]
param(
    [switch]$Cv,                # was: $updatelatex = 1
    [switch]$CvCompileOnly,     # passes -SkipCitations to cv\latexrun.ps1
    [switch]$SkipPublications,
    [switch]$SkipAuthors,
    [switch]$Build,
    [switch]$Zip
)

# ─── Console prep: UTF-8 so emojis render (also for child Python processes) ──
chcp 65001 > $null
[Console]::OutputEncoding = [Text.UTF8Encoding]::new()
$OutputEncoding           = [Console]::OutputEncoding
$env:PYTHONUTF8           = '1'

# ─── Colour palette ──────────────────────────────────────────────────────────
$Info     = 'Cyan'
$Step     = 'Yellow'
$Warn     = 'Magenta'
$ErrColor = 'Red'
$Good     = 'Green'

# Cmdlet errors stop the script; native .exe exit codes are checked by Invoke-Tool.
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false   # PS 7.4+: we check exit codes ourselves

# ─── Config ──────────────────────────────────────────────────────────────────
$CvPdf        = 'cv\dsmc-cv.pdf'
$CvTarget     = 'content\cv.pdf'
$BibFile      = 'cv\papers.bib'
$PubDirs      = 'content\publication', 'content\bn\publication'
$AuthorScript = '_pythonscripts\sync_authors.py'
$PagefindPkg  = 'pagefind@1.4.0'          # keep in step with publish.yaml / package.json
# BibTeX spellings of the site owner; each becomes "me" so HugoBlox links the
# papers to data\authors\me.yaml. Regexes, applied in order (longest first).
$MyNames = @(
    'Sajid Muhaimin Choudhury',
    'Choudhury, Sajid Muhaimin',
    'Sajid Choudhury',
    'S\. M\. Choudhury'
)

# ─── Helpers ─────────────────────────────────────────────────────────────────
function Write-Step([string]$Message) {
    Write-Host ''
    Write-Host $Message -ForegroundColor $Step
}

# Run an external program (or .ps1) and throw if it returns a non-zero exit code.
function Invoke-Tool([string]$Name, [string]$Exe, [string[]]$ArgList = @()) {
    $global:LASTEXITCODE = 0
    & $Exe @ArgList
    if ($LASTEXITCODE -ne 0) { throw "$Name failed (exit code $LASTEXITCODE)." }
}

function Assert-Command([string]$Name, [string]$Hint) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "'$Name' is not on PATH. $Hint"
    }
}

function Copy-IfChanged([string]$Source, [string]$Destination) {
    if (-not (Test-Path -LiteralPath $Source)) { throw "$Source not found." }
    if ((Test-Path -LiteralPath $Destination) -and
        (Get-FileHash -LiteralPath $Source).Hash -eq (Get-FileHash -LiteralPath $Destination).Hash) {
        return $false
    }
    New-Item -ItemType Directory -Force -Path (Split-Path $Destination) | Out-Null
    Copy-Item -LiteralPath $Source -Destination $Destination -Force
    return $true
}

# ─── Steps ───────────────────────────────────────────────────────────────────
function Update-Cv {
    if ($Cv) {
        Write-Step '📄  Step 1a: Compiling the CV (cv\latexrun.ps1; tool output → cv\latexmk.log)'
        $cvArgs = if ($CvCompileOnly) { @('-SkipCitations') } else { @() }
        $global:LASTEXITCODE = 0
        & '.\cv\latexrun.ps1' @cvArgs > 'cv\latexmk.log'
        if ($LASTEXITCODE -ne 0) { throw "CV build failed (exit code $LASTEXITCODE) — see cv\latexmk.log." }
    } else {
        Write-Host 'ℹ️   CV not recompiled — pass -Cv to run cv\latexrun.ps1.' -ForegroundColor $Warn
    }

    Write-Step "📂  Step 1b: $CvPdf → $CvTarget"
    if (Copy-IfChanged $CvPdf $CvTarget) {
        Write-Host '✅  CV copied.' -ForegroundColor $Good
    } else {
        Write-Host '✅  CV already up to date.' -ForegroundColor $Good
    }
}

function Update-Publications {
    Write-Step "📚  Step 2: Importing $BibFile into $($PubDirs -join ', ')"
    Assert-Command 'academic' 'Install the HugoBlox importer with:  python -m pip install academic'

    # Work on a temp copy so the CV's own papers.bib is never touched.
    $bibMe = Join-Path ([IO.Path]::GetTempPath()) "papers-me-$PID.bib"
    try {
        $text = [IO.File]::ReadAllText((Resolve-Path $BibFile))
        foreach ($pattern in $MyNames) { $text = $text -replace $pattern, 'me' }
        [IO.File]::WriteAllText($bibMe, $text, [Text.UTF8Encoding]::new($false))   # no BOM

        foreach ($dir in $PubDirs) {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
            Write-Host "🔄  academic import → $dir" -ForegroundColor $Info
            Invoke-Tool "academic import ($dir)" 'academic' @('import', $bibMe, $dir, '--compact', '--overwrite')
        }
    } finally {
        Remove-Item -LiteralPath $bibMe -ErrorAction SilentlyContinue
    }
    Write-Host '✅  Publications imported.' -ForegroundColor $Good
}

function Update-Authors {
    Write-Step '👥  Step 3: Syncing people pages from _pythonscripts\all-members.xlsx'
    Assert-Command 'python' 'Install Python 3 and run:  python -m pip install pandas openpyxl pyyaml'
    Invoke-Tool 'sync_authors.py' 'python' @($AuthorScript)
}

function Invoke-HugoBuild {
    Write-Step '🚀  Step 4: hugo --gc --minify (clean public\) + pagefind'
    Assert-Command 'hugo' 'Install Hugo extended (see HUGO_VERSION in .github/workflows/publish.yaml).'
    Assert-Command 'npx'  'Install Node.js (needed for the pagefind search index).'
    Invoke-Tool 'hugo' 'hugo' @('--gc', '--minify', '--cleanDestinationDir')
    Invoke-Tool 'pagefind' 'npx' @('--yes', $PagefindPkg, '--site', 'public')
    Write-Host '✅  Site built in public\.' -ForegroundColor $Good
}

function New-PublicZip {
    Write-Step '🗜️  Step 5: Packaging public\ into a ZIP'
    $zipFile = "public-$(Get-Date -Format 'yyyy-MM-dd-HH-mm').zip"
    Compress-Archive -Path 'public\*' -DestinationPath $zipFile -Force
    Write-Host "✅  $zipFile ready." -ForegroundColor $Good
    Write-Host ''
    Write-Host '📤  Manual deploy:' -ForegroundColor $Step
    Write-Host "        1. Upload $zipFile to public_html"            -ForegroundColor $Step
    Write-Host '        2. Remove the previous files in public_html' -ForegroundColor $Step
    Write-Host "        3. Unzip public_html\$zipFile"               -ForegroundColor $Step
    Write-Host "        4. Delete public_html\$zipFile"              -ForegroundColor $Step
}

# ─── Main ────────────────────────────────────────────────────────────────────
Write-Host ' HUGO Blox SajidLab'                -ForegroundColor $Info
Write-Host '🔧  Full Content Toolchain'         -ForegroundColor $Step
Write-Host '🌐  https://www.sajid.org.bd'       -ForegroundColor $Info

Push-Location $PSScriptRoot            # all paths above are relative to the repo root
try {
    Update-Cv
    if ($SkipPublications) { Write-Host "`n⏭️   -SkipPublications: step 2 skipped." -ForegroundColor $Warn } else { Update-Publications }
    if ($SkipAuthors)      { Write-Host "`n⏭️   -SkipAuthors: step 3 skipped."      -ForegroundColor $Warn } else { Update-Authors }
    if ($Build -or $Zip)   { Invoke-HugoBuild }
    if ($Zip)              { New-PublicZip }
} catch {
    Write-Host ''
    Write-Host "💥  $($_.Exception.Message)" -ForegroundColor $ErrColor
    Write-Verbose $_.ScriptStackTrace       # run with -Verbose for the call stack
    exit 1
} finally {
    Pop-Location
}

Write-Host ''
Write-Host '🎯  Pipeline complete. Review `git status`, then commit and push to main —' -ForegroundColor $Step
Write-Host '    GitHub Actions builds and deploys the site.'                            -ForegroundColor $Step
