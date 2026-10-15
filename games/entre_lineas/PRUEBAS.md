# Pruebas

Ejecutadas:

- `node games/entre_lineas/check-agency.cjs`: tres casos, restauración, marcas, pruebas distintas, acusación incorrecta, resolución, repetición sin XP, expediente clásico y envío RESULT.
- `node scripts/check-entre-lineas.mjs`: loader y protocolo existente.
- `node --check games/entre_lineas/agency.js`.

Pendientes en navegador antes de publicar:

1. Servir el repositorio por HTTP y abrir `games/entre_lineas/`.
2. Revisar 1366×768, 1440×900 y 1920×1080, incluyendo el juego integrado con cabecera.
3. Interrogar, marcar sospechoso, archivar documentos, conectar fuentes y entregar el informe.
4. Recargar a mitad de investigación y comprobar recuperación dentro de LenguArcade.
5. Comprobar scroll interno y navegación del expediente anterior, perfil y logros.

El ensayo Playwright no pudo arrancar: falta Chromium y su descarga no produjo un archivo válido. Las pruebas de lógica usan un DOM simulado y no validan el diseño.

La prueba `check-agency.cjs` cubre además los seis pasos del tutorial, bloqueo de informe anticipado, recuperación del paso tras reabrir, corrección sin gastar intentos y repetición sin XP.
