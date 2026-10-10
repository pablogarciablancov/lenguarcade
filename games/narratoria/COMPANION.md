# Plumín: mascota animada de Narratoria

Plumín usa 240 fotogramas WebP con transparencia: 60 posiciones independientes para cada secuencia de reposo, aleteo, conversación y reacciones. Las imágenes se generan desde poses dibujadas a lápiz con interpolación de movimiento; cada fotograma se valida y se separan restos ajenos a la silueta. El navegador precarga la secuencia y cambia la imagen completa en cada paso; no desplaza una hoja compartida ni recorta celdas, por lo que ningún fotograma puede recoger partes de poses vecinas ni quedar vacío durante la carga. Aletea mientras el alumno escribe, abre y cierra el pico al hablar, celebra al alcanzar el mínimo de palabras o superar una fase, piensa si se intenta evaluar un texto incompleto y cambia de postura al pasar de fase. En los descansos parpadea, ladea la cabeza y alterna gestos de curiosidad.

La guía lateral de escritura pasa a un desplegable. Al abrirla, la misión y los objetivos aparecen arriba, seguidos de un único Plumín grande con su jaula, diálogo y progreso del manuscrito; debajo están las seis cartas y el inventario. No se duplica el búho junto al editor ni en el encabezado plegado.

La Tienda del Gremio conserva sus ayudas narrativas e incorpora skins, accesorios, un traje y tres jaulas. Las compras y el equipamiento se guardan en `state.owl`, tanto en el guardado local como en los datos completos de la partida enviados a LenguArcade. Las partidas antiguas reciben el aspecto original y el nido de roble como valores iniciales.

## Validación

- Ejecuta `node games/narratoria/check-companion.mjs` para comprobar los 240 fotogramas WebP independientes, sus rutas, las animaciones, las reacciones, los controles y los identificadores de la tienda.
- Ejecuta `node scripts/check-syntax.mjs` para validar los bloques de código del juego.
- Prueba en el juego: inicia una historia, abre la guía y comprueba que misión y objetivos aparecen arriba de un único Plumín grande. Escribe para ver el aleteo, alcanza el mínimo de palabras para ver la celebración, evalúa para ver la reacción de fase y prueba una evaluación incompleta para ver el gesto pensativo. Espera para ver el parpadeo y los gestos de curiosidad; saluda a Plumín.
- En la tienda, compra una skin, un accesorio y una jaula; equipa y cambia los elementos, sal del juego y reanúdalo para comprobar que se conservan.
- Comprueba en 1366×768 y móvil que el editor siga siendo cómodo con la guía cerrada y que el panel desplegado permita leer objetivos y cartas.
