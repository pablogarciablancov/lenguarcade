# Pruebas de LEXOMA

## Automáticas

`node games/forja/smoke-test.mjs`

Valida léxico, acentos, irregularidades registradas, positivos y negativos gramaticales, primer robo real, conservación de fichas, rechazo de palabras, tildes/comodines, efectos de reliquias, compras y rechazo de duplicados, recorrido hasta victoria/derrota, tres fases de Morfax, snapshot y separación de perfiles. La prueba completa de recorrido controla la frase para aislar combate/economía; la prueba de primer turno sí forma EL MAGO CORRE desde las fichas reales.

Pruebas de interfaz realizadas con Chromium: primer ataque real por clics, ideas, recarga y continuación, códice, compra en tienda. Sin pageerrors ni recursos HTTP fallidos. Sin scroll general y mano, enemigo, frase y finalizar visibles en 1366×768, 1440×900, 1920×1080, 1366×640 y 800×600.

Host de pruebas con iframe a 1366×768 y cabecera de 110 px: READY/INIT, checkpoint confirmado, restauración de selección a mitad de turno, salida guardada, fallo de guardado con fallback explícito, solicitud de checkpoint/salida simulando final de gracia y cambio de alumno. No sustituye la validación del despliegue real /exec.

Prueba de interfaz reproducible: `node games/forja/browser-test.mjs` (requiere Playwright instalado; `LEXOMA_CHROMIUM` permite indicar un navegador ya instalado). Usa su propio servidor temporal. `LEXOMA_SCREENSHOTS` permite guardar capturas fuera del repositorio.

## Prueba manual

1. Abrir `games/forja/index.html` desde un servidor estático. Entrar en la forja.
2. Seleccionar E, L; Forjar. Seleccionar M, A, G, O; Forjar. Seleccionar C, O, R, R, E; Forjar. Finalizar. Se obtienen 290 puntos sin reliquias aplicables.
3. Reordenar cartas con ‹/› o retirarlas con ×; observar los errores y bonificaciones antes de atacar.
4. Forjar una secuencia no incluida: no consume letras. Aplicar ficha de tilde después de vocal. Elegir letra en comodín y análisis en una forma ambigua.
5. Usar descartes, cerrar ronda y verificar que agotar rondas resta Integridad. Continuar hasta tienda, élite y jefe.
6. Volver al menú y continuar; recargar con cartas y selección a medias; comprobar recuperación exacta.
7. Integración central: aplicar manifest y adaptador desde integration/*. Confirmar que dos checkpoints idénticos y recarga no duplican XP; confirmar guardado después de finalizar partida; probar /exec como alumno y profesor, apertura desde Sites y cierre real con minuto de gracia.

Pendiente de publicación coordinada: catálogo vivo, XP global, logros globales, políticas de acceso reales y /exec. El juego y el bridge están probados en laboratorio; no se afirma despliegue en producción.
