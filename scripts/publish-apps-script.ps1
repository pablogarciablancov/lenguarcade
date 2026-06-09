param(
  [Parameter(Mandatory = $true)]
  [string]$Description
)

$ErrorActionPreference = "Stop"
$deploymentId = "AKfycbyYW1m5zkvLc87XHUqCqNZpY59ZVA6wv6GyxqB_g7u19tRbE22eYZINSV7BHZLkbLpa"
$repoRoot = Split-Path -Parent $PSScriptRoot
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

  & $clasp status
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo comprobar la lista de archivos de Apps Script."
  }

  & $clasp push --force
  if ($LASTEXITCODE -ne 0) {
    throw "clasp push ha fallado."
  }

  & $clasp version $Description
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo crear la version de Apps Script."
  }

  $versionLines = & $clasp versions
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo consultar la lista de versiones."
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
    throw "No se pudo determinar la nueva version."
  }

  $versionNumber = ($versionNumbers | Measure-Object -Maximum).Maximum
  & $clasp redeploy $deploymentId --versionNumber $versionNumber --description $Description
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo actualizar el despliegue."
  }

  Write-Host "Apps Script publicado en la version $versionNumber."
} finally {
  Pop-Location
}
