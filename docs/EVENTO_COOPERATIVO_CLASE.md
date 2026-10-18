# Evento cooperativo de clase · El Devorapalabras

**Estado:** diseño aprobado para preparar la implementación. **No está implementado ni publicado.**

**Alcance inicial:** un evento para LenguArcade, clase de aproximadamente 25–30 alumnos de 2.º ESO, 12–15 minutos, integrado en **Talleres** y en la infraestructura de Supabase. No debe convertirse en una misión o sistema de puntuación independiente.

## 0. Dependencia previa: consolidación de Talleres

La consolidación ya existe en `main`: PR #118 unificó objetivo y taller; PR #164 incorporó `workshop_key`, «Reabrir y continuar», «Nueva edición» y «Eliminar del historial», con intervalos y premios idempotentes.

Antes de empezar la implementación del evento:

1. Comprobar que el HTML actualizado del panel profesor está realmente publicado en el despliegue estable de Apps Script. La fusión GitHub NO publica Apps Script.
2. Probar en una clase de prueba: abrir taller → completarlo parcialmente → cerrar → reabrir → conservar XP y resultados → cerrar sin duplicar premio.
3. Probar «Nueva edición»: debe empezar una actividad independiente sin modificar la anterior.
4. Probar «Eliminar del historial»: no borra partidas, XP ni puntos concedidos y no reconstruye automáticamente el taller eliminado.
5. Comprobar que un taller compartido entre 2.º C y 2.º D mantiene estados, participantes y resultados aislados.
6. Conservar las seis reconstrucciones históricas provisionales sin concederles premios automáticos. No ejecutar limpiezas destructivas de datos reales.

No reescribir lo ya resuelto ni migrar datos antiguos sin necesidad. Separar estrictamente **cerrado/abierto** de **objetivo conseguido/no conseguido**.

## 1. Fantasía jugable

**Título provisional:** «El Devorapalabras: la defensa del Gran Archivo».

La criatura del olvido está borrando palabras del Gran Archivo. Toda la clase lucha contra un único jefe desde sus Chromebooks; el profesor proyecta la batalla en la pizarra. Cada alumno elige entre varios juegos habilitados y sus avances confirmados alimentan un ataque colectivo. No hay clasificación individual: el resultado es de la clase.

Estética: criatura gigantesca hecha de tinta y papel desgarrado, biblioteca en peligro, barra de vida integrada en el escenario, impactos y cambios de fase. Aspecto de videojuego, sin tablas de oficina ni formularios como pantalla central.

## 2. Flujo de la sesión

**Profesor, desde Talleres:**
- Elegir clase y una preparación de taller o abrir una preparación preconfigurada de «Evento cooperativo».
- Seleccionar juegos compatibles (MVP propuesto: Battlegrafía, Forja y Lexitrama), duración 12 o 15 minutos y dificultad «Normal» o «Épica».
- Abrir los juegos mediante el flujo existente de `workshop_sessions`; crear una única instancia de evento vinculada a esa ejecución lógica, nunca una misión duplicada.
- Pulsar «Iniciar batalla» y abrir «Proyectar batalla». El panel permite Pausar, Reanudar y Finalizar. Cerrar el taller no debe borrar resultados.

**Alumno:**
- Entra en el LenguArcade habitual y ve un indicador discreto «Evento de clase en curso».
- Juega a cualquiera de los juegos habilitados. No necesita sala ni código y no debe perder la partida que tenía.
- Su actividad válida, después de guardarse en el backend, produce daño visual en el jefe. Ve la vida del jefe y la contribución colectiva, sin interrumpir el juego ni generar scroll.

**Pantalla proyectada:**
- Jefe animado grande, salud restante, reloj y tres fases visuales (100–70 %, 70–35 %, 35–0 %).
- Avisos breves de «Golpe de ortografía», «Palabra forjada», «Racha de equipo» y desenlace.
- Sin nombres, perfiles ni resultados individuales de alumnos en una pantalla pública.

## 3. Mecánica y equidad

La primera versión reutiliza `game_events` y las confirmaciones reales de `save-progress`, sin exigir modificar los motores de los tres juegos. No aceptar un número de daño enviado directamente por el navegador.

**Daño MVP propuesto:**
- Un evento guardado con progreso positivo y juego habilitado puede generar una unidad de energía de equipo.
- Límite inicial: una unidad por alumno cada 30 segundos, independientemente del juego. Así no gana siempre el juego que genera más XP o más guardados.
- Cada evento se contabiliza solo una vez mediante su ID persistido; se excluyen ajustes del profesor, intervalos cerrados, actividades anteriores al inicio y juegos no seleccionados.
- Si en una ventana de 90 segundos contribuyen los tres juegos diferentes, se activa un combo compartido de 4 unidades (máximo una vez por ventana). El combo se calcula en servidor.
- Salud orientativa del jefe: **8 unidades por participante previsto** (por ejemplo, 224 para 28 alumnos); el profesor puede elegir dificultad. La fórmula se ajustará después de una prueba con tráfico representativo.
- No hay daño recibido por fallar respuestas ni castigos a quienes trabajen a diferente velocidad. Los alumnos más lentos deben poder contribuir de forma apreciable.
- No se suman premios nuevos de Flotas automáticamente: el +5 del taller conserva su criterio e identificador original. Una recompensa estética colectiva puede estudiarse en una segunda iteración.

