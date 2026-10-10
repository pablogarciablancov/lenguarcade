## Navegación del profesor y progreso de Maniacgrafía (2026-10-10)
- Ejecutar `node scripts/check-learning-tracking.mjs`: los enlaces cruzados deben invocar `laShowTeacherScreen` y pasar el filtro de progreso de Maniacgrafía (palabras acertadas, mundo de aventura y porcentaje que no retrocede).
- Ejecutar `npm run check`.
- En `/exec`, alternar desde «Planificar taller» a Taller y desde el acceso del Taller a Misiones: la sección elegida debe quedar visible y el botón correcto activo.
- Enviar un resultado de Maniacgrafía con `stats.totalWords=250` y sin `metrics.percentage`: el progreso guardado debe mostrar 25 %, y conservar cualquier porcentaje anterior superior.

## 2026-10-07 · Profesor en el panel común de jugador

1. Actualizar `main` y publicar el despliegue estable: `npm.cmd run apps:publish -- "Modo jugador del profesor"`.
2. En el panel profesor, pulsar «Modo jugador» en la barra lateral. Debe abrir el catálogo habitual con la cuenta Google del profesor, sin pedir una cuenta de alumno.
3. Comprobar que el perfil conserva rol de profesor y que aparece «Panel profesor» para volver. Los accesos normales de alumnos no muestran ese botón.
4. Abrir Conjuga y apuesta desde el catálogo → Duelo online. Elegir una clase propia, crear sala y compartir código con un alumno con el juego abierto.
5. Jugar varios turnos y recargar el iframe. Debe recuperar la misma sala y mantener los turnos exclusivos. Al terminar, el alumno conserva XP/logros y el profesor no recibe recompensas online.
6. Repetir creando la sala desde el alumno y entrando como profe-jugador con el código.
7. Si hay una sesión antigua de alumno en ese navegador, la ruta de profesor debe verificar Google antes de enseñar el catálogo; el parámetro de URL no permite convertirse en profesor.
8. Probar «Panel profesor», tanto en página directa como dentro de Sites; se mantiene la navegación del acceso existente y puede requerir permitir ventanas emergentes.

Automatizado: `npm run check` incluye pruebas de rutas y aislamiento de sesión de entrada; `scripts/check-conjuga-online-browser.mjs` prueba el profesor con el panel de jugador real y servicios simulados. La comprobación final de Google y `/exec` requiere publicar Apps Script y usar cuentas reales.

## 2026-10-07 · Profesor contra alumno online

1. Publicar el núcleo desde `main` actualizado: `npm.cmd run apps:publish -- "Conjuga: profesor contra alumno"`. Mantener el despliegue estable.
2. Entrar en `/exec` como profesor; abrir Alumnos → «Jugar con un alumno»; elegir una clase asignada.
3. Crear sala desde el juego y pasar el código a un alumno de esa clase, con el juego abierto para él.
4. Ambos pulsan «Estoy listo». Solo quien tiene el turno puede apostar o contestar; ambos ven el mismo resultado.
5. Recargar el iframe: debe recuperar la misma partida. Cerrar desde el panel: debe abandonar y guardar los aciertos del alumno.
6. Repetir creando la sala desde el alumno y uniéndose el profesor mediante código.
7. Revisar que el alumno recibe XP, sesiones y logros una sola vez. El profesor no obtiene progreso ni modifica su guardado anterior.
8. Rechazar profesor de otra clase, organización distinta, clase archivada y pareja de dos profesores. Cerrar el juego para el alumno y comprobar que se aplica su acceso.

Validación automatizada:

- `npm run check`: incluye motor y permisos online con perfiles, organización, membresías activas y cierre de taller.
- `PGLITE_MODULE=/ruta/a/pglite/dist/index.js node --no-warnings scripts/check-conjuga-online-db.mjs`: migraciones originales y actualización, cierre alumno–alumno y profesor–alumno, recompensas e idempotencia.
- `PLAYWRIGHT_MODULE=/ruta/a/playwright CHROMIUM_EXECUTABLE=/ruta/a/chromium node --no-warnings scripts/check-conjuga-online-browser.mjs`: dos navegadores y panel profesor real contra backend de pruebas; creación/unión, turnos, reconexión, mensajes ajenos y cierre.

Las pruebas locales usan perfiles y autenticación simulados; la prueba final en `/exec` requiere dos sesiones reales después de publicar Apps Script.

## 2026-10-07 — Duelo online de Conjuga y apuesta

Automáticas:

- `npm run check`: incluye `scripts/check-conjuga-online.mjs` (reglas, duplicados, tildes, ayudas, timeout, rescate, final, desconexión y privacidad).
- `scripts/check-conjuga-online-db.mjs`: PostgreSQL PGlite con las tablas originales de progreso; migración, recompensas de dos perfiles, logros, permisos e idempotencia. Requiere `@electric-sql/pglite@0.3.14`, disponible en `PGLITE_MODULE` si está instalado fuera del proyecto.
- `scripts/check-conjuga-online-browser.mjs`: dos páginas aisladas, host con el proxy real y servidor local con el motor. Requiere Playwright y Chromium (`PLAYWRIGHT_MODULE`, `CHROMIUM_EXECUTABLE`). Crear/unirse/listos, turno exclusivo, resultado compartido, texto conservado durante sondeo, seguro y recarga. 1366×768, 1440×900, 1920×1080 y 600 px disponibles, sin scroll ni errores JS.
- Estas pruebas de navegador usan perfiles ficticios: no sustituyen la prueba final del `/exec` con dos alumnos reales.

Tras publicar el despliegue estable:

1. Dos alumnos de una misma clase, cada uno con sesión de LenguArcade en su Chromebook.
2. Abrir Conjuga y apuesta → Duelo online. A crea; B introduce su código. Ambos pulsan «Estoy listo».
3. Confirmar turnos exclusivos, apuestas, acierto/fallo compartido, pistas, seguro y cambio.
4. Recargar durante una pregunta; recuperar sala y reloj sin duplicar jugadas.
5. Cortar la red brevemente; recuperar antes de 90 s. Probar abandono y cierre por profesor.
6. Completar la partida, cerrar el juego y verificar progreso/evento único de ambos perfiles en el panel.
7. Comprobar rechazo de códigos de otra clase y de un tercer jugador. Confirmar modo local.

## 2026-10-05 · Panel del profesor · Fase 1

1. Abrir `/exec?page=profesor`, iniciar sesión y comprobar que «Resumen» aparece como «Hoy» sin alterar el resto de navegación.
2. Seleccionar una clase y confirmar que Alumnos, Activos ahora, Sesiones hoy y Necesitan mirada cambian con el filtro.
3. Con dos alumnos de prueba, generar actividad reciente y verificar el estado verde (≤5 min), amarillo (≤15 min), último juego y apertura de ficha al pulsar la fila.
4. Desde Control rápido, probar «Abrir solo este», «Todos» y «Cerrar todos»; comprobar en alumno que el acceso cambia y que no se pierde progreso.
5. Abrir un Taller para la clase y verificar que «Hoy» muestra título, juegos, objetivo XP y cumplimiento; «Gestionar / cerrar sesión» debe llevar a Talleres con la clase seleccionada.
6. Permanecer en «Hoy» al menos 30 s y confirmar refresco silencioso cada 12 s sin loader ni salto de pantalla; cambiar a otra sección y comprobar que deja de refrescar.
7. Revisar 1366×768, 1440×900 y 1920×1080, además de anchura móvil: sin scroll horizontal general, solapamientos ni tabla ilegible.
8. Ejecutar `npm run check` antes de fusionar y publicar Apps Script mediante el despliegue estable; si cambia teacher-dashboard, desplegar también esa Edge Function.

## 2026-10-05 · FORJA

