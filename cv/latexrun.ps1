# Stop execution if any command fails
$ErrorActionPreference = "Stop"

## Step 1: Latex Compilation
Write-Host "** Step 1: Latex Compilation **"

# Define the paths to the main TeX file, bibliography file, and class file
$texFile = "dsmc-cv.tex"
$bibFile = "papers.bib"
$clsFile = "buetcv.cls"

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
Write-Host "Running pdflatex (first pass)..."
lualatex $localTexFile   -interaction nonstopmode 

# Run biber to process the bibliography (instead of bibtex)
Write-Host "Running bibtex..."
bibtex $texBaseName

biber $texBaseName 



# Run pdflatex two more times to resolve references and bibliography
Write-Host "Running pdflatex (second pass)..."
lualatex $localTexFile   -interaction nonstopmode  

Write-Host "Running pdflatex (third pass)..."
lualatex $localTexFile   -interaction nonstopmode 

Write-Host "Compilation complete."


# Clean up auxiliary files (aux, bbl, bcf, log, xml, gz) in the current directory
Write-Host "Cleaning up auxiliary files..."
Get-ChildItem -Path .\* -Include *.aux, *.bbl, *.bcf, *.log, *.xml, *.gz, *.fls, *.fdb_latexmk, *.blg, -File | Remove-Item -Force

Write-Host "Cleanup complete."

