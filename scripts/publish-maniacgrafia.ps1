param(
  [Parameter(Mandatory = $true)]
  [string]$Description
)

$ErrorActionPreference = "Stop"
$deploymentId = "AKfycbxgtB6NP9zVvkkEZjodyGhSQbZmFifeFdMf8uDr0QsXoWsp_AxZdb7OFxtS5vKM-VruPw"
$repoRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Join-Path $repoRoot "games\maniacgrafia\apps-script"
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
    throw "No se pudo comprobar Maniacgrafía."
  }

  & $clasp push --force
  if ($LASTEXITCODE -ne 0) {
    throw "clasp push ha fallado para Maniacgrafía."
  }

  & $clasp version $Description
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo crear la versión de Maniacgrafía."
  }

  $versionLines = & $clasp versions
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo consultar la lista de versiones de Maniacgrafía."
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
    throw "No se pudo determinar la nueva versión de Maniacgrafía."
  }

  $versionNumber = ($versionNumbers | Measure-Object -Maximum).Maximum
  & $clasp redeploy $deploymentId --versionNumber $versionNumber --description $Description
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo actualizar el despliegue estable de Maniacgrafía."
  }

  Write-Host "Maniacgrafía publicada en la versión $versionNumber."
} finally {
  Pop-Location
}