- `node games/forja/dictionary-test.mjs`: talar/TALAR, saltar, cantar, mesa, perro, casa, jardín/jardin, rápido/rapido, Unicode descompuesto, Ñ, palabras inválidas, puntuación, guardado y fallos independientes de las fuentes.
- `node games/forja/smoke-test.mjs`: economía, tienda, eventos, infinito y guardado anterior.
- `node games/forja/browser-test.mjs`: UI y bridge; 1366×768, 1440×900, 1920×1080 y altura reducida, sin scroll general. Usar LEXOMA_CHROMIUM si hace falta; movimiento reducido en las pruebas para poder clicar fichas animadas.
- `node games/forja/integration-browser-test.cjs`: tarjeta con portada, runner real y backend simulado, TALAR, XP idempotente, cierre y restauración central sin caché, responsive embebido.
- `npm run catalog:sync` y `npm run check`: 15 juegos oficiales, sintaxis y comprobaciones generales.
- La prueba local no acredita publicación del /exec estable. Actualizarlo con `npm.cmd run apps:publish -- "Integra FORJA y amplía su diccionario"` si no hay credenciales en este entorno.

## 2026-10-05 · Lexitrama

- `npm run catalog:sync` y `npm run check`: catálogo de 14 juegos y checks generales, incluidas 300 campañas/semillas y 1450 cascadas de Lexitrama.
- `node games/lexitrama/browser-test.cjs`: Chromium con arrastre, teclado, táctil, victoria, recarga, jefe y perfil. 1366×768, 1440×900, 1920×1080, iframe de 620 px y móvil 390×844; sin scroll general ni errores JS.
- `node games/lexitrama/integration-browser-test.cjs`: runner extraído del HTML real y persistencia de prueba con el cálculo autoritativo real. Carga, perfil, guardado central, XP idempotente, logros, salida y restauración sin caché; gracia de 60 s, guardado durante gracia, reapertura, salida voluntaria, checkpoint al agotarse el minuto y fallo/reintento.
- Pendiente de credenciales: actualizar el /exec estable mediante `npm.cmd run apps:publish -- "Integra Lexitrama y conserva su diseño ilustrado"` y repetir con alumno/profesor reales. Las pruebas locales no demuestran publicación de Apps Script ni uso con alumnos reales.

# Plan de pruebas

## Conexión y Tierras de Tinta (2026-09-30)

1. Ejecutar `npm run check`; incluye campaña, aislamiento de perfiles y reanudación de expedición.
2. Alumno de prueba: abrir los siete juegos afectados y comprobar que tras conectar no vuelve «Cargando tu progreso».
3. Guardianes: Jugar oculta el menú inicial; elegir mapa conserva `lenguarcade` y `channel`; salir espera CHECKPOINT_CONFIRMED.
4. Tierras: abrir dentro del runner, cambiar héroe/equipo, iniciar expedición, salir y reabrir. Comprobar vida, bajas y recursos de la expedición, además del campamento.
5. Interrumpir red durante un guardado: no mostrar confirmación falsa; reintentar antes de salir.
6. Verificar visualmente a 1366×768, 1440×900 y 1920×1080 con la cabecera del host. La ejecución local del navegador no estuvo disponible en este entorno.
7. Publicar Apps Script en el despliegue estable y validar /exec con alumno y profesor.

## Versópolis V0.5 (2026-09-28)

1. Ejecutar `node scripts/check-versopolis.mjs` y `npm run check`.
2. Abrir `https://pablogarciablancov.github.io/lenguarcade/games/versopolis/` y comprobar que la portada indica V0.5 y muestra las cuatro expediciones.
3. Entrar en cada mapa, elegir una Musa y confirmar que se ven el escenario, el rival animado, el HUD, el contrato y las cartas sin desplazamiento vertical en escritorio.
4. Usar Barajar y Descartar y verificar que cada acción consume un Cambio sin gastar una ronda; intentar atacar sin cumplir el contrato y comprobar el coste del fallo.
5. Guardar y salir; reabrir la expedición y comprobar la recuperación. Repetir con un guardado anterior de V0.4.
6. Abrir Versópolis desde la tarjeta del alumno en LenguArcade cuando el profesor lo tenga disponible. Comprobar que carga en el runner, se conserva el progreso al salir y aparece el cierre de un minuto si el profesor lo bloquea durante la partida.
7. Revisar el atlas y el duelo también a 1440×900 y 1920×1080, además de la vista de 1366×768.

## Identidad Supabase y sesión de alumno (2026-09-26)

1. Ejecutar `node scripts/check-student-auth-session.mjs` y `npm run check`.
2. En un navegador sin datos previos, entrar con un alumno válido; comprobar una única llamada a `/auth/v1/signup`.
3. Salir y volver a entrar con el mismo alumno; comprobar que no aparece otra llamada a `/auth/v1/signup`.
4. Salir y entrar con otro alumno en el mismo Chromebook; debe cargar su perfil y no el anterior, sin un nuevo signup.
5. Recargar la página con la sesión abierta: recuperar el panel. Salir y recargar: mostrar el acceso, mantener `LA_SUPABASE_SESSION` y rechazar el dashboard previo.
6. Probar un PIN incorrecto y comprobar que se conserva `LA_SUPABASE_SESSION`.
7. Con el access token caducado, comprobar una llamada a `/auth/v1/token?grant_type=refresh_token` y ningún signup. Con refresh token inválido, comprobar una única creación nueva al iniciar sesión.
8. Probar el acceso con Google y el modo profesor jugador. Añadir un rival en un juego compatible y verificar que su token no sustituye el principal.
9. Guardar progreso y comprobar que se recupera después de recargar; verificar también la copia de respaldo en Sheets si está habilitada.
10. Confirmar que un 429 en `/auth/v1/signup` muestra un mensaje comprensible sin bucle de peticiones.

Las pruebas automatizadas simulan las respuestas de Supabase; estos pasos con credenciales de prueba deben hacerse sobre el despliegue tras publicar una versión validada.

## Sesiones del taller y acceso supervisado en casa

1. Publicar la nueva versión de Apps Script y abrir `/exec?page=profesor` con una cuenta autorizada.
2. Entrar en `🎛️ Taller` y seleccionar una clase concreta.
3. Confirmar que aparece `🎯 Sesión del taller` con título, objetivo XP, mensaje, selector de juegos y controles de casa.
4. Preparar una misión con dos juegos, un título y un mensaje; pulsar `Guardar sesión`.
5. Abrir la vista de un alumno de esa clase y confirmar que aparece la tarjeta `MISIÓN ACTUAL`.
6. Con la sesión guardada pero cerrada, confirmar que los juegos de la misión no pueden abrirse.
7. Pulsar `Abrir en clase` y comprobar que, en un máximo aproximado de 30 segundos, los juegos seleccionados quedan disponibles para ese alumno.
8. Confirmar que un juego no seleccionado permanece bloqueado aunque otros juegos de la sesión estén abiertos.
9. Pulsar `Cerrar en clase` y confirmar que vuelven a bloquearse sin cerrar sesión ni recargar manualmente.
10. Activar `Acceso supervisado en casa`, indicar un intervalo que incluya la hora actual y guardar.
11. Con la sesión de clase cerrada, confirmar que durante ese intervalo la tarjeta indica `Abierta en casa` y los juegos seleccionados pueden abrirse.
12. Cambiar el final del intervalo a una hora ya pasada y confirmar que el acceso doméstico queda cerrado tras la siguiente actualización.
13. Programar un intervalo futuro y confirmar que la tarjeta muestra que existe acceso en casa programado pero no abre todavía los juegos.
14. Cerrar manualmente uno de los juegos seleccionados mediante `AccesosJuegos` y confirmar que sigue cerrado incluso cuando la sesión está abierta.
15. Pulsar `Retirar sesión` y confirmar que deja de aparecer `MISIÓN ACTUAL`; para esa clase vuelve a aplicarse el comportamiento previo del launcher.
16. Abrir la hoja central y confirmar que existe `TallerSesiones` con una fila por clase y las columnas de configuración de la sesión.
17. Recargar el panel del profesor y confirmar que título, mensaje, XP, juegos y horario de casa persisten.
18. Comprobar que un alumno no puede invocar las funciones de escritura de sesiones porque el servidor exige profesor autorizado.
19. Activar en el catálogo un juego nuevo de prueba y confirmar que aparece automáticamente en el selector de `Juegos de esta misión` sin modificar el código de sesiones.
20. Repetir la prueba en móvil y escritorio y confirmar que el editor, las fechas y la tarjeta de misión no desbordan.

