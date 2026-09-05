param(
  [Parameter(Mandatory = $true)]
  [string]$Description
)

$ErrorActionPreference = "Stop"
$deploymentId = "AKfycbyYW1m5zkvLc87XHUqCqNZpY59ZVA6wv6GyxqB_g7u19tRbE22eYZINSV7BHZLkbLpa"
$repoRoot = Split-Path -Parent $PSScriptRoot

# Guardia de publicación concurrente:
# solo el núcleo estable o una rama de integración actualizada puede redeplegar Apps Script.
Push-Location $repoRoot
try {
  $branch = (& git branch --show-current).Trim()
  if (-not $branch) {
    throw "No se pudo determinar la rama Git actual. No se publica Apps Script."
  }

  if ($branch -ne "main" -and -not $branch.StartsWith("integration/")) {
    throw "Publicación bloqueada desde '$branch'. Apps Script solo puede publicarse desde main o integration/*."
  }

  $dirtyCore = @(& git status --porcelain -- apps-script .clasp.json package.json scripts/publish-apps-script.ps1)
  if ($dirtyCore.Count -gt 0) {
    throw "Hay cambios locales sin commit en el núcleo. Haz commit o descártalos antes de publicar Apps Script."
  }

  & git fetch origin main --quiet
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo actualizar origin/main. Se cancela la publicación para evitar desplegar una copia antigua."
  }

  $originMain = (& git rev-parse origin/main).Trim()
  if ($branch -eq "main") {
    $head = (& git rev-parse HEAD).Trim()
    if ($head -ne $originMain) {
      throw "Tu main local no coincide con origin/main. Actualízalo antes de publicar."
    }
  } else {
    $mergeBase = (& git merge-base HEAD origin/main).Trim()
    if ($mergeBase -ne $originMain) {
      throw "La rama '$branch' no está basada en el main remoto más reciente. Rebasea/actualiza antes de publicar."
    }
  }
} finally {
  Pop-Location
}
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