**Validación pedagógica:** los golpes se basan en actividad confirmada, no en pulsar botones arbitrarios. Una segunda versión puede distinguir explícitamente aciertos, palabras válidas o victorias cuando esos eventos estén normalizados y verificados por los motores de cada juego. El MVP no debe fingir disponer de esos datos.

## 4. Integración técnica mínima

La **identidad del taller** sigue siendo `classroom_id + workshop_key` y se conserva la identidad de cada apertura en `workshop_runs`. El evento es una modalidad vinculada a esa entidad; no crear otro registro en `mission_definitions`.

Diseño aditivo orientativo (nombres a confirmar durante implementación):
- `class_event_runs`: UUID, `organization_id`, `classroom_id`, `workshop_key`, `workshop_run_id`, configuración (juegos, duración, dificultad), estado (draft/active/paused/finished), HP inicial/actual, tiempos y docente creador.
- `class_event_contributions`: evento, ID de `game_events` usado, perfil, juego, daño, instante; restricción única `(event_id,game_event_id)` para idempotencia.
- Procesador servidor invocado tras guardar progreso correctamente; sumar aportaciones y actualizar salud de forma atómica (evitar condiciones de carrera entre 30 alumnos).
- Autorizar en servidor al profesor de esa clase para iniciar/controlar; únicamente alumnos con matrícula activa en esa clase pueden contribuir mientras el taller y el evento permitan jugar.
- RLS o acceso de servicio restringido: jamás aceptar `classroom_id`, `profile_id`, puntos o cambios de HP arbitrarios del cliente como autorización suficiente.
- La emisión de efectos visuales puede hacerse por actualizaciones periódicas moderadas o Realtime; si falla el canal visual, la actividad y el guardado siguen funcionando.
- Fallos del evento **nunca** deben impedir `save-progress` ni alterar guardados existentes.
- Eliminar del historial oculta/finaliza el evento correspondiente sin borrar `game_events`, progreso ni premios pasados. «Nueva edición» crea evento distinto; «Reabrir y continuar» debe recuperar el mismo estado si se pausó.

## 5. Implementación por entregas

**Entrega A — seguridad e infraestructura:** ejecutar lista previa de Talleres; migración aditiva y lógica de contribuciones; pruebas unitarias de clase, periodo, unicidad y concurrencia. Sin cambios visuales grandes.

**Entrega B — experiencia mínima completa:** controles desde Talleres, pantalla proyectable de batalla e indicador pequeño del alumno. Integrar los tres juegos a través de eventos de progreso existentes, sin editar sus motores si no es necesario.

**Entrega C — acabado jugable:** sprites e ilustración original del jefe, fases, impactos, combos, música/sonido opcionales, movimiento reducido y feedback del resultado.

**Entrega D — prueba piloto:** sesión simulada con al menos 30 alumnos/eventos concurrentes y después clase real; calibrar salud y ritmo con datos agregados, sin exposición pública de identidades.

## 6. Criterios de aceptación

1. Se crea **un solo taller** y **una sola batalla** por ejecución lógica; no aparece otra misión de XP duplicada.
2. 30 alumnos pueden contribuir en paralelo sin perder guardados ni duplicar daño.
3. Abrir/cerrar/reabrir no suma actividad del intervalo cerrado, conserva avances y mantiene premios idempotentes.
4. Cambiar de clase no mezcla resultados ni permite a alumnos ajenos atacar al jefe.
5. Jugar en juegos seleccionados de distintos ritmos ofrece contribuciones comparables.
6. Pausar detiene daño y reloj; terminar bloquea nuevas contribuciones, sin afectar XP legítima.
7. El profesor ve el estado completo; la pantalla proyectada no revela datos personales.
8. En 1366×768, 1440×900 y 1920×1080 la batalla ocupa la altura disponible sin scroll general; el indicador de alumno no desplaza el juego.
9. Las pruebas de regresión existentes de Talleres, Misiones, guardado, cierre de gracia y Flotas siguen pasando.
10. La publicación de GitHub, las funciones/migraciones de Supabase y Apps Script se verifican de manera separada. Ninguna fusión se considera publicación completa por sí sola.

## 7. Fuera del MVP

Partidas PVP, chat de alumnos, tablas de clasificación individual, nuevas monedas, avatares, recompensas permanentes, nuevos eventos por juego, modificación profunda de Battlegrafía/Forja/Lexitrama y refactorizaciones ajenas a este evento.

**Siguiente paso técnico:** validar el Apps Script publicado y, solo después, preparar una PR de implementación que comience por Entrega A; no implementar a ciegas una nueva capa de misiones.
