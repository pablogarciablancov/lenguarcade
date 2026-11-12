/**
 * Copiar al Apps Script ACTUAL de "Flota de Las Tablas"; no sustituye a doPost.
 * Autoriza SOLO dos formatos bajo el secreto del webhook que doPost YA valida:
 *  - premios de talleres: 5 puntos, identificador LA:<sha256>
 *  - recompensas semanales por XP/constancia: 1 punto, LA:WEEK:<lunes>:<profileUUID>:...
 *
 * No desactivar la validación del secreto ni la deduplicación por awardId.
 */
function validarPuntosPremioLenguArcade_(profileId, awardId, points) {
  const id=String(awardId||'').trim();
  const profile=String(profileId||'').trim().toLowerCase();
  const n=Number(points);
  const weekly=/^LA:WEEK:(\d{4}-\d{2}-\d{2}):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):(?:XP:([1-6])|CONSTANCIA)$/i.exec(id);
  if (weekly) return weekly[2].toLowerCase()===profile && n===1;
  return /^LA:[0-9a-f]{64}$/i.test(id) && n===5;
}
