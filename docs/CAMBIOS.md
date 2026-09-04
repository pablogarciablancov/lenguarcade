# Registro de cambios

## 2026-09-03 - Sesiones del taller y acceso supervisado en casa

- Se añadió una capa de `Sesión del taller` por clase sobre el control de acceso existente.
- Cada sesión puede tener título, mensaje para los alumnos, objetivo de XP y una selección concreta de juegos.
- En clase, el profesor abre y cierra manualmente la sesión con `Abrir en clase` y `Cerrar en clase`, pensado para la sesión semanal de 30 minutos.
- Fuera del aula, el profesor puede activar `Acceso supervisado en casa` e indicar una fecha y hora de inicio y de fin. La ventana se activa y caduca automáticamente.
- Una sesión publicada pero cerrada bloquea sus juegos hasta que el profesor la abra en clase o llegue una ventana doméstica autorizada.
- Los alumnos ven una tarjeta `MISIÓN ACTUAL` con el título, instrucciones, objetivo de XP, número de juegos y, si existe, la ventana de casa.
- La disponibilidad de la sesión se vuelve a consultar automáticamente cada 30 segundos.
- La configuración se guarda en la nueva hoja `TallerSesiones` con una fila por clase.
- La selección de la sesión no elimina el control manual `AccesosJuegos`: un juego cerrado manualmente sigue cerrado aunque forme parte de la misión.
- El catálogo del editor es dinámico. Cualquier juego nuevo que se incorpore y se marque como activo en `Juegos` aparecerá automáticamente en las sesiones sin tener que modificar esta capa.
- Si una clase todavía no tiene una sesión publicada, se mantiene el comportamiento anterior del launcher para no romper el curso ya existente.

Archivos:

- `apps-script/zzzzz_LenguArcade_workshop_sessions.gs`
- `apps-script/zzzzzz_LenguArcade_workshop_session_guard.gs`
- `docs/CAMBIOS.md`
- `docs/PRUEBAS.md`

Riesgos a comprobar al publicar:

- `zzzzz_...` y `zzzzzz_...` deben cargarse después de `zzzz_LenguArcade_workshop_access.gs`; sus nombres mantienen ese orden alfabético en el flujo actual de `clasp`.
- La primera consulta crea la hoja `TallerSesiones` si todavía no existe.
- La ventana de casa se interpreta con la zona horaria del proyecto de Apps Script; debe mantenerse configurada para Madrid/España.
- El guard final conserva como autoritativo cualquier cierre manual de `AccesosJuegos` dentro de una sesión.

## 2026-09-03 - Control de acceso del taller

- Se añadió al panel del profesor una sección `Control del taller` para decidir qué aplicaciones están abiertas o cerradas.
- El profesor puede aplicar una regla general a todas las clases o seleccionar una clase concreta.
- Se añadieron acciones rápidas `Abrir todos` y `Cerrar todos` para preparar una sesión semanal en pocos segundos.
- Los estados se guardan de forma persistente en la hoja `AccesosJuegos`, con clase, juego, estado, fecha y profesor que realizó el cambio.
- Si una clase no tiene una regla propia, hereda la regla general; si tampoco existe una regla general, el juego permanece disponible para conservar el comportamiento anterior.
- La vista del alumno mantiene visibles todas las tarjetas y marca cada aplicación como `Disponible hoy` o `Cerrado hoy`.
- Los juegos cerrados quedan desactivados desde el launcher y muestran un mensaje explicativo si se intenta abrirlos.
- La disponibilidad se vuelve a consultar automáticamente cada 30 segundos para que los cambios del profesor lleguen a una sesión ya abierta.
- La lógica se implementó como una capa común de LenguArcade y no modifica las mecánicas ni el guardado interno de Battlegrafía, Maniacgrafía, Narratoria, Rimópolis, Scrabble ni otros juegos.
- El control de acceso gobierna el launcher de LenguArcade; no pretende convertir las URLs públicas de los juegos en recursos privados.

Archivos:

- `apps-script/zzzz_LenguArcade_workshop_access.gs`
- `docs/CAMBIOS.md`
- `docs/PRUEBAS.md`

Riesgos a comprobar al publicar:

- El nuevo adaptador debe cargarse después de `zz_LenguArcade_entry_and_patches.gs`; el nombre `zzzz_...` lo sitúa al final del orden alfabético usado por `clasp` para los archivos no incluidos en `filePushOrder`.
- La primera consulta crea la hoja `AccesosJuegos` si todavía no existe.
- Si la consulta de disponibilidad falla, la interfaz conserva el comportamiento previo para no bloquear LenguArcade por un fallo de red.

## 2026-06-15 - Supabase activo y puente de Classroom

- Se migro la base inicial a Supabase: perfiles, progreso, partidas, eventos,
  logros, misiones y clases.
- El acceso de alumnos usa correo institucional y PIN cifrado.
- El panel del profesor usa una sesion segura y carga resumen y fichas completas
  directamente desde Supabase.
