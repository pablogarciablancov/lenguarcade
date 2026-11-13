import {FLEET_START, fleetWeeklySnapshots, fleetAwardsForWeek} from "./fleet-weekly.js";

// Solo el trabajador programado de Flota envía premios a Google.
// Máximo dos envíos secuenciales por ejecución, con 25s por intento.
export const FLEET_WEBHOOK_TIMEOUT_MS = 25000;
export const FLEET_DELIVERY_MAX_AWARDS = 2;

export function isAcknowledgedFleetAward(result, award) {
  return result?.ok === true &&
    String(result.awardId || "") === String(award?.award_id || "") &&
    Number(result.points) === Number(award?.points) &&
    [1,5].includes(Number(award?.points));
}

export async function loadFleetWeeks(admin, profileId) {
  const {data, error} = await admin.rpc("fleet_weekly_daily_activity", {
    p_profile:profileId,p_since:FLEET_START,
  });
  if (error) throw error;
  return fleetWeeklySnapshots(data || []);
}

// Piloto explícito: profesor-jugador autorizado para comprobar la entrega real
// sin añadir profesores a clases ni tratarlos como alumnos en Supabase.
export function isFleetTeacherPilot(profile) {
  return profile?.role === "teacher" && profile?.active !== false &&
    String(profile?.source || "").toLowerCase() === "google" &&
    String(profile?.email || "").trim().toLowerCase() === "pgarciab@fomento.edu";
}

// La cola se guarda en Supabase; la entrega la realiza un único trabajador.
// Únicamente registra premios deterministas. El envío a Google no debe
// ejecutarse jamás desde el panel o desde un guardado de partida.
export async function syncFleetWeekAwards(admin, profileId, weeks, classroomIds) {
  const {data:profile,error:profileError} = await admin.from("profiles")
    .select("role,source,active,email").eq("id",profileId).maybeSingle();
  if (profileError) throw profileError;
  const enrolledStudent = Boolean(classroomIds?.length) && profile?.role === "student" &&
    profile?.active !== false && String(profile?.source || "").toLowerCase() !== "test";
  if (!enrolledStudent && !isFleetTeacherPilot(profile)) return;

  const eligible = (weeks || []).flatMap(week => fleetAwardsForWeek(profileId,week));
  if (!eligible.length) return;
  const {error} = await admin.from("fleet_weekly_awards")
    .upsert(eligible,{onConflict:"award_id",ignoreDuplicates:true});
  if (error) throw error;
}

export async function refreshFleetWeekAwards(admin, profileId, classroomIds) {
  if (!classroomIds?.length) return;
  const weeks = await loadFleetWeeks(admin,profileId);
  await syncFleetWeekAwards(admin,profileId,weeks,classroomIds);
}
