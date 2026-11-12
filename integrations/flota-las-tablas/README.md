# Flota de Las Tablas · Receptor de premios LenguArcade (actualizar Apps Script)

## Alcance y estado (12-11-2026)
- El cálculo de XP ya está corregido en **Supabase** con la migración
  `20261112171647_fleet_all_game_xp_including_rayuela.sql`.
- Cuenta **toda XP positiva obtenida en juegos registrados**, incluida Rayuela
  (también la galería) y recompensas de evento vinculadas a juegos.
- No cuenta ajustes manuales de profesores ni el juego técnico de administración.
- Sigue vigente **250 XP = 1 punto**, máximo **3 puntos por día** y **6 por semana**,
  con **+1 por constancia** al jugar dos días distintos de una semana.
- El 12/11/2026 quedaron **250 puntos en `fleet_weekly_awards` pendientes**:
  188 de 02–08/11 y 62 de 09–15/11. La creación idempotente se hizo con
  `ON CONFLICT DO NOTHING`, manteniendo intactas 12 filas que ya existían.
- Su envío está fallando con `invalid_award`: **el Apps Script receptor de Flota
  sigue obligando a `points === 5` y la función interna de premio de taller
  probablemente fija 5 puntos en el asiento**. No hay evidencia de entrega.

## Cambio imprescindible en el proyecto receptor de Flota

**No editar `apps-script/LenguArcade_*.gs`: el receptor vive en otro Apps Script.**
Abrir el Apps Script ACTUAL vinculado al marcador de Flota de Las Tablas. No
sustituirlo por una copia antigua de `Code.gs` ni cambiar el despliegue publicado.

1. Añadir un archivo GS con el contenido de
   `integrations/flota-las-tablas/validar-puntos-lenguarcade.gs`.
2. En `doPost(e)`, conservar la validación del secreto
   `LENGUARCADE_FLEET_WEBHOOK_SECRET`, la comprobación
   `challengeCompleted === true`, la categoría `CAT1`, la identidad
   `profileId`, y la detección de `awardId` repetido.
3. **Únicamente para la validación del premio LenguArcade**, reemplazar la
   condición `Number(points) === 5` por
   `validarPuntosPremioLenguArcade_(profileId, awardId, points)`.
   El helper admite `5` para los IDs antiguos `LA:<hash>`, y `1`
   para `LA:WEEK:<lunes>:<profileId>:XP:<1..6>` o `...:CONSTANCIA`.
4. Pasar **también** el valor recibido a la función de aplicación:
   `aplicarPremioRetoLenguArcade_({profileId, awardId, title, points:Number(points)})`.
5. Dentro de `aplicarPremioRetoLenguArcade_`, usar los puntos ya validados
   **en todo asiento o suma**: columna `Puntos` de `Registro`, total del
   alumno y total de la flota, en lugar de 5 fijo. La categoría `CAT1`
   sigue conservando 5 puntos como valor predeterminado para las acciones
   normales y para los premios de talleres. No alterar cálculos de otras
   categorías ni la protección de duplicados.
6. Publicar **una nueva versión del MISMO despliegue `/exec`** de Flota.

**Importante:** no es suficiente quitar `points === 5` de `doPost`;
si la función de aplicación conserva el 5 fijo, se multiplican por cinco
los premios semanales.

## Validación tras publicar el receptor
1. Probar un premio semanal de **1 punto** para un alumno y confirmar
   que aumenta exactamente +1 en `Registro`, su total y la Flota.
   Consultar primero si el `awardId` ya existe antes de repetir la prueba.
2. Probar una recompensa de taller de **5 puntos** con su `awardId` real,
   comprobando que continúa sumando +5; no inventar puntos de producción.
3. Reenviar un `awardId` ya aplicado y comprobar que no duplica nada.
4. Comprobar en Supabase que `fleet_weekly_awards.delivered_at` empieza
   a completarse al entrar alumnos en LenguArcade o finalizar partidas.
   Los 250 premios permanecerán pendientes hasta entonces y se reintentarán
   con sus identificadores originales.
5. Las 250 recompensas en cola **no son 250 puntos ya acreditados**:
   validar `delivered_at` y `Registro` para afirmar entrega real.
6. Mantener la seguridad del webhook; nunca publicar su secreto ni simular
   250 envíos de producción sin deduplicación.

## Revisión rápida
- `npm run check`: pruebas de reglas 250 XP, topes, semanas, constancia
  y validación de IDs/1 punto semanal vs 5 por taller.
- `select week_start,count(*),count(*) filter (where delivered_at is not null)
   from public.fleet_weekly_awards group by 1;`
