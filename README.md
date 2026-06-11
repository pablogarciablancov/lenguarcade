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
    apps-script/
      Code.js
      Alumno.html
      Profesor.html
      appsscript.json

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
npm.cmd run maniac:publish -- "descripcion del cambio"
```

Maniacgrafía es el primer juego integrado: se abre dentro de LenguArcade, recibe la identidad del alumno autenticado y devuelve el resultado de la partida al progreso central. El token de sesión nunca se entrega al juego.

Los comandos de publicación suben el código, crean una versión inmutable y actualizan el despliegue web estable correspondiente.

La carpeta `.codex/rules/` permite a Codex ejecutar estos comandos concretos sin solicitar permisos repetidos cuando el repositorio está abierto como proyecto confiable.

Los recursos visuales públicos se mantienen en:

```text
https://github.com/pablogarciablancov/lenguarcade-assets
```

Battlegrafía se mantiene como proyecto independiente y no se modifica desde este repositorio salvo petición expresa.

## Regla de oro

No rehacer juegos desde cero. Integrar mediante adaptadores y cambios pequeños, conservando lo que ya funciona.
