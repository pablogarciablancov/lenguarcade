# FORJA

Roguelite de palabras de LenguArcade, servido desde `games/lexoma/` por compatibilidad con el `gameId` ya creado.

## Bucle de juego

- Forma una palabra con las letras de la **Mano**.
- Cada letra aporta valor y algunas fichas mejoradas añaden PUNTOS o MULTIS.
- La jugada calcula **PUNTOS × MULTIS = TOTAL**.
- Cada palabra consume 1 **Energía**.
- Hay que alcanzar el objetivo antes de quedarse sin Energía.
- Los **rerolls** sirven para cambiar hasta 3 letras o para renovar los 3 bonus ofrecidos entre rondas.
- Al superar una ronda se elige 1 de 3 bonus permanentes para la run.
- Normal tiene 10 rondas; hay Fácil, Difícil, Reto diario y continuación infinita.

## Contenido

- 54 bonus.
- Letras normales, mejoradas y especiales.
- Comodines y exclamaciones especiales.
- Diccionario español ampliado cargado desde el banco común de Word Play, con el léxico morfológico local como respaldo.
- Cuando una palabra pertenece al léxico morfológico local, se muestra su categoría gramatical.

## Integración

Mantiene el protocolo común de LenguArcade: READY / INIT / CHECKPOINT / RESULT / CLOSE_READY, guardado por alumno y adaptador acumulativo de progreso.

## Verificación

- `node games/lexoma/smoke-test.mjs`
- `node games/lexoma/browser-test.mjs` con Playwright disponible.
