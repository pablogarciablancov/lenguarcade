# Misiones por mapa y 24 estrellas permanentes

Ámbito: únicamente Guardianes de la Biblioteca y estas notas. No se modifica el núcleo, las preguntas, las recompensas, Supabase ni Apps Script.

Cada mapa tiene tres objetivos independientes, siempre condicionados a ganar las diez oleadas:

1. Biblioteca a salvo: ganar.
2. Defensa sólida: ganar con al menos 15 vidas.
3. Cumplir la misión propia del escenario.

Las estrellas se conservan por objetivo entre partidas: se puede obtener la segunda en una defensa y la tercera en otra. Una repetición peor o una derrota no restan estrellas. No se inventan estrellas de partidas antiguas sin estos registros ni se añaden premios de XP o moneda por obtenerlas. Los ocho mapas siguen disponibles libremente.

| Mapa | Misión de la tercera estrella |
| --- | --- |
| Bosque de Pergaminos | El primer catálogo: 12 aciertos |
| Ciudad del Scriptorium | Las tres secciones: 4 aciertos de cada familia |
| Campos de Trigo y Tinta | La cosecha de palabras: al menos 20 respuestas y 75 % de precisión |
| Acantilados del Archivo | Los faros verbales: 8 aciertos de Verbos y dos torres de nivel 2 o superior al terminar |
| Bosque de las Dos Sendas | Dos sendas, una biblioteca: 3 derrotas por ruta y 12 aciertos |
| Marisma de los Tres Cauces | Ningún cauce sin defensa: 2 derrotas por ruta y 18 aciertos |
| Cumbres del Archivo Helado | Romper la escolta: derrotar 2 Protectores y conseguir 8 aciertos de Léxico |
| Caldera de las Encrucijadas | Dominar las encrucijadas: una derrota en cada combinación de ruta, 25 respuestas y 75 % de precisión |

Se utiliza la precisión exacta para decidir el objetivo; no un porcentaje redondeado al entero. Nunca se exige responder deprisa. Las muertes se registran una sola vez, con la ruta real elegida por el monstruo; llegar a la biblioteca no cuenta como una derrota.

## Interfaz y guardado

- Estrellas visibles en las ocho tarjetas de mapa, más leyenda y botón para consultar todas las misiones antes de jugar.
- Libro de campaña con progreso total sobre 24 estrellas, accesible desde el inicio.
- Botón «Misión» durante la defensa, con estrellas conservadas y progreso de cada condición. El panel pausa, cierra con Escape y devuelve el foco.
- Resultado con tres estrellas grandes de esta partida, estrellas nuevas, requisitos pendientes y colección permanente del mapa, diferenciadas explícitamente.
- Botones para repetir el mapa conservando estrellas o elegir otro escenario. Repetir una defensa terminada empieza desde la primera oleada; no retoma solo la última.
- Estrellas dibujadas con CSS, sin imágenes adicionales ni hojas de sprites; descripción accesible de la cantidad obtenida.

El checkpoint se amplía con `mapCampaign` y `missionRun`. El primero conserva las estrellas y victorias por mapa; el segundo conserva las muertes por ruta, Protectores derrotados y la marca de defensa terminada. La limpieza de una defensa conserva campaña, guardianes reclutados y refuerzo de Lengua. Se aceptan guardados antiguos sin estos campos.

El adaptador de `saveCheckpoint` devuelve también los campos completos de las extensiones existentes. Esto permite que los mensajes reales CHECKPOINT y RESULT incluyan campaña, misiones, guardianes y refuerzo, además del guardado local y bootstrap. Las estrellas se calculan antes del RESULT de victoria. Un alumno incrustado sin guardado propio no hereda ni estrellas ni objetivos en curso del caché local de otro alumno.

## Verificación

- `node games/tower_defense/check-campaign.cjs`: ocho misiones, 24 estrellas, condiciones de victoria, precisión sin redondeo, conservación por objetivo entre partidas, derrotas, restauración, datos inválidos, rutas, Protectores y defensas terminadas.
- Comprobaciones existentes de encuentros/refuerzo, especializaciones, guardianes, mapas/preguntas, juego y sintaxis; `git diff --check`.
- Navegador a 1366×768 y 390×844: libro de campaña visible sobre el inicio, ocho tarjetas, objetivos, pausa/foco/Escape, resultados de victoria y derrota, repetición completa, cambio de mapa y conservación de estrellas.
- Comprobación con muertes reales, llamadas duplicadas a morir/finalizar, recarga de objetivos a mitad de defensa y estrellas conseguidas en partidas distintas.
- Iframe con caché previo de otro alumno: se inicia limpio. El RESULT real de una victoria contiene las estrellas recién obtenidas, misión terminada, guardianes y refuerzo. No hay errores JavaScript.

No se ha jugado de principio a fin una campaña humana completa: los resultados y estados finales se prueban con escenarios controlados, además de las reglas y eventos reales. Los umbrales podrán ajustarse tras observar partidas completas con alumnos.
