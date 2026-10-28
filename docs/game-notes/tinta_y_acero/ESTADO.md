# Tinta y Acero — estado y pruebas

Juego nuevo aislado en games/tinta_y_acero, rama game/tinta_y_acero/aventura-inicial.
No se ha modificado catálogo, Apps Script, Supabase ni otros juegos.

Cambios: interfaz completa de laboratorio, motor por turnos, contenido, diccionario con licencia y generador, tiendas, códice, mazo, logros, guardado local y bridge del runner. Alcance y carencias detallados en README propio. No es todavía la versión final del encargo.

Pruebas automatizadas: `node games/tinta_y_acero/test.mjs`; `node games/tinta_y_acero/bridge-test.mjs`; `npm run check`.
Pruebas manuales pendientes: abrir servidor HTTP local, recorrer tutorial, atacar con teclado/fichas, usar tildes/Ñ, defender, habilidad, recargar en combate, comprar, comprobar colección/logros y reanudar; revisar 1366×768, 1440×900, 1920×1080 y móvil. Chromium no está disponible y su descarga falla en este entorno. El bridge se ha probado con un host simulado, no con sesión real de alumno/profesor.

Siguiente paso: prueba visual real y revisión; después PR de integración desde integration/* para catálogo/servidor, con autorización expresa antes de fusionar o desplegar. Mantener el juego como laboratorio mientras no existan economía/XP validadas por servidor y pruebas del runner real.
