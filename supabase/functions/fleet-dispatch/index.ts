import {createClient} from "npm:@supabase/supabase-js@2";
import {
  FLEET_WEBHOOK_TIMEOUT_MS, FLEET_DELIVERY_MAX_AWARDS, isAcknowledgedFleetAward,
} from "../_shared/fleet-weekly-delivery.js";

// Ejecutado exclusivamente por Supabase Cron. El secreto se genera en SQL y
// vive cifrado en Vault; esta función no admite usuarios ni peticiones anónimas.
// Su lease único impide que 25 alumnos envíen premios a Apps Script a la vez.
Deno.serve(async request => {
  if (request.method !== "POST") return new Response("method_not_allowed",{status:405});
  const token = String(request.headers.get("x-fleet-worker-token") || "").trim();
  if (!/^[0-9a-f]{64}$/.test(token)) return new Response("unauthorized",{status:401});

  const url=Deno.env.get("SUPABASE_URL") || "";
  const serviceRole=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const endpoint=Deno.env.get("FLEET_MARKER_WEBHOOK_URL") || "";
  const secret=Deno.env.get("FLEET_MARKER_WEBHOOK_SECRET") || "";
  if (!url || !serviceRole || !endpoint || !secret) {
    console.error("fleet dispatcher configuration incomplete");
    return new Response("not_configured",{status:503});
  }

  const admin=createClient(url,serviceRole,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:leaseOwner,error:leaseError}=await admin.rpc("fleet_begin_dispatch",{p_token:token});
  if (leaseError) {
    console.error("fleet dispatcher lease unavailable",leaseError);
    return new Response("lease_error",{status:503});
  }
  if (!leaseOwner) return Response.json({ok:true,busy:true});

  let delivered=0,failed=0;
  try {
    // Un taller terminado tiene prioridad, pero las recompensas semanales
    // permanecen en cola hasta su confirmación individual.
    const [{data:workshops,error:workshopError},{data:weekly,error:weeklyError}]=await Promise.all([
      admin.from("fleet_workshop_awards")
        .select("award_id,profile_id,points,title").is("delivered_at",null)
        .order("created_at",{ascending:true}).order("award_id",{ascending:true})
        .limit(FLEET_DELIVERY_MAX_AWARDS),
      admin.from("fleet_weekly_awards")
        .select("award_id,profile_id,points,award_key").is("delivered_at",null)
        .order("week_start",{ascending:true}).order("award_id",{ascending:true})
        .limit(FLEET_DELIVERY_MAX_AWARDS),
    ]);
    if (workshopError || weeklyError) throw workshopError || weeklyError;
    const queue=[
      ...(workshops||[]).map(award=>({...award,kind:"workshop"})),
      ...(weekly||[]).map(award=>({...award,kind:"weekly"})),
    ].slice(0,FLEET_DELIVERY_MAX_AWARDS);

    for (const award of queue) {
      const title=award.kind==="workshop"
        ? String(award.title || "Taller de LenguArcade").slice(0,120)
        : award.award_key==="CONSTANCIA"
          ? "LenguArcade: constancia semanal"
          : "LenguArcade: experiencia de juego";
      // Solo aceptar los dos tipos de premio previstos en el sistema.
      if ((award.kind==="weekly" && Number(award.points)!==1) ||
          (award.kind==="workshop" && Number(award.points)!==5)) {
        failed++;
        console.error("fleet dispatcher invalid points",award.kind);
        continue;
      }
      try {
        const response=await fetch(endpoint,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            token:secret,profileId:award.profile_id,awardId:award.award_id,
            challengeCompleted:true,subject:"LenguArcade",asignatura:"LenguArcade",
            categoryId:"CAT1",points:award.points,title,
          }),
          signal:AbortSignal.timeout(FLEET_WEBHOOK_TIMEOUT_MS),
        });
        const result=await response.json().catch(()=>null);
        // La respuesta duplicate:true también es éxito: Google ya aplicó el premio.
        if (!response.ok || !isAcknowledgedFleetAward(result,award)) {
          failed++;
          console.error("fleet dispatcher rejected",response.status,result?.error || "invalid_ack");
          continue;
        }
        const table=award.kind==="workshop"?"fleet_workshop_awards":"fleet_weekly_awards";
        const {error}=await admin.from(table)
          .update({delivered_at:new Date().toISOString()})
          .eq("award_id",award.award_id).is("delivered_at",null);
        if (error) throw error;
        delivered++;
      } catch (error) {
        failed++;
        // No dar por entregado sin ACK. award_id estable => reintentos seguros.
        console.error("fleet dispatcher delivery error",error);
      }
    }
    return Response.json({ok:true,processed:delivered+failed,delivered,failed});
  } catch (error) {
    console.error("fleet dispatcher failed",error);
    return new Response("dispatch_unavailable",{status:503});
  } finally {
    const {error}=await admin.rpc("fleet_end_dispatch",{p_token:token,p_owner:leaseOwner});
    if (error) console.error("fleet dispatcher release failed",error);
  }
});
