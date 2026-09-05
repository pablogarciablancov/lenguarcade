# Plan de pruebas

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
