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
