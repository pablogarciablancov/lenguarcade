# Tinta y Acero — laboratorio jugable

## Probar
Desde la raíz del repositorio: `python -m http.server 8765`.
Abrir `http://localhost:8765/games/tinta_y_acero/`.
Pruebas: `node games/tinta_y_acero/test.mjs` y `node games/tinta_y_acero/bridge-test.mjs`.
No abrir con file://: el diccionario se carga con fetch.

## Estado actual
Combate por turnos con tablero 3×3 no adyacente, escritura/selección de fichas, acentos, Ñ, ataque/defensa, intención enemiga, 4 clases, habilidades, estados y dos combos elementales. Partidas cortas de 5 nodos o completas de 15 en 3 regiones. Rutas reproducibles; 18 enemigos, 3 jefes con fases, 16 eventos. Mercader temporal, tienda cosmética permanente, mazo de 4–12 cartas, máximo 2 cartas IV. Códice, bestiario, 36 logros, tutorial contextual y entrenamiento. Desafío diario en fecha de Madrid con clase y mazo fijos. Guardado local por perfil y reanudación de expedición. Sonidos sintetizados opcionales, movimiento reducido y ajustes de texto.

40 cartas representan 10 efectos con 4 mejoras cada uno, **no 40 mecanismos únicos**. Las 30 reliquias tienen reglas propias; algunos efectos comparten primitivas. Las clases están disponibles desde el principio para permitir probarlas. No hay multijugador ni clasificación central.

`content.js`: datos y léxico escolar; `engine.js`: motor puro; `app.js`: pantallas/guardado/dibujo; `style.css`: disposición; `bridge.js`: protocolo del runner. Los escenarios y personajes son dibujos originales por código con bloques de píxeles, sin sprites ni ilustraciones de terceros. Por ahora son poses estáticas con feedback de golpe; no es la dirección artística animada final solicitada.

## Fiabilidad lingüística
281.240 formas de 2–9 letras, subconjunto exacto del banco RLA-ES ya expandido por Forja. `build-dictionary.py` regenera el archivo. Fuente original y commit documentados en `../forja/dictionary-source/README.md`; licencia incluida en `assets/RLA_ES_LICENSE.md`. No es un diccionario oficial de la RAE ni garantiza cobertura total.
Las tildes solo se normalizan para comprobar fichas disponibles. La validación conserva la escritura exacta (incluyendo Ñ/diéresis), por lo que canto y cantó son diferentes. `rio` puede ser válido como forma de reír; no se rechaza automáticamente por no llevar tilde. Solo el léxico explícito aplica categorías, afinidades o morfología. No se asignan lemas sin análisis fiable de las formas flexionadas. No se ofrecen definiciones inventadas. Tableros y objetivos usan únicamente soluciones del léxico escolar conocido.

## Persistencia e integración
LocalStorage es guardado de laboratorio, **no un servidor seguro**: puede modificarse desde herramientas del navegador. No prometer transacciones seguras, control docente o XP central por estar presentes las pantallas locales.
El adaptador usa namespace, canal y ancestros comprobados, una escritura en vuelo, ACK real, reintentos, IDs estables y outbox local de resultados. No calcula XP ni envía recompensas de logros como XP. Las recompensas locales se aplican sin duplicarse en una sola instancia. Falta control de concurrencia entre pestañas/dispositivos, validación servidor y conciliación de estados; no sustituir datos centrales con este laboratorio sin esa revisión.

El manifiesto declara el alta pendiente. AGENTS.md y docs/TRABAJO_CONCURRENTE_JUEGOS.md reservan catálogo, host y servidor a una rama integration/*. Nada se ha desplegado.

## Pendiente real
Integración de catálogo, perfiles reales, límites de XP e idempotencia validados por servidor; economía transaccional; talleres, misiones y estadísticas docentes. Pruebas completas del runner y recarga central con alumno/profesor. Tutorial con secuencia garantizada (ahora guía contextual), animaciones y sprites diferenciados de producción, música, más efectos únicos de cartas, rarezas comunes y dígrafos. Las fases de jefe cambian fuerza/barrera/debilidad, pero faltan patrones narrativos más profundos. No se han afinado duraciones escolares con alumnos. Desafío diario todavía puede alterar estadísticas acumuladas en repeticiones; no usar como evaluación o ranking hasta cerrar política servidor. Falta revisión visual en navegador a 1366×768, 1440×900 y 1920×1080: el entorno no ha podido descargar Chromium.

## Decisiones y siguiente paso
Se priorizó cerrar un bucle jugable real sin tocar otros juegos. La siguiente intervención debe validar la UI en navegador y realizar la integración central en su rama correspondiente antes de ampliar contenido o publicar.
