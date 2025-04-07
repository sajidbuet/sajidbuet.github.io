---
Title: Bulk Add Users to Microsoft Teams Using PowerShell
Placing: 7
icon: users
description: Bulk Add in Microsoft Teams with Powershell
date: '2025-04-05'
---

Adding multiple users to a Microsoft Teams group manually can be tedious and error-prone, especially for large groups. As we use Teams to manage class, we need to add upto 35 students for each sessional class, 65 students for theory and 195 students if we want to add the entire batch in a team. Fortunately, we can automate this task using PowerShell simplifies the task, reducing time and mistakes. I am releasing these two templates to make our lives easier:
* PowerShellScript
* Excel Template


In this tutorial, you'll learn how to use PowerShell and Excel to bulk-add users to a Microsoft Teams group. You can also download the templates and directly use them:


## Prerequisites

- [PowerShell](https://learn.microsoft.com/powershell/) installed on your system.
- Owner access to the Microsoft Teams where you will add members. (You need to create the teams using the Microsoft Teams desktop app or web interface)
- Excel file (`BulkAdd.xlsx`) containing users' email addresses and roles.

## Step 1: Installing and Running PowerShell

### Windows Users

Windows typically comes with PowerShell pre-installed. To open it:

1. Click **Start** and type **PowerShell**.
2. Right-click **Windows PowerShell** and choose **Run as administrator**.

If you need to install the latest PowerShell version, download it [here](https://github.com/PowerShell/PowerShell/releases).

### macOS/Linux Users

Download and install PowerShell from the official GitHub repository:

- [Download PowerShell](https://github.com/PowerShell/PowerShell/releases)

After installing, open the terminal and type `pwsh` to launch PowerShell.

## Step 2: Install Necessary Modules

You need two modules: `MicrosoftTeams` and `ImportExcel`.

Open PowerShell as Administrator and run:

```powershell
Install-Module MicrosoftTeams -Scope CurrentUser
Install-Module ImportExcel -Scope CurrentUser
```

## Step 3: Prepare Excel Data

Create an Excel file named `BulkAdd.xlsx` with a sheet titled `PowerShellData`:

| Email                   | Role    |
|-------------------------|---------|
| user1@example.com       | Member  |
| user2@example.com       | Owner   |
| user3@example.com       | Member  |

Ensure you save this file in the same directory as your PowerShell script. 

**[Download Excel Template](#)** *(Replace '#' with your actual download URL.)*
If you are using the given template, just edit the batch, department and section part in the file. 

## Step 4: PowerShell Script

Here's the script that automates the bulk addition of users:

```powershell
Import-Module MicrosoftTeams
Import-Module ImportExcel

# Connect to Microsoft Teams
Connect-MicrosoftTeams

# Define your team name
$TeamDisplayName = "Your Team Display Name"

# Get the Team Group ID
$team = Get-Team -DisplayName $TeamDisplayName
if (!$team) {
    Write-Host "Team not found: $TeamDisplayName"
    exit
}
$groupId = $team.GroupId

# Load users from Excel
$excelPath = Join-Path (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent) "BulkAdd.xlsx"
$data = Import-Excel -Path $excelPath -WorksheetName "PowerShellData"

foreach ($row in $data) {
    $email = $row.Email
    $role = $row.Role

    Write-Host "Adding $email as $role"

    # Add users to Team
    Add-TeamUser -GroupId $groupId -User $email -Role $role
}

Write-Host "Bulk addition completed!"
```

Replace `Your Team Display Name` with your actual Microsoft Teams name where you want to add the members.

**[Download Sample PowerShell Script](#)** *(Replace '#' with your actual download URL.)*

## Step 5: Execute the Script

Save this script as `BulkAddUsers.ps1`. Run it by opening PowerShell and executing:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
.\BulkAddUsers.ps1
```

If prompted about execution policy, type `Y` and hit Enter.

## Conclusion

You've now automated the bulk addition of users into Microsoft Teams using PowerShell. This approach saves considerable time, especially when managing large teams.

Happy automating!

Note: I might update the script in the future, where it would check against the BIIS generated roll number list, and also automatically remove members that are not present in the BIIS list, but that might need further testing.
