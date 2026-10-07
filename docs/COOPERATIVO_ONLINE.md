# Cooperativo online en LenguArcade

## Estado y alcance

Conjuga y apuesta incorpora duelo alumno–alumno y profesor–alumno desde dispositivos separados. El profesor accede desde el modo jugador y el catálogo común; el runner específico del panel profesor ha sido sustituido por este acceso. Es competición por turnos. La infraestructura de sala, identidad, presencia, versiones, recuperación y cierre sirve de base para nuevos adaptadores, pero cada juego necesita su motor y reglas de validación en el servidor. Ninguno de los modos cooperativos propuestos aquí está implementado aún.

## Candidatos revisados

La dificultad es una estimación a partir del código y las mecánicas actuales; no representa una fecha ni un compromiso de entrega.

| Juego | Cooperativo propuesto | Dificultad | Qué requiere |
|---|---|---|---|
| Sopa de Tinta | Dos alumnos completan el mismo café; cada concepto encontrado queda marcado para ambos. | Media; primer candidato | Generación común por semilla, validar trazados en servidor, reservar cada hallazgo una sola vez y registrar quién lo resolvió. `generator.js` ya separa generación y comprobación. |
| Battlegrafía | Dos héroes contra un monstruo o jefe; alternan retos, curaciones y ataques. | Media–alta | Adaptador del combate actual: vida del enemigo compartida, turnos, ayudas y banco de preguntas en servidor. Mantener la aventura individual. |
| Versópolis | Construir juntos una estrofa o poema y vencer al rival del mapa. | Media–alta | Mazo y contrato comunes; alternar colocaciones y confirmar la estrofa. Guardar el poema con ambos autores en sus antologías, sin sobrescribir colecciones. |
| Batalla verbal | Dos alumnos aliados contra enemigos, o dos equipos en competición online. | Media–alta | El modo actual maneja 2–4 perfiles en un ordenador; necesita transporte entre dispositivos y un modo de alianza/enemigo. No confundir los jugadores actuales con cooperativo online existente. |
| Scrabble | Tablero común con objetivo de puntuación del equipo. | Media | Turnos, bolsa compartida, validación de colocaciones y diccionario en servidor. |
| Lexitrama | Resolver una expedición común y derrotar un jefe con palabras entre ambos. | Media–alta | El motor dispone de PRNG guardado y semilla de clase, pero no sincronización en directo. Serializar trazados, gravedad y cascadas; una selección pendiente debe invalidarse si cambia el tablero. |
| FORJA | Una expedición con bolsa, cartas y monedas comunes. | Media–alta | Alternar palabras; decisiones de tienda y gasto confirmadas por turno; sin duplicar monedas o compras. |
| Word Play | Superar objetivos juntos con cartas y fichas compartidas. | Media–alta | Estado común de la ronda y economía; validar cada palabra y activación. |
| Entre Líneas | Pareja de detectives que reúne evidencias y presenta una hipótesis conjunta. | Media–alta | Expediente compartido, atribución de evidencias y entrega conjunta. El juego se distribuye como payload comprimido; recuperar su fuente editable antes del adaptador. |
| Lexaria | Dos escuadras contra oleadas o un jefe de Academia. | Alta | Diseño de combate conjunto, simular resultado en servidor y contribución individual. La arena asíncrona actual no es una partida compartida simultánea. |
| Narratoria | Relato escrito por turnos con decisiones y objetivos comunes. | Media–alta | Documento y fase compartidos, autoría y control de edición; revisiones y entrega de la pareja. |
| Rayuela | Escribir juntos una aventura con ramas y finales. | Alta | Control de edición por nodo o bloqueo temporal; historial y dos autores. Más próximo a edición colaborativa que a combate cooperativo. |
| Guardianes de la Biblioteca | Uno construye torres y otro resuelve escudos; intercambian roles entre oleadas. | Alta | Economía y enemigos compartidos; el motor actual avanza en `requestAnimationFrame`. Necesita simulación común y sincronización más frecuente que el sondeo del duelo. |
| Tierras de Tinta | Dos héroes en una expedición de acción. | Muy alta | Posiciones, colisiones, ataques, enemigos y latencia: transporte de tiempo real, reconciliación y simulación autoritativa. No trasladar sin más el sondeo de Conjuga. |
| Maniacgrafía | Pareja que limpia una oleada común de palabras. | Alta | Reloj, aparición y captura comunes; arbitrar capturas simultáneas y ajustar la rapidez al transporte. |
| Conjuga y apuesta | Ambos contra una banca, con fichas del equipo y retos alternos. | Media | Reutilizar el duelo pero añadir objetivo y resultado de equipo, elección de ayuda y evaluación individual. El modo publicado sigue siendo un duelo. |

## Orden recomendado

1. **Sopa de Tinta**: permite cooperación simultánea visible, sin movimiento físico ni latencia de acción. MVP de dos jugadores, una cuadrícula fija y una misión compartida.
2. **Battlegrafía**: un combate cooperativo aislado contra un jefe, por turnos; no sincronizar toda la campaña al principio.
3. **Versópolis**: un poema conjunto conservado por ambos, con turnos de edición y autoría visible.

Batalla verbal es una alternativa a la segunda fase si se prefiere profundizar en equipos y estrategia de verbos.

## Reglas comunes para nuevas integraciones

- Salas limitadas a la clase y organización; profesor opcional como jugador de práctica. Autorización comprobada en servidor, sin confiar en roles enviados por el juego.
- Guardar estado una sola vez por acción con versión y `requestId`. Reconectar a la misma sala y terminar de forma segura si alguien abandona.
- XP individual por respuestas o aportaciones verificadas. Los hallazgos duplicados no suman dos veces; un alumno inactivo no recibe todos los puntos del equipo.
- Mantener guardados individuales y usar un resultado de sala idempotente. El profesor no entra en los rankings del alumnado.
- Un adaptador y endpoint por juego. La tabla `multiplayer_rooms` es un sobre compartido, no una API legible desde el navegador ni un motor universal.
- Aplicar aperturas y cierres del profesor, probar dos navegadores y publicar juntos juego, backend y host compatibles desde integración.
