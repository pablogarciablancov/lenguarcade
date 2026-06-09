# Registro de cambios

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
