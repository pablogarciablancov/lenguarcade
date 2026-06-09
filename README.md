# LenguArcade

Plataforma unificada tipo launcher/Steam educativo para juegos de Lengua.

## Objetivo

Centralizar los juegos educativos existentes sin rehacerlos desde cero, con:

- identificación común de alumno
- catálogo visual de juegos
- progreso general de LenguArcade
- progreso específico por juego
- panel de profesor
- evaluación automática orientativa
- arquitectura modular mediante adaptadores

## Estructura del repositorio

```text
apps-script/
  LenguArcade_Code.gs
  LenguArcade_Alumno.html
  LenguArcade_Profesor.html
  zz_LenguArcade_v0_3_patch.gs
  appsscript.json

games/
  maniacgrafia/
  narratoria/
  versopolis/
  scrabble/
  conjuga-apuesta/
  jeopardy-verbos/

shared/
  lenguarcade-core.js
  lenguarcade-theme.css
  lenguarcade-adapters.js

docs/
  INSTALACION.md
  CAMBIOS.md
  PRUEBAS.md
```

## Desarrollo y publicación

El repositorio está conectado al proyecto de Google Apps Script mediante `clasp`.

```powershell
npm.cmd install
npm.cmd run apps:status
npm.cmd run apps:publish -- "descripcion del cambio"
```

El último comando sube el código, crea una versión inmutable y actualiza el despliegue web estable.

Los recursos visuales públicos se mantienen en:

```text
https://github.com/pablogarciablancov/lenguarcade-assets
```

Battlegrafía se mantiene como proyecto independiente y no se modifica desde este repositorio salvo petición expresa.

## Regla de oro

No rehacer juegos desde cero. Integrar mediante adaptadores y cambios pequeños, conservando lo que ya funciona.
