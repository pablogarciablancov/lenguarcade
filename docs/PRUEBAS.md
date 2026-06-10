# Plan de pruebas

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
2. Abrir la sección Perfil y confirmar que el personaje predeterminado tiene chaqueta roja, ropa azul, botas marrones, pelo castaño detallado y proporciones similares a la referencia.
3. Cambiar peinado, piel, ojos, ropa y fondo, comprobando que la vista previa responde a cada cambio.
4. Pulsar `Aleatorio` varias veces y confirmar que genera combinaciones válidas.
5. Pulsar `Guardar` y comprobar que el retrato de la cabecera adopta la combinación elegida.
6. Recargar la página y confirmar que se conserva.
7. Cerrar sesión, volver a entrar con el mismo alumno y confirmar que sigue seleccionado.
8. Comprobar que otro alumno mantiene su propia configuración.
9. Revisar el editor en escritorio y móvil, especialmente selectores, muestras de color y proporción del personaje.

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
