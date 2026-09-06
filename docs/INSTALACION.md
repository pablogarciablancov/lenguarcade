# Instalación y publicación de LenguArcade

## Requisitos

- Node.js
- Git
- acceso autorizado al proyecto central de Google Apps Script
- acceso al repositorio de GitHub
- acceso al proyecto de Supabase cuando haya cambios de backend

## Preparación local

Se mantienen dos repositorios locales, uno junto al otro:

```text
LenguArcade/
├── lenguarcade/          código, juegos, Apps Script y Supabase
└── lenguarcade-assets/   recursos visuales públicos compartidos
```

No fusionar ni borrar `lenguarcade-assets`: el portal de alumno/profesor carga desde
ese repositorio el logo, el banner general, avatares, fondos y banners del launcher.

Desde `lenguarcade/`:

```powershell
npm.cmd install
npx.cmd clasp login
npm.cmd run apps:status
npm.cmd run check
```

## Portal de producción

El portal central se publica con:

```powershell
npm.cmd run apps:publish -- "descripcion del cambio"
```

Este comando:

1. ejecuta las comprobaciones;
2. verifica que la rama sea `main` o `integration/*`;
3. comprueba que la copia local esté basada en el `origin/main` más reciente;
4. sube únicamente `apps-script/`;
5. crea una versión inmutable;
6. actualiza el despliegue web estable.

URL estable:

```text
https://script.google.com/macros/s/AKfycbyYW1m5zkvLc87XHUqCqNZpY59ZVA6wv6GyxqB_g7u19tRbE22eYZINSV7BHZLkbLpa/exec
```

No ejecutar `clasp push --force` directamente para publicar producción.

## Juegos

Los juegos públicos viven en `games/<gameId>/` y se sirven con GitHub Pages:

```text
https://pablogarciablancov.github.io/lenguarcade/games/<gameId>/
```

El workflow `.github/workflows/deploy-pages.yml` publica los juegos tras los cambios
en `main`.

Las carpetas `games/*/apps-script/` son fuentes históricas/originales de algunos
juegos. No deben publicarse como aplicaciones independientes.

## Backend

Supabase es la fuente principal para:

- perfiles y sesiones;
- catálogo vivo;
- progreso;
- guardados;
- logros;
- evaluaciones;
- gestión de clases y alumnado.

El Google Sheet central se mantiene solo como capa legacy/respaldo para las partes que
todavía lo necesitan. No debe considerarse la fuente principal.

Las migraciones de `supabase/migrations/` forman parte del historial del esquema:
**no se borran ni se reescriben una vez aplicadas**. Los cambios nuevos se añaden como
una migración posterior.

## Google Classroom

Classroom se conecta desde el panel del profesor mediante Apps Script. La primera
autorización puede requerir ejecutar `autorizarClassroom` desde el editor de Apps
Script y aceptar los permisos solicitados.

Consulta `docs/SUPABASE_CLASSROOM.md`.

## Precauciones

- No publicar Apps Script desde una rama `game/*`.
- No editar el proyecto online de Apps Script mientras haya cambios locales pendientes.
- No ejecutar `clasp pull` con cambios locales sin guardar.
- No usar RawGitHack/RawCDN como alojamiento de producción.
- No volver a activar publicadores independientes de Maniacgrafía, Scrabble o Battlegrafía.
- No aplicar migraciones o inicializaciones destructivas sin revisar antes su efecto.
