###############################################################################
# 🛠️  DSMC CV — Full LaTeX + Bibliography Build Script (emoji + colour)       #
# ----------------------------------------------------------------------------#
# • Updates citation metrics, regenerates papers.bib, compiles the short CV   #
#   (dsmc-cv.pdf) and the full dossier (dsmc-dossier.pdf) with LuaLaTeX+Biber, #
#   then cleans auxiliaries. Both share buetcv.cls, cv-setup.tex, cv-body.tex.  #
# • Requires: pop8query.exe, pop8metrics.exe, LuaLaTeX, Biber, Python 3 with   #
#   pandas and bibtexparser 1.x  (pip install pandas "bibtexparser<2").        #
#                                                                              #
# Usage:                                                                       #
#   .\latexrun.ps1                   full run (download → metrics → compile)   #
#   .\latexrun.ps1 -UseExistingCsv   skip the download; use a PoPCites.csv you #
#                                    exported manually (Tampermonkey fallback) #
#   .\latexrun.ps1 -SkipCitations    compile only (skip Steps 1–5)             #
#   .\latexrun.ps1 -KeepAux          keep .aux/.bbl/.log etc. for debugging    #
###############################################################################

[CmdletBinding()]
param(
    [switch]$SkipCitations,
    [switch]$UseExistingCsv,
    [switch]$KeepAux
)

# ─── Console prep: force UTF-8 so emojis render in Windows PowerShell 5 ──────
chcp 65001 > $null
[Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8

# ─── Colour palette shortcuts ────────────────────────────────────────────────
# NB: never name one of these $Error — that is PowerShell's read-only error list.
$Info     = 'Cyan'
$Step     = 'Yellow'
$Warn     = 'Magenta'
$ErrColor = 'Red'
$Good     = 'Green'

# Fail fast on any non-terminating cmdlet error. Native .exe failures do NOT
# raise errors, so every external tool is run through Invoke-Tool below.
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false   # PS 7.4+: we check exit codes ourselves

# ─── Config ──────────────────────────────────────────────────────────────────
$GoogleScholarProfileID = 'Fu8Hkb4AAAAJ'
$texFiles       = @('dsmc-cv.tex', 'dsmc-dossier.tex')   # short CV, full dossier
$sharedFiles    = @('cv-setup.tex', 'cv-body.tex', 'buetcv.dbx')
$bibFile        = 'papers.bib'
$clsFile        = 'buetcv.cls'
$citesCsv       = 'PoPCites.csv'
$citesCsvNew    = 'PoPCites.new.csv'   # download target; only replaces $citesCsv once validated
$metricsCsv     = 'PoPMetrics.csv'
$authYearCsv    = 'PoPAuthYear.csv'
$texBaseNames   = @($texFiles | ForEach-Object { [IO.Path]::GetFileNameWithoutExtension($_) })
$auxExtensions  = 'aux','bbl','bcf','blg','run.xml','out','toc','fls','fdb_latexmk','synctex.gz'

# ─── Helpers ─────────────────────────────────────────────────────────────────
function Stop-Build([string]$Message) {
    Write-Host "❌  $Message" -ForegroundColor $ErrColor
    exit 1
}

# Run an external program and stop if it returns a non-zero exit code.
# EAP is relaxed inside this function only: in some hosts (ISE, redirected
# output) Windows PowerShell 5 turns a tool's stderr text into a terminating error.
function Invoke-Tool([string]$Name, [string]$Exe, [string[]]$Arguments) {
    $ErrorActionPreference = 'Continue'
    & $Exe @Arguments
    if ($LASTEXITCODE -ne 0) { Stop-Build "$Name failed (exit code $LASTEXITCODE)." }
}

function Assert-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Stop-Build "'$Name' was not found on PATH."
    }
}

function Assert-File([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        Stop-Build "Required file '$Path' was not found in $PWD."
    }
}

# True if another program holds $Path in a way that stops us writing it
# (e.g. a CSV open in Excel, the PDF open in Acrobat). Sharing-friendly
# readers such as OneDrive or antivirus do not count.
function Test-FileLocked([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $false }
    try {
        $fs = [IO.File]::Open((Resolve-Path -LiteralPath $Path).ProviderPath, 'Open', 'ReadWrite', 'ReadWrite, Delete')
        $fs.Close()
        return $false
    } catch {
        return $true
    }
}

