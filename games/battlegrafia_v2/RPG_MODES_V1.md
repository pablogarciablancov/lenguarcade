# Battlegrafía · Expediciones y Reinos de la Tinta (prototipo v1)

## Alcance
Se añaden **dos modos RPG jugables** a Battlegrafía Fantasy Arcade (games/battlegrafia_v2/), sin alterar los modos existentes ni el catálogo:
- **Expediciones:** 5 etapas con bifurcaciones, eventos, combates, descanso, recompensas y jefe final.
- **Reinos de la Tinta:** mapas de bosque y cripta de 10 × 7, movimiento por teclado o pulsación, NPC, cofres, enemigos persistentes y jefe.

Comparten un héroe (guerrero, mago o explorador), nivel, vida, energía, monedas, pociones e historial de aciertos por categoría. El combate es por turnos, con ataque, defensa, hechizo y poción. Defender no causa daño al rival; retirarse no permite saltar enemigos.

## Aislamiento y seguridad
- Módulos nuevos: rpg-modes-v1.js y rpg-modes-v1.css.
- En index.html solo se añade la carga del módulo; no se modifica el motor tradicional.
- No escribe bg_modeId, no modifica las ranuras battlegrafia_v2_save_slots_v1_*, no toca Supabase ni emite XP oficial.
- El progreso del prototipo se guarda **solo localmente**, por perfil verificado (clave propia). En modo de prueba independiente se mantiene en la sesión de la pestaña.
- En entorno embebido sin perfil verificado, no persiste datos para evitar mezclar alumnos.
- No añadir al catálogo ni publicar Apps Script por este cambio.

## Prueba automática
Desde la raíz del repositorio:

    node games/battlegrafia_v2/rpg-modes-v1.smoke.mjs

## Pruebas manuales recomendadas
1. Abrir Battlegrafía → NUEVOS MODOS RPG, elegir clase y acceder a los dos modos.
2. Abrir Partidas y verificar que aparecen dos tarjetas nuevas además de las cuatro originales.
3. En Expediciones, probar combates, cofre, descanso, defensa (sin daño), pociones, hechizos y jefe final.
4. Retirarse del combate y comprobar que no se salta la etapa ni se cobran recompensas.
5. En Reinos, probar WASD/flechas, NPC, cofres, cripta y accesibilidad del jefe.
6. Comprobar que un enemigo derrotado no se repite al regresar a su casilla.
7. Cerrar y reabrir y comprobar persistencia local con perfil verificado.
8. Verificar que Aventura, Supervivencia, Dominio y Estrategia conservan sus partidas.
9. Revisar 1366×768, 1440×900 y 1920×1080 dentro del portal, con scroll solo interno cuando sea necesario.

## Pendiente antes de publicación estable
- Pruebas interactivas de navegador y perfiles alumno/profesor.
- Arte y animaciones propios completos, sonido y más profundidad táctica.
- Banco lingüístico común; este prototipo utiliza 29 preguntas locales.
- Progresión en la nube, integración pedagógica y XP oficial solo tras validar el anti-duplicado y el aislamiento por alumno.