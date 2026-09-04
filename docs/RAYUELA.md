# Rayuela · Tu historia. Tus decisiones.

Rayuela es el editor/juego narrativo de LenguArcade para construir aventuras ramificadas. El alumno empieza con una sola casilla en el centro de una cuadrícula 9×9 y el territorio narrativo crece a medida que crea escenas y decisiones.

## Experiencia del alumno

- mapa narrativo visual con escenas y flechas;
- decisiones de una a cuatro opciones;
- posibilidad de crear una continuación o conectar con una escena ya existente;
- finales normales y secretos;
- capítulos o zonas;
- objetos, condiciones y variables como mecánicas avanzadas opcionales;
- modo jugador separado del editor;
- colección de finales descubiertos;
- inspector estructural;
- Brújula del autor;
- métricas de palabras, decisiones, finales, profundidad y complejidad;
- más de 30 logros y easter eggs;
- autoguardado, deshacer/rehacer, JSON de respaldo y exportación a texto;
- entrega con una instantánea congelada;
- feedback docente general y por escena.

## Evaluación

Las métricas automáticas no asignan la nota definitiva. El panel docente dispone de una rúbrica configurable que parte de cinco criterios:

1. Estructura narrativa.
2. Ramificación y consecuencias.
3. Calidad de escritura.
4. Corrección lingüística.
5. Creatividad y elaboración.

El profesor puede cambiar nombres, pesos, puntuaciones y comentarios. La nota ponderada se guarda como evaluación de juego con `scope=game` y `game_id=rayuela`.

Los comentarios por escena se guardan junto con la rúbrica. Al volver a abrir Rayuela, el alumno recibe ese feedback mediante el dashboard de LenguArcade y puede marcar cada comentario como revisado. Ese estado queda en el proyecto del alumno; no modifica la evaluación original del profesor.

## Integración técnica

Rayuela vive en `games/rayuela/index.html` y usa el bridge embebido de LenguArcade. No recibe tokens de sesión.

Mensajes principales:

- `READY`
- `INITIALIZED`
- `SESSION_STARTED`
- `CHECKPOINT`
- `RESULT`
- `CLOSE_READY`

El guardado reutiliza `game_saves`, `game_progress`, `achievement_definitions`, `player_achievements` y `game_events`.

La evaluación docente reutiliza `evaluations`; no se ha creado un segundo sistema de notas.

## Archivos

- `games/rayuela/index.html`: juego/editor.
- `apps-script/LenguArcade_Alumno.html`: traducción de progreso y envío de feedback al juego.
- `apps-script/zzzzzzzzz_LenguArcade_rayuela.gs`: catálogo legado y extensión del panel docente.
- `supabase/migrations/202609040001_add_rayuela.sql`: alta del juego en el catálogo principal.
- `supabase/functions/teacher-rayuela-evaluation/index.ts`: guardado de rúbrica y comentarios.
- `supabase/functions/student-dashboard/index.ts`: entrega de evaluaciones al alumno.
- `supabase/functions/teacher-student-detail/index.ts`: exposición de evaluación específica al profesor.
- `scripts/check-rayuela.mjs`: comprobaciones automáticas de contrato.

## Regla de XP

Rayuela tiene XP interno para mantener motivación durante la escritura. LenguArcade recibe XP únicamente por logros nuevos comunicados por el bridge; el backend deduplica esos logros. Guardar repetidamente el mismo proyecto no genera XP infinito.

## Publicación

La migración y las funciones Supabase están preparadas en el repositorio. Antes de publicar en producción deben aplicarse en el proyecto Supabase autorizado y después publicarse Apps Script/portal con el procedimiento habitual de LenguArcade.
