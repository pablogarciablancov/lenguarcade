# Plumín: mascota animada de Narratoria

Plumín usa 16 poses PNG individuales con transparencia, recortadas y aisladas de una hoja de dibujos. En reposo permanece en una pose fija; no reproduce ciclos ni reacciones aleatorias. Al saludar recorre cuatro poses de saludo; mientras el alumno escribe alterna cuatro posiciones de aleteo y vuelve a quedarse quieto al hacer una pausa. Al completar una fase puede celebrar. Cada archivo contiene un solo dibujo de 256 × 256 px y mantiene skins, accesorios y trajes mediante capas superpuestas.

Plumín permanece grande y visible en el lateral durante la escritura, incluso con la guía cerrada. El desplegable reúne misión, objetivos, las seis cartas y el inventario; el lateral conserva también la jaula, el diálogo y el progreso del manuscrito.

La Tienda del Gremio conserva sus ayudas narrativas e incorpora skins, accesorios, un traje y tres jaulas. Las compras y el equipamiento se guardan en `state.owl`, tanto en el guardado local como en los datos completos de la partida enviados a LenguArcade. Las partidas antiguas reciben el aspecto original y el nido de roble como valores iniciales.

## Validación

- Ejecuta `node games/narratoria/check-companion.mjs` para comprobar los 16 fotogramas PNG independientes, sus dimensiones y transparencia, los estados de reposo e interacción, la visibilidad lateral y los identificadores de la tienda.
- Ejecuta `node scripts/check-syntax.mjs` para validar los bloques de código del juego.
- Prueba en el juego: inicia una historia y comprueba que Plumín siga visible al cerrar la guía. Escribe y pausa para ver el aleteo y la vuelta a reposo; saluda para ver la secuencia breve. Abre la guía y comprueba que misión y objetivos sigan encima de las cartas y el inventario.
- En la tienda, compra una skin, un accesorio y una jaula; equipa y cambia los elementos, sal del juego y reanúdalo para comprobar que se conservan.
- Comprueba en 1366×768 y móvil que el editor siga siendo cómodo con la guía cerrada y que el panel desplegado permita leer objetivos y cartas.
