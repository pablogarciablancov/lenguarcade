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
- ramas `feature/*`: pueden contener trabajo no fusionado y no se consideran basura.

## Supabase

Se eliminó la tabla temporal:

```text
public.bridge_diagnostics
```

Las Edge Functions temporales creadas durante el diagnóstico:

- `bridge-diagnostic`
- `game-static`
- `diagnose-game-host`

no se pueden borrar mediante la API disponible en esta sesión. Se redeplegaron para
responder siempre `404 Not found`, por lo que quedan desactivadas.

## Alojamiento consolidado

Producción usa:

```text
https://pablogarciablancov.github.io/lenguarcade/games/<gameId>/
```

Se añadió una migración posterior que registra estas URL sin reescribir migraciones
históricas que usaron Githack.

## Pendiente opcional · fase 2

No se hizo en esta limpieza porque implicaría una refactorización funcional:

1. convertir el catálogo de juegos en una única fuente canónica generadora de Apps
   Script + Supabase;
2. podar manualmente ramas `integration/*` ya fusionadas;
3. borrar desde el panel de Supabase las tres Edge Functions temporales desactivadas,
   si se desea que desaparezcan también de la lista;
4. revisar si el workflow `harden-assets.yml` puede simplificarse en una futura
   migración de assets a un único host.

La limpieza de esta fase no modifica ningún `index.html` de juego ni sus mecánicas.