# Name of the program(s) locking $Path, via the Windows Restart Manager API.
function Get-FileLocker([string]$Path) {
    try {
        if (-not ('CvBuild.RestartManager' -as [type])) {
            Add-Type -ErrorAction Stop -TypeDefinition @'
using System; using System.Runtime.InteropServices; using System.Collections.Generic;
namespace CvBuild {
public static class RestartManager {
    [StructLayout(LayoutKind.Sequential)]
    struct UniqueProcess { public int Pid; public System.Runtime.InteropServices.ComTypes.FILETIME StartTime; }
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    struct ProcessInfo {
        public UniqueProcess Process;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)] public string AppName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)]  public string ServiceName;
        public int AppType; public uint AppStatus; public uint SessionId;
        [MarshalAs(UnmanagedType.Bool)] public bool Restartable;
    }
    [DllImport("rstrtmgr.dll", CharSet = CharSet.Unicode)] static extern int RmStartSession(out uint h, int flags, string key);
    [DllImport("rstrtmgr.dll")] static extern int RmEndSession(uint h);
    [DllImport("rstrtmgr.dll", CharSet = CharSet.Unicode)] static extern int RmRegisterResources(uint h, uint nFiles, string[] files, uint nApps, IntPtr apps, uint nSvc, string[] svc);
    [DllImport("rstrtmgr.dll")] static extern int RmGetList(uint h, out uint needed, ref uint n, [In, Out] ProcessInfo[] info, ref uint reasons);
    public static List<string> Lockers(string path) {
        var result = new List<string>(); uint h;
        if (RmStartSession(out h, 0, Guid.NewGuid().ToString()) != 0) return result;
        try {
            if (RmRegisterResources(h, 1, new[] { path }, 0, IntPtr.Zero, 0, null) != 0) return result;
            uint needed = 0, n = 0, reasons = 0;
            RmGetList(h, out needed, ref n, null, ref reasons);
            if (needed == 0) return result;
            var info = new ProcessInfo[needed]; n = needed;
            if (RmGetList(h, out needed, ref n, info, ref reasons) != 0) return result;
            for (int i = 0; i < n; i++) result.Add(info[i].AppName + " (PID " + info[i].Process.Pid + ")");
        } finally { RmEndSession(h); }
        return result;
    }
}
}
'@
        }
        $names = [CvBuild.RestartManager]::Lockers((Resolve-Path -LiteralPath $Path).ProviderPath)
        if ($names.Count -gt 0) { return ($names -join ', ') }
    } catch { }
    return 'another program'
}

# Stop early if any of these files is open somewhere we cannot write/read it.
function Assert-Unlocked([string[]]$Paths) {
    $locked = @($Paths | Where-Object { Test-FileLocked $_ })
    if ($locked.Count -eq 0) { return }
    foreach ($p in $locked) {
        Write-Host "🔒  $p is open in $(Get-FileLocker $p)." -ForegroundColor $ErrColor
    }
    Stop-Build 'Close the file(s) above (save any edits first) and re-run.'
}

# Overwrite $Destination with $Source in place (keeps OneDrive's file identity),
# retrying briefly in case a sync/antivirus scan holds it for a moment.
function Copy-FileWithRetry([string]$Source, [string]$Destination) {
    for ($attempt = 1; $attempt -le 5; $attempt++) {
        try {
            Copy-Item -LiteralPath $Source -Destination $Destination -Force
            return
        } catch {
            if ($attempt -eq 5) {
                Write-Host "🔒  Could not overwrite $Destination — it is open in $(Get-FileLocker $Destination)." -ForegroundColor $ErrColor
                Stop-Build "The new download is kept as $Source. Close the file, copy $Source over $Destination, and re-run with -UseExistingCsv."
            }
            Start-Sleep -Seconds 2
        }
    }
}

