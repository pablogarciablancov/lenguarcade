# Mesa legible y arrastre de Versópolis

La mesa da prioridad al contrato, los cuatro huecos y la mano. Las cartas tienen
240–300 px de ancho, versos de 20–24 px, sombras y estados de selección. La mano
mantiene scroll horizontal interno y conserva su posición al seleccionar. Inspiración,
rondas, cambios, racha y total siguen visibles. Detalles abre los paneles de Musas,
mazo y lectura poética. Los datos auxiliares del tema se consultan en el tooltip
solo en el primer duelo; se mantiene la retirada de pistas de los duelos posteriores.

Pointer Events permite llevar una carta al atril, reordenar insertándola en otra
posición y devolverla a la mano. Clic y flechas llaman a la misma función de movimiento.
El arrastre muestra una carta fantasma y destinos resaltados; una suelta inválida,
Escape o pointercancel devuelve la representación sin modificar el estado. No se
traspasa la propiedad de la carta: selected sigue siendo la vista ordenada de hand.
Se conservan las reglas, generación, puntuación, formato V6 y bridge existentes.

## Validación

- `node scripts/check-versopolis.mjs`: contratos de los cuatro mapas, banco,
  migración V5→V6, conservación de cartas, movimientos, límite de cuatro cartas,
  rechazo de cartas ajenas, bloqueo durante ataque/descarte y equivalencia con clic.
- `node scripts/check-syntax.mjs`: sintaxis e interfaces existentes.
- `node games/versopolis/browser-test.cjs` (Playwright y Chromium disponibles):
  carga mediante menú/Atlas/Musa, tamaños 1366×768, 1440×900, 1920×1080 y
  1366×650; ausencia de scroll general y de contenido recortado en la mano.
  Arrastre real de ratón, clic, reordenación, suelta inválida, devolución,
  eventos táctiles CDP reales y cancelación; persistencia/restauración con perfil
  local, panel Detalles, navegación al mazo, ataque con contrato válido y puntuación.
- Para usar un Chromium ya instalado, definir `VERSOPOLIS_CHROMIUM` con su ruta.
  Opcional: `VERSOPOLIS_SCREENSHOT` guarda una captura de la mesa de prueba.

No se ha desplegado ni modificado Supabase, Apps Script o el catálogo. La prueba de
persistencia verifica las APIs locales del perfil; no escribe en cuentas de alumnos.
La publicación queda pendiente de fusionar la PR. Una mesa diferenciada por tipo de
reto puede abordarse después como una intervención independiente.
