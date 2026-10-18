import {BOSS_GAMES,BOSS_DURATION_SECONDS,battleClock,countBossDamage} from "../_shared/class-boss-engine.js";
import {corsHeaders,jsonResponse,requireTeacherSession,requireProfileSession} from "../_shared/lenguarcade.ts";

function fail(message:string,status=400){return jsonResponse({ok:false,error:message},status);}
function isoNow(){return new Date().toISOString();}
async function resolveClass(admin:any,org:string,code:string){
  if(!code)return null;
  const {data,error}=await admin.from("classrooms").select("id,name,section,legacy_class_code").eq("organization_id",org).eq("active",true);
  if(error)throw error;
  return (data||[]).find((c:any)=>String(c.id)===code||String(c.legacy_class_code||"")===code)||null;
}
async function getActiveWorkshop(admin:any,org:string,classId:string){
  const {data,error}=await admin.from("workshop_sessions")
    .select("plan_id,started_at,game_ids,published,classroom_open")
    .eq("organization_id",org).eq("classroom_id",classId).maybeSingle();
  if(error)throw error;
  return data?.published&&data?.classroom_open?data:null;
}
async function latestBoss(admin:any,org:string,classId:string){
  const {data,error}=await admin.from("class_boss_events").select("*")
    .eq("organization_id",org).eq("classroom_id",classId)
    .order("created_at",{ascending:false}).limit(1);
  if(error)throw error;
  return data?.[0]||null;
}
async function currentBoss(admin:any,org:string,classId:string,workshop:any){
  if(!workshop)return latestBoss(admin,org,classId);
  const {data:run,error:runError}=await admin.from("workshop_runs")
    .select("workshop_key,plan_id").eq("organization_id",org).eq("classroom_id",classId)
    .eq("plan_id",workshop.plan_id).eq("started_at",workshop.started_at)
    .eq("published",true).is("closed_at",null).maybeSingle();
  if(runError)throw runError;
  if(!run)return null;
  const key=String(run.workshop_key||run.plan_id);
  const {data,error}=await admin.from("class_boss_events")
    .select("*").eq("organization_id",org).eq("classroom_id",classId)
    .eq("workshop_key",key).maybeSingle();
  if(error)throw error;
  return data||null;
}
function withClosedInterval(battle:any,at:string){
  const intervals=Array.isArray(battle.intervals)?[...battle.intervals]:[];
  if(battle.state==="active"&&battle.active_since)intervals.push({from:battle.active_since,to:at});
  const elapsed=Number(battle.elapsed_seconds||0)+(battle.state==="active"&&battle.active_since?
    Math.max(0,(Date.parse(at)-Date.parse(battle.active_since))/1000):0);
  return {intervals,elapsed_seconds:Math.round(elapsed),active_since:null,updated_at:at};
}
async function getWorkshopForBoss(admin:any,battle:any,workshop:any){
  if(!workshop)return false;
  const {data,error}=await admin.from("workshop_runs")
    .select("workshop_key,plan_id").eq("organization_id",battle.organization_id)
    .eq("classroom_id",battle.classroom_id).eq("plan_id",workshop.plan_id)
    .eq("started_at",workshop.started_at).eq("published",true).is("closed_at",null).maybeSingle();
  if(error)throw error;
  return data&&String(data.workshop_key||data.plan_id)===String(battle.workshop_key);
}
async function getBossPeriods(admin:any,battle:any){
  const {data:runs,error:runsError}=await admin.from("workshop_runs")
    .select("run_id,plan_id,workshop_key,started_at,closed_at,published,classroom_open,game_ids")
    .eq("organization_id",battle.organization_id).eq("classroom_id",battle.classroom_id)
    .eq("published",true).order("started_at",{ascending:true});
  if(runsError)throw runsError;
  return (runs||[]).filter((r:any)=>String(r.workshop_key||r.plan_id)===String(battle.workshop_key));

}
async function battleSummary(admin:any,battle:any,workshop:any){
  if(!battle)return null;
  const now=Date.now();
  const {data:enrollments,error:enrollmentError}=await admin.from("classroom_enrollments")
    .select("profile_id").eq("classroom_id",battle.classroom_id).eq("active",true);
  if(enrollmentError)throw enrollmentError;
  const members=(enrollments||[]).map((r:any)=>String(r.profile_id));
  const periods=await getBossPeriods(admin,battle);
  const events:any[]=[];
  if(members.length&&periods.length){
    for(let offset=0;offset<5000;offset+=1000){
      const {data,error}=await admin.from("game_events")
        .select("id,profile_id,game_id,event_type,xp_delta,occurred_at")
        .in("profile_id",members).in("game_id",battle.game_ids)
        .gt("xp_delta",0).gte("occurred_at",battle.started_at)
        .lte("occurred_at",new Date(now).toISOString())
        .order("occurred_at",{ascending:true}).order("id",{ascending:true})
        .range(offset,offset+999);
      if(error)throw error;
      events.push(...(data||[]));
      if((data||[]).length<1000)break;
    }
  }
  const tally=countBossDamage(events,battle,periods,now);
  const remainingSeconds=battleClock(battle,now,periods);
  const workshopMatches=Boolean(workshop&&workshop.plan_id&&
    periods.some((p:any)=>String(p.plan_id)===String(workshop.plan_id)&&p.closed_at===null));
  const finished=battle.state==="finished"||remainingSeconds<=0||tally.health===0;
  return {
    id:battle.id,state:finished?"finished":workshopMatches?battle.state:"paused",
    outcome:tally.health===0?"victory":finished?"defeat":null,
    title:"El Devorapalabras",health:tally.health,totalHealth:battle.health_total,
    remainingSeconds,damage:tally.damage,hits:tally.hits,combos:tally.combos,
    gameIds:battle.game_ids,workshopRunId:battle.workshop_run_id,
    workshopOpen:workshopMatches,startedAt:battle.started_at
  };
}
Deno.serve(async(request)=>{
  if(request.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(request.method!=="POST")return fail("method_not_allowed",405);
  try{
    const body=await request.json().catch(()=>({}));
    const action=String(body.action||"status");
    if(action==="studentStatus"){
      const {admin,profileId,organizationId}=await requireProfileSession(request,{gatewayVerifiedJwt:true});
      const {data:memberships,error:membershipError}=await admin.from("classroom_enrollments")
        .select("classroom_id").eq("profile_id",profileId).eq("active",true);
      if(membershipError)throw membershipError;
      for(const member of memberships||[]){
        const workshop=await getActiveWorkshop(admin,organizationId,member.classroom_id);
        if(!workshop)continue;
        const battle=await currentBoss(admin,organizationId,member.classroom_id,workshop);
        if(!battle||battle.state!=="active"||!battle.game_ids?.length)continue;
        const {data:currentRun,error:runError}=await admin.from("workshop_runs")
          .select("run_id,workshop_key,plan_id,closed_at").eq("organization_id",organizationId)
          .eq("classroom_id",member.classroom_id).eq("plan_id",workshop.plan_id)
          .eq("started_at",workshop.started_at).eq("published",true).is("closed_at",null).maybeSingle();
        if(runError)throw runError;
        if(currentRun&&String(currentRun.workshop_key||currentRun.plan_id)===String(battle.workshop_key)&&
          battleClock(battle,Date.now(),await getBossPeriods(admin,battle))>0)return jsonResponse({ok:true,event:{id:battle.id,title:"El Devorapalabras",state:battle.state}});

      }
      return jsonResponse({ok:true,event:null});
    }
    if(!["status","start","pause","resume","finish"].includes(action))return fail("invalid_action");
    const {admin,organizationId,profileId}=await requireTeacherSession(request);
    const classroom=await resolveClass(admin,organizationId,String(body.classCode||""));
    if(!classroom)return fail("class_not_found",404);
    const workshop=await getActiveWorkshop(admin,organizationId,classroom.id);
    let battle=await currentBoss(admin,organizationId,classroom.id,workshop);
    if(action==="start"){
      if(!workshop)return fail("open_workshop_first",409);
      if(!BOSS_GAMES.every(id=>(workshop.game_ids||[]).includes(id)))return fail("select_boss_games_in_workshop",409);
      const {data:run,error:runError}=await admin.from("workshop_runs")
        .select("run_id,workshop_key,plan_id,started_at,closed_at,published")
        .eq("organization_id",organizationId).eq("classroom_id",classroom.id)
        .eq("plan_id",workshop.plan_id).eq("started_at",workshop.started_at)
        .eq("published",true).is("closed_at",null).maybeSingle();
      if(runError)throw runError;
      if(!run)return fail("workshop_run_missing",409);
      const logicalKey=String(run.workshop_key||run.plan_id);
      const previous=battle&&String(battle.workshop_key)===logicalKey?battle:null;
      if(previous)return jsonResponse({ok:true,event:await battleSummary(admin,previous,workshop),reused:true});
      const {count,error:countError}=await admin.from("classroom_enrollments")
        .select("profile_id",{count:"exact",head:true}).eq("classroom_id",classroom.id).eq("active",true);
      if(countError)throw countError;
      const duration=BOSS_DURATION_SECONDS; // Server-enforced limit; ignore client duration parameters.
      const initialHealth=Math.max(8,Math.min(5000,Math.max(1,count||0)*8));
      const now=isoNow();
      const {data, error}=await admin.from("class_boss_events")
        .insert({organization_id:organizationId,classroom_id:classroom.id,
          workshop_run_id:run.run_id,workshop_key:run.workshop_key||run.plan_id,
          game_ids:BOSS_GAMES,state:"active",duration_seconds:duration,health_total:initialHealth,
          started_at:now,active_since:now,created_by:profileId})
        .select("*").single();
      if(error){
        if(error.code==="23505")return fail("event_already_exists_reload",409);
        throw error;
      }
      battle=data;
    }else if(action!=="status"){
      if(!battle)return fail("boss_not_found",404);
      if(action==="resume"&&(!workshop||!(await getWorkshopForBoss(admin,battle,workshop))))return fail("open_same_workshop_first",409);
      if(action!=="finish"&&(battle.state==="finished"||battleClock(battle,Date.now(),await getBossPeriods(admin,battle))<=0))return fail("boss_finished",409);
      if(action==="pause"&&battle.state==="active"){
        const at=isoNow(); const {data,error}=await admin.from("class_boss_events")
          .update({...withClosedInterval(battle,at),state:"paused"}).eq("id",battle.id).eq("state","active").select("*").maybeSingle();
        if(error)throw error;if(!data)return fail("event_state_changed",409);battle=data;
      }
      if(action==="resume"&&battle.state==="paused"){
        const {data,error}=await admin.from("class_boss_events")
          .update({state:"active",active_since:isoNow(),updated_at:isoNow()})
          .eq("id",battle.id).eq("state","paused").select("*").maybeSingle();
        if(error)throw error;if(!data)return fail("event_state_changed",409);battle=data;
      }
      if(action==="finish"){
        const at=isoNow(); const {data,error}=await admin.from("class_boss_events")
          .update({...withClosedInterval(battle,at),state:"finished"})
          .eq("id",battle.id).select("*").single();
        if(error)throw error;battle=data;
      }
    }
    const summary=await battleSummary(admin,battle,workshop);
    if(action==="status"&&battle&&battle.state!=="finished"&&summary?.state==="finished"&&summary.outcome){
      const now=isoNow();
      const {error}=await admin.from("class_boss_events")
        .update({...withClosedInterval(battle,now),state:"finished"})
        .eq("id",battle.id).eq("state",battle.state);
      if(error)console.error("class-boss automatic finish failed",error);
    }
    return jsonResponse({ok:true,event:summary});
  }catch(error){
    if(error instanceof Response)return error;
    console.error("class-boss error",error);
    return fail("class_boss_unavailable",503);
  }
});