Resultado esperado por defecto: una clase que todavía no tenga sesión publicada conserva el comportamiento anterior basado en `AccesosJuegos`.

## Control de acceso del taller

1. Publicar la nueva versión de Apps Script con el flujo estable del proyecto.
2. Abrir `/exec?page=profesor` con una cuenta autorizada `@fomento.edu`.
3. Confirmar que aparece la nueva opción `🎛️ Taller` y la tarjeta `Control del taller`.
4. En `Todas las clases · regla general`, cerrar un juego concreto y comprobar que el botón pasa a `🔒 Cerrado`.
5. Abrir `/exec?page=alumno` con un alumno y confirmar que ese juego sigue visible, aparece como `🔒 Cerrado hoy` y su botón está desactivado.
6. Intentar abrir el juego cerrado y confirmar que LenguArcade muestra el aviso de que no está disponible en el taller de hoy.
7. Desde el panel del profesor, volver a abrirlo y confirmar que la vista del alumno se actualiza en un máximo aproximado de 30 segundos sin volver a iniciar sesión.
8. Seleccionar una clase concreta, cerrar otro juego y confirmar que para esa clase aparece `Regla propia de esta clase`.
9. Entrar con un alumno de otra clase y confirmar que conserva la regla general.
10. Probar `Cerrar todos` y `Abrir todos` y confirmar que el contador de juegos abiertos coincide con las tarjetas.
11. Abrir la hoja central y confirmar que existe `AccesosJuegos` con las columnas `classCode`, `gameId`, `enabled`, `updatedAt` y `updatedBy`.
12. Recargar profesor y alumno y confirmar que la configuración persiste.
13. Confirmar que un alumno no puede invocar las funciones de escritura del control del taller porque el servidor exige una cuenta de profesor autorizada.
14. Abrir Battlegrafía, Narratoria, Maniacgrafía, Rimópolis y Scrabble cuando estén permitidos y confirmar que su mecánica y guardado siguen funcionando igual que antes.
15. Probar escritorio y móvil para confirmar que el panel de interruptores no desborda.

Resultado esperado por defecto: si `AccesosJuegos` todavía está vacía, todos los juegos activos conservan su disponibilidad anterior.

## Supabase y Classroom

1. Ejecutar `npm.cmd run check` y confirmar la comprobacion del esquema.
2. Crear un proyecto de Supabase de prueba y ejecutar la migracion SQL.
3. Confirmar en Supabase que RLS esta activado en todas las tablas publicas.
4. Confirmar que `private.profile_secrets` no es accesible con la clave publica.
5. Ejecutar `testClassroomAccess_` desde el editor de Apps Script.
6. Aceptar una sola vez los permisos de lectura solicitados.
7. Confirmar que devuelve los cursos activos del profesor.
8. Ejecutar `previewClassroomRoster_('ID_DEL_CURSO')`.
9. Confirmar que solo lee el curso y los alumnos y que no crea tareas ni notas.
10. No activar el envio de notas hasta vincular una tarea concreta de Classroom.

## Acceso institucional

1. Abrir `/exec?page=alumno` en una ventana privada.
2. Confirmar que solo aparece la pantalla de acceso y que no se ve el panel, ninguna clase ni ningún nombre de alumno.
3. Probar un correo que no termine en `@alumno.fomento.edu` y comprobar que se rechaza en el navegador.
4. Probar un correo institucional o PIN incorrectos y confirmar que el mensaje no indica cuál de los dos datos ha fallado.
5. Iniciar sesión con correo institucional y PIN correctos y confirmar que entonces aparece el panel.
6. Pulsar `Salir` y comprobar que el panel vuelve a quedar oculto.
7. Repetir cinco intentos fallidos con una cuenta de prueba y comprobar el bloqueo temporal.
8. Si el navegador tiene iniciada otra cuenta escolar de Google, confirmar que no permite acceder como un alumno distinto.

## Avatares personalizables

1. Iniciar sesión como alumno.
2. Abrir la sección Perfil y confirmar que solo aparece el retrato actual y el botón `Cambiar avatar`, sin galerías completas.
3. Pulsar `Cambiar avatar` y comprobar que se abre una ventana con una vista previa grande.
4. Usar las flechas de personaje y confirmar que recorre 16 opciones sin modificar el paisaje.
5. Usar las flechas de paisaje y probar montañas, castillo, volcán, bosque, nieve, costa, ruinas, ciudad nocturna, arcade, biblioteca, islas flotantes y pueblo otoñal.
6. Confirmar que las flechas vuelven al inicio al superar la primera o la última opción.
7. Pulsar `Aleatorio` varias veces y confirmar que genera combinaciones válidas.
8. Pulsar `Cancelar`, reabrir el selector y comprobar que la combinación no guardada se descarta.
9. Pulsar `Guardar avatar` y comprobar que el retrato de la cabecera y del perfil adoptan la combinación elegida.
10. Recargar la página y confirmar que se conserva.
11. Cerrar sesión, volver a entrar con el mismo alumno y confirmar que sigue seleccionado.
12. Comprobar que otro alumno mantiene su propia configuración.
13. Revisar la ventana y la vista previa en escritorio y móvil.

## Identidad visual y portadas

1. Abrir `/exec?page=alumno`.
2. Confirmar que aparece el emblema nuevo en el lateral y el banner general en la cabecera.
3. Confirmar que las siete tarjetas cargan portadas JPG distintas sin imágenes rotas.
4. Cambiar entre modo oscuro y claro y comprobar la legibilidad de título, subtítulo y controles.
5. Repetir las comprobaciones en `/exec?page=profesor`.
6. Comprobar en móvil o ventana estrecha que cabecera, logo y tarjetas no desbordan.

## Regla general

Cada versión debe poder probarse sin copiar código manualmente al editor de Apps Script.

## Comprobación de sincronización

1. Ejecutar `npm.cmd install`.
2. Ejecutar `npm.cmd run apps:status`.
3. Confirmar que solo aparecen los archivos de `apps-script/`.
4. No ejecutar la publicación si aparece un archivo inesperado.

## Publicación

1. Ejecutar `npm.cmd run apps:publish -- "descripcion del cambio"`.
2. Confirmar que se crea una versión nueva.
3. Confirmar que se actualiza el despliegue estable.
4. Abrir la URL `/exec?page=alumno`.
5. Abrir la URL `/exec?page=profesor`.

## Pruebas de LenguArcade v0.1

### Instalacion

1. Crear proyecto de Apps Script.
2. Copiar los archivos de apps-script.
3. Ejecutar `setupLenguArcade_()` desde el editor solo durante una instalación o reparación controlada.
4. Confirmar que se crea el Google Sheets central.

### Panel del alumno

Abrir la aplicacion web con el parametro page=alumno.

Comprobar que:

- aparece la estetica de LenguArcade
- carga alumnos demo
- se puede elegir alumno y clase
- aparece el catalogo de juegos
- aparecen XP, nivel y plumas

### Panel del profesor

Abrir la aplicacion web con el parametro page=profesor.

Comprobar que:

- se carga resumen de clase
- aparecen alumnos
- aparece progreso general
- aparecen juegos
- aparece evaluacion orientativa

### Modo diagnostico

Comprobar que hay conexion con backend, lectura de alumnos, lectura de catalogo y simulacion de guardado si existe.

## Si falla

Pasar al asistente: captura, error exacto, consola del navegador, pantalla concreta y paso donde se rompe.

## Rayuela · 2026-09-04

Pruebas mínimas antes de publicar:

