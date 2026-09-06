# LenguArcade

Plataforma educativa que reúne en un único portal los juegos de Lengua y Literatura.

## Producción

LenguArcade tiene tres piezas claramente separadas:

- **Portal y panel del profesor:** Google Apps Script.
- **Juegos estáticos:** GitHub Pages.
- **Datos, sesiones y progreso:** Supabase.

URL estable del portal:

```text
https://script.google.com/macros/s/AKfycbyYW1m5zkvLc87XHUqCqNZpY59ZVA6wv6GyxqB_g7u19tRbE22eYZINSV7BHZLkbLpa/exec
```

Base pública de los juegos:

```text
https://pablogarciablancov.github.io/lenguarcade/games/
```

Los recursos visuales generales se mantienen en el repositorio independiente
`pablogarciablancov/lenguarcade-assets`.

## Estructura actual

```text
apps-script/                 núcleo del portal
games/                       un directorio por juego
  <gameId>/index.html        entrada pública del juego
  <gameId>/apps-script/      fuentes históricas/originales cuando existen
supabase/
  functions/                 backend activo
  migrations/                historial de esquema; no borrar migraciones aplicadas
scripts/
  check-*.mjs                validaciones
  archive/                   herramientas históricas no operativas
docs/                        arquitectura, pruebas y procedimientos
.github/workflows/
  deploy-pages.yml           publicación de los juegos en GitHub Pages
  game-scope-guard.yml       protege el trabajo simultáneo por juego
  harden-assets.yml          endurecimiento de recursos
```

Las carpetas `games/*/apps-script/` se conservan como fuente o referencia cuando un
juego nació como proyecto Apps Script. **No son destinos de publicación de producción.**

## Catálogo único de juegos

La fuente de verdad del catálogo es:

```text
config/game-catalog.json
```

No se escriben manualmente listas de juegos en Apps Script, el HTML del alumno ni
`student-dashboard`.

Después de modificar el catálogo:

```powershell
npm.cmd run catalog:sync
npm.cmd run check
```

`catalog:sync` genera:

- `apps-script/LenguArcade_GameCatalog.gs`;
- `supabase/catalog/game-catalog.sql`.

Esos archivos generados se versionan, pero no se editan a mano. Supabase almacena
además `description`, `competencies`, `integration` y `official`, de modo que
el dashboard puede construir cada juego directamente desde `public.games`.

## Comandos habituales

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run apps:status
npm.cmd run apps:publish -- "descripcion del cambio"
```

`apps:publish` es el único comando admitido para publicar el núcleo de Apps Script.
Tiene una guardia que impide publicar desde ramas de juego o desde una copia local
desactualizada.

Los juegos no se publican con `clasp`: GitHub Pages despliega `games/` desde
`main`.

## Trabajo simultáneo

Cada juego se desarrolla en:

```text
game/<gameId>/<cambio>
```

Una rama de juego solo modifica su propio juego. Los cambios de catálogo, runner,
Apps Script o Supabase se hacen exclusivamente desde una rama `integration/*`.

Consulta `docs/TRABAJO_CONCURRENTE_JUEGOS.md`.

## Principios

1. No rehacer un juego que ya funciona.
2. No romper mecánicas, bancos, guardados ni progreso.
3. Mantener el núcleo separado de los juegos.
4. Integrar mediante el bridge de LenguArcade sin entregar tokens de sesión al juego.
5. Toda publicación de producción debe ser reproducible desde el repositorio.
6. No usar RawGitHack/RawCDN como alojamiento de producción.

## Battlegrafía 2.0

`games/battlegrafia_v2/` se conserva como versión independiente en laboratorio.
No sustituye a la Battlegrafía clásica y permanece fuera del catálogo activo hasta
una integración posterior.
