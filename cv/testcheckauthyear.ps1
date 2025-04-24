Write-Host "** Step 3: Check PoPAuthYear.csv **"

$csvPoPAuthYear = "PoPAuthYear.csv"

# Check if file exists
if (-Not (Test-Path $csvPoPAuthYear)) {
    Write-Error "File '$csvPoPAuthYear' not found."
    exit 1
}
$data = Import-Csv -Path $csvPoPAuthYear

if (-Not ($data | Get-Member -Name 'Year') -or -Not ($data | Get-Member -Name 'Cites')) {
    Write-Error "CSV must have 'Year' and 'Cites' columns."
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
    Write-Output "Current year is $expectedLastYear."
    Write-Output "Last entry of $csvPoPAuthYear is $lastYear."
    Write-Output ""
    Write-Output "So citation data of current year is missing. "
    Write-Output "You must update the $csvPoPAuthYear manually up to last year's citations."
    throw "Missing citation data at $csvPoPAuthYear"
} else {
    Write-Output "PoPAuthYear.csv is up-to-date till last year (last entry: $lastYear)."
}