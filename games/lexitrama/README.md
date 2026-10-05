# Lexitrama — El Atlas de las Palabras

Juego aislado de LenguArcade. No requiere compilación ni servicios externos para jugar.

## Probar

Servir el repositorio por HTTP y abrir `games/lexitrama/index.html`. En ejecución directa se guarda una partida de demostración en este navegador. Desde el runner, se espera `INIT` y se usa el alumno y su guardado central; las cachés se separan por identificador del alumno.

- **Aventura:** 30 etapas, cinco mundos; tableros 3×3, 4×4, 5×5 y cinco jefes 7×7.
- **Maestría:** elegir entre 25 objetivos lingüísticos.
- **Contrarreloj:** 1, 3 o 5 minutos; objetivo mínimo y récord.
- **Infinito:** tres errores, sin límite de palabras.
- **Hardcore:** dos errores, sin pistas y con movimientos limitados.
- **Diario:** semilla común por fecha de Madrid; se puede volver a jugar.
- **Semilla de clase:** mismo tablero/configuración para comparar el resumen; sin clasificación de red ni multijugador en directo.

Las palabras fuera del banco no se validan como incorrectas en español: se informa de que no pertenecen al banco pedagógico del juego. Tildes, diéresis y ñ se conservan. En las misiones gramaticales se usa la lectura indicada en el banco; una palabra puede tener otras categorías en otros contextos.

## Motor y solvencia

`content.js` contiene 2031 términos: vocabulario etiquetado y formas de 25 verbos regulares en presente, imperfecto y futuro de indicativo, además de infinitivos. Las formas compartidas conservan sus análisis posibles. Los campos semánticos y lecturas gramaticales se conservan al compartir palabras; incluye plurales y clasificación ortográfica por núcleos vocálicos, u muda e hiatos.

`engine.js` usa un PRNG con estado guardado. Las palabras se incrustan en rutas adyacentes verificables. Tras la gravedad, se busca un objetivo no utilizado. Si falta, el Atlas recompone una ruta y avisa visualmente; los sellos se respetan y el hielo conserva sus usos restantes. La garantía es progresiva: cada nuevo tablero tiene al menos un objetivo disponible hasta completar la misión. No se afirma que todos los objetivos estén simultáneamente en el tablero inicial. En contenidos con pocos términos se abren nuevos ciclos cuando se agota el banco de objetivos.

El combo depende de los aciertos consecutivos; ocho activan Lexifuria durante 12 segundos. La tinta permite pistas y rehacer la trama. Fichas: doradas, comodines, bombas, hielo, sellos y corrupción. Las nuevas fichas pueden ser especiales; se limita su cantidad. Los jefes atacan cada 20 segundos; 12 puntos de corrupción producen derrota. El Borrador además cambia una letra. Solo las palabras objetivo dañan al jefe. El reloj continúa al abrir el menú; no corre durante una salida solicitada.

## Archivos

- `index.html`, `styles.css`, `app.js`: vistas, HUD, Pointer Events, teclado, accesibilidad y tablero basado en la altura real disponible.
- `content.js`, `engine.js`: banco, generación, gravedad, campaña, modos, estrellas, XP, 39 logros y estadísticas.
- `bridge.js`: protocolo genérico del runner, bootstrap, cola serializada, guardado y salida confirmada.
- `audio.js`: sonidos Web Audio; mute, sin descargas externas.
- `assets/*.svg`: ilustración vectorial propia para menú, catálogo, fondo y jefe. Arte inicial, sin dependencias externas.
- `lenguarcade.integration.json`: solicitud de integración central.

## Guardado e integración

Esquema propio `version:1`, transportado por `participant.save` dentro del protocolo actual. Incluye campaña, estrellas, récords, XP, logros, palabras, maestría, fechas diarias y la partida activa con RNG, tablero, movimientos y reloj.

`bridge.js` usa READY/INIT/INITIALIZED, SESSION_STARTED, CHECKPOINT, RESULT, REQUEST_CHECKPOINT y REQUEST_EXIT. Las escrituras se serializan, los resultados conservan ID e instantánea y los errores mantienen el elemento para reintentar con el mismo ID. Solo se emite CLOSE_READY tras CHECKPOINT_CONFIRMED; no hay una confirmación falsa por temporizador. Una caché más reciente del mismo alumno recupera cambios aún no confirmados; no se mezcla el modo demo con alumnos.

El host existente aplica apertura/cierre remoto y el minuto de gracia. El juego responde a su petición de checkpoint/salida y guarda por ese canal. La XP y los logros globales se calculan en el host/backend existente; no se escriben credenciales ni se invoca Supabase desde el juego.

**Estado de publicación:** laboratorio. No se ha añadido al catálogo vivo ni desplegado el núcleo desde esta rama. La integración debe procesar el manifiesto en `integration/*`, actualizar los contadores de catálogo, resolver la ruta del banner y publicar juntos catálogo/host/backend según `AGENTS.md`.

## Comprobaciones

```bash
node scripts/check-lexitrama.mjs
npm run check
# Requiere Playwright y Chromium disponibles (sin modificar package.json):
CHROMIUM_PATH=/ruta/a/chromium node games/lexitrama/browser-test.cjs
# Opcional: guardar capturas de la comprobación
LEXITRAMA_SCREENSHOTS=/ruta/temporal CHROMIUM_PATH=/ruta/a/chromium node games/lexitrama/browser-test.cjs
```

El test de motor cubre 300 combinaciones campaña/semilla y 1450 jugadas/cascadas, reproducibilidad, guardado, alumnos, reloj, jefe, Lexifuria, todas las fichas, tildes y bridge con fallo/reintento/confirmación. El test de navegador prueba arrastre real, teclado, gesto táctil de Chromium, victoria, recarga, jefe, restauración mediante host de iframe simulado y salida confirmada. Comprueba 1366×768, 1440×900, 1920×1080, contenedor de 620 px y móvil 390×844.

Pendiente de validación final tras integración: guardado en el servidor real, XP/logros globales, cierre por profesor en `/exec`, catálogo alumno/profesor y publicación coordinada. La prueba de iframe simula el servidor; no reemplaza esas comprobaciones en producción.

## Rediseño visual de la prueba

Escenario ilustrado propio (`assets/atlas-scene.webp`) generado para el juego: un Atlas mágico en un bosque nocturno, con espacio oscuro para los controles. Menú de expediciones con acción principal, iconos vectoriales, perfil y estadísticas compactas; regiones con hitos y rutas de etapas; HUD con contexto de mundo y tablero de fichas talladas con marco metálico. Solo cambia presentación y marcado de las vistas; motor, banco y protocolo de guardado se conservan.

Validado con `browser-test.cjs`: selección con ratón, teclado y táctil, victoria, jefe, guardado/restauración y cierre confirmado en host simulado, tres resoluciones de escritorio, contenedor de 620 px y móvil. También se comprobó el HTML autónomo por `file://`, con assets incrustados, selección, guardado/recarga y menú responsive.