1. Abrir `games/rayuela/index.html` y comprobar que aparece una única escena central en la cuadrícula inicial.
2. Escribir el inicio y crear dos decisiones. Crear continuaciones distintas desde ambas.
3. Crear al menos tres finales, incluyendo un final secreto, y comprobar que las flechas llegan al destino correcto.
4. Hacer que dos rutas vuelvan a encontrarse y confirmar que la métrica de reencuentros/complejidad cambia.
5. Crear una escena con objeto, una decisión condicionada por ese objeto y verificar en modo jugador que la opción solo aparece cuando corresponde.
6. Ejecutar Inspector: debe detectar escenas inaccesibles, opciones sin destino, callejones sin final y ausencia de finales.
7. Probar desde una escena intermedia y después jugar desde el inicio hasta un final. Comprobar la colección de finales.
8. Recargar el navegador: el proyecto debe conservarse. Exportar JSON, borrar/restablecer e importar la copia.
9. Entregar: debe guardarse una instantánea congelada sin anidar entregas anteriores.
10. Abrir mediante el visor embebido de LenguArcade y confirmar READY → INIT → INITIALIZED → SESSION_STARTED.
11. Editar y esperar al autoguardado: debe llegar CHECKPOINT y quedar una copia en `game_saves`.
12. Entregar: RESULT debe llegar con `outcome=submitted`, métricas estructurales y logros.
13. Abrir la ficha del alumno en el panel docente y comprobar el bloque Rayuela con escenas, palabras, decisiones, finales, complejidad y errores estructurales.
14. Verificar que los controles de taller pueden bloquear/desbloquear `rayuela` igual que cualquier otro juego.
15. Ejecutar `npm run check`; incluye `scripts/check-rayuela.mjs` y debe finalizar sin errores.
16. En la ficha docente, abrir «Mapa y evaluación»: deben verse las escenas y conexiones del último guardado.
17. Cambiar nombres/pesos de la rúbrica, puntuar los criterios y guardar. La nota debe persistir como evaluación específica de `rayuela`.
18. Seleccionar un nodo del mapa, dejar un comentario y guardar la evaluación.
19. Volver a entrar como alumno: el comentario general y el comentario de esa escena deben aparecer dentro del editor.
20. Marcar el comentario de escena como revisado, guardar y comprobar desde el panel docente que el proyecto conserva ese estado en el siguiente checkpoint.

Escenario de aceptación recomendado: Inicio → A/B; A → A1/A2; B → B1/B2; A2 y B1 se reencuentran; final bueno, final malo y final secreto. Guardar, recargar, recorrer los tres finales, entregar y abrir desde profesor.

## Entre Líneas
1. Iniciar sesión como alumno y comprobar que **Entre Líneas** aparece en el catálogo con la etiqueta de comprensión lectora.
2. Desde el panel del profesor, bloquear y desbloquear Entre Líneas y verificar que el alumno recibe el estado correcto tanto en horario de taller como fuera de él.
3. Abrir el juego: debe cargarse dentro del runner de LenguArcade y mostrar el perfil conectado; el acceso docente local no debe aparecer.
4. Empezar «El aula vacía», marcar pistas, crear una conexión, responder una prueba y recargar: el checkpoint debe recuperar el estado.
5. Resolver correctamente el expediente usando dos pruebas distintas y comprobar que se guarda resultado, XP, precisión, logros y actividad.
6. Repetir el expediente ya resuelto y confirmar que no concede de nuevo la recompensa principal de XP.
7. Abrir el alumno en el panel del profesor y comprobar el bloque «Entre Líneas · diagnóstico lector» con pistas, conexiones, ayudas, intentos y habilidades.
8. Probar la investigación a 1366×768 y en viewport móvil; los paneles no deben tapar el documento ni impedir el acceso a las acciones principales.


## Acceso inicial simplificado
1. Abrir la portada de LenguArcade sin sesión y comprobar que no aparece el texto sobre «cuenta institucional de Google» ni la explicación de los dominios.
2. Pulsar «Soy profesor» y comprobar que no aparece el párrafo explicativo sobre panel docente/profe-jugador.
3. Confirmar que siguen funcionando y visibles «Entrar con Google del colegio», «Entrar como profe-jugador» y «Abrir panel del profesor».
4. Validar que alumno y profesor pueden iniciar sesión exactamente igual que antes.


## Publicación tras corrección de Entre Líneas
1. Ejecutar `npm.cmd run check` y confirmar que no aparece el error `Unexpected identifier 'sub'`.
2. Ejecutar `npm.cmd run apps:publish -- "Simplifica la pantalla de acceso"`.
3. Confirmar que el proceso llega hasta `Apps Script publicado en la version ...`.
4. Abrir el panel docente y verificar que el bloque de diagnóstico de Entre Líneas sigue mostrándose correctamente.


## Gestión de clases y alumnado
1. Entrar en el panel del profesor y comprobar que aparece «Gestión» en la navegación lateral.
2. Abrir «Gestión»: deben mostrarse clases y alumnos con estado Activo/Archivado, buscador y filtros.
3. Archivar un alumno de prueba: debe desaparecer del panel activo, permanecer visible como archivado en Gestión y no poder iniciar sesión.
4. Restaurar ese alumno: debe volver al panel activo y recuperar exactamente su progreso anterior.
5. Archivar una clase de prueba: la clase debe desaparecer de los filtros activos; los alumnos que solo pertenecen a esa clase deben quedar archivados. Los que también estén en otra clase activa deben conservarse activos.
6. Restaurar la clase y comprobar que vuelven la clase y sus alumnos.
7. Pulsar «Eliminar…» sobre un alumno y cancelar o escribir algo distinto de `ELIMINAR`: no debe modificarse ningún dato.
8. Con un alumno de prueba, confirmar `ELIMINAR`: su perfil y datos asociados deben desaparecer definitivamente.
9. Con una clase de prueba, confirmar `ELIMINAR`: debe borrarse la clase; los alumnos exclusivos deben borrarse y los compartidos con otra clase deben conservarse.
10. Ejecutar `npm.cmd run check`: debe incluir «Gestión de clases y alumnado: arquitectura consolidada correcta.».
11. Publicar Apps Script y volver a probar la sección desde la URL estable del profesor.


## Aceptación de la arquitectura consolidada
1. Ejecutar `npm.cmd run check`. Deben superar sintaxis, juegos, Supabase, Rayuela, Entre Líneas, Gestión y la comprobación de arquitectura consolidada.
2. Ejecutar `npm.cmd run apps:status`: no debe aparecer ningún archivo cuyo nombre empiece por `zz`.
3. Publicar la versión estable y abrir la portada del alumno con recarga completa.
4. Comprobar login Google de alumno, menú de profesor y modo profe-jugador.
5. Entrar como alumno y verificar catálogo, navegación lateral, avatar, taller, bloqueo/desbloqueo de juegos y apertura de un juego embebido.
6. Verificar una sesión de taller y un permiso temporal de casa.
7. Abrir Rayuela y Entre Líneas desde el catálogo y confirmar que siguen comunicándose con el host.
8. Entrar en el panel del profesor y comprobar acceso directo, navegación, control del taller, Classroom y la nueva sección Gestión.
9. Abrir la ficha de un alumno con datos de Rayuela y Entre Líneas: deben aparecer la rúbrica de Rayuela y el diagnóstico lector.
10. En Gestión, probar solo con datos de prueba: archivar/restaurar alumno y clase antes de probar cualquier eliminación definitiva.
11. Confirmar que `apps-script/` contiene únicamente los módulos base y ningún adaptador `zz...`.


## Catálogo oficial de 10 juegos
1. Entrar como alumno y comprobar que aparecen exactamente los diez juegos oficiales, en este orden: Battlegrafía, Maniacgrafía, Narratoria, Versópolis, Scrabble, Conjuga y apuesta, Batalla verbal, Rayuela, Entre Líneas y Tower Defense.
2. Comprobar que no aparece Rimópolis como juego independiente.
3. Verificar estados: Maniacgrafía/Narratoria/Scrabble = «listo»; Battlegrafía/Rayuela/Entre Líneas = «en pruebas»; Versópolis/Conjuga y apuesta/Batalla verbal/Tower Defense = «en revisión».
4. Los cuatro juegos «en revisión» deben aparecer bloqueados y mostrar «En revisión» en lugar de un botón de juego funcional.
5. Battlegrafía, Maniacgrafía, Narratoria, Scrabble, Rayuela y Entre Líneas deben conservar su URL o integración de lanzamiento.
6. Abrir el panel docente y comprobar que el taller reconoce los diez IDs oficiales.
7. Ejecutar `npm.cmd run check`; debe finalizar con «Catálogo oficial LenguArcade: 10 juegos, identidades y estados correctos.».


