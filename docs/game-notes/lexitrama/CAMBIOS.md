## 2026-10-05 · Palabras y categorías

- Corregida la pérdida de campos semánticos cuando una palabra se registraba en varias categorías; se conservan también sus lecturas gramaticales y familias.
- Banco ampliado de 812 a más de 2.000 formas: vocabulario de bosque, mar y los demás campos, con plurales regulares y formas acentuadas declaradas. SETO y SETOS sirven en bosque.
- La clasificación de acentuación, hiatos y diptongos se calcula para todo el banco; u muda y h intercalada incluidas.
- Motor, diseño, objetivos, recompensas y formato de guardado v1 conservados; los tableros guardados usan las nuevas categorías sin regenerarse.
- Recurso content.js versionado para evitar cargar el diccionario anterior.

# Lexitrama — 2026-10-04

Primera implementación jugable aislada en `games/lexitrama/`.

- Cinco mundos, 30 etapas, tableros 3/4/5/7 y jefes con vida, ataques y derrota por corrupción.
- Banco propio de 812 términos, 25 misiones, RNG reproducible y rescate de solvencia después de la gravedad.
- Siete entradas de juego: aventura, maestría, contrarreloj, infinito, hardcore, diario y semilla de clase.
- Combos, Lexifuria, seis fichas especiales, tinta, estrellas, rangos, 39 logros y estadísticas.
- Menú, Atlas, HUD, ilustraciones SVG propias, Web Audio, Pointer Events y teclado.
- Guardado versionado, caché por alumno y bridge con cola serializada, reintentos estables y salida confirmada.
- Sin cambios en otros juegos ni en núcleo/catálogo/backend. Integración central declarada en el manifiesto.

Estado: PR de juego lista para revisión; publicación e integración conjunta pendientes según las reglas de trabajo concurrente.

## 2026-10-08 — Sustantivos espontáneos

- Causa: LOSA y PISO no figuraban en el banco, aunque la misión pedía sustantivos sin restricciones. El motor ya valida todas las entradas compatibles, no solo la palabra garantizada.
- Se añaden 1492 entradas nuevas (sustantivos comunes y flexiones nominales), pasando de 2031 a 3523 palabras. Las categorías compartidas conservan sus lecturas y los campos semánticos no se amplían indiscriminadamente.
- La captura original admite LOSA, PISO, LODO, ROSA, SILO, SOL, BOCA y PUPITRE como objetivo. Se actualiza la versión del recurso para evitar el banco antiguo en caché.
- Se mantiene el banco pedagógico local: la ampliación no equivale a un diccionario exhaustivo de español. No cambia el formato de guardado ni las reglas de puntuación.
