# Plan de pruebas

## Regla general

Cada version debe poder probarse sin tocar codigo manualmente mas alla de copiar los archivos indicados.

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
