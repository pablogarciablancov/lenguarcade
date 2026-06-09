# Registro de cambios

## 2026-06-09 - Sincronización con Codex y Apps Script

- Se conectó el repositorio con el proyecto real mediante `clasp`.
- Se añadió el manifiesto `apps-script/appsscript.json`.
- Se restauró desde la versión 7 publicada el parche completo `zz_LenguArcade_v0_3_patch.gs`.
- Se eliminaron dos fragmentos v0.4.1 truncados que no eran código ejecutable completo.
- Se añadió un comando de publicación que actualiza el despliegue estable.
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
