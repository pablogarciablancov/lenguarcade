# Cuatro escenarios ramificados y preguntas de ESO

## Cambios

Se conservan los cuatro mapas originales y sus identificadores. Se añaden:

| Mapa | Rutas | Estrategia |
| --- | --- | --- |
| Bosque de las Dos Sendas | 2 | Defender flancos distintos antes de que se reúnan |
| Marisma de los Tres Cauces | 3 | Atender al atajo central, más corto |
| Cumbres del Archivo Helado | 3 | Cobertura repartida entre pasos de longitudes distintas |
| Caldera de las Encrucijadas | 4 combinaciones | Dos bifurcaciones sucesivas con reencuentro entre ellas |

Las rutas se reparten mediante una bolsa barajada para utilizar todas las alternativas sin un orden fijo. Cada enemigo tiene su distancia real recorrida y restante. Las torres priorizan la proximidad a la biblioteca; los enemigos solo forman cola en segmentos compartidos. No se frenan por tener otro enemigo cerca en una rama paralela. El guardián se puede colocar y recuperar desde un checkpoint en cualquier rama. Movimiento, geometría visible y proyección del guardián usan las mismas coordenadas.

Los nuevos fondos son pixel art generado; las carreteras se dibujan en el juego a partir de la geometría exacta. Biblioteca, puerta y peanas tienen alfa real. Se carga el fondo del escenario activo; el selector utiliza miniaturas menores, con los caminos visibles.

## Preguntas

El catálogo activo pasa a 289 preguntas: 110 de ortografía, 139 de verbos y 40 de léxico. Se mantienen categorías de evaluación, economía, logros, monedas, torres y checkpoint. Los datos históricos no cambian.

Se sustituyen las faltas fabricadas de c/z/s y las grafías obvias por:

- Tildes diacríticas y homófonos en contexto: tú/tu, sé/se, hecho/echo, haya/halla, porque/por qué/porqué, sino/si no, aun/aún.
- Interrogativas indirectas, hiatos, monosílabos sin tilde, adverbios en -mente y enclíticos.
- Puntuación con una intención explícita, evitando considerar incorrectas variantes normativas opcionales.
- Irregulares, haber impersonal, participios, imperativo, tiempos compuestos y análisis verbal con persona inequívoca.
- Significados contextualizados, precisión léxica, relaciones semánticas, metáfora y metonimia.

No se fabrican opciones al azar ni se completan con «Ninguna de las anteriores». Hay entre dos y cuatro opciones según la pregunta. La ventana de preguntas se centra en el viewport y permite desplazamiento interno si el texto lo requiere, para que las respuestas no se recorten en móvil. Los subtemas se alternan para que las conjugaciones no monopolicen el banco. Los dos mapas finales excluyen el nivel de repaso básico e incorporan los ítems avanzados. El bonificador de la torre especializada en tildes reconoce las nuevas etiquetas de acentuación.

## Pruebas

Desde la raíz:

```
node games/tower_defense/check-expansion.cjs
node games/tower_defense/check-guardians.cjs
node scripts/check-tower-defense.mjs
node scripts/check-syntax.mjs
```

Validado en Chromium: mapa original, selector de ocho mapas, uso de todas las alternativas, recorrido íntegro y llegada a la biblioteca, prioridad por distancia restante, cola en segmentos compartidos, colocación y recuperación del guardián en ramas secundarias, preguntas contextuales y ruptura de una sola capa por acierto. Revisados 1366×768, 1440×900, 1920×1080 y 390×844; sin desbordamiento del selector ni recursos ausentes.

Prueba manual recomendada: jugar una oleada en cada nuevo mapa; cubrir primero un flanco y observar enemigos por el otro. En la Caldera comprobar ambos cruces. Comparar preguntas del Bosque original con las de Cumbres. Salir al menú y continuar con el guardián colocado en una rama secundaria.

Ámbito: `games/tower_defense/` y esta nota. Sin cambios del núcleo ni migraciones; no requiere Apps Script.
