# La Última Palabra

Juego autocontenido de defensa automática. Abrir `index.html` desde un servidor local (por ejemplo `python3 -m http.server 8000` en la raíz del repositorio) y visitar `/games/la_ultima_palabra/`.

- Campo abierto y cuatro oleadas. Elige un edificio y pulsa en el terreno para colocarlo; cuartel, atalaya y scriptorium reclutan defensores automáticamente, que persiguen a los enemigos por el mapa.
- Los aciertos dan tinta para construir, mejorar edificios y reparar. La tinta no es XP.
- Los retos incluyen ortografía, morfología y verbos; las preguntas aparecen en secuencia mezclada.
- El árbol de mejoras tiene tres ramas y doce nodos. Los sellos ganados al finalizar cada intento se guardan para futuras partidas y no se convierten en XP.
- El resultado y los checkpoints se comunican al runner cuando se abre como juego integrado; en laboratorio se guardan el récord y los sellos localmente.
- El alta en el catálogo y la economía de XP están pendientes de la rama `integration/*` según `lenguarcade.integration.json`.

## Comprobación

`node games/la_ultima_palabra/test.mjs` y jugar las cuatro oleadas en el navegador, también a 1366×768.
