# Sopa de Tinta — 4 de octubre de 2026

Primera versión aislada en `games/sopa_de_tinta/`: 160 conceptos de ESO, generador con español completo y semillas reproducibles; selección mediante Pointer Events y teclado; siete distritos con tres pedidos y Hora Punta cada uno; relax, contrarreloj, maestría y diario común con fecha de Madrid.

XP, nivel, Tintas para cosméticos, fichas de ayuda ganadas jugando, tres ayudas, combo, puntuación, estrellas, récords, racha diaria, 37 logros, tres misiones diarias y adaptación suave a conceptos resueltos con ayuda o pendientes. Sonidos sintetizados, música opcional, reducción de movimiento, alto contraste y distintivos numéricos en las palabras encontradas.

Guardado local por identidad y bridge genérico: bootstrap/INIT, checkpoints, resultado con ID estable y salida tras confirmación o fallback local. Una selección errónea libre no se atribuye arbitrariamente a un concepto: el registro individual distingue respuestas sin ayuda, con ayuda y conceptos pendientes al cerrar una partida.

## Integración pendiente

No se modifican catálogo, runner, backend ni Apps Script desde esta rama `game/*`, conforme a `AGENTS.md` y `docs/TRABAJO_CONCURRENTE_JUEGOS.md`.

La petición está en `lenguarcade.integration.json`: incorporar catálogo, calcular progreso de los 28 pedidos y XP central con delta idempotente, desplegar el host coordinado y probar con una cuenta real. Los checkpoints usan contadores de recompensa a cero para no sumar respuestas repetidamente al guardado. El ranking global del diario requiere un endpoint común autorizado; la versión actual muestra registros personales, sin presentar una clasificación inventada.

## Límites de esta versión

Arte original vectorial ligero. Siete tintes de distrito; tres fondos y cosméticos de trazo, marco y taza. Las fichas de ayuda no se compran con Tintas. No hay compras reales. No hay multijugador. El reloj se pausa al volver al café, por lo que cualquier futuro ranking competitivo deberá definir y validar su política de pausas. Las misiones se renuevan a diario; los desafíos semanales quedan para la integración posterior.

## Revisión visual y glosario

Cafetería ilustrada original integrada como fondo WebP ligero (~240 KB), título con volumen, botones de juego, HUD enmarcado, tablero con fichas y madera, pedidos numerados, distritos con emblemas y puntos flotantes al acertar. Se mantiene el motor, las recompensas y el protocolo del visor.

Glosario desbloqueado únicamente al encontrar conceptos: término, definición, pista original, distrito y contador de encuentros. Búsqueda sin dependencia de tildes y filtro por distrito. Se guarda en `profile.discovered` con el mismo esquema y clave de guardado existentes. Los perfiles previos recuperan los aciertos sin ayuda y los conceptos encontrados de la partida conservada; el contador antiguo de ayudas también incluía palabras pendientes, por lo que no se usa para desbloquear falsos descubrimientos.

Arte creado con imagegen: cafetería literaria de fantasía nocturna, lámparas ámbar, libros, tinta turquesa, ciudad violeta y taza con vapor mágico; sin personas ni interfaz en la ilustración. Recurso: `games/sopa_de_tinta/cafe.webp`.

## Acceso permanente a Aventura

El botón principal mantiene siempre «Jugar Aventura», incluso con un pedido pendiente. «Continuar pedido» dispone de un botón separado. Entrar en un distrito conserva la confirmación antes de sustituir una partida activa.

## Botones explícitos dentro de los distritos

Cada tarjeta muestra antes de los niveles un botón grande «Jugar · Pedido N» para el siguiente pedido pendiente (o Pedido 1 si ya se completó el distrito). Los cuatro pedidos individuales siguen disponibles según la progresión. La estructura evita recortes de controles y utiliza una columna en pantallas estrechas, con scroll interno del mapa. No cambia guardados, banco ni recompensas.
