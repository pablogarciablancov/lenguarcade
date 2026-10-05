# Validación de Sopa de Tinta

Ejecutar desde la raíz:

```bash
node games/sopa_de_tinta/smoke-test.mjs
npm run check
```

Ambos han pasado. La prueba propia verifica 640 tableros en siete categorías y cuatro dificultades, colocación válida, determinismo, ocho direcciones, banco de 160 conceptos, 37 logros, reclamación única de misiones y recompensas idempotentes.

Validación real con Playwright/Chromium:

- 1366×768, 1440×900, 1920×1080, 1366×600 y 390×844: tablero dentro del viewport, cuadrado y sin scroll de documento.
- Arrastre con ratón y Touch Events reales, selección por teclado y combo.
- Ayuda de letra descontada una sola vez; guardar, recargar y continuar conserva la partida.
- Completar un tablero entrega recompensa; recargar conserva XP sin repetirla.
- Diario reproducible con la misma fecha.
- Host de prueba con iframe: INIT aplica identidad independiente, CHECKPOINT contiene avance y REQUEST_EXIT concluye tras CHECKPOINT_CONFIRMED.
- Sin errores JavaScript en estas rutas.

## Comprobación manual antes de producción

1. Servir la raíz con `python -m http.server 8765` y abrir `/games/sopa_de_tinta/`.
2. Probar aventura, desbloqueos, jefe (90 s / tres errores), maestría, pistas de zona/tinta y personalización.
3. Tras la integración, abrir desde el catálogo real con dos alumnos distintos; comprobar identidad y recuperación central en otro dispositivo.
4. Comprobar cierre desde panel del profesor, incluido guardado durante el minuto de gracia.
5. Verificar progreso central, XP y logros sin duplicados antes de activar el juego para clases.

Las pruebas del host de laboratorio no certifican por sí solas la autenticación, los permisos ni el backend de producción.

## Revisión visual y glosario

Comprobado en Chromium: 1366×768, 1440×900, 1920×1080, 1366×600 y 390×844; tablero cuadrado, menú accesible y sin scroll general. HTML autónomo con imagen, estilos y scripts integrados: carga, arrastre real, acierto y persistencia después de recargar. Glosario vacío sin respuestas reveladas; un acierto desbloquea exactamente un término, con su definición. Buscar ignorando tildes, filtrar por distrito y recargar conservan los datos. Sin errores JavaScript. Vuelven a pasar las pruebas de 640 tableros.

Acceso a Aventura comprobado con clics reales desde perfil nuevo y pedido pendiente: siete distritos jugables, continuar partida, sustituir pedido con confirmación y desbloquear Pedido 2 tras completar Pedido 1. Aventura y Continuar accesibles en los cinco tamaños anteriores, sin errores JavaScript.

Regresión específica: `node games/sopa_de_tinta/adventure-ui-test.cjs` con Playwright instalado; opcional `TINTA_CHROMIUM_PATH` para un Chromium local. Comprueba 42 entradas reales, los siete distritos en 1366×768, 1440×900, 1920×1080, 1366×600, 390×844 y 375×667. Verifica tamaño táctil, botón dentro de su tarjeta y hit-test sin elementos que intercepten el clic, sustitución confirmada de pedido pendiente e inicio de partida. Captura móvil inspeccionada; sin errores JS. El HTML autónomo pasa la misma comprobación usando `TINTA_TEST_URL=file:///ruta/Sopa_de_Tinta_Prueba.html`.
