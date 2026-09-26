export function isLockedStatus(status: unknown) {
  const normalized = String(status || "").trim().toLowerCase();
  return normalized === "en revisión" ||
    normalized === "en revision" ||
    normalized === "próximamente" ||
    normalized === "proximamente" ||
    normalized.includes("coming");
}

export function workshopModeFor(row: Record<string, unknown> | null, now = Date.now()) {
  if (!row || row.published !== true) return "none";
  if (row.classroom_open === true) return "classroom";
  if (row.home_enabled === true) {
    const from = row.active_from ? Date.parse(String(row.active_from)) : Number.NaN;
    const to = row.active_to ? Date.parse(String(row.active_to)) : Number.NaN;
    if (Number.isFinite(from) && Number.isFinite(to) && now >= from && now < to) return "home";
  }
  return "closed";
}

export function studentGameAccess(
  game: Record<string, unknown>,
  accessByGame: Map<string, boolean>,
  workshopSessionRow: Record<string, unknown> | null,
  workshopSelectedGameIds: Set<string>,
  workshopActive: boolean,
) {
  const catalogLocked = isLockedStatus(game.status) || !game.url || String(game.integration || "none") === "none";
  const baseAccessEnabled = accessByGame.get(String(game.id)) !== false;
  const workshopControlsAccess = Boolean(workshopSessionRow);
  const selectedForWorkshop = workshopSelectedGameIds.has(String(game.id));
  const workshopAccessEnabled = workshopControlsAccess ? (workshopActive && selectedForWorkshop) : null;
  const accessEnabled = workshopAccessEnabled === null ? baseAccessEnabled : workshopAccessEnabled;
  const lockedByWorkshop = workshopControlsAccess && !accessEnabled;
  const lockedByTeacher = !workshopControlsAccess && !baseAccessEnabled;
  const workshopScheduledClosed = workshopControlsAccess && selectedForWorkshop && !workshopActive;
  return {
    catalogLocked: Boolean(catalogLocked),
    baseAccessEnabled,
    workshopControlsAccess,
    selectedForWorkshop,
    workshopAccessEnabled,
    accessEnabled,
    lockedByWorkshop,
    lockedByTeacher,
    workshopScheduledClosed,
    locked:lockedByWorkshop || lockedByTeacher || Boolean(catalogLocked),
    accessSource:workshopControlsAccess ? "workshop" : "default",
  };
}

export function studentGameButtonLabel(
  access: ReturnType<typeof studentGameAccess>,
  status: unknown,
  sessions: number,
) {
  if (access.lockedByWorkshop) {
    return access.workshopScheduledClosed ? "Fuera del horario del taller" : "Fuera de este taller";
  }
  if (access.lockedByTeacher) return "Cerrado por tu profesor";
  if (access.locked) return isLockedStatus(status) ? "En revisión" : "No disponible";
  return sessions > 0 ? "Continuar" : "Jugar";
}
