# Arquitectura de LenguArcade

## Principio

LenguArcade no debe ampliar la aplicación creando archivos `zz...` que sobrescriban
funciones o envuelvan sucesivamente la salida HTML. La versión publicada debe poder
entenderse leyendo los archivos base.

## Apps Script

- `LenguArcade_Code.gs`  
  Núcleo: entrada web, Sheets, catálogo, progreso, sesiones legacy y funciones comunes.

- `LenguArcade_Auth.gs`  
  Acceso institucional con Google, profe-jugador, compatibilidad V03 y utilidades de
  autenticación.

- `LenguArcade_Workshop.gs`  
  Control de juegos disponibles, sesiones del taller y permisos temporales de casa.

- `LenguArcade_Roster.gs`  
  Sincronización del respaldo legacy de Sheets para archivar, restaurar o eliminar
  clases y alumnos.

- `LenguArcade_Classroom.gs`  
  Puente de Google Classroom.

- `LenguArcade_Alumno.html`  
  Interfaz final del alumno. Las funciones de acceso, navegación, taller y bridge de
  juegos forman parte de este documento; no se inyectan desde otro archivo `.gs`.

- `LenguArcade_Profesor.html`  
  Interfaz final del profesor, incluida Gestión, taller, diagnósticos y evaluaciones.

## Supabase

Supabase sigue siendo la fuente principal para autenticación de aplicación, perfiles,
progreso, guardados, evaluaciones y gestión. Las Edge Functions sensibles exigen una
sesión válida y realizan las operaciones con privilegios de servidor.

## Assets públicos

Los recursos visuales compartidos no viven dentro del repositorio principal. Se
mantienen en el repositorio independiente `pablogarciablancov/lenguarcade-assets`:

- `assets/brand/`: logo, favicon y banner general;
- `assets/avatars/`: personajes del perfil;
- `assets/avatar-backgrounds/`: fondos del perfil;
- `assets/games/`: banners de las tarjetas del launcher.

El portal carga primero desde GitHub Raw y dispone de jsDelivr como fallback. Los
`index.html` de los juegos conservan sus propios recursos internos y no dependen de
este repositorio salvo que se documente expresamente lo contrario.

En local, la estructura recomendada es mantener ambos repositorios como carpetas
hermanas: `LenguArcade/lenguarcade` y `LenguArcade/lenguarcade-assets`.

## Catálogo canónico

`config/game-catalog.json` es la única fuente editable de identidad, estado,
orden, URL, integración y metadatos de los juegos.

El comando:

```powershell
npm.cmd run catalog:sync
```

genera la representación compatible con Apps Script y el snapshot SQL de Supabase.
`npm run check` ejecuta `catalog:check` y falla si una salida generada ha sido
editada a mano o está desincronizada.

`student-dashboard` no contiene un mapa de integraciones: lee `url`,
`integration`, `description`, `competencies` y `official` directamente de
`public.games`.

El HTML del alumno tampoco contiene overrides de URL o estado. Solo conserva lógica
específica de mecánicas cuando un juego la necesita.

## Regla para nuevas funciones

1. Si es lógica de servidor, añadirla al módulo `.gs` correspondiente.
2. Si es interfaz de alumno o profesor, integrarla en su HTML base.
3. Si es un juego, mantener el juego separado en `games/` y usar el bridge estable de
   LenguArcade.
4. No sobrescribir `buildLenguArcadeHtmlOutput_`, `getActiveGames_` o `findGame_`
   desde archivos posteriores.
5. No crear archivos prefijados con `zz` para controlar el orden de carga.
6. Añadir una comprobación a `npm run check` cuando la nueva función tenga un contrato
   importante.

## Publicación

La publicación estable continúa realizándose con:

```powershell
npm.cmd run apps:publish -- "Descripción del cambio"
```

El script ejecuta las comprobaciones antes de `clasp push` y actualiza el despliegue
estable solamente si todo pasa.
