# Sopa de Tinta — 4 de octubre de 2026

Primera versión aislada en `games/sopa_de_tinta/`: 160 conceptos de ESO, generador con español completo y semillas reproducibles; selección mediante Pointer Events y teclado; siete distritos con tres pedidos y Hora Punta cada uno; relax, contrarreloj, maestría y diario común con fecha de Madrid.

XP, nivel, Tintas para cosméticos, fichas de ayuda ganadas jugando, tres ayudas, combo, puntuación, estrellas, récords, racha diaria, 37 logros, tres misiones diarias y adaptación suave a conceptos resueltos con ayuda o pendientes. Sonidos sintetizados, música opcional, reducción de movimiento, alto contraste y distintivos numéricos en las palabras encontradas.

Guardado local por identidad y bridge genérico: bootstrap/INIT, checkpoints, resultado con ID estable y salida tras confirmación o fallback local. Una selección errónea libre no se atribuye arbitrariamente a un concepto: el registro individual distingue respuestas sin ayuda, con ayuda y conceptos pendientes al cerrar una partida.

## Integración pendiente

No se modifican catálogo, runner, backend ni Apps Script desde esta rama `game/*`, conforme a `AGENTS.md` y `docs/TRABAJO_CONCURRENTE_JUEGOS.md`.

La petición está en `lenguarcade.integration.json`: incorporar catálogo, calcular progreso de los 28 pedidos y XP central con delta idempotente, desplegar el host coordinado y probar con una cuenta real. Los checkpoints usan contadores de recompensa a cero para no sumar respuestas repetidamente al guardado. El ranking global del diario requiere un endpoint común autorizado; la versión actual muestra registros personales, sin presentar una clasificación inventada.

## Límites de esta versión

Arte original vectorial ligero. Siete tintes de distrito; tres fondos y cosméticos de trazo, marco y taza. Las fichas de ayuda no se compran con Tintas. No hay compras reales. No hay multijugador. El reloj se pausa al volver al café, por lo que cualquier futuro ranking competitivo deberá definir y validar su política de pausas. Las misiones se renuevan a diario; los desafíos semanales quedan para la integración posterior.
