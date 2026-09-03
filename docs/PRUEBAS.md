# Plan de pruebas

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
