# LEXOMA — Forja de Frases

Abre `index.html` en Chrome/Chromium para probar el taller independiente. Todos los recursos son locales; no requiere cuenta, instalación ni llamadas a una IA. La partida queda guardada en ese navegador. Para probar el bridge utiliza un servidor estático y el host de LenguArcade con los parámetros habituales `?lenguarcade=1&channel=…`.

La primera mano permite EL → MAGO → CORRE. Selecciona las fichas de cada palabra y pulsa **Forjar palabra**. **Finalizar frase** transforma la construcción en daño. Las flechas de las cartas permiten reordenar; × retira la carta. **Ver ideas** descubre formas que pueden construirse con tu mano. Los comodines abren un selector de letra; la ficha de tilde se coloca justo después de la vocal. Las palabras ambiguas permiten elegir análisis.

**Cerrar ronda** renueva una mano bloqueada: pierdes las cartas actuales y gastas una ronda. Agotar las rondas del enemigo resta Integridad. La bolsa recicla fichas consumidas y descartadas. La tienda aparece tras el segundo encuentro; Morfax tiene tres fases.

El léxico inicial tiene 1.300 formas. Una palabra desconocida puede existir en español: el taller informa que todavía no está en su banco. El análisis usa patrones sencillos y concordancia, no un analizador universal ni un juicio de coherencia semántica.

## Verificación

- `node games/lexoma/smoke-test.mjs` desde la raíz del repositorio.
- `node games/lexoma/browser-test.mjs` con Playwright instalado. Puedes indicar un Chromium existente mediante `LEXOMA_CHROMIUM`.

## Estado de integración

MVP probado, preparado en rama `game/lexoma/mvp-forja`. Manifest y adaptador de progreso listos para la integración central. Todavía no se ha añadido al catálogo vivo ni publicado Apps Script/Supabase. Aplicar `lenguarcade.integration.json` desde la rama `integration/*`, siguiendo `docs/TRABAJO_CONCURRENTE_JUEGOS.md`. El adaptador evita sumar otra vez la XP de un checkpoint repetido y no premia forjar/retirar indefinidamente palabras sin finalizar construcciones.
