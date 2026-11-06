// La Flota de Las Tablas: sólo la XP real registrada por juegos oficiales.
// No se altera la XP personal ni se trasladan saldos al lunes siguiente.
export const FLEET_START = "2026-11-02";
export const FLEET_XP_PER_POINT = 250;
export const FLEET_DAILY_LIMIT = 3;
export const FLEET_WEEKLY_LIMIT = 6;

export function madridDate(instant = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone:"Europe/Madrid",year:"numeric",month:"2-digit",day:"2-digit",
  }).formatToParts(instant);
  const number = type => parts.find(part => part.type === type)?.value || "00";
  return number("year") + "-" + number("month") + "-" + number("day");
}

export function mondayOf(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(day))) throw new Error("invalid_fleet_day");
  const date = new Date(day + "T12:00:00Z");
  if (Number.isNaN(date.getTime())) throw new Error("invalid_fleet_day");
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return date.toISOString().slice(0, 10);
}

export function fleetWeeklySnapshots(dailyRows, today = madridDate()) {
  const byWeek = new Map();
  for (const row of dailyRows || []) {
    const day = String(row.local_day || row.day || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < FLEET_START || day > today) continue;
    const monday = mondayOf(day);
    const week = byWeek.get(monday) || [];
    const xp = Math.max(0,Math.floor(Number(row.xp || 0)));
    const existing = week.find(item => item.day === day);
    if (existing) {
      existing.xp += xp;
      existing.played ||= xp > 0;
    } else {
      week.push({day, xp, played:xp > 0});
    }
    byWeek.set(monday, week);
  }
  const currentWeek = mondayOf(today);
  if (!byWeek.has(currentWeek)) byWeek.set(currentWeek, []);
  return [...byWeek.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([weekStart, days]) => {
    let carry = 0, xpPoints = 0, xpEarned = 0, activeDays = 0;
    for (const day of days.sort((a,b)=>a.day.localeCompare(b.day))) {
      xpEarned += day.xp;
      carry += day.xp;
      if (!day.played) continue;
      activeDays++;
      const awarded = Math.min(FLEET_DAILY_LIMIT,
        FLEET_WEEKLY_LIMIT - xpPoints, Math.floor(carry / FLEET_XP_PER_POINT));
      xpPoints += awarded;
      carry -= awarded * FLEET_XP_PER_POINT;
    }
    const bonusPoints = activeDays >= 2 ? 1 : 0;
    return {
      weekStart, xpEarned, xpPoints, bonusPoints, activeDays,
      earnedPoints:xpPoints + bonusPoints,
      xpReserved:xpPoints === FLEET_WEEKLY_LIMIT ? 0 : carry,
      xpForNext:xpPoints === FLEET_WEEKLY_LIMIT ? 0 : Math.min(FLEET_XP_PER_POINT, carry),
      maxPoints:FLEET_WEEKLY_LIMIT + 1,
      maxXpPoints:FLEET_WEEKLY_LIMIT,
      xpPerPoint:FLEET_XP_PER_POINT,
      dailyLimit:FLEET_DAILY_LIMIT,
    };
  });
}

export function fleetAwardsForWeek(profileId, week) {
  if (!profileId || !week || week.weekStart < FLEET_START) return [];
  const common = "LA:WEEK:" + week.weekStart + ":" + profileId;
  const awards = Array.from({length:Math.min(FLEET_WEEKLY_LIMIT,week.xpPoints)},(_,i)=>({
    award_id:common + ":XP:" + (i + 1),
    profile_id:profileId,week_start:week.weekStart,award_key:"XP" + (i + 1),points:1,
  }));
  if (week.bonusPoints) awards.push({
    award_id:common + ":CONSTANCIA", profile_id:profileId,
    week_start:week.weekStart,award_key:"CONSTANCIA",points:1,
  });
  return awards;
}
