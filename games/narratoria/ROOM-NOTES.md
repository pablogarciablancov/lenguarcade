# Habitación personalizable — 12/10/2026

Habitación ampliada visible durante la escritura. «Decorar habitación» abre un escenario grande con objetos vectoriales, cuadros, biblioteca, sillón, reloj, planta, lámpara y globo; paredes y suelos intercambiables. Ventana, biblioteca y alfombra iniciales gratuitas. Compras con plumillas; conserva tienda y accesorios anteriores.

`owl.room` conserva posesiones, colocación y tamaño en porcentajes. Normalización compatible con partidas anteriores; las historias antiguas no sustituyen una decoración actual editada. Arrastre con ratón/táctil, selección y movimiento con flechas, ajuste de tamaño, guardar y volver a colocar sin volver a pagar. No se modifica el núcleo ni el backend.

## Validación realizada

- JavaScript y comprobación de sintaxis del repositorio.
- Chromium: carga sin errores, arrastre real, teclado, cambio de tamaño, retirar y volver a colocar.
- Comprar objeto dos veces no vuelve a cobrar; cambiar pared/suelo descuenta su precio una sola vez.
- Recarga conserva decoración y texto de historia; migración de mobiliario anterior.
- 1366×768, 1440×900 y 1920×1080: escritura y diálogo sin scroll general; editor y navegación visibles. Catálogo con scroll interno.

## Prueba manual

1. Empezar o continuar una historia; escribir y comprobar las animaciones de Plumín.
2. Abrir «Decorar habitación», arrastrar la biblioteca y ajustar su tamaño.
3. Completar fases para ganar plumillas; comprar un cuadro, pared o suelo.
4. Cerrar decoración, continuar escribiendo y recargar: comprobar historia y habitación.
5. En la tienda, equipar un accesorio anterior y comprobarlo en la escritura.
