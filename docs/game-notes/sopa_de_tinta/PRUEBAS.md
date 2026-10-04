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
