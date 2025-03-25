

# Stop execution if any command fails
$ErrorActionPreference = "Stop"


## Step 1: Latex Compilation
Write-Host "** Step 1: Latex Compilation **"

# Define the paths to the main TeX file, bibliography file, and class file
$texFile = "cv/dsmc-cv.tex"
$bibFile = "papers.bib"
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

# Run pdflatex (first pass) to generate the .aux file
Write-Host "Running pdflatex (first pass)..."
pdflatex $localTexFile

# Run bibtex to process the bibliography
Write-Host "Running bibtex..."
bibtex $texBaseName

# Run pdflatex two more times to resolve references and bibliography
Write-Host "Running pdflatex (second pass)..."
pdflatex $localTexFile

Write-Host "Running pdflatex (third pass)..."
pdflatex $localTexFile

Write-Host "Compilation complete."

# Clean up auxiliary files (aux, bbl, bcf, log, xml, gz) in the current directory
Write-Host "Cleaning up auxiliary files..."
Get-ChildItem -Path .\* -Include *.aux, *.bbl, *.bcf, *.log, *.xml, *.gz, *.fls, *.fdb_latexmk, *.blg -File | Remove-Item -Force

Write-Host "Cleanup complete."

# Return to the original directory if it was changed
if ($texDir -and $texDir -ne "") {
    Pop-Location
}

# Step 2: Export the bib file into folders.
Write-Host "** Step 2: Export the bib file into folders. **"

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

Write-Host "Academic import completed successfully."

# Step 3: Compile Hugo Site
Write-Host "** Step 3: Compile Hugo Site **"
# Define the folder path
$publicFolder = "public"

# Check if the folder exists and delete it if it does
if (Test-Path $publicFolder) {
    Write-Host "Deleting folder '$publicFolder'..."
    Remove-Item $publicFolder -Recurse -Force
    Write-Host "Folder '$publicFolder' deleted."
} else {
    Write-Host "Folder '$publicFolder' does not exist. Skipping deletion."
}

# Execute the Hugo command
Write-Host "Running 'hugo --gc --minify'..."
hugo --gc --minify
Write-Host "Hugo command completed."


# Step 4: zip the public folder
Write-Host "** Step 4: zip the public folder **"

# Define the folder to zip
$folderToZip = "public"

# Check if the folder exists
if (-Not (Test-Path $folderToZip)) {
    Write-Error "Error: The folder '$folderToZip' does not exist."
    exit 1
}

# Get the current date and time formatted as "yyyy-MM-dd-HH-mm"
$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm"

# Define the output ZIP file name (using hyphens instead of colons)
$zipFileName = "public-$timestamp.zip"

Write-Host "Zipping folder '$folderToZip' into '$zipFileName'..."
Compress-Archive -Path $folderToZip -DestinationPath $zipFileName

Write-Host "Folder zipped successfully into '$zipFileName'."