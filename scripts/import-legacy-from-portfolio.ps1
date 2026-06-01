param([Parameter(Mandatory=$true)][string]$PortfolioPath)
$ErrorActionPreference = "Stop"
$target = Join-Path $PSScriptRoot "..\legacy\portfolio-source"
New-Item -ItemType Directory -Force -Path "$target\pages\blog", "$target\assets\js", "$target\assets\css" | Out-Null
Copy-Item "$PortfolioPath\pages\tokenops.html" "$target\pages\tokenops.html" -Force
Copy-Item "$PortfolioPath\pages\blog\token-cost-comparator.html" "$target\pages\blog\token-cost-comparator.html" -Force
Copy-Item "$PortfolioPath\assets\js\token-pricing.js" "$target\assets\js\token-pricing.js" -Force
Copy-Item "$PortfolioPath\assets\css\tokenops.css" "$target\assets\css\tokenops.css" -Force
Copy-Item "$PortfolioPath\assets\css\token-cost-comparator.css" "$target\assets\css\token-cost-comparator.css" -Force
Write-Host "Original TokenOps source copied into legacy/portfolio-source. Review and commit the preservation copy."
