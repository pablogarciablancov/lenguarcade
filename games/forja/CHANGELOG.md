# FORJA · 8 de octubre de 2026

- Tienda: títulos de cartas de 23 px, efectos de 16 px y compra de 13 px; ampliados taller y menús de sustitución/colección.
- Arrastre desde la mano a la palabra, inserción en una posición ocupada, intercambio entre fichas colocadas y devolución a la mano.
- Se conserva el clic, teclado, tildes, comodines, propiedades de las fichas y formato de guardado. Arrastre desactivado durante reroll y puntuación.

## Pruebas

- `node games/forja/smoke-test.mjs`: economía, cartas, eventos, puntuación y guardado.
- `node games/forja/browser-test.mjs`: arrastre real, inserción, intercambio con tilde/comodín, devolución, cancelación fuera del destino y clic.
- Tienda a 1366×768, 1440×900, 1920×1080 y 1366×658; efectos de 16 px sin desbordamiento horizontal.
- Juego sin scroll general; checkpoint, restauración y salida en iframe LenguArcade.

Prueba manual: empezar una ronda, arrastrar letras desde la mano a la fila; soltar una ficha sobre otra ya colocada para intercambiarlas, o sobre la mano para retirarla.