# Returns @{ Papers; Cites } for a PoPCites-style CSV, or $null if unusable.
function Get-CitesSummary([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    $rows = @(Import-Csv -LiteralPath $Path -Encoding UTF8)
    if ($rows.Count -eq 0) { return $null }
    $cols = $rows[0].PSObject.Properties.Name
    if ($cols -notcontains 'Cites' -or $cols -notcontains 'CitationURL') { return $null }
    $total = 0
    foreach ($r in $rows) { $total += [int]($r.Cites -as [int]) }
    return @{ Papers = $rows.Count; Cites = $total }
}

function Show-ScholarFallback {
    Write-Host ''
    Write-Host '📝  Fallback: generate PoPCites.csv manually from your browser using Tampermonkey.' -ForegroundColor $Warn
    Write-Host '👉  Install and enable the userscript from: https://github.com/sajidbuet/scholar-profile-exporter/' -ForegroundColor $Warn
    Write-Host '✅  Open your Google Scholar profile → click **Load all (optional)** → click **Export PoPCites.csv**.' -ForegroundColor $Warn
    Write-Host "📌  Save/replace it as $citesCsv in $PWD" -ForegroundColor $Warn
    Write-Host '🔄  Then re-run:  .\latexrun.ps1 -UseExistingCsv' -ForegroundColor $Warn
    Write-Host ''
}

# Everything below uses paths relative to this script's folder.
Push-Location -LiteralPath $PSScriptRoot
try {

# ──────────────────────────── BANNER ─────────────────────────────────────────
Write-Host ''
Write-Host '📄  ** DSMC LaTeX Run **' -ForegroundColor $Step
Write-Host '🌐  sajid.bd'             -ForegroundColor $Info
Write-Host ''

# ═════════════════════ 0️⃣  Pre-flight checks ═══════════════════════════════
Write-Host '🧪  Pre-flight checks' -ForegroundColor $Step
foreach ($f in @($texFiles + $sharedFiles + $bibFile + $clsFile)) { Assert-File $f }
Assert-Command 'lualatex'
Assert-Command 'biber'

# Every file the run reads or (over)writes must not be open in Excel, a PDF
# viewer, etc. — Excel's lock even stops pop8metrics from READING a CSV.
$lockCheck = @($bibFile) + @($texBaseNames | ForEach-Object { "$_.pdf", "$_.log" })
if (-not $SkipCitations) {
    $lockCheck += @($citesCsv, $citesCsvNew, $metricsCsv, $authYearCsv, 'metrics.tex', 'update_citations_py.log')
}
Assert-Unlocked $lockCheck

if (-not $SkipCitations) {
    if (-not $UseExistingCsv) { Assert-File 'pop8query.exe' }
    Assert-File 'pop8metrics.exe'
    Assert-File 'pycv_update_citations_bib.py'
    Assert-File 'pycv_update_gscholar_tex.py'
    Assert-Command 'python'
    # Windows PowerShell 5 turns redirected native stderr into errors, so relax EAP here.
    $ErrorActionPreference = 'Continue'
    # pycv_update_citations_bib.py uses the bibtexparser 1.x API (bparser/bwriter),
    # which bibtexparser 2.x removed.
    python -c 'import pandas; from bibtexparser.bparser import BibTexParser' 2>$null
    $pyOk = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = 'Stop'
    if (-not $pyOk) {
        Stop-Build 'Python packages missing or incompatible. Run:  python -m pip install pandas "bibtexparser<2"'
    }

    # ── Validate PoPAuthYear.csv before touching Google Scholar ─────────────
    # pycv_update_gscholar_tex.py overwrites the LAST row with
    # (total citations − sum of all earlier rows), so the last row must be the
    # CURRENT year and every earlier year must already hold its final count.
    Write-Host "🗂️   Checking $authYearCsv" -ForegroundColor $Info
    Assert-File $authYearCsv
    $authYear = @(Import-Csv -LiteralPath $authYearCsv -Encoding UTF8)
    if ($authYear.Count -lt 2 -or
        $authYear[0].PSObject.Properties.Name -notcontains 'Year' -or
        $authYear[0].PSObject.Properties.Name -notcontains 'Cites') {
        Stop-Build "$authYearCsv needs columns Year,Cites and at least two rows."
    }
    $years = @($authYear | ForEach-Object { [int]$_.Year })
    for ($i = 1; $i -lt $years.Count; $i++) {
        if ($years[$i] -ne $years[$i - 1] + 1) {
            Stop-Build "$authYearCsv must list consecutive years in ascending order (found $($years[$i - 1]) → $($years[$i]))."
        }
    }
    $currentYear = (Get-Date).Year
    $lastYear    = $years[-1]
    if ($lastYear -ne $currentYear) {
        Write-Host "⚠️  Last row of $authYearCsv is $lastYear, expected $currentYear." -ForegroundColor $Warn
        Write-Host "    Enter the final citation count for every year up to $($currentYear - 1) (from the Scholar" -ForegroundColor $Warn
        Write-Host "    profile / PoP GUI), and add a '$currentYear,0' row; it is recalculated automatically." -ForegroundColor $Warn
        exit 1
    }
    Write-Host "✅  $authYearCsv is current (last year: $lastYear)." -ForegroundColor $Good
}
Write-Host ''

# ═════════════════════ 1️⃣  Update citation CSVs ════════════════════════════
if (-not $SkipCitations) {

    if ($UseExistingCsv) {
        Write-Host "🔍  Step 1: Using existing $citesCsv (download skipped)" -ForegroundColor $Step
        $summary = Get-CitesSummary $citesCsv
        if (-not $summary) { Stop-Build "$citesCsv is missing, empty, or lacks the Cites/CitationURL columns." }
        $age = (Get-Date) - (Get-Item -LiteralPath $citesCsv).LastWriteTime
        if ($age.TotalDays -gt 1) {
            Write-Host ("⚠️  {0} was last modified {1:N0} day(s) ago — make sure it is the fresh export." -f $citesCsv, $age.TotalDays) -ForegroundColor $Warn
        }
    } else {
        Write-Host "🔍  Step 1: Refresh $citesCsv via pop8query.exe" -ForegroundColor $Step
        $old = Get-CitesSummary $citesCsv
        Remove-Item -LiteralPath $citesCsvNew -ErrorAction SilentlyContinue

        $ErrorActionPreference = 'Continue'   # see Invoke-Tool
        & .\pop8query.exe --gsprofile --author $GoogleScholarProfileID $citesCsvNew
        $queryExit = $LASTEXITCODE
        $ErrorActionPreference = 'Stop'
        $summary   = Get-CitesSummary $citesCsvNew

        if ($queryExit -ne 0 -or -not $summary) {
            Remove-Item -LiteralPath $citesCsvNew -ErrorAction SilentlyContinue
            Write-Host "❌  pop8query failed (exit code $queryExit) or returned no usable data (CAPTCHA / rate limit?)." -ForegroundColor $ErrColor
            Write-Host "    $citesCsv was left unchanged." -ForegroundColor $ErrColor
            Show-ScholarFallback
            exit 1
        }

        # A throttled Scholar response can silently return a partial list.
        if ($old -and ($summary.Papers -lt $old.Papers -or $summary.Cites -lt $old.Cites)) {
            Write-Host "❌  New download looks incomplete: $($summary.Papers) papers / $($summary.Cites) cites" -ForegroundColor $ErrColor
            Write-Host "    vs. previous $($old.Papers) papers / $($old.Cites) cites. $citesCsv was left unchanged." -ForegroundColor $ErrColor
            Write-Host "    Inspect $citesCsvNew; if it is correct, rename it to $citesCsv and re-run with -UseExistingCsv." -ForegroundColor $ErrColor
            Show-ScholarFallback
            exit 1
        }

        # Copy over the old file instead of Move-Item: the move fails with "Cannot
        # create a file when that file already exists" if the CSV is open (Excel).
        Copy-FileWithRetry $citesCsvNew $citesCsv
        Remove-Item -LiteralPath $citesCsvNew -ErrorAction SilentlyContinue
        if ($old) {
            Write-Host "    Papers: $($old.Papers) → $($summary.Papers);  Cites: $($old.Cites) → $($summary.Cites)" -ForegroundColor $Info
        }
    }
    Write-Host "✅  ${citesCsv}: $($summary.Papers) papers, $($summary.Cites) citations." -ForegroundColor $Good

    Write-Host "📈  Step 2: Produce $metricsCsv via pop8metrics.exe" -ForegroundColor $Step
    Invoke-Tool 'pop8metrics' '.\pop8metrics.exe' @('--label', 'text1', '--format', 'csvh', $citesCsv, $metricsCsv)

    Write-Host "🖊️   Step 3: Inject new citation counts into $bibFile" -ForegroundColor $Step
    Invoke-Tool 'pycv_update_citations_bib.py' 'python' @('pycv_update_citations_bib.py')
    Write-Host '    (Unmatched / skipped entries are listed in update_citations_py.log)' -ForegroundColor $Info

    # ═════════════════════ 2️⃣  Sanity-check the year split ══════════════════
    Write-Host "🗂️   Step 4: Check $metricsCsv against $authYearCsv" -ForegroundColor $Step
    $metrics = @(Import-Csv -LiteralPath $metricsCsv -Encoding UTF8)
    if ($metrics.Count -eq 0 -or $null -eq ($metrics[0].c -as [int])) {
        Stop-Build "$metricsCsv has no total-citations ('c') value."
    }
    $totalCites   = [int]$metrics[0].c
    $sumPrevYears = 0
    foreach ($r in $authYear[0..($authYear.Count - 2)]) { $sumPrevYears += [int]$r.Cites }
    $thisYear = $totalCites - $sumPrevYears
    if ($thisYear -lt 0) {
        Stop-Build "Total citations ($totalCites) < sum of $authYearCsv up to $($currentYear - 1) ($sumPrevYears). Check both files."
    }
    Write-Host "✅  Total $totalCites citations → $currentYear so far: $thisYear." -ForegroundColor $Good

    # ═════════════════════ 3️⃣  Generate metrics.tex ════════════════════════
    Write-Host "🧮  Step 5: Write metrics.tex (data for the metrics panel)" -ForegroundColor $Step
    Invoke-Tool 'pycv_update_gscholar_tex.py' 'python' @('pycv_update_gscholar_tex.py')

} else {
    Write-Host '⏭️   -SkipCitations given: skipping Steps 1–5.' -ForegroundColor $Warn
}

# ═════════════════════ 4️⃣  LaTeX compilation ═══════════════════════════════
$latexOpts = @('-interaction=nonstopmode', '-file-line-error')
foreach ($texBaseName in $texBaseNames) {
    $texFile = "$texBaseName.tex"
    $pdfFile = "$texBaseName.pdf"
    Write-Host "📚  Step 6: Compiling $texFile…" -ForegroundColor $Step

    # Remove stale auxiliaries so biber/biblatex start clean. The old PDF is kept
    # until it is overwritten, so a failed build never leaves you without one.
    foreach ($ext in $auxExtensions + 'log') {
        Remove-Item -LiteralPath "$texBaseName.$ext" -ErrorAction SilentlyContinue
    }
    $buildStart = Get-Date
    $latexArgs  = $latexOpts + $texFile

    Write-Host '🖨️   lualatex — first pass' -ForegroundColor $Info
    Invoke-Tool "lualatex ($texBaseName, pass 1)" 'lualatex' $latexArgs
    Write-Host '🔗  biber bibliography pass' -ForegroundColor $Info
    Invoke-Tool "biber ($texBaseName)" 'biber' @($texBaseName)
    Write-Host '🔄  lualatex — second pass' -ForegroundColor $Info
    Invoke-Tool "lualatex ($texBaseName, pass 2)" 'lualatex' $latexArgs
    Write-Host '🔄  lualatex — third pass' -ForegroundColor $Info
    Invoke-Tool "lualatex ($texBaseName, pass 3)" 'lualatex' $latexArgs

    # ═════════════════ 5️⃣  Verify output PDF ═══════════════════════════════
    if ((Test-Path -LiteralPath $pdfFile) -and (Get-Item -LiteralPath $pdfFile).LastWriteTime -ge $buildStart) {
        Write-Host "✅  $pdfFile created successfully." -ForegroundColor $Good
    } else {
        Stop-Build "Build finished but $pdfFile was not (re)written — see $texBaseName.log."
    }

    # ═════════════════ 6️⃣  Clean auxiliary files ═══════════════════════════
    if ($KeepAux) {
        Write-Host '🧹  Step 7: -KeepAux given, auxiliaries left in place.' -ForegroundColor $Step
    } else {
        Write-Host '🧹  Step 7: Cleaning auxiliaries' -ForegroundColor $Step
        foreach ($ext in $auxExtensions + 'log') {
            Remove-Item -LiteralPath "$texBaseName.$ext" -ErrorAction SilentlyContinue
        }
    }
    Write-Host ''
}

Write-Host ''
Write-Host '🎉  End of LaTeX run. Have a productive day!' -ForegroundColor $Step

} finally {
    Pop-Location
}