## Retirada completa de Rimópolis
1. Ejecutar `npm.cmd run check`: la prueba de catálogo debe pasar y confirmar que no existen archivos o referencias activas de Rimópolis.
2. Ejecutar `npm.cmd run apps:status`: no debe aparecer `Rimopolis_Alumno.html`.
3. Publicar Apps Script y abrir LenguArcade como alumno.
4. La cuarta tarjeta debe llamarse **Versópolis**, con estado **En revisión** y sin botón funcional.
5. No debe existir ninguna tarjeta, enlace ni ruta visible denominada Rimópolis.
6. La primera carga tras esta versión debe descartar automáticamente la caché anterior del catálogo.


## Portadas de Rayuela y Entre Líneas
1. Publicar Apps Script y entrar como alumno.
2. Comprobar que la tarjeta de **Rayuela** muestra su portada propia con el mapa de decisiones.
3. Comprobar que la tarjeta de **Entre Líneas** muestra su portada propia de investigación lectora.
4. Ninguna de las dos tarjetas debe utilizar la imagen genérica de Maniacgrafía.
5. Ejecutar `npm.cmd run check`; la comprobación del catálogo debe validar ambos nombres de asset.


## Conjuga y apuesta v2
1. Ejecutar `npm.cmd run check`: debe terminar con «Conjuga y apuesta v2 correcto».
2. Abrir `games/conjuga_apuesta/index.html` directamente y comprobar que permite una partida local entre dos jugadores.
3. Verificar configuraciones de 5, 8 y 10 rondas y temporizadores de 20, 30, 45 segundos y sin límite.
4. Comprobar los cuatro niveles de dificultad y sus multiplicadores.
5. Elegir apuestas de 10, 20, 30, 50 y todo lo disponible cuando corresponda.
6. Comprobar que una respuesta correcta suma fichas y XP, una incorrecta resta fichas y un error solo de tilde muestra feedback específico.
7. Verificar los botones de caracteres `á é í ó ú ü ñ`.
8. Usar Pista, Cambio y Seguro y comprobar sus costes/consumos.
9. Llevar un jugador a cero: debe recibir un único rescate de 40 fichas; una segunda bancarrota termina la partida.
10. Jugar suficientes turnos para comprobar que una ronda múltiplo de cuatro muestra el bote ×1,5.
11. Abrir Logros y comprobar que existen 24 y que los nuevos se desbloquean sin repetirse.
12. Entrar desde LenguArcade: la tarjeta debe aparecer como «en pruebas» y abrirse embebida.
13. Iniciar una partida: el nombre del jugador principal debe llegar desde su perfil de LenguArcade.
14. Desde el perfil de otro alumno/profe-jugador, generar un «Código para partidas 1 contra 1» e introducirlo cuando Conjuga y apuesta solicite rival.
15. Terminar una partida con los dos perfiles conectados: el host debe guardar resultado, XP, precisión, racha y logros para ambos participantes.
16. Salir durante una partida: debe conservarse lo respondido hasta ese momento sin adjudicar una victoria ficticia.


## Conjuga y apuesta v3
1. Ejecutar `npm.cmd run check`: debe terminar con «Conjuga y apuesta v3 correcto».
2. Comprobar que el test informa de **4.288 retos posibles**.
3. Jugar una partida de 10 rondas seleccionando repetidamente la misma dificultad: no debe repetirse la misma respuesta dentro de la partida.
4. Comprobar que el mismo verbo no reaparece inmediatamente; el selector intenta mantener seis verbos recientes distintos.
5. Probar los cuatro niveles con banco completo y con banco esencial. Experto debe seguir teniendo preguntas disponibles en ambos modos.
6. Completar una partida desde LenguArcade. Tras guardar, el iframe no debe cerrarse ni volver al catálogo de LenguArcade.
7. Después del guardado normal debe volver a la pantalla inicial de Conjuga y apuesta.
8. Iniciar otra partida sin cerrar el juego y comprobar que conserva el XP y los logros obtenidos en la partida anterior.
9. Pulsar «Salir» durante una partida y confirmar el abandono: tras guardar, en este caso sí debe cerrarse el juego y regresar a LenguArcade.
10. Abrir una partida 1 contra 1. La ventana emergente debe hablar de un «código general para jugar con otra persona» y nunca de un «código de Scrabble».
11. En Perfil, el generador debe llamarse «Código para jugar con otra persona» y explicar que no pertenece a un juego concreto.
12. Generar un código y utilizarlo en Scrabble o Conjuga y apuesta; debe funcionar en ambos y caducar tras 10 minutos o un único uso.


## Cierre seguro de Conjuga y apuesta
1. Abrir Conjuga y apuesta desde LenguArcade y completar una partida sin pulsar «Salir del juego».
2. Tras guardar el resultado, el runner debe seguir abierto y el juego debe volver a su pantalla inicial.
3. Aunque el juego enviase por error un `CLOSE_READY` tras un resultado normal, LenguArcade debe ignorarlo.
4. Pulsar «Salir del juego» durante una partida: el host debe marcar la salida como explícita, pedir al juego que cierre/guarde y después regresar a LenguArcade.
5. Verificar que Scrabble y el resto de juegos conservan su comportamiento anterior de cierre.


## Batalla verbal v1
1. Ejecutar `npm.cmd run check`: debe terminar con «Batalla verbal v1 correcta».
2. Abrir Batalla verbal desde LenguArcade y comprobar que aparece como **en pruebas**.
3. Configurar partidas de 2, 3 y 4 equipos y verificar nombres y clases.
4. Probar los modos Relámpago (90 PV), Clásica (120 PV) y Épica (160 PV).
5. Jugar una casilla de cada columna: Indicativo, Tiempos compuestos, Subjuntivo, Imperativo y Maestría irregular.
6. Comprobar que el tablero cambia al empezar una nueva partida.
7. Resolver varias casillas y confirmar que no se repite la misma respuesta dentro de un tablero.
8. Acierto: suma puntuación, combo, energía y abre la defensa del rival.
9. Fallo: aplica retroceso al atacante, rompe el combo y pasa el turno.
10. Defensa correcta: reduce a la mitad el daño y carga energía del defensor.
11. Activar las cuatro clases y comprobar sus habilidades al alcanzar 100 de energía.
12. Verificar que los escudos absorben daño antes de los PV.
13. Encontrar una casilla con ✦ y comprobar su runa al acertar.
14. Resolver cinco casillas y comprobar que se activa un evento de arena.
15. Activar un frenesí o bote y confirmar que permanece hasta el siguiente ataque correcto.
16. Probar el temporizador; al llegar a cero debe contabilizar el reto como fallo.
17. Completar una partida por eliminación y otra agotando las 25 casillas.
18. Abrir Logros y comprobar que existen 24 y persisten entre partidas.
19. Terminar una partida desde LenguArcade: debe guardar resultado/XP/logros y permanecer dentro del juego.
20. Pulsar Salir durante una batalla: debe guardar la actividad como abandono y regresar a LenguArcade después de la confirmación.


## Batalla verbal v2 y práctica individual
1. Ejecutar `npm.cmd run check`: debe aparecer «Batalla verbal v2 correcta».
2. Abrir Batalla verbal desde LenguArcade en un portátil/Chromebook habitual: la interfaz completa de juego debe caber en la ventana sin scroll vertical ni scroll interno.
3. Probar **Práctica individual**: debe poder comenzar solo con el perfil principal y completar 25 retos sin defensa ni eliminación.
4. Probar Batalla con 2, 3 y 4 jugadores:
   - cada jugador secundario genera un código general desde su perfil;
   - se introduce un código distinto para cada plaza;
   - no debe permitirse duplicar el mismo perfil.
