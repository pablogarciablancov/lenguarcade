# Plumín: mascota animada de Narratoria

Plumín usa una hoja de sprites 4×4 dibujada a lápiz: una fila para parpadeo, otra para aletear, otra para hablar y otra para pequeños saltos y desplazamientos. Aletea cuando el alumno escribe; cuando hay pausa alterna gestos breves y vuelve a parpadear.

La guía lateral de escritura pasa a un desplegable. Dentro reúne la misión, los objetivos de la fase, las seis cartas, el inventario y el hábitat de Plumín. Su avatar sigue visible en el desplegable cerrado y junto al editor.

La Tienda del Gremio conserva sus ayudas narrativas e incorpora skins, accesorios, un traje y tres jaulas. Las compras y el equipamiento se guardan en `state.owl`, tanto en el guardado local como en los datos completos de la partida enviados a LenguArcade. Las partidas antiguas reciben el aspecto original y el nido de roble como valores iniciales.

## Validación

- Ejecuta `node games/narratoria/check-companion.mjs` para comprobar la hoja de sprites, sus rutas, las animaciones, los controles y los identificadores de la tienda.
- Ejecuta `node scripts/check-syntax.mjs` para validar los bloques de código del juego.
- Prueba en el juego: inicia una historia, escribe para ver el aleteo, espera para ver el parpadeo y los gestos, abre la guía lateral y saluda a Plumín.
- En la tienda, compra una skin, un accesorio y una jaula; equipa y cambia los elementos, sal del juego y reanúdalo para comprobar que se conservan.
- Comprueba en 1366×768 y móvil que el editor siga siendo cómodo con la guía cerrada y que el panel desplegado permita leer objetivos y cartas.
