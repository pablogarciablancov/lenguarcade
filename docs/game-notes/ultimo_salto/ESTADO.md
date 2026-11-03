# Último Salto · 29 de octubre de 2026

Rama `game/ultimo_salto/templo`. Primera campaña jugable aislada en `games/ultimo_salto/`, sin cambios de núcleo ni publicación.

Decisión visual: escenario tridimensional real y explorador de sprites pixel art animados. Motor local Three.js 0.170.0 con licencia conservada. Portada original preparada.

Comprobado con Node: 110 palabras, nueve reglas, pistas discriminantes, 5.000 tableros reproducibles con ruta válida, clasificación de sus casillas coherente, tienda y economía sin recompensas repetidas. Navegador real con WebGL: recorrido, caída, tienda, habilidades, restauración, regla oculta, cuatro tamaños, edición autónoma y ACK de cierre comprobados. Final con tres sellos y reglas sucesivas.

Prueba manual: abrir la edición autónoma; completar el primer templo; provocar caída; comprobar ojo, runa y botas; pausar; recargar a mitad de recorrido; comprar objetos; repetir un nivel ya perfecto y comprobar que no da XP adicional. Revisar palabras y controles a 1366×768, 1440×900, 1920×1080. En modo táctil usar los nombres de las piedras al pie.

Pendiente: alta coordinada en catálogo y host/XP central conforme al manifiesto, validación con el /exec real, pulido artístico adicional y prueba de rendimiento en ordenador escolar real. El resultado preparado no se ha fusionado ni desplegado.


## Revisión visual 2

Rama `game/ultimo_salto/visual-temple`, basada en la entrega jugable. Se sustituyen exclusivamente presentación 3D y sprites: atlas original, caliza, arcos de dovelas, columnas estriadas, islotes de roca, hiedra, olivos, cascadas, niebla, portal y luces. Palabras grabadas sobre la piedra; pies y sombra del personaje anclados al suelo. Salto, aterrizaje y derrumbe con efectos coordinados. Geometría estática agrupada y sombras reutilizadas; render suspendido durante pausa. Se mantienen versión de guardado y progreso v1.

Pruebas visuales en `games/ultimo_salto/visual-qa.cjs`. Validación de regresión en `browser-test.cjs` y `test.mjs`. Sigue pendiente catálogo, XP central y prueba en equipo escolar; no se fusiona ni despliega.
