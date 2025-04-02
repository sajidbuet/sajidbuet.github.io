$bibFile = "cv/papers.bib"

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
academic import $bibFile $pubFolder --verbose

Write-Host "Academic import completed successfully for en."


$pubFolder = "content/bn/publication/"


# Check if the publication folder exists; if not, create it
if (-not (Test-Path $pubFolder)) {
    Write-Host "The folder '$pubFolder' does not exist. Creating it now..."
    New-Item -ItemType Directory -Path $pubFolder | Out-Null
}

# Execute the academic import command with the provided parameters
Write-Host "Executing academic import command..."
academic import $bibFile $pubFolder --verbose

Write-Host "Academic import completed successfully."
