# Limpieza y consolidación · 2026-09-06

Esta revisión se realizó después de estabilizar LenguArcade con los juegos servidos
desde GitHub Pages.

## Criterio

No se eliminó nada por apariencia. Solo se retiraron elementos que cumplían alguna de
estas condiciones:

- diagnóstico temporal ya finalizado;
- duplicado exacto sin referencias;
- placeholder vacío;
- publicador antiguo incompatible con la arquitectura actual;
- recurso local sustituido por la fuente pública oficial;
- script de migración histórico que podía confundirse con una herramienta operativa.

## Retirado del árbol activo

- `diagnostics/bridge-probe.html`.
- `assets/games/`: banners SVG locales antiguos; los assets generales viven en
  `lenguarcade-assets`.
- `shared/.gitkeep`: la antigua capa `shared/` no existe en la arquitectura actual.
- `.gitkeep` innecesarios dentro de carpetas de juegos.
- `games/narratoria/Narratoria_Alumno.html` y
  `games/narratoria/Narratoria_Alumnos.html`: redirects idénticos y sin referencias.
- `scripts/publish-maniacgrafia.ps1`.
- `scripts/publish-scrabble.ps1`.
- `scripts/publish-battlegrafia.ps1`.
- las `.clasp.json` de esos tres proyectos antiguos.
- los alias npm de publicación independiente y el alias directo `apps:push`.

## Reorganizado

Las herramientas de migración ya utilizadas se conservan en:

```text
scripts/archive/legacy-migrations/
```

No forman parte del flujo operativo.

## Conservado intencionadamente

- `games/*/apps-script/`: fuentes originales/históricas de juegos que nacieron en
  Apps Script. Se mantienen para edición y comparación, pero no se publican.
- `games/battlegrafia_v2/`: laboratorio independiente; no sustituye a la clásica.
- todas las migraciones de `supabase/migrations/`: las migraciones aplicadas son
  historial de esquema y no deben borrarse.
- `docs/CAMBIOS.md` y `docs/PRUEBAS.md`: historial útil aunque contengan referencias
  a etapas antiguas.
- las ramas de trabajo se conservaron mientras podían contener cambios exclusivos; tras comparar su contenido con `main`, se podaron cuando quedó demostrado que no aportaban trabajo no integrado.

## Supabase

Se eliminó la tabla temporal:

```text
public.bridge_diagnostics
```

Las Edge Functions temporales creadas durante el diagnóstico:

- `bridge-diagnostic`
- `game-static`
- `diagnose-game-host`

se eliminaron definitivamente del proyecto una vez comprobado que ningún código de
producción las referenciaba.

## Alojamiento consolidado

Producción usa:

```text
https://pablogarciablancov.github.io/lenguarcade/games/<gameId>/
```

Se añadió una migración posterior que registra estas URL sin reescribir migraciones
históricas que usaron Githack.

## Fase 2 completada · catálogo canónico

La consolidación del catálogo se realizó después de esta limpieza:

- `config/game-catalog.json` es la única fuente editable;
- Apps Script recibe un archivo generado;
- Supabase recibe un snapshot SQL generado;
- `student-dashboard` lee directamente `public.games`;
- el HTML del alumno ya no contiene overrides de identidad, URL o estado.

## Fase 3 completada · cierre estructural

La tercera fase dejó el entorno en su estado consolidado:

- el repositorio `pablogarciablancov/lenguarcade` conserva únicamente la rama `main`;
- el repositorio `pablogarciablancov/lenguarcade-assets` conserva únicamente la rama `main`;
- `lenguarcade-assets` queda documentado como segundo repositorio oficial y dependencia
  activa para logo, identidad visual, avatares, fondos y banners del launcher;
- `npm run check` vuelve a validar Battlegrafía 2.0 como laboratorio aislado;
- `harden-assets.yml` comprueba también los banners de Rayuela y Entre Líneas;
- las funciones de diagnóstico temporales de Supabase han sido eliminadas;
- las migraciones históricas de Supabase se conservan como historial reproducible;
- las herramientas antiguas permanecen archivadas fuera del flujo operativo.

En local, la estructura final recomendada es:

```text
LenguArcade/
├── lenguarcade/
└── lenguarcade-assets/
```

La limpieza de estas fases no modifica ningún `index.html` de juego ni sus mecánicas.
