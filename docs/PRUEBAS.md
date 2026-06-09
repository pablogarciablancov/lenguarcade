# Plan de pruebas

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
3. Ejecutar setupLenguArcade().
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