5. Comprobar que cada jugador conectado muestra su nombre y puede elegir Guerrero, Mago, Arquero o Clérigo.
6. En un ataque, escribir la respuesta:
   - correcta → ataque válido;
   - error solo de tilde → aviso específico y oportunidad de corregir;
   - forma incorrecta → fallo automático.
7. En una defensa, repetir la misma prueba: no deben existir botones manuales para declarar acierto/fallo.
8. Verificar dificultad real por filas:
   - 100: regulares/frecuentes;
   - 300: formas intermedias;
   - 500: irregularidad avanzada o tiempos/formas complejas.
9. Comprobar la regla inversa de defensa:
   - 100 → defensa nivel 5 / 65 %;
   - 200 → nivel 4 / 60 %;
   - 300 → nivel 3 / 55 %;
   - 400 → nivel 2 / 50 %;
   - 500 → nivel 1 / 45 %.
10. Conseguir una runa: debe abrirse una ventana que muestre jugador, nombre y efecto antes de continuar.
11. Resolver cinco casillas: el evento de arena debe aparecer en una ventana emergente con su efecto.
12. Finalizar una batalla multijugador y comprobar que LenguArcade guarda el progreso de todos los perfiles conectados.
13. Volver a jugar sin cerrar el juego: XP y logros recién conseguidos no deben retroceder.
14. Pulsar «Salir» durante una partida: debe guardar lo realizado como abandono y regresar a LenguArcade.

## Scrabble · práctica individual
1. Abrir Scrabble desde LenguArcade.
2. En la pantalla inicial deben aparecer «1 contra 1» y «Práctica individual».
3. Elegir práctica: no debe pedir código ni contrincante.
4. La práctica debe comenzar únicamente con el perfil principal y, al pasar turno, seguir correspondiendo al mismo jugador.
5. Si la victoria estaba en modo clásico al entrar en práctica, debe proponerse automáticamente el objetivo de 100 puntos.
6. Completar la práctica: debe guardarse como `practice`, conservar logros/progreso y **no sumar una victoria**.
7. Volver a «1 contra 1»: debe seguir exigiendo el código general del rival y conservar la mecánica competitiva existente.


## Battlegrafía 2.0 · Fantasy Arcade
1. Ejecutar `npm.cmd run check`: debe terminar con «Battlegrafía 2.0 correcta: 5 mundos, 30 sprites originales, guardado aislado e integración paralela».
2. Abrir LenguArcade y comprobar que aparecen **Battlegrafía** y **Battlegrafía 2.0** como dos tarjetas distintas.
3. Entrar en Battlegrafía 2.0 y verificar que se abre embebida y recibe el perfil del alumno.
4. Comprobar que la portada muestra la identidad Fantasy Arcade y que Jugar, Perfil, Bestiario, Mercader y Logros siguen abriendo las funciones existentes.
5. Probar los cinco modos: Aventura, Supervivencia, Práctica, Dominio y Estrategia.
6. Crear un héroe con Mago, Guerrero, Ninja y Robot y comprobar que los cuatro sprites originales funcionan.
7. En combate, verificar que el riel superior contiene exactamente **seis posiciones**: cinco guardianes y el jefe del mundo actual.
8. Montañas: H-Ghoul, Vampiro de la V, Gargántua G/J, Espectro Agudo, Serpiente Comata y Lexikon.
9. Castillo: Diacritik, Oxiton, Llanor, Puntor, Kalkor y Paper.
10. Ciénaga: Esdrulia, Muxlor, Prosodion, Zarruk, Minotauro y Torvax.
11. Acantilados: Caoskrin, Hiatikus, Momia, Rugiton, Zombie y Sintaxion.
12. Volcán: Gravikus, Jarkon, Ortograf, Siseus, Cíclope y Don Pablo.
13. Llegar a un jefe y comprobar que aparece la presentación breve del jefe sin modificar el inicio real del combate.
14. Abrir Mundo/Mapa y cambiar de escenario: el roster debe mostrar los seis sprites correctos de la zona elegida.
15. Jugar una batalla completa: respuesta correcta, respuesta incorrecta, ataque, daño, habilidad y uso de objeto deben conservar la mecánica clásica.
16. Abrir Campamento, Mercader, Mochila, Diario, Historia, Bestiario y Logros y verificar que siguen operativos.
17. Guardar progreso en la v2, cerrar y volver a entrar: debe restaurarse la partida de `battlegrafia_v2`.
18. Abrir después la Battlegrafía clásica y confirmar que su partida anterior no ha sido modificada por la v2.
19. Terminar una partida v2 y comprobar que LenguArcade guarda el progreso bajo `gameId='battlegrafia_v2'`, separado de `battlegrafia`.
20. Probar en 1366×768: Combate, hub, selector de modos, mapa y campamento no deben requerir scroll de página.


## Limpieza y consolidación del repositorio · 2026-09-06

1. Ejecutar `npm.cmd run check`: todas las comprobaciones deben terminar correctamente.
2. Confirmar que no existen `scripts/publish-maniacgrafia.ps1`, `publish-scrabble.ps1` ni `publish-battlegrafia.ps1`.
3. Confirmar que Maniacgrafía, Scrabble y Battlegrafía no contienen una `.clasp.json` dentro de `games/*/apps-script/`.
4. Confirmar que no existen las carpetas activas `diagnostics/`, `shared/` ni `assets/games/`.
5. Confirmar que `package.json` no expone `maniac:publish`, `scrabble:publish`, `battlegrafia:publish` ni `apps:push`.
6. Confirmar que el núcleo no contiene referencias a `raw.githack.com` ni `rawcdn.githack.com`.
7. Abrir Scrabble y Battlegrafía desde GitHub Pages y desde LenguArcade.
8. Verificar que ningún `games/*/index.html` aparece modificado en el PR de limpieza.
9. Verificar que GitHub Pages vuelve a desplegar correctamente tras fusionar.



## Catálogo canónico · 2026-09-06

1. Ejecutar `npm.cmd run catalog:check`: debe confirmar 10 juegos oficiales y 11 entradas totales.
2. Ejecutar `npm.cmd run check`: todas las pruebas deben pasar.
3. Confirmar que `LenguArcade_Code.gs` no contiene `const LA_OFFICIAL_GAMES` ni `LA_GAME_INTEGRATIONS`.
4. Confirmar que `LenguArcade_Alumno.html` no contiene `LA_EMBEDDED_GAME_OVERRIDES`, `normalizeNarratoriaUrl` ni URL de juegos.
5. Confirmar que `student-dashboard/index.ts` no contiene `const integrations` ni URLs hardcodeadas.
6. Confirmar que `apps-script/LenguArcade_GameCatalog.gs` y `supabase/catalog/game-catalog.sql` coinciden con `catalog:sync`.
7. Aplicar la migración `202609060002_canonical_game_catalog.sql` y comprobar las nuevas columnas.
8. Desplegar `student-dashboard` antes de publicar Apps Script.
9. Publicar Apps Script y probar Scrabble, Battlegrafía, Narratoria, Rayuela y Entre Líneas desde el portal.
10. Confirmar que Battlegrafía 2.0 sigue inactiva y no aparece en el catálogo del alumno.



## Taller · selector de clases reales (2026-09-09)

1. Abrir el panel del profesor y entrar en **Taller**.
2. Comprobar que no aparecen `1º ESO A/B` … `4º ESO A/B` si esas clases no existen en Supabase.
3. Sin clases activas, verificar que Taller muestra un estado vacío y no ofrece cursos ficticios.
4. Importar o restaurar una clase real y actualizar el panel.
5. Confirmar que la clase real aparece en Taller sin recargar manualmente datos legacy.
6. Archivar esa clase desde **Gestión**, actualizar el panel y confirmar que desaparece del selector de Taller.
7. Ejecutar `npm.cmd run check`.


## Taller · planificador de sesiones (2026-09-09)

