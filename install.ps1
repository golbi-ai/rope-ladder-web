# Usage: irm https://rpldr.golbi.ai/install.ps1 | iex
param([string]$BaseUrl = $env:ROPE_LADDER_INSTALL_BASE)
if (-not $BaseUrl) { $BaseUrl = "https://rpldr.golbi.ai" }
$ErrorActionPreference = "Stop"; $ProgressPreference = "SilentlyContinue"
$Arch = switch ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture) { "X64" { "amd64" }; "Arm64" { "arm64" }; default { throw "Unsupported architecture: $_" } }
Write-Host "  > Fetching version manifest..." -ForegroundColor Blue
$Manifest = Invoke-RestMethod -Uri "$BaseUrl/version.json"
$Asset = $Manifest.assets | Where-Object { $_.os -eq "windows" -and $_.arch -eq $Arch } | Select-Object -First 1
if (-not $Asset) { throw "No release asset exists for windows/$Arch" }
$Temp = Join-Path $env:TEMP "rope-ladder-install-$([guid]::NewGuid())"; New-Item -ItemType Directory -Path $Temp -Force | Out-Null
try {
  $Archive = Join-Path $Temp (Split-Path -Leaf $Asset.url)
  Write-Host "  > Downloading rope-ladder $($Manifest.version)..." -ForegroundColor Blue
  Invoke-WebRequest -Uri $Asset.url -OutFile $Archive
  $Hash = (Get-FileHash -Path $Archive -Algorithm SHA256).Hash.ToLower()
  if ($Hash -ne $Asset.sha256) { throw "Checksum verification failed" }
  Expand-Archive -Path $Archive -DestinationPath $Temp -Force
  $Binary = Get-ChildItem -Path $Temp -Recurse -Filter "rope-ladder.exe" | Select-Object -First 1
  if (-not $Binary) { throw "Release archive does not contain rope-ladder.exe" }
  $Install = Join-Path $env:LOCALAPPDATA "rope-ladder\bin"; New-Item -ItemType Directory -Path $Install -Force | Out-Null
  $Destination = Join-Path $Install "rope-ladder.exe"
  Get-ChildItem -Path "$Destination.old-*" -ErrorAction SilentlyContinue | ForEach-Object { try { Remove-Item $_.FullName -Force -ErrorAction Stop } catch {} }
  try { Copy-Item $Binary.FullName $Destination -Force -ErrorAction Stop } catch { $Old = "$Destination.old-$([guid]::NewGuid().ToString('N'))"; Move-Item $Destination $Old -Force; Copy-Item $Binary.FullName $Destination -Force }
  $UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
  if ($UserPath -notlike "*$Install*") { [Environment]::SetEnvironmentVariable("Path", "$UserPath;$Install", "User"); $env:Path = "$env:Path;$Install" }
  & $Destination version
  Write-Host "rope-ladder installed successfully. Run: rope-ladder mcp install" -ForegroundColor Green
} finally { Remove-Item -Recurse -Force $Temp -ErrorAction SilentlyContinue }
