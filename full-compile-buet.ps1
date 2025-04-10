# Uncomment this line if you need to run the latexrun. 

#./latexrun.ps1


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