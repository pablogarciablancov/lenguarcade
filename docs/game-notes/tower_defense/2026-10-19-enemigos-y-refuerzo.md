# Enemigos tácticos y repaso adaptativo

Cambios limitados al juego y sus notas; no se modifica el núcleo, Supabase ni Apps Script.

## Combate y bestiario

- Corredor de Pergamino: aparece desde la oleada 3. Cada bifurcación real activa 2,5 segundos de movimiento ×1,7. La ralentización, las colas y el bloqueo del guardián siguen aplicándose. En los cuatro mapas sin ramificaciones mantiene su velocidad normal. En Caldera puede acelerar en ambas bifurcaciones, una vez en cada una.
- Protector del Códice: desde la oleada 5, con dos capas de escudo. Mientras vive, otros enemigos expuestos a 46 unidades reciben un 35 % menos de daño. El aura no se acumula, no le protege de sí mismo y desaparece inmediatamente al morir. No afecta a la resolución de preguntas ni crea escudos nuevos. Puede proteger a otro Protector expuesto.
- Devoratinta: desde la oleada 6. Al alcanzar la biblioteca quita la vida normal y roba hasta 18 de tinta, una sola vez y sin saldo negativo.

Los nuevos enemigos sustituyen a enemigos comunes: se conserva el total de enemigos de cada oleada, sus minijefes y el jefe final al final de la cola. La vista previa utiliza los datos reales, incluyendo retrato y consejo de cada amenaza. El bestiario original se conserva; se añaden tres fichas con señales y estrategias, accesibles también desde el campo. El bestiario pausa, admite Escape y devuelve el foco al botón de apertura.

Los sprites se generaron con la herramienta integrada image_gen, uno por personaje y con transparencia. Están normalizados a 96×96, en archivos independientes y con los pies en una base fija; no se recortan hojas de sprites al jugar. El movimiento visual utiliza oscilación suave, dirección, impacto y señales de habilidad. Rutas y prompts exactos: `games/tower_defense/assets/encounters/prompts.json`. El renderizador conserva un sprite existente como respaldo si una imagen tarda en cargar.

## Refuerzo de Lengua

- Cada fallo aceptado programa la misma habilidad para después de cuatro respuestas más, con otro enunciado y dentro de la dificultad del mapa. El tiempo, los enemigos generados y los clics duplicados no adelantan el repaso.
- Se comprueban la regla o el contraste, el nivel y los ejemplos recientes. No se repite inmediatamente el enunciado fallado.
- Un primer repaso correcto programa el segundo tras siete respuestas más. Dos repasos correctos separados retiran esa dificultad de la cola. Un nuevo fallo reinicia ese refuerzo.
- Como máximo se ofrece un refuerzo cada dos respuestas. Las demás preguntas mantienen su reparto actual. No se añaden premios, penalizaciones ni XP por separado.
- La ventana indica «Refuerzo · La misma regla, otro ejemplo». Todos los escudos siguen dependiendo de Lengua.
- El checkpoint incluye `adaptiveReview`: turno de respuestas, dificultades pendientes, ejemplos recientes y refuerzos completados. Se conserva al continuar, reiniciar o cambiar de mapa. El inicio incrustado toma el guardado del alumno actual; no reutiliza refuerzos locales de otro alumno.

Se añaden 22 preguntas redactadas (11 de ortografía, 8 de verbos y 3 de léxico), hasta 311 en total. Todas las preguntas de ambos niveles activos tienen al menos otro ejemplo de su habilidad: también hay comprobaciones automáticas para esta cobertura. No se generan frases ni distractores al azar.

## Verificación

- `node games/tower_defense/check-encounters.cjs`: cobertura de ejemplos, espera por respuestas, segundo repaso, reinicio tras fallo, restauración, datos inválidos, nodos de bifurcación, aura y límite de robo, sustituciones progresivas sin alterar el total de las oleadas.
- Comprobaciones existentes de estrategia, guardianes, expansión, juego y sintaxis; `git diff --check`.
- Navegador: movimiento real, dos capas y tipos nuevos, diez colas de aparición, reducción de daño sin acumulación y retirada al morir, inmunidad con escudo, robo único, guardado de refuerzo y secuencia de respuestas reales con clic duplicado.
- Paneles y sprites revisados a 1366×768 y 390×844, incluyendo vista previa, bestiario con desplazamiento y ventana de refuerzo. Comprobada la continuidad del bucle de renderizado y la ausencia de errores JavaScript. También se prueban imágenes nuevas bloqueadas, aislamiento entre alumnos en iframe, actualización de su bootstrap y restauración del checkpoint.

Prueba manual: elegir un mapa con ramas, consultar una oleada con Corredor, Protector o Devoratinta y abrir el bestiario. Fallar una regla, responder cuatro preguntas más y abrir un monstruo de esa familia; debe aparecer un enunciado distinto de refuerzo. Acertarlo, continuar y volver a entrar para comprobar la persistencia. Queda por valorar el equilibrio de las nuevas oleadas con alumnos en campañas completas.
