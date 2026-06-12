param(
  [Parameter(Mandatory = $true)]
  [string]$Description
)

$ErrorActionPreference = "Stop"
$deploymentId = "AKfycbxcVJ1I8jFuhbwjjPPzGFcCdku_LDnXKeZEmnpNYwYo9beCEyNHN8ElzWnXxxjyJFJb"
$repoRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Join-Path $repoRoot "games\scrabble\apps-script"
$clasp = Join-Path $repoRoot "node_modules\.bin\clasp.cmd"

if (-not (Test-Path -LiteralPath $clasp)) {
  throw "Falta clasp. Ejecuta primero: npm.cmd install"
}

Push-Location $repoRoot
try {
  & npm.cmd run check
  if ($LASTEXITCODE -ne 0) {
    throw "Las comprobaciones locales han fallado."
  }
} finally {
  Pop-Location
}

Push-Location $projectRoot
try {
  & $clasp status
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo comprobar Scrabble."
  }

  & $clasp push --force
  if ($LASTEXITCODE -ne 0) {
    throw "clasp push ha fallado para Scrabble."
  }

  & $clasp version $Description
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo crear la versión de Scrabble."
  }

  $versionLines = & $clasp versions
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo consultar la lista de versiones de Scrabble."
  }

  $versionNumbers = @(
    $versionLines |
      ForEach-Object {
        if ($_ -match '^\s*(\d+)\s+-') {
          [int]$Matches[1]
        }
      }
  )

  if (-not $versionNumbers.Count) {
    throw "No se pudo determinar la nueva versión de Scrabble."
  }

  $versionNumber = ($versionNumbers | Measure-Object -Maximum).Maximum
  & $clasp redeploy $deploymentId --versionNumber $versionNumber --description $Description
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo actualizar el despliegue estable de Scrabble."
  }

  Write-Host "Scrabble publicado en la versión $versionNumber."
} finally {
  Pop-Location
}
