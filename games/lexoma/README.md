# FORJA

Roguelite de palabras de LenguArcade, servido desde `games/lexoma/` por compatibilidad con el `gameId` ya creado.

## Bucle de juego

- Forma una palabra con las letras de la **Mano**.
- Cada letra aporta valor y algunas fichas mejoradas añaden PUNTOS o MULTIS.
- La jugada calcula **PUNTOS × MULTIS = TOTAL**.
- Cada palabra consume 1 **Energía**; la Energía se reinicia al empezar cada ronda (6 Fácil / 5 Normal / 4 Difícil, modificable por cartas).
- Hay que alcanzar el objetivo antes de quedarse sin Energía.
- La mano prioriza al menos dos vocales y evita repeticiones excesivas para reducir manos muertas.
- Los **rerolls** sirven para cambiar hasta 3 letras o para renovar las 3 cartas ofrecidas entre rondas.
- Antes de la primera jugada entras en una **tienda inicial** con monedero propio. Las cartas ya no son gratis: puedes comprar una, varias o ninguna y ahorrar.
- Tras cada ronda ganas monedas por base + Energía restante + interés, y vuelves a la tienda.
- La build admite un máximo de **5 cartas activas**; después hay que sustituir una para incorporar otra.
- Las cartas pueden mejorarse hasta **nivel III**.
- El taller permite eliminar letras de la bolsa, grabar fichas de Puntos o Multis y dorarlas.
- Las tiendas pueden incluir eventos con riesgo/recompensa: apuestas, rerolls, comodines, energía extra, mejoras aleatorias o fundición de letras.
- Normal tiene 10 rondas; hay Fácil, Difícil, Reto diario y continuación infinita.

## Contenido

- 54 Cartas de Forja, con disparadores por letras, longitud, categorías gramaticales y situaciones de la run.
- Puntuación base reforzada por longitud: las palabras generan PUNTOS y MULTIS incluso antes de activar cartas.
- Letras normales, mejoradas y especiales.
- Animación secuencial al seleccionar letras y resolver PUNTOS × MULTIS.
- Economía persistente durante la run con monedero visible, precios, refresco de tienda e interés.
- Comodines y exclamaciones especiales.
- Diccionario español ampliado cargado desde el banco común de Word Play, con el léxico morfológico local como respaldo.
- Cuando una palabra pertenece al léxico morfológico local, se muestra su categoría gramatical.

## Integración

Mantiene el protocolo común de LenguArcade: READY / INIT / CHECKPOINT / RESULT / CLOSE_READY, guardado por alumno y adaptador acumulativo de progreso.

## Verificación

- `node games/lexoma/smoke-test.mjs`
- `node games/lexoma/browser-test.mjs` con Playwright disponible.

## Diccionario y portada (2026-10-05)

Forja combina el diccionario compartido de frecuencia con `dictionary-es-extra.txt`: 54,492 entradas minúsculas de RLA-ES/Hunspell ya incluido en el repositorio (sin nombres propios ni expansión de sufijos). Licencia en `assets/RLA_ES_LICENSE.md`; regeneración: extraer la entrada antes de `/` de `../word_play/hunspell/es_ES.dic`, conservar solo letras españolas y minúsculas, ordenar y quitar duplicados. No convertir flags Hunspell en palabras ni generar conjugaciones indiscriminadamente. `talar` también tiene análisis verbal local y conjugaciones documentadas.

Los alias sin acento preservan Ñ y Ü; las cartas reciben el análisis de la forma canónica. La portada del catálogo y del manifest es `assets/forja-cover-v1.webp`.
