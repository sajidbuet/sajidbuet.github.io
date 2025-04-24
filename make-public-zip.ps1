Write-Host " "
Write-Host " "
Write-Host "Full Compilation Toolchain"
Write-Host "https://sajid.buet.ac.bd"
Write-Host " "
Write-Host "Compile the CV, update publications in bib, compile hugoblox site, and make a zip of the public folder"
Write-Host " "
# Uncomment this line if you need to run the latexrun. 
$updatelatex = 1
if ($updatelatex) {

Write-Host "Executing LaTeX run in /cv/ folder"
Write-Host "latexrun log is saved as latexmk.log "
cd cv
./latexrun.ps1 > latexmk.log
cd ..
}

# Define source and destination paths



$sourceFile = "cv\dsmc-cv.pdf"
$destinationFolder = "content\authors\admin"
$destinationFile = Join-Path $destinationFolder "cv.pdf"
Write-Host "** Step 1: Copy $sourceFile into the $destinationFolder **"

# Ensure the destination folder exists; if not, create it
if (!(Test-Path $destinationFolder)) {
    New-Item -ItemType Directory -Path $destinationFolder -Force
}

# Copy the file and overwrite if it already exists
Copy-Item -Path $sourceFile -Destination $destinationFile -Force

Write-Host "$sourceFile copied to $destinationFolder successfully."
Write-Host " "

# Define source and destination paths
$sourceFile = "cv/papers.bib"
$destinationFile = "papers.bib"

Write-Host "** Step 2: Export the bib file into folders. **"

# Copy the file and overwrite if it already exists
Copy-Item -Path $sourceFile -Destination $destinationFile -Force

Write-Host "Copy $sourceFile file to root folder."

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

Write-Host "** Step 2(a): Export the bib file into $pubFolder using academic import. **"
# Execute the academic import command with the provided parameters
Write-Host "Executing academic import command..."
academic import $bibFile $pubFolder --compact --overwrite

Write-Host "Academic import completed successfully for en."


$pubFolder = "content/bn/publication/"
Write-Host "** Step 2(b): Export the bib file into $pubFolder using academic import. **"

# Check if the publication folder exists; if not, create it
if (-not (Test-Path $pubFolder)) {
    Write-Host "The folder '$pubFolder' does not exist. Creating it now..."
    New-Item -ItemType Directory -Path $pubFolder | Out-Null
}

# Execute the academic import command with the provided parameters
Write-Host "Executing academic import command..."
academic import $bibFile $pubFolder --compact --overwrite

Write-Host "Academic import completed successfully for bn."



# Step 3: Compile Hugo Site
Write-Host " "
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

Remove-Item "papers.bib"

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
Compress-Archive -Path "$folderToZip\*" -DestinationPath $zipFileName -Force

Write-Host "Folder zipped successfully into '$zipFileName'."