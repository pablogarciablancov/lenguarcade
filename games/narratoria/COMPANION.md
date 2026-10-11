# Plumín: mascota y hogar evolutivo de Narratoria

Plumín usa 80 fotogramas WebP independientes de 256×256, limpiados para conservar la silueta principal y ajustados a una línea de apoyo común. Una imagen completa sustituye a la anterior en cada paso; no se desplaza una tira de sprites ni se funden dos poses distintas. Así no aparecen restos de dibujos vecinos ni el efecto de encogerse. Tiene secuencias tranquilas, de aleteo, saludo, pensamiento y celebración. En reposo permanece quieto; solo se mueve al escribir, saludar o completar una acción.

Los accesorios son capas vectoriales ancladas al movimiento de la cabeza y el cuerpo. La capa se dibuja en profundidad, detrás del búho, y su cuello por delante. Gorro, corona, gafas y trajes conservan una escala legible, además del sistema existente de skins y jaulas.

La guía narrativa permanece plegable y Plumín aparece una sola vez, grande y siempre visible en el lateral. Cada diez palabras nuevas por página se gana una plumilla. Los registros por historia y fase guardan el máximo de palabras alcanzado, de modo que borrar, volver a escribir o reabrir una historia antigua no repite premios. Las plumillas amplían el nido y permiten comprar muebles; los tinteros siguen pagando accesorios y jaulas. El vínculo con Plumín crece con las palabras nuevas acumuladas. Casa, muebles, saldo y vínculo se guardan en el estado de Narratoria.

La progresión toma como punto de partida la idea de acompañar la escritura de [Little Writer Desktop Companion](https://store.steampowered.com/app/4672770/Little_Writer_Desktop_Companion/), adaptada aquí al manuscrito por fases de Narratoria y a una economía propia para el hogar de Plumín.

## Preparación de poses

Para regenerar los fotogramas a partir de las 80 poses fuente, instala Pillow, NumPy y SciPy y ejecuta:

- `python -m pip install pillow numpy scipy`
- `python games/narratoria/prepare-plumin-poses.py`

El proceso conserva el componente conectado más grande de cada dibujo, elimina fragmentos separados, normaliza el tamaño y alinea los pies a la misma base. Escribe un manifiesto con dimensiones, caja visible y hashes. El navegador carga solo los WebP resultantes.

## Validación

- `node games/narratoria/check-companion.mjs` comprueba los 80 WebP, transparencia, tamaño común, manifiesto, movimientos, accesorios, inventario y progresión.
- `node scripts/check-syntax.mjs` valida el JavaScript.
- En Narratoria, prueba reposo, escritura, saludo, celebración y cambio de fase; compra un mueble, amplía la casa, recarga y comprueba que el hogar y el saldo permanecen.
- Todos los cambios pertenecen a `games/narratoria/`.
