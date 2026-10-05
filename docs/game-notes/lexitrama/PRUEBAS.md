## 2026-10-05 · Regresión de categorías

- `node scripts/check-lexitrama.mjs`: 300 campañas/semillas y 1450 cascadas, campos compartidos, plurales con tilde, homógrafos y misiones ortográficas. SETO aceptado en el tablero exacto de la captura y en un guardado v1 restaurado, sin cambiar sus letras.
- `node games/lexitrama/browser-test.cjs`: arrastre real de S-E-T-O en ese tablero: suma un objetivo del bosque y no añade errores; también teclado, táctil, victoria, guardado, jefe y responsive.
- `node games/lexitrama/integration-browser-test.cjs`: runner real con persistencia de prueba, XP, logros, salida/continuación, gracia, reapertura y cierre automático.
- Publicación solo del juego mediante PR game/* y GitHub Pages; sin cambios en Apps Script o Supabase.

# Pruebas de Lexitrama

## Ejecutadas

- `node scripts/check-lexitrama.mjs`: 300 niveles/semillas, 1450 jugadas y cascadas, solución inicial y posterior, campaña, estrellas, seed/RNG, restauración, aislamiento de alumnos, jefe, reloj, Lexifuria, fichas, tildes y distinción objetivo/palabra válida.
- Bridge con host simulado: rechazo de canal/origen incorrecto, una escritura en vuelo, resultado con instantánea estable, fallo y reintento con mismo ID, CLOSE_READY exclusivamente tras confirmación.
- `CHROMIUM_PATH=... node games/lexitrama/browser-test.cjs`: arrastre de ratón, selección mediante espacio/Enter, gesto táctil real, victoria, recarga del progreso, jefe, iframe de host simulado, restauración central simulada y cierre confirmado. Sin errores JavaScript.
- Geometría: 1366×768, 1440×900, 1920×1080, altura disponible 620 px y móvil 390×844. Tablero y controles visibles, sin scroll general; paneles secundarios con scroll interno.
- `npm run check`: batería general del repositorio correcta (catálogo actual de 13 juegos intacto).

## Después de integrar/publicar

1. Abrir Lexitrama desde catálogo alumno y comprobar su banner.
2. Formar tres palabras, salir mediante el host y volver a continuar exactamente el tablero/RNG.
3. Verificar estrellas, récord, estadísticas, logros y XP global con otro dispositivo.
4. Cerrar el juego desde profesor durante una partida. Comprobar aviso/gracia de 60 segundos, guardado en esa gracia y checkpoint final al cerrar.
5. Probar salida con una escritura de resultado pendiente y con fallo real de red, usando el reintento del host.
6. Verificar que otro alumno del mismo Chromebook no hereda los datos.
7. Abrir otro juego y verificar menú de alumno/profesor tras publicar el catálogo.

No se ha probado la base de datos real ni el `/exec` estable en esta rama aislada. La semilla de clase tiene resumen comparable, no un ranking remoto nuevo.
