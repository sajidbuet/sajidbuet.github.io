

# Stop execution if any command fails
$ErrorActionPreference = "Stop"



# Stop execution if any command fails
$ErrorActionPreference = "Stop"


## Step 1: Latex Compilation
Write-Host "** Step 1: Latex Compilation **"

# Define the paths to the main TeX file, bibliography file, and class file
$texFile = "cv/dsmc-cv.tex"
$bibFile = "cv/papers.bib"
$clsFile = "cv/buetcv.cls"

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
Write-Host "Running lualatex (first pass)..."
lualatex $localTexFile   -interaction nonstopmode 

# Run biber to process the bibliography (instead of bibtex)
Write-Host "Running biber..."
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

# Return to the original directory if it was changed
if ($texDir -and $texDir -ne "") {
    Pop-Location
}


# Define source and destination paths
$sourceFile = "cv\dsmc-cv.pdf"
$destinationFolder = "content\authors\admin"
$destinationFile = Join-Path $destinationFolder "cv.pdf"

# Ensure the destination folder exists; if not, create it
if (!(Test-Path $destinationFolder)) {
    New-Item -ItemType Directory -Path $destinationFolder -Force
}

# Copy the file and overwrite if it already exists
Copy-Item -Path $sourceFile -Destination $destinationFile -Force

Write-Host "File copied successfully."


# Step 2: Export the bib file into folders.
Write-Host "** Step 2: Export the bib file into folders. **"


# Define source and destination paths
$sourceFile = $bibFile
$destinationFile = "papers.bib"

# Copy the file and overwrite if it already exists
Copy-Item -Path $sourceFile -Destination $destinationFile -Force

Write-Host "Copy bib file to root folder."

# Define file and folder paths
$bibFile = "papers.bib"
$pubFolder = "content/publication/"

# Check if the bibliography file exists
if (-not (Test-Path $bibFile)) {
    Write-Error "Error: The bibliography file '$bibFile' was not found."
    exit 1
}

# Check if the publication folder exists; if not, create it
if (-not (Test-Path $pubFolder)) {
    Write-Host "The folder '$pubFolder' does not exist. Creating it now..."
    New-Item -ItemType Directory -Path $pubFolder | Out-Null
}

# Execute the academic import command with the provided parameters
Write-Host "Executing academic import command..."
academic import $bibFile $pubFolder --compact --overwrite

Write-Host "Academic import completed successfully for en."


$pubFolder = "content/bn/publication/"


# Check if the publication folder exists; if not, create it
if (-not (Test-Path $pubFolder)) {
    Write-Host "The folder '$pubFolder' does not exist. Creating it now..."
    New-Item -ItemType Directory -Path $pubFolder | Out-Null
}

# Execute the academic import command with the provided parameters
Write-Host "Executing academic import command..."
academic import $bibFile $pubFolder --compact --overwrite

Write-Host "Academic import completed successfully."