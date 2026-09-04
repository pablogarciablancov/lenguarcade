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
