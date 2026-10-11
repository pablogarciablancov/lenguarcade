# Plumín: mascota animada de Narratoria

Plumín usa 80 poses PNG individuales con transparencia: cuatro secuencias de 20 fotogramas para pensar, saludar, aletear y celebrar. Cada secuencia combina las poses clave ya existentes con dibujos intermedios aislados en archivos independientes de 256 × 256 px. El navegador precarga las imágenes y realiza un fundido corto entre dibujos completos; nunca desplaza una hoja compartida ni recorta celdas vecinas. En reposo permanece tranquilo en una pose fija. Saludar inicia una reacción breve, escribir activa el aleteo, evaluar una hoja vacía o incompleta provoca una expresión pensativa y completar una fase activa la celebración.

Plumín permanece grande y visible en el lateral durante la escritura, incluso con la guía cerrada. El desplegable reúne misión, objetivos, las seis cartas y el inventario; el lateral conserva también la jaula, el diálogo y el progreso del manuscrito.

Los accesorios de cabeza, cara y cuerpo se dibujan con piezas vectoriales a escala y se anclan sobre el búho; también aparecen aplicados en las miniaturas de la tienda. Se conservan los identificadores, precios, compras, equipamiento, skins, traje, jaulas y persistencia de los datos existentes.

## Validación

- Ejecuta `node games/narratoria/check-companion.mjs` para comprobar los 80 PNG independientes, sus dimensiones y transparencia, las secuencias de 20 poses, los fundidos entre fotogramas, los accesorios, la visibilidad lateral y los identificadores de la tienda.
- Ejecuta `node scripts/check-syntax.mjs` para validar los bloques de código del juego.
- Prueba en el juego: inicia una historia y comprueba que Plumín siga visible al cerrar la guía. Escribe y pausa para ver el aleteo y la vuelta a reposo; saluda para ver la secuencia de voz; evalúa una fase vacía o incompleta para ver la reacción pensativa.
- En la tienda, compra el gorro, la corona, las gafas o una prenda y comprueba que cada pieza cubre una zona legible del búho, tanto en el escaparate como equipada. Comprueba que las compras y el equipamiento se conservan al salir y reanudar la partida.
- Comprueba en 1366×768 y móvil que el editor siga siendo cómodo con la guía cerrada y que misión y objetivos se desplieguen dentro del panel.