- Se anadio renovacion automatica de sesiones para partidas largas.
- Se mantiene una copia secundaria en Sheets durante la transicion.
- Se incorporo la sincronizacion de cursos y alumnos desde Google Classroom.
- Se incorporo el envio explicito de calificaciones como borrador a una tarea
  propia de LenguArcade.
- Se anadieron scripts de migracion y pruebas reales de los flujos de alumno y
  profesor.

## 2026-06-12 - Base de migracion a Supabase y Classroom

- Se anadio el esquema inicial de Supabase para perfiles, clases, matriculas,
  juegos, progreso, eventos, logros, partidas, errores y cola de notas.
- Todas las tablas de datos tienen RLS y el PIN queda en un esquema privado.
- Los checkpoints del alumno se separan del progreso evaluable para evitar que
  una manipulacion del navegador termine convertida en nota.
- Se preparo la vinculacion entre juegos, tareas de Classroom y entregas.
- Se anadio el servicio avanzado de Classroom y dos diagnosticos privados que
  solo leen cursos y alumnos.
- Se preparo una Edge Function para conservar el acceso por correo y PIN sin
  exponer hashes ni claves privadas al navegador.
- La version publica sigue usando Sheets y no se han migrado datos reales.
- No se ha activado todavia ningun envio de notas.

## 2026-06-11 - Selector modal de avatar y paisaje

- Las galerías completas del perfil se sustituyeron por un selector compacto con flechas.
- La personalización se abre en una ventana modal y muestra una única vista previa grande.
- El personaje y el paisaje se recorren por separado, con nombre y contador de opción.
- Se mantienen las 16 opciones de personaje, los 12 paisajes, la combinación aleatoria y el guardado existente.
- Cancelar o cerrar la ventana descarta la vista previa y conserva el avatar guardado.
- No se modificaron los datos, el acceso, el progreso, los juegos ni el panel del profesor.

## 2026-06-10 - Galería de 16 avatares y 12 escenarios

- El constructor por colores se sustituyó por 16 personajes masculinos completos con estética pixel art uniforme.
- Se añadieron 12 fondos independientes: montañas, castillo, volcán, bosque mágico, nieve, costa, ruinas, ciudad nocturna, arcade, biblioteca, islas flotantes y pueblo otoñal.
- Cualquier personaje se puede combinar con cualquier escenario desde dos galerías visuales.
- La cabecera y la vista previa componen el fondo y el personaje en capas.
- Los recursos están optimizados en WebP y se sirven desde `lenguarcade-assets`.
- La configuración se guarda como `{version:2, character, background}` en la misma columna `avatar`.
- Los identificadores antiguos y las configuraciones del constructor anterior se convierten automáticamente.
- No se modificaron el acceso, el progreso, las notas, los juegos ni el panel del profesor.

## 2026-06-10 - Acceso institucional y sprite refinado

- La página del alumno se oculta hasta validar una sesión.
- La pantalla inicial solicita el correo completo `@alumno.fomento.edu` y el PIN personal.
- Se eliminaron de la experiencia pública los selectores de clases y alumnos.
- Las antiguas funciones públicas de listado de alumnos quedan desactivadas para impedir enumeraciones.
- Los errores de acceso son genéricos, se limitan los intentos fallidos y, cuando Apps Script identifica una cuenta escolar de Google, se exige que coincida con el correo introducido.
- El avatar se redibujó con una cuadrícula de mayor resolución, rostro y cuerpo más proporcionados, pelo por mechones, chaqueta abierta, pantalones y botas detallados.
- El personaje predeterminado usa pelo castaño despeinado, piel clara, chaqueta roja y ropa azul para aproximarse a la referencia visual.
- Se mantienen la personalización de colores, peinado y fondo, así como la compatibilidad con configuraciones guardadas.
- No se modificaron el progreso, las notas, los juegos ni el panel del profesor.

## 2026-06-10 - Constructor de avatares pixel art

- Se añadió al perfil del alumno un constructor de personajes de cuerpo entero con estética de videojuego de 16 bits.
- Se pueden combinar tono de piel, peinado, color de pelo, color de ojos, chaqueta, camiseta, pantalón y escenario.
- La vista previa se dibuja por capas en un `canvas` de baja resolución para conservar píxeles nítidos al ampliarlo.
- Se añadió un botón para generar combinaciones aleatorias.
- La configuración se guarda como JSON en la columna `avatar` de la hoja `Alumnos` y reaparece en la cabecera y entre sesiones.
- Los antiguos identificadores `avatar_01` a `avatar_12` se convierten automáticamente a una combinación compatible.
- El servidor exige una sesión de alumno y valida cada opción contra una lista cerrada.
- No se modificaron el PIN, el progreso, las notas ni la evaluación.

## 2026-06-09 - Nueva identidad visual y portadas