1. Entrar en el panel del profesor y abrir **Taller**.
2. Comprobar que la cabecera explica que Taller sirve para **preparar sesiones** y no para gestionar permisos técnicos.
3. Elegir una clase activa real.
4. Verificar que aparecen tres zonas claras:
   - estado de la sesión visible para los alumnos;
   - biblioteca de **Sesiones preparadas**;
   - editor **Preparar la sesión**.
5. Pulsar **Nueva** y crear una sesión con título, fecha prevista, instrucciones, objetivo de XP y al menos dos juegos.
6. Pulsar **Guardar preparación**.
7. Confirmar que la sesión aparece en la biblioteca y que **no** cambia el acceso del alumno ni publica ninguna misión.
8. Crear otras dos preparaciones para la misma clase; las tres deben conservarse simultáneamente.
9. Cambiar de clase y confirmar que la biblioteca es independiente.
10. Volver a la clase anterior y comprobar que las tres preparaciones siguen disponibles.
11. Editar una preparación y guardar: debe actualizarse sin crear un duplicado.
12. Pulsar **Duplicar**, modificar el título y guardar: debe aparecer como una preparación nueva.
13. Eliminar una preparación no activa y confirmar que desaparece.
14. Abrir una preparación con **Abrir ahora**:
    - debe aparecer como sesión activa;
    - los alumnos deben ver el título, instrucciones y objetivo;
    - únicamente los juegos elegidos deben estar accesibles.
15. Desde la sesión activa, pulsar **Cerrar clase**:
    - la sesión sigue publicada;
    - los juegos dejan de estar accesibles en clase;
    - un horario de casa configurado debe conservarse.
16. Crear una preparación con **Acceso en casa**, fechas válidas y pulsar **Guardar y activar horario de casa**:
    - debe publicarse sin abrirse inmediatamente en clase;
    - antes de la hora indicada debe permanecer cerrada;
    - dentro de la ventana debe permitir solo sus juegos;
    - al terminar la ventana debe volver a cerrarse automáticamente.
17. Pulsar **Retirar**:
    - la sesión deja de aparecer como publicada;
    - los juegos de esa clase quedan cerrados;
    - las preparaciones guardadas siguen existiendo.
18. Abrir **Ajustes avanzados de disponibilidad** y comprobar que está claramente presentado como un control excepcional, no como el flujo principal.
19. Verificar que abrir una sesión reconfigura esos permisos con los juegos de la sesión.
20. Ejecutar `npm.cmd run check` y confirmar el mensaje:
    `Planificador de Taller correcto: sesiones preparadas, activación explícita y permisos automáticos.`

## Disponibilidad de juegos en vivo (2026-09-26)

1. Ejecutar `npm run check`, que incluye `check-live-access.mjs` y el resto de comprobaciones existentes.
2. Tras desplegar `student-access-state` y publicar el portal, abrir A = profesor y B = alumno de la clase afectada, sin recargar B.
3. En A cerrar Battlegrafía: en unos cinco segundos B debe mostrar el cierre, desactivar Jugar y retirarlo de «Seguir jugando». Pulsar Jugar justo antes del siguiente sondeo debe consultar acceso y mostrar «Cerrado por tu profesor».
4. Abrir Battlegrafía, cerrar todos, abrir todos y usar «Solo este»: comprobar en B todos los botones y el contador del taller.
5. Aplicar un cierre a una clase: un alumno de esa clase debe cambiar; otro de distinta clase debe conservar su acceso. Aplicar una regla individual: solo cambia el alumno elegido.
6. Publicar, abrir, cerrar y retirar una sesión de taller: comprobar juegos seleccionados, cabecera, misión y horario de casa en B sin recargar.
7. Dejar B en segundo plano, cambiar reglas en A y volver a B: debe sincronizar inmediatamente. Desconectar Internet durante unos sondeos: debe conservar sesión y último acceso; al reconectar debe actualizarse.
8. Inspeccionar Network: los sondeos van a `/functions/v1/student-access-state`, no a `student-dashboard` ni a `/auth/v1/user`. El dashboard completo sigue consultándose en sus flujos normales (acceso, progreso y perfil) o si cambia el catálogo.
9. Entrar en una partida y cerrarla desde A: la partida no debe expulsar al alumno; al volver al portal debe verse el nuevo cierre. Confirmar que el guardado sigue funcionando.
10. Revisar los logs de la nueva función y comprobar ausencia de respuestas 401/429/5xx inesperadas con varios alumnos simultáneos.

## Cierre de juegos en vivo · 2026-09-27

- Profesor cierra un juego con un alumno dentro: aviso en menos de un ciclo de sondeo y cuenta atrás basada en el instante real del cierre.
- Se intenta un único checkpoint final; los guardados posteriores quedan congelados durante la gracia.
- Salir ahora funciona aunque el checkpoint falle o quede colgado.
- Al llegar a 0:00 el iframe se destruye y el alumno vuelve al portal sin un guardado adicional.
- Reabrir antes de 0:00 cancela el cierre y reactiva el guardado, incluso si llega tarde el CLOSE_READY del checkpoint técnico.
- student-access-state sigue siendo ligero y save-progress rechaza cualquier guardado normal cuando el acceso está cerrado.

## Guardado durante el minuto de gracia · 2026-09-27

- Cerrar un juego con un alumno dentro: la cuenta atrás conserva el guardado normal hasta 0:00.
- Un resultado o autosave dentro de la gracia debe persistir aunque el juego ya figure cerrado para nuevas entradas.
- Al pulsar Salir ahora o llegar a 0:00 se solicita un último checkpoint y después se cierra el iframe.
- Si un guardado estaba en curso al llegar a 0:00, debe terminar antes de solicitar el checkpoint final.
- Tras la gracia, save-progress rechaza guardados normales; solo acepta el checkpoint final asociado al mismo cierre con margen breve de red.
- Reabrir antes de 0:00 cancela la cuenta atrás y mantiene la partida/guardado normales.


## 2026-09-30 · Segunda revisión de alumno

Automáticas: `npm run check` incluye regresiones de la curva de nivel, rúbrica con juegos asignados aún sin actividad, ausencia de recompensa al repetir snapshots, separación por perfil y expedición restaurada antes de Continuar, métrica de versos y rimas, diccionario español real y banco de 50 Lexarios. Tierras comprueba en VM flechas sin movimiento, WASD, recogida de vida, duración de ralentización y aparición periódica de ayudas. Los cinco endpoints modificados deben pasar `node --experimental-strip-types --check`.

Validación manual pendiente en el despliegue estable:

1. Entrar como alumno de prueba; abrir Versópolis, avanzar un distrito, escribir una estrofa, salir y continuar desde otra sesión. Repetir un guardado sin jugar: XP, plumas e intentos no deben crecer. Simular pérdida de conexión y comprobar que la partida no se cierra ni pierde el borrador.
2. Scrabble: validar CASA, PERROS, CANCION, CAMINAMOS y NIÑO automáticamente; una secuencia inventada debe quedar pendiente de revisión. Comprobar que Ñ no se interpreta como N.
3. Desplazar Mis juegos hasta las últimas tarjetas. Abrir/cerrar distintos juegos: la tarjeta y la posición de pantalla deben permanecer estables tras actualizar el progreso.
4. Revisar Batalla verbal con cuatro jugadores a 1366×768 y ancho 390; ficha completa de vida/energía/habilidad. Rayuela: logros desbloqueados y bloqueados legibles. Word Play: muchos modificadores/mejoras y recompensas a 1366×768, 820×700 y 390×700, sin superposición ni scroll horizontal.
5. Guardianes: monstruos protegidos con cobertura dorada, desaparece al romper la última capa; el círculo de selección conserva su función independiente.
6. Tierras: banner y título usan el refugio nuevo; atlas sin cortes, terreno variado, Códice completo mediante páginas y pestañas sin scroll, WASD y flechas simultáneos, ayudas durante la expedición y restauración de sus temporizadores al continuar.
7. Lexaria: compañeros de la misma clase publican formaciones; abrir arena, combatir, guardar, comprobar el ranking y el historial tras recargar. Los duelos de laboratorio no cuentan en ranking. Todos los Lexarios respiran y atacan hacia el oponente; respetar movimiento reducido. Guardar y salir vuelve al título de Lexaria; el botón del runner sí cierra a LenguArcade.
8. Nota/niveles: XP acumulada conservada, coste sucesivo creciente, una misión en un juego no practicado baja el cumplimiento en lugar de ignorarse; misma rúbrica en alumno y resumen docente. Logros de nivel/XP/nota persisten después de una bajada de nota.

