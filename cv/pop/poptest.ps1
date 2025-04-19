.\pop8query.exe --gsprofile --author Fu8Hkb4AAAAJ --years=1999-2025 --format csv |
  ConvertFrom-Csv |
  Select-Object Title, DOI, Cites |
  Export-Csv -Path "publications.csv" -NoTypeInformation
