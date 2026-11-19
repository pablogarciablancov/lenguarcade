# La Última Palabra

Juego autocontenido de defensa automática. Abrir `index.html` desde un servidor local (por ejemplo `python3 -m http.server 8000` en la raíz del repositorio) y visitar `/games/la_ultima_palabra/`.

- Tres caminos y cuatro oleadas. Cuartel, torre y scriptorium reclutan defensores automáticamente.
- Los aciertos dan tinta para construir, mejorar edificios y reparar. La tinta no es XP.
- Los retos incluyen ortografía, morfología y verbos; las preguntas aparecen en secuencia mezclada.
- El resultado y los checkpoints se comunican al runner cuando se abre como juego integrado; en laboratorio se guarda el récord local.
- El alta en el catálogo y la economía de XP están pendientes de la rama `integration/*` según `lenguarcade.integration.json`.

## Comprobación

`node games/la_ultima_palabra/test.mjs` y jugar las cuatro oleadas en el navegador, también a 1366×768.
