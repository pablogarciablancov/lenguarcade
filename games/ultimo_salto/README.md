# Último Salto — Las ruinas de las palabras

Primera versión jugable aislada. Explorador pixel art con un atlas original de 32 fotogramas y diez estados de animación en un templo 3D real (Three.js 0.170.0, distribuido localmente con licencia MIT).

## Probar

- Edición autónoma: abrir `Ultimo_Salto.html` en Chrome o Edge. No necesita servidor ni conexión. WebGL y JavaScript deben estar disponibles.
- Módulos del repositorio: servir la raíz por HTTP y abrir `/games/ultimo_salto/`.
- Generar edición autónoma: `node games/ultimo_salto/build-standalone.mjs /ruta/Ultimo_Salto.html`.
- Pruebas de contenido/generador/economía: `node games/ultimo_salto/test.mjs`.
- Pruebas de navegador: `SALTO_CHROMIUM=/ruta/chrome-headless-shell node games/ultimo_salto/browser-test.cjs` (requiere Playwright en `CODEX_PRIMARY_RUNTIME_NODE_MODULES`). El test autónomo espera `/workspace/scratch/6386c6d91a33/Ultimo_Salto.html`; pasar SALTO_STANDALONE para usar otra ruta.

## Incluido

20 niveles de acentuación y categorías gramaticales; diez reglas; bancos separados de palabras clasificadas explícitamente; generación con camino comprobado y semilla reproducible; reglas ocultas con ejemplos y contraejemplos que discriminan las hipótesis del banco; salto, aterrizaje, desequilibrio, caída y celebración; derrumbes con fragmentos; cámara de perspectiva; ruinas, islas y vegetación; geometría repetida del entorno agrupada mediante instancing; sombras, niebla, luces, partículas; audio sintético original; ratón/táctil/teclado; ayudas limitadas; tienda; tres apariencias; cinco logros; estrellas y récords.

El guardado local se produce tras decisiones estables y al abandonar. No se envían saltos al servidor. Las recompensas permanentes se obtienen por primera victoria y mejora de estrellas; repetir una marca no da más XP. No hay límite de tiempo para aprender. El reloj mostrado mide tiempo activo.

## Integración preparada, pendiente de publicar

`src/bridge.js` implementa el protocolo actual del runner: READY, INIT, INITIALIZED, SESSION_STARTED, RESULT, CHECKPOINT, REQUEST_EXIT y CLOSE_READY. Valida ventana ascendente y canal; acepta bootstrap; aísla almacenamiento por estudiante; serializa las escrituras; reutiliza identificadores al reintentar y solo confirma salida tras ACK. Un resultado antiguo no puede adelantarse a un guardado posterior.

La entrada en catálogo y el cálculo central de XP necesitan la integración descrita en `lenguarcade.integration.json`. **Los puntos de la edición autónoma son XP de aventura local, no XP ya abonada en LenguArcade.** No se ha tocado Apps Script, autenticación, Supabase ni ningún otro juego.

## Límites de esta entrega

Es una primera versión con arte 3D estilizado construido con geometría y sprites originales; la portada es arte promocional y no una captura. No equivale al acabado audiovisual de un título comercial terminado. No incluye cooperativo/duelo, otros mundos, plataformas móviles, un mapa 3D navegable ni banda sonora grabada. El final reúne tres sellos consecutivos con reglas diferentes, portal e iluminación especiales.

La identidad central remota tiene prioridad sobre la copia local al inicializar un perfil conectado; no se fusionan saldos de dos dispositivos. Una integración futura deberá decidir la recuperación explícita de progreso local pendiente cuando la copia central sea anterior.

## Recursos

- Three.js 0.170.0: MIT, `vendor/THREE-LICENSE.txt`. Fuente: paquete oficial `three@0.170.0`.
- Efectos, arquitectura y audio: originales, generados por código en este juego. El explorador v2 y la textura de piedra v2 son recursos originales creados con ImageGen e integrados en el renderizado real.
- `assets/cover.webp`: portada original creada con ImageGen, herramienta integrada. Prompt: «ÚLTIMO SALTO», explorador pixel art con bufanda turquesa y linterna ante templos de piedra flotantes, ruinas 3D estilizadas, niebla azul y luz dorada; subtítulo «LAS RUINAS DE LAS PALABRAS». No se utilizan recursos de las referencias comerciales.

## Validación ejecutada

Navegador real con WebGL: teclado, salto hasta victoria, caída, tienda, ayudas, regla oculta, restauración de partida en curso, antifarmeo, ausencia de scroll a 1366×768 / 1440×900 / 1920×1080 / 390×844, edición autónoma con file:// y cierre solo después del ACK del runner simulado. Pendiente el host real de producción y rendimiento en el equipo escolar.


## Revisión visual 2

- Nuevo atlas transparente de ocho columnas y cuatro filas: respiración, carrera, salto y celebración. Los diez estados del controlador reutilizan keyframes específicos, con giro de caída y anclaje de pies. La capa conserva sus tres variantes mediante una máscara cromática.
- Arquitectura de piedra biselada, arcos de dovelas, columnas con estrías y capiteles, islas de roca estratificada, hiedra, olivos, cascadas y santuario al fondo. Todo el escenario se renderiza en Three.js.
- Material de caliza original, bronce, marcas talladas y palabras en planos sobre la superficie de las piedras, con texto oscuro de mayor tamaño.
- Cielo con shader, niebla en dos planos animados, polvo, luz de linterna, antorchas y portal animado. Aterrizaje con polvo, salto con anticipación y estela, fisura previa al derrumbe y sacudida de cámara limitada por el ajuste de movimiento.
- Geometría repetida agrupada con instancing, esculturas estáticas fusionadas por material y sombras estáticas reutilizadas. Al pausar se deja de redibujar la escena hasta que cambia el estado o el tamaño. La calidad ligera mantiene geometría y sprites, desactiva sombras y los dos planos de niebla.
- Sin cambios en datos lingüísticos, generador, reglas, estrellas, monedas, logros, versión de guardado ni adaptador del host.

### Recursos originales nuevos

`assets/explorer-v2.png` — ImageGen integrado; prompt de producción: atlas transparente 8×4, explorador con cabello castaño, bufanda turquesa, túnica de lino y linterna; ocho poses de respiración, ocho de carrera, ocho de salto y ocho de celebración, sin textos ni escenario. Resolución recibida: 1774×887; las celdas se leen mediante UV normalizadas.

`assets/stone-v2.png` — ImageGen integrado; prompt: textura de albedo tileable de caliza antigua marfil, poro fino, pequeñas fisuras, desgaste y musgo suave; iluminación uniforme, sin perspectiva, objetos ni texto. Resolución recibida: 1254×1254.

La edición autónoma incluye ambos recursos y no necesita conexión.

Distribución: los PNG maestros se conservan; el juego carga `stone-v2.webp` (calidad 88) y `explorer-v2.webp` (compresión sin pérdidas, alpha intacta). Mismas dimensiones y misma cuadrícula UV.

Validación de la revisión visual completada: navegador WebGL sin errores, recursos cargados sin red, cuatro tamaños sin scroll, selección de calidad y suspensión del render durante pausa. Regresión completa de juego, ayudas, final de tres sellos, guardado/restauración y cierre confirmado superada. Captura real: `qa/templo-v2.png`. Pendiente comprobar fluidez en el ordenador escolar físico.
