# Tierras de Tinta · presentación de tinta y oro

El título pasa a una composición de escenario completo con logo, héroe activo y una acción principal. El Refugio conserva sus cinco estaciones. Héroes, forja, códice, gestas y expediciones comparten marcos, jerarquía y estados de selección. El HUD incorpora el arma equipada, iconos SVG locales y feedback de vida/experiencia. Los desafíos, ventajas y resultados usan la misma dirección artística.

Se sustituye el CSS inline acumulado por `art-direction.css`. Se reutilizan las ilustraciones existentes; no se cambian estadísticas, recompensas, preguntas, desbloqueos, balance, versión de guardado ni bridge.

La pausa permite continuar, guardar y salir al título, o abrir el portal de retorno existente. Guardar y salir crea un checkpoint de la expedición, sin aplicar recompensas ni cerrar la partida. La expedición se puede reanudar también después de recargar el navegador. Los resultados permiten volver al Refugio o iniciar otra expedición.

## Validación

Desde la raíz del repositorio:

```sh
node scripts/check-syntax.mjs
node scripts/check-tinta-integration.mjs
node scripts/check-checkpoint-lifecycle.mjs
```

Para las pruebas de navegador se necesita Playwright y Chromium disponibles en el entorno. Servir el repositorio en un terminal y ejecutar la prueba en otro:

```sh
python3 -m http.server 8765
node games/tierras_de_tinta/smoke-test.cjs
```

Opcionales: `BROWSER_EXECUTABLE` selecciona un Chromium ya instalado; `TINTA_QA_URL` cambia la URL del juego; `TINTA_QA_OUTPUT` cambia la carpeta de capturas.

La prueba recorre título, Refugio, cinco estaciones, repaso con respuestas incorrecta/correcta, inicio de combate, desafío de campo, pausa, checkpoint con recarga y reanudación, selección de ventaja, extracción, derrota/victoria, reintento, retorno y persistencia de campaña. Los casos de ventaja, desafío, derrota y victoria se provocan mediante instrumentación que solo se inyecta en la respuesta de prueba; el juego publicado no expone ese acceso.

Se comprueban límites del viewport y ausencia de scroll de documento en 1366×768, 1440×900, 1920×1080, 1366×640 (altura disponible reducida) y 390×844. Los inventarios extensos y la preparación móvil usan scroll interno. Se revisan las capturas para detectar proporciones, textos e iconos. Esto valida los flujos visuales y su conexión con la lógica, no equivale a jugar la campaña completa ni a medir el rendimiento en un Chromebook físico.

## Ajuste de proporciones y ataque sin ratón

Las ilustraciones de los atlas usan un SVG recortado a la celda original con escala uniforme y espacio libre cuando la caja tiene otra proporción. Se aplica a título, campamento, héroes, arsenal, destinos y jefes. El canvas también conserva la proporción de origen y evita el aplastamiento de enemigos durante el ataque.

Ataque automático al enemigo vivo más próximo dentro del alcance real del arma y visible en pantalla. Mantiene daño, cadencia, efectos, escudos y preguntas. Se detiene en pausa y durante el desafío activo. WASD y flechas mueven; Espacio esquiva; Q activa la habilidad; E abre el desafío. En móvil el botón derecho activa la habilidad.

Pruebas específicas: ataque cuerpo a cuerpo y a distancia sin eventos de ratón, dirección del proyectil, cadencia, pausa y descarte de objetivos muertos o fuera de alcance. Las pruebas de navegador verifican escala uniforme de sprites, navegación, combate, preguntas, guardado y reanudación en las cinco resoluciones descritas.
