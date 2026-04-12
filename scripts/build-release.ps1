param(
  [string]$OutputName = ("release-" + (Get-Date -Format "yyyy-MM-dd_HHmm")),
  [switch]$SkipFrontendBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $repoRoot "frontend"
$backendRoot = Join-Path $repoRoot "backend"
$docsRoot = Join-Path $repoRoot "docs"
$outputRoot = Join-Path $repoRoot $OutputName

function Ensure-Directory {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Copy-Directory {
  param(
    [string]$Source,
    [string]$Destination
  )

  Ensure-Directory -Path (Split-Path -Parent $Destination)
  Copy-Item $Source $Destination -Recurse -Force
}

function New-GitKeep {
  param([string]$Directory)

  Ensure-Directory -Path $Directory
  Set-Content -Path (Join-Path $Directory ".gitkeep") -Value "" -Encoding utf8
}

if (Test-Path $outputRoot) {
  throw "Release folder already exists: $outputRoot"
}

if (-not $SkipFrontendBuild) {
  Push-Location $frontendRoot
  try {
    & npm.cmd run build
  }
  finally {
    Pop-Location
  }
}

$frontendDist = Join-Path $frontendRoot "dist"
if (-not (Test-Path $frontendDist)) {
  throw "Missing frontend build output: $frontendDist"
}

Ensure-Directory -Path $outputRoot
Ensure-Directory -Path (Join-Path $outputRoot "backend")
Ensure-Directory -Path (Join-Path $outputRoot "frontend")
Ensure-Directory -Path (Join-Path $outputRoot "docs")

Copy-Directory -Source $frontendDist -Destination (Join-Path $outputRoot "frontend/dist")
Copy-Item (Join-Path $docsRoot "DEPLOYMENT.md") (Join-Path $outputRoot "docs/DEPLOYMENT.md") -Force
Copy-Item (Join-Path $repoRoot "README.md") (Join-Path $outputRoot "README.source.md") -Force

$backendDirectories = @(
  "app",
  "bootstrap",
  "config",
  "lang",
  "public",
  "routes"
)

foreach ($directory in $backendDirectories) {
  Copy-Directory `
    -Source (Join-Path $backendRoot $directory) `
    -Destination (Join-Path $outputRoot ("backend/" + $directory))
}

$databaseOutput = Join-Path $outputRoot "backend/database"
Ensure-Directory -Path $databaseOutput
Get-ChildItem (Join-Path $backendRoot "database") -Force | ForEach-Object {
  if ($_.Extension -eq ".sqlite") {
    return
  }

  Copy-Item $_.FullName $databaseOutput -Recurse -Force
}

$backendFiles = @(
  ".env.example",
  ".env.production.example",
  ".gitignore",
  "artisan",
  "composer.json",
  "composer.lock"
)

foreach ($file in $backendFiles) {
  Copy-Item (Join-Path $backendRoot $file) (Join-Path $outputRoot ("backend/" + $file)) -Force
}

$storageRoot = Join-Path $outputRoot "backend/storage"
$storageDirectories = @(
  "app",
  "app/avatars",
  "app/datasets",
  "framework",
  "framework/cache",
  "framework/sessions",
  "framework/testing",
  "framework/views",
  "logs"
)

foreach ($directory in $storageDirectories) {
  Ensure-Directory -Path (Join-Path $storageRoot $directory)
}

New-GitKeep -Directory (Join-Path $storageRoot "app")
New-GitKeep -Directory (Join-Path $storageRoot "framework")
New-GitKeep -Directory (Join-Path $storageRoot "logs")

$builtOn = Get-Date -Format "yyyy-MM-dd"
$releaseReadmeTemplate = @'
# Release Package

Built on {BUILT_ON} from the current workspace state.

## Contents

- `backend/` - Laravel backend source prepared for deployment.
- `backend/.env.production.example` - production backend environment template.
- `frontend/dist/` - production-built Vue/Vite frontend assets ready to publish.
- `docs/DEPLOYMENT.md` - deployment checklist for server setup and publish steps.
- `README.source.md` - project overview from the repository root.

## Packaging Rules

- Runtime data is intentionally excluded from the package.
- No user uploads, logs, sessions, cache files, or local SQLite databases are copied.
- Composer dependencies are not bundled; install them on the target server.

## Deployment Notes

- Create `backend/.env` on the server based on `backend/.env.production.example`.
- Point the backend web root to `backend/public`.
- Run `composer install --no-dev --prefer-dist --optimize-autoloader` in `backend/`.
- Publish the contents of `frontend/dist/` on the frontend host or SPA web root.
- Run `php artisan migrate --force`, `php artisan storage:link`, `php artisan config:cache`, `php artisan route:cache`, and `php artisan view:cache` on the server.

## Frontend Build Context

The current production frontend build was generated with `VITE_API_BASE_URL=/api/v1`.

This release expects either:
- same-origin deployment for frontend and API, or
- a reverse proxy on the frontend host that forwards `/api/v1` to Laravel.
'@

$releaseReadme = $releaseReadmeTemplate.Replace("{BUILT_ON}", $builtOn)
Set-Content -Path (Join-Path $outputRoot "README.md") -Value $releaseReadme -Encoding utf8

Write-Host "Release package created at: $outputRoot"