Límites: el contador conserva el total de duelos; la lista guarda los 100 más recientes. La rúbrica de misiones por ventana usa los eventos disponibles (500 por detalle de alumno, 5.000 por resumen de clase). El cómputo de verso no sustituye la revisión de licencias poéticas por el profesor. Las pruebas automáticas verifican ejecución y datos, no validan píxeles ni la sesión autenticada de Apps Script.


## Integridad de progreso (2026-10-01)

1. Ejecutar node scripts/check-xp-integrity.mjs y después npm run check.
2. Battlegrafía: responder correctamente una vez y guardar; debe sumar solo el XP correspondiente al nuevo acierto. Forzar otro checkpoint sin jugar: debe sumar 0 XP y 0 plumas.
3. Derrotar una criatura y comprobar que solo se premian los aciertos y derrotas nuevos, no el total histórico de logros.
4. Repetir el mismo snapshot en cualquier juego integrado: no debe aumentar XP, plumas, intentos ni aciertos.
5. Enviar un salto artificial grande de métricas en un checkpoint de prueba: la recompensa por checkpoint debe quedar acotada y, si se encadenan peticiones, deben actuar los límites globales de 1 y 10 minutos.
6. Confirmar en game_events.details.integrity que serverAuthoritative es true y que rateLimited refleja los casos limitados.
7. Verificar que el guardado de partida sigue actualizando game_saves aunque un checkpoint no otorgue XP.


## Seguimiento, ranking y misiones (2026-10-01)

- Ejecutar `node scripts/check-learning-tracking.mjs` y `npm run check`.
- Comprobar ordenación de todas las columnas de la tabla de alumnos.
- Comprobar nombres y porcentajes de cumplimiento en misiones y talleres.
- Comprobar ranking de clase, historial de misiones y logros generales en la vista de alumno.
- Confirmar que Ranking y Misiones se refrescan al volver a esas pantallas.

## Panel profesor · Juegos unificados (2026-10-05)
- Ejecutar `npm run check`.
- Verificar una fila por juego, sesiones integradas y portadas de FORJA/Sopa de Tinta.
- Simular portada ausente y error de carga: queda visible el fondo con icono.
- Cambiar clase y comprobar abrir/cerrar/solo este y acciones globales con el mismo ámbito.
- Probar selectores con clic, flechas, Inicio/Fin, Escape, Tab y cierre exterior.
- Comprobar 1366×768, 1440×900 y 1920×1080: sin solapamientos ni scroll horizontal.

## Colección unificada de portadas (2026-10-05)
- Ejecutar catalog:sync y npm run check.
- Comprobar las dieciséis rutas públicas y dimensiones 16:9 de los recursos WebP.
- Verificar que ambos paneles resuelven la misma portada con datos actuales, sin banner y con banner antiguo en caché.
- Abrir Juegos y Taller en profesor y catálogo de alumno: títulos legibles, sin imágenes repetidas ni fallidas.

## Portadas diversas y marca (2026-10-05)
- catalog:sync y npm run check.
- Verificar dieciséis WebP distintos a 1280×720 y rutas públicas.
- Comprobar el logo oficial en el encabezado de cada tarjeta alumno y en la esquina de cada miniatura docente.
- Revisar título, sello y estado sin solapamientos en 1366×768, 1440×900 y 1920×1080 tras publicar Apps Script.

## Salida al menú propio (2026-10-08)
- `npm run check`; la comprobación de Word Play exige ahora checkpoint y navegación interna para Guardar y salir.
- `node games/forja/browser-test.mjs`: salir al título sin CLOSE_READY, continuar con mismos datos y cerrar ante REQUEST_EXIT del host.
- `node scripts/check-game-menu-exit.browser.mjs`: siete juegos en iframe con perfil, confirmación de guardado y detección de CLOSE_READY/REQUEST_EXIT inesperados.
- Verificar regreso al inicio y continuación en Versópolis, Lexitrama, Sopa de Tinta y Play the Word; reloj pausado en Lexitrama y Sopa de Tinta.
- Conjuga y apuesta y Batalla verbal: salida local conserva resultados y vuelve al inicio; cierre del host permanece operativo.
- Guardianes: cerrar pausa muestra su inicio, oculta el modal, guarda la partida y no muestra el aviso de integración futura.
- Prueba online real pendiente de dos alumnos: Conjuga utiliza la función existente Online.back para abandonar la sala y volver al inicio; el host conserva Online.leave para cerrar.

## Botones de menú sin duplicados (2026-10-08)
- `npm run check`.
- `node games/forja/browser-test.mjs`: no existen gameExitBtn/exitBtn; Menú guarda y vuelve al título; Continuar y cierre del host funcionan.
- `node scripts/check-game-menu-exit.browser.mjs`: navegación y guardados con los botones restantes; ausencia de exit en Lexitrama/Sopa de Tinta y menuExitBtn en Batalla verbal.

## Carpeta de FORJA (2026-10-08)
- `node games/forja/smoke-test.mjs`, `node games/forja/dictionary-test.mjs`, `node games/forja/browser-test.mjs` y `npm run check` aprobados.
- `node scripts/check-game-menu-exit.browser.mjs`: entrada desde `/games/lexoma/` en iframe, redirección a `/games/forja/`, conservación de canal/hash, guardado y restauración de la misma partida.
- La prueba antigua `integration-browser-test.cjs` mantiene un fixture del launcher desactualizado (no genera las tarjetas actuales); la navegación de compatibilidad se valida con la prueba en iframe anterior y el browser-test del juego.

## 2026-10-08 · Botones Entrar
1. Abrir el tablón con juegos nuevos y con progreso: todos los abiertos deben mostrar «Entrar».
2. Entrar, guardar progreso y volver; recargar y revisar la caché: la etiqueta permanece.
3. Cerrar y reabrir un juego desde profesor o taller: conserva el aviso de cierre y vuelve a «Entrar» al abrirse.
Automatizado: `npm run check`, incluido `scripts/check-live-access.mjs`.

## XP transparente, objetivos de taller y puntos de flota · 2026-10-10
1. Ejecutar `node scripts/check-xp-integrity.mjs` y `npm run check`; deben pasar las pruebas de los 16 juegos, topes y recompensas pendientes.
2. Abrir la ficha del alumno: expandir «¿Cómo se gana la XP?» y comprobar que están explicadas las reglas de todos los juegos oficiales.
3. Repetir un guardado sin progreso: no suma XP; avanzar en un juego: el evento muestra regla aplicada, solicitada, otorgada y pendiente.
4. Alcanzar el límite de seguridad en entorno de prueba: comprobar que el exceso se guarda como pendiente y se paga en un guardado posterior del mismo juego, sin duplicar progreso.
5. En el panel docente, abrir Actividades de clase y un taller con más de ocho alumnos: comprobar que se ven todos, su XP/objetivo y el estado completado/pendiente.
6. Confirmar que la navegación permite pasar del planificador de talleres al tablón de retos y misiones.
7. La suma automática +5 requiere configurar `FLEET_MARKER_WEBHOOK_URL` y `FLEET_MARKER_WEBHOOK_SECRET` en Supabase, y `LENGUARCADE_FLEET_WEBHOOK_SECRET` como propiedad del script con el mismo valor. El envío queda apagado mientras falte cualquiera de las dos variables de Supabase.
8. Tras autorizar y activar el despliegue, probar primero con un perfil de prueba vinculado: alcanzar `target_xp` en un taller activo debe añadir una entrada `CAT1` de +5; repetir el envío con el mismo ID no debe volver a sumar. Una identidad inexistente/ambigua o un token incorrecto debe dejar intactas las puntuaciones.

