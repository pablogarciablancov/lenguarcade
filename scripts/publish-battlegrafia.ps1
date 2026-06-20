param(
  [Parameter(Mandatory = $true)]
  [string]$Description
)

$ErrorActionPreference = "Stop"
$deploymentId = "AKfycbwJRO4_CkEYp6tLtmaYohUD6dSEtAiit3OTW2669yo75DpY5IR6yGdeBv-kWor22zxEyA"
$repoRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Join-Path $repoRoot "games\battlegrafia\apps-script"
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
    throw "No se pudo comprobar BattleGrafia."
  }

  & $clasp push --force
  if ($LASTEXITCODE -ne 0) {
    throw "clasp push ha fallado para BattleGrafia."
  }

  & $clasp version $Description
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo crear la version de BattleGrafia."
  }

  $versionLines = & $clasp versions
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo consultar la lista de versiones de BattleGrafia."
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
    throw "No se pudo determinar la nueva version de BattleGrafia."
  }

  $versionNumber = ($versionNumbers | Measure-Object -Maximum).Maximum
  & $clasp redeploy $deploymentId --versionNumber $versionNumber --description $Description
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo actualizar el despliegue estable de BattleGrafia."
  }

  Write-Host "BattleGrafia publicada en la version $versionNumber."
} finally {
  Pop-Location
}
