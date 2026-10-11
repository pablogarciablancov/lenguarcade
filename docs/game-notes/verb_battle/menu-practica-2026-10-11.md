# Batalla Verbal: portada y práctica

- La portada muestra cuatro cartas seleccionables de héroe y ocho cartas de rivales; ya no presenta un combate ficticio.
- La práctica usa una ilustración propia de la academia, oculta el marcador «VS» y aumenta el tamaño de los enunciados de las acciones.
- Se conserva la selección de clase, el progreso del perfil, la configuración y las mecánicas de juego.
- Ajuste posterior: las cartas de héroe muestran el retrato entero y centrado; las cartas de rivales ganan un marco de ilustración y más jerarquía visual.
- Ajuste posterior: en batalla, el héroe y el rival quedan centrados en el área de combate; la imagen conserva su proporción y el HUD ya no la tapa.
- Validación: `node scripts/check-verb-battle.mjs`, `npm run check` y `git diff --check`.
- QA visual interactiva pendiente: Playwright está disponible, pero no hay Chromium instalado en este entorno.
