# Stop execution if any command fails
$GoogleScholarProfileID = "Fu8Hkb4AAAAJ"
$ErrorActionPreference = "Stop"

# Define the paths to the main TeX file, bibliography file, and class file
$texFile = "dsmc-cv.tex"
$bibFile = "papers.bib"
$clsFile = "buetcv.cls"

Write-Host " "
Write-Host " "
Write-Host "    ** DSMC LaTeX Run **"
Write-Host "    ** sajid.buet.ac.bd **"
Write-Host " "
Write-Host "    Before you proceed, make sure that you have updated the publications in papers.bib."
Write-Host "     Add citationurl field in the bib file from the PoPCites.csv, add journal metrics from SCIMAGO JR manually. "
Write-Host " "
Write-Host " "
Write-Host "    ** LaTeXRun Step 1: Update PoPCites.csv with pop8query.exe **"
.\pop8query.exe --gsprofile --author $GoogleScholarProfileID PoPCites.csv

Write-Host "    ** LaTeXRun Step 2: Update PoPMetrics.csv with pop8metrics.exe **"
.\pop8metrics.exe --label "text1" --format csvh PoPCites.csv PoPMetrics.csv

Write-Host "    ** LaTeXRun Step 3: Use pycv_update_citations_bib.py for updating the $bibFile file**"
python pycv_update_citations_bib.py

Write-Host "    ** LaTeXRun Step 4: Check PoPAuthYear.csv for completeness **"

$csvPoPAuthYear = "PoPAuthYear.csv"

# Check if file exists
if (-Not (Test-Path $csvPoPAuthYear)) {
    Write-Error "    File '$csvPoPAuthYear' not found."
    exit 1
}
$data = Import-Csv -Path $csvPoPAuthYear

if (-Not ($data | Get-Member -Name 'Year') -or -Not ($data | Get-Member -Name 'Cites')) {
    Write-Error "    CSV must have 'Year' and 'Cites' columns."
    exit 1
}

# Convert years to integers, just in case
$data | ForEach-Object { $_.Year = [int]$_.Year }

# Find the last (latest) year in the file
$lastYear = ($data | Sort-Object Year)[-1].Year

# Get last full year (e.g., if current year is 2025, we expect data till 2024)
$expectedLastYear = (Get-Date).Year 

# Check and throw error if outdated
if ($lastYear -lt $expectedLastYear) {
    Write-Output "    Current year is $expectedLastYear."
    Write-Output "    Last entry of $csvPoPAuthYear is $lastYear."
    Write-Output ""
    Write-Output "    So citation data of current year is missing. "
    Write-Output "    You must update the $csvPoPAuthYear manually up to last year's citations."
    throw "    Missing citation data at $csvPoPAuthYear"
} else {
    Write-Output "PoPAuthYear.csv is up-to-date till last year (last entry: $lastYear)."
}

Write-Host "    ** Step 5: Use PoPAuthYear.csv for updating gscholar.tex **"
python pycv_update_gscholar_tex.py


Write-Host "    ** Step 6: Latex Compilation **"



# Verify that the required files exist
if (-Not (Test-Path $texFile)) {
    Write-Error "Error: The file '$texFile' was not found."
    exit 1
}

if (-Not (Test-Path $bibFile)) {
    Write-Error "Error: The bibliography file '$bibFile' was not found."
    exit 1
}

if (-Not (Test-Path $clsFile)) {
    Write-Error "Error: The class file '$clsFile' was not found."
    exit 1
}


# Extract the directory and base name from the TeX file path
$texDir = [System.IO.Path]::GetDirectoryName($texFile)
$texBaseName = [System.IO.Path]::GetFileNameWithoutExtension($texFile)

# If the TeX file is in a subfolder, change directory into it
if ($texDir -and $texDir -ne "") {
    Push-Location $texDir
    # Now, the TeX file is in the current directory
    $localTexFile = "$texBaseName.tex"
} else {
    $localTexFile = $texFile
}




# Run pdflatex (first pass) to generate the .aux and .bcf files
Write-Host "        Running lualatex (first pass)..."
lualatex $localTexFile   -interaction nonstopmode 

# Run biber to process the bibliography (instead of bibtex)
Write-Host "        Running biber..."
biber $texBaseName 


# Run pdflatex two more times to resolve references and bibliography
Write-Host "        Running lualatex (second pass)..."
lualatex $localTexFile   -interaction nonstopmode  
Write-Host "        Running lualatex (third pass)..."
lualatex $localTexFile   -interaction nonstopmode  


Write-Host "        Compilation complete."


# Clean up auxiliary files (aux, bbl, bcf, log, xml, gz) in the current directory
Write-Host "    ** Step 7: Cleaning up auxiliary files... **"
Get-ChildItem -Path .\* -Include *.aux, *.bbl, *.bcf, *.xml, *.gz, *.fls, *.fdb_latexmk, *.blg, -File | Remove-Item -Force

Write-Host "       Cleanup complete."
Write-Host "       End of LaTeX run."

