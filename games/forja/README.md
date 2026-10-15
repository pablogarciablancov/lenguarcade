# FORJA

Roguelite de palabras de LenguArcade, servido desde `games/forja/`. El identificador técnico `lexoma` se conserva para mantener los perfiles y guardados existentes; no condiciona el nombre de la carpeta.

El catálogo ya desplegado puede usar el alias `games/lexoma/`, que redirige a FORJA conservando los parámetros de integración.

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

- `node games/forja/smoke-test.mjs`
- `node games/forja/browser-test.mjs` con Playwright disponible.

## Diccionario y portada (2026-10-05)

Forja combina el diccionario compartido de frecuencia con `dictionary-es-extra.txt`: 659.202 formas de RLA-ES/Hunspell, incluidas conjugaciones regulares e irregulares, género, número y derivaciones autorizadas por sus flags. Se excluyen entradas con mayúsculas, siglas y puntuación; no se acepta cualquier unión de raíz y sufijo. Licencia en `assets/RLA_ES_LICENSE.md`.

Regeneración reproducible: `python games/forja/build-dictionary.py`. Lee exclusivamente los archivos `../word_play/hunspell/es_ES.dic` y `.aff`; aplica condiciones, eliminación/adición, prefijos cruzados y continuaciones de sufijos. No modifica Word Play. Verificación independiente opcional con libhunspell: añadir `--verify-native`. Las formas ya están expandidas para que cada jugada conserve lookup O(1), sin un conjugador en tiempo de ejecución. La caché del banco y los scripts está versionada.

Pruebas: `node games/forja/dictionary-test.mjs`, `node games/forja/smoke-test.mjs` y `node games/forja/integration-browser-test.cjs` (Playwright). Incluyen familias de ceñir, construir, hacer, tener, decir e ir, derivados/plurales, tildes y Ñ, rechazo de formas inventadas, y jugar CIÑO/guardar/restaurar en el runner. El análisis local de ceñir distingue ciño (presente) y ciñó (pretérito). La ampliación de aceptación no pretende etiquetar morfológicamente todas las formas ni elimina las ambigüedades al jugar sin tildes.

Los alias sin acento preservan Ñ y Ü; las cartas reciben el análisis de la forma canónica. La portada del catálogo y del manifest es `assets/forja-cover-v1.webp`.

## Validación léxica (2026-10-15)

La lista compartida de frecuencia deja de autorizar palabras: contiene cadenas como phi y xvi. Se conserva RLA-ES flexionado y el léxico local, con ñu y sus plurales ñus/ñúes como suplemento. XI se excluye por criterio del juego (nombre de letra griega), aunque existe como entrada léxica. No se aplica un veto general a letras romanas: mil, civil y vi siguen admitidas. Se conserva la distinción Ñ/N y el sistema de alias de tildes.

## Revisión general y significados (2026-10-15)

Sustituye el criterio de la revisión anterior: XI vuelve a admitirse, como nombre español de letra griega. El banco incluye 707.808 formas, 48.606 más que el original: snapshot del español general de RLA-ES (España y América), con reglas de flexión, licencia y commit fijados en `dictionary-source/README.md`. No se utiliza la frecuencia para autorizar palabras. El suplemento y las exclusiones tienen motivos documentados en JSON. Se admiten también las palabras españolas de una letra. Las palabras desconocidas se describen como fuera del diccionario, no necesariamente inexistentes.

`python games/forja/build-dictionary.py --verify-all` contrasta las 707.796 formas generadas no incluidas en el suplemento con libhunspell. Los casos en que el analizador nativo rechaza una forma válida se documentan en el suplemento. No se supone que un corrector sea una garantía de cobertura total ni de corrección semántica. El banco de regresión `dictionary-coverage.json` cubre léxico cotidiano, asignaturas, conjugaciones, enclíticos y palabras cortas; también se prueban cadenas inventadas y falsas regularizaciones. Todas las formas del analizador local deben existir en el banco aprobado.

Se conserva la tolerancia a omitir tildes; una tilde escrita incorrectamente ya no se elimina para buscar otra palabra. Ñ y Ü siguen conservando su identidad.

Después de una jugada, `definitions.js` consulta la primera acepción española de Wikcionario (Action API con CORS), con atribución y enlace CC BY-SA. Si falta la forma flexionada, consulta el lema cuando el análisis local lo conoce. Timeout de 4,5 s, peticiones simultáneas deduplicadas y caché persistente de hasta 200 entradas. Solo se extrae texto, nunca se inserta HTML remoto. Un error, falta de cobertura o bloqueo de red muestra «Definición no disponible» y no afecta a puntos ni guardado. La definición es una acepción posible, no una interpretación contextual de la jugada.

Pruebas: `dictionary-test.mjs`, `smoke-test.mjs`, `feedback-test.mjs`, `definitions-test.mjs` (DOMParser de linkedom mediante FORJA_DOM_MODULE en Node), `browser-test.mjs` e `integration-browser-test.cjs`.