- Se sustituyeron los siete banners provisionales por portadas JPG 16:9 con estética de biblioteca de videojuegos.
- Se añadió un nuevo emblema de LenguArcade y un banner general del universo de juegos.
- El banner general se refinó con una composición pixel art centrada en una plaza arcade, sin escenas ni personajes repetidos.
- La vista del alumno muestra la nueva marca en el lateral y en la cabecera.
- La vista del profesor muestra la nueva marca en el lateral y el banner general en la cabecera.
- Se añadió favicon PNG en ambas vistas.
- No se modificó la lógica de datos, autenticación, progreso ni evaluación.

## 2026-06-09 - Verificación y protección del despliegue

- Las rutas públicas de alumno y profesor responden con HTTP 200.
- Las funciones de instalación y reparación ya no son invocables desde el navegador.
- El panel público deja de mostrar la contraseña inicial.
- La lectura del panel del alumno exige sesión.
- El guardado de progreso exige siempre una sesión de alumno válida.
- El selector público de alumnos ya no devuelve correos.
- La comprobación automática valida sintaxis, IDs HTML, contratos cliente-servidor y funciones sensibles.
- El publicador valida el proyecto y fuerza de forma explícita la actualización del manifiesto para evitar versiones vacías.
- Las instalaciones nuevas generan una clave de profesor aleatoria en lugar de usar una contraseña conocida en el código.

## 2026-06-09 - Sincronización con Codex y Apps Script

- Se conectó el repositorio con el proyecto real mediante `clasp`.
- Se añadió el manifiesto `apps-script/appsscript.json`.
- Se restauró desde la versión 7 publicada el parche completo `zz_LenguArcade_v0_3_patch.gs`.
- Se eliminaron dos fragmentos v0.4.1 truncados que no eran código ejecutable completo.
- Se añadió un comando de publicación que actualiza el despliegue estable.
- Se añadieron reglas limitadas de Codex para evitar permisos repetidos en los comandos de instalación, comprobación y publicación.
- No se modificó la lógica funcional publicada ni el repositorio de Battlegrafía.

Prueba:

```powershell
npm.cmd install
npm.cmd run apps:status
```

## v0.1 - Núcleo inicial

Pendiente de subir al repositorio como versión base.

Objetivos:

- estructura central de Apps Script
- panel de alumno
- panel de profesor
- Sheets central
- alumnos demo
- catálogo de juegos
- funciones base de progreso

## Criterio de cambios

Cada cambio debe indicar:

- versión
- archivos modificados
- qué se ha tocado
- qué no se ha tocado
- cómo probarlo
- posibles riesgos

## 2026-09-04 · Rayuela, aventura narrativa ramificada

- Nuevo juego `games/rayuela/index.html`: editor visual de aventuras con mapa inicial 9×9 ampliable, escenas conectadas, decisiones y múltiples finales.
- Dos experiencias separadas: modo creador y modo jugador, con inventario, variables, condiciones, capítulos y finales secretos.
- Brújula del autor, inspector estructural, métricas de complejidad, más de 30 logros, easter eggs, XP interno, tutorial, plantillas, pruebas desde cualquier escena y colección de finales.
- Autoguardado local, importar/exportar JSON, deshacer/rehacer y entrega con copia congelada.
- Integración con el bridge de LenguArcade: INIT/READY, checkpoints, resultados, logros y cierre seguro sin compartir el token con el juego.
- Integración nativa en el host del alumno para XP/guardado; adaptador `zzzzzzzzz_LenguArcade_rayuela.gs` como compatibilidad para catálogos antiguos y para la ficha/rúbrica específica del profesor.
- Migración Supabase preparada para registrar `rayuela` en el catálogo y `student-dashboard` preparado para abrirlo embebido.
- Rúbrica docente configurable (criterios, pesos, notas y comentarios), con comentarios por escena que vuelven al editor del alumno como feedback revisable.
- La nota final continúa siendo decisión del profesor; las métricas automáticas se usan como evidencias estructurales, no como calificación definitiva.
- Evaluación específica de Rayuela mediante una rúbrica configurable guardada en `evaluations` con `scope=game`.
- El panel docente puede abrir el mapa narrativo completo, leer escenas y dejar comentarios generales o asociados a nodos concretos.
- Los comentarios del profesor vuelven al juego a través del dashboard del alumno; el alumno puede marcarlos como revisados sin modificar la evaluación docente.


## 2026-09-04 · Entre Líneas
- Nuevo juego de comprensión lectora: **Entre Líneas · Agencia de Investigación Lectora**.
- Se integra como juego embebido de LenguArcade con sesión del alumno, autoguardado, recuperación de partida y resultados centrales.
- El Expediente 001, «El aula vacía», registra pistas, conexiones, pruebas de comprensión, ayudas, intentos finales, notas, perfil lector y logros.
- El resultado envía XP al progreso central con protección frente a repetir el mismo expediente para acumular experiencia.
- El catálogo del alumno y el control de acceso del taller pueden habilitar/bloquear Entre Líneas igual que el resto de juegos.
- El panel del profesor incorpora un diagnóstico específico con métricas de investigación y las seis habilidades lectoras.
- Supabase incorpora el juego al catálogo y el dashboard lo publica con integración embebida.
