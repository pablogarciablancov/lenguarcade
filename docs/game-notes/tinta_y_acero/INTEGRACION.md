# Tinta y Acero — integración preparada

## Estado actual
Rama `integration/2026-10-29-tinta-y-acero` basada en `main` 3a1299d. Contiene la versión visual y jugable actual del sitio de prueba, con turnos separados, defensa sin daño directo y arena cooperativa/duelo. Sustituye el contenido inicial de la PR de laboratorio #201; esa PR no debe publicarse después de esta integración.

## Catálogo y profesor
Alta oficial 17, estado «en pruebas», URL de producción de GitHub Pages. Portada original con título en `games/tinta_y_acero/assets/tinta-y-acero-collection-v3.png`. `config/game-catalog.json` sigue siendo la única fuente editable. El sincronizador genera también los mapas de portadas de las vistas alumno/profesor; ambos paneles y los selectores de talleres usan la portada canónica, aunque el caché anterior contenga otra imagen.

La portada se generó con image_gen integrado. Prompt: cápsula de catálogo 16:9 de pixel art de fantasía, guardaplumas verde, maga violeta, guerrero de cobre y monstruo de tinta en bosque nocturno; texto principal exacto «TINTA Y ACERO» y subtítulo «EL PODER DE LAS PALABRAS», título grande y zona segura central.

## Perfiles y progreso
El adaptador existente realiza READY/INIT, checkpoints, resultados y ACK. Cada perfil conserva su guardado propio. La XP se calcula en `_shared/progression.js`: 20 por combate nuevo y 30 por expedición ganada, sin XP por palabra ni entrenamiento; deltas idempotentes y límites compartidos. La arena conserva su economía separada y todavía no concede XP. Moneda y compras internas del juego mantienen el modelo de los guardados de laboratorio; no se presentan como economía transaccional validada.

## Arena integrada
`games/tinta_y_acero/online-host.js` envía comandos al host sin recibir credenciales. El host autentica las llamadas a `tinta-online`. El backend usa `requireProfileSession`, la organización y las clases del perfil, las reglas docentes de acceso y la tabla `multiplayer_rooms` existente, ya protegida por RLS y accesible solo por el servidor. No necesita una nueva tabla ni una migración de esquema.

Código de sala integrado de ocho caracteres. Alias derivados del perfil, sin permitir suplantación mediante campos del cliente. Guardado de sala aislado por perfil en el navegador, validación de pertenencia y organización, rechazo tras cierre docente, escritura condicional por versión y reintentos para acciones simultáneas. Decisiones y estadísticas del rival ocultas hasta resolver. Sondeo con intervalo de 5–6 segundos para moderar carga. El modo privado del sitio de prueba conserva su API propia de seis caracteres y no se modifica con esta PR.

El profesor elige una clase de las que gestiona para crear sala. El alumno usa una de sus clases activas. Se permite profesor-alumno o alumno-alumno; dos perfiles de profesor no comparten sala. La reconexión mantiene el código del asiento autenticado al recargar. No hay ranking ni premios de arena pendientes de validación.

## Publicación coordinada — pendiente de autorización
1. Revisar y fusionar esta PR (no la antigua #201). Esperar la publicación de GitHub Pages y comprobar juego y portada.
2. Aplicar `supabase/catalog/game-catalog.sql` a la base actual (upsert de catálogo, sin reiniciar datos).
3. Desplegar `tinta-online`, `save-progress`, `student-dashboard`, `teacher-dashboard` y `teacher-student-detail`, incluyendo sus dependencias compartidas actualizadas. Mantener `verify_jwt=true`.
4. Publicar el proyecto Apps Script estable mediante el flujo documentado del repositorio; no crear otro despliegue.
5. En `/exec`, probar profesor, profesor-jugador y dos alumnos: visibilidad, abrir/cerrar, taller, guardado/recarga, XP sin duplicados y dos modos online. Cerrar el acceso debe impedir nuevas acciones.

## Verificación completada
`npm run check` completo. Pruebas propias de motor (1.250 tableros y expediciones de las cuatro clases), bridge, turnos, arena completa y soporte al compañero con escudo propio lleno. Pruebas de integración de portada/catálogo, transporte sin credenciales, XP idempotente y handler de Supabase simulado con acciones simultáneas, perfil autenticado, organización/clase, pertenencia y cierre docente.

## Pendiente real
Comprobación de extremo a extremo con el despliegue vivo y cuentas reales tras publicar; afinado de duración y equilibrio de arena; premios de arena y economía interna transaccional si se requieren. No se han modificado cuentas, XP existente, salas reales ni otros juegos en producción.
