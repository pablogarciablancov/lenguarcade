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

## Estado

Versión inicial del núcleo: `v0.1`.

Esta versión prepara la base de LenguArcade con Google Apps Script y Google Sheets central, pero todavía no integra en profundidad los juegos reales.

## Regla de oro

No rehacer juegos desde cero. Integrar mediante adaptadores y cambios pequeños, conservando lo que ya funciona.
