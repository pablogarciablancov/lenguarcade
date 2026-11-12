import {FLEET_START, fleetWeeklySnapshots, fleetAwardsForWeek} from "./fleet-weekly.js";

// Apps Script puede tardar mucho más de 5 s cuando debe adquirir un lock,
// abrir las hojas y escribir Registro. El máximo de cuatro premios por acceso
// evita agotar la vida del worker incluso ante cuatro tiempos de espera.
export const FLEET_WEBHOOK_TIMEOUT_MS = 25000;
export const FLEET_DELIVERY_MAX_AWARDS = 4;

export function isAcknowledgedFleetAward(result, award) {
  return result?.ok === true &&
    String(result.awardId || "") === String(award?.award_id || "") &&
    Number(result.points) === Number(award?.points) &&
    Number(award?.points) === 1;
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

// La entrega es asíncrona: nunca retrasa el guardado del juego ni el acceso al panel.
// El registro local y el identificador remoto hacen seguros los reintentos simultáneos.
export async function syncFleetWeekAwards(admin, profileId, weeks, classroomIds) {
  const {data:profile,error:profileError} = await admin.from("profiles")
    .select("role,source,active,email").eq("id",profileId).maybeSingle();
  if (profileError) throw profileError;
  const enrolledStudent = Boolean(classroomIds?.length) && profile?.role === "student" &&
    profile?.active !== false && String(profile?.source || "").toLowerCase() !== "test";
  if (!enrolledStudent && !isFleetTeacherPilot(profile)) return;

  const endpoint = Deno.env.get("FLEET_MARKER_WEBHOOK_URL") || "";
  const secret = Deno.env.get("FLEET_MARKER_WEBHOOK_SECRET") || "";
  if (!endpoint || !secret) return;
  const eligible = (weeks || []).flatMap(week => fleetAwardsForWeek(profileId,week));
  if (eligible.length) {
    const {error} = await admin.from("fleet_weekly_awards")
      .upsert(eligible,{onConflict:"award_id",ignoreDuplicates:true});
    if (error) throw error;
  }
  const {data:pending,error:pendingError} = await admin.from("fleet_weekly_awards")
    .select("award_id,week_start,award_key,points")
    .eq("profile_id",profileId).is("delivered_at",null)
    .order("week_start",{ascending:true}).order("award_key",{ascending:true}).limit(FLEET_DELIVERY_MAX_AWARDS);
  if (pendingError) throw pendingError;

  // Un único envío a Google por perfil y cada vez. Google Apps Script serializa
  // las escrituras con LockService; enviar dos premios en paralelo solo aumenta
  // las esperas y produce confirmaciones perdidas.
  for (const award of pending || []) {
    const title = award.award_key === "CONSTANCIA"
      ? "LenguArcade: constancia semanal"
      : "LenguArcade: experiencia de juego";
    try {
      const response = await fetch(endpoint, {
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          token:secret, profileId, awardId:award.award_id,
          challengeCompleted:true, subject:"LenguArcade",asignatura:"LenguArcade",
          categoryId:"CAT1",points:award.points,title,
        }),
        signal:AbortSignal.timeout(FLEET_WEBHOOK_TIMEOUT_MS),
      });
      const result = await response.json().catch(()=>null);
      // Incluye los duplicados válidos: Apps Script ya aplicó el premio
      // y devolvió la misma ID y cantidad. Los ACK incorrectos se rechazan.
      if (!response.ok || !isAcknowledgedFleetAward(result,award)) {
        console.error("fleet weekly award rejected",response.status,result?.error || "invalid_ack");
        continue;
      }
      const {error} = await admin.from("fleet_weekly_awards")
        .update({delivered_at:new Date().toISOString()})
        .eq("award_id",award.award_id).is("delivered_at",null);
      if (error) throw error;
    } catch (error) {
      // Nunca dar por entregado un premio si la confirmación se ha perdido:
      // Google deduplica por awardId, así que reintentarlo es seguro.
      console.error("fleet weekly delivery failed",error);
    }
  }
}

export async function refreshFleetWeekAwards(admin, profileId, classroomIds) {
  if (!classroomIds?.length) return;
  const weeks = await loadFleetWeeks(admin,profileId);
  await syncFleetWeekAwards(admin,profileId,weeks,classroomIds);
}
