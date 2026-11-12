import {FLEET_START, fleetWeeklySnapshots, fleetAwardsForWeek} from "./fleet-weekly.js";

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
    .order("week_start",{ascending:true}).order("award_key",{ascending:true}).limit(12);
  if (pendingError) throw pendingError;

  // No lanzar decenas de solicitudes en paralelo a Apps Script durante una clase.
  for (let offset=0;offset<(pending || []).length;offset+=2) {
    const batch = pending.slice(offset,offset+2);
    await Promise.all(batch.map(async award => {
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
          signal:AbortSignal.timeout(5000),
        });
        const result = await response.json().catch(()=>null);
        if (!response.ok || result?.ok !== true) {
          console.error("fleet weekly award rejected",response.status,result?.error || "invalid_response");
          return;
        }
        const {error} = await admin.from("fleet_weekly_awards")
          .update({delivered_at:new Date().toISOString()})
          .eq("award_id",award.award_id).is("delivered_at",null);
        if (error) throw error;
      } catch (error) {
        // El receptor deduplica awardId. Mantener pendiente para el próximo acceso.
        console.error("fleet weekly delivery failed",error);
      }
    }));
  }
}

export async function refreshFleetWeekAwards(admin, profileId, classroomIds) {
  if (!classroomIds?.length) return;
  const weeks = await loadFleetWeeks(admin,profileId);
  await syncFleetWeekAwards(admin,profileId,weeks,classroomIds);
}
