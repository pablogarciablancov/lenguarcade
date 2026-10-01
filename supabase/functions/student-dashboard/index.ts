import {levelProgress,learningGrade,platformMilestones} from "../_shared/progression.js";
import {
  corsHeaders,
  jsonResponse,
  requireProfileSession,
} from "../_shared/lenguarcade.ts";
import { studentGameAccess, studentGameButtonLabel, workshopModeFor } from "../_shared/student-access.ts";

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function missionProgressValue(
  mission: Record<string, unknown>,
  progress: Array<Record<string, unknown>>,
  missionEvents: Array<Record<string, unknown>>,
) {
  const rawGameId = String(mission.game_id || "");
  const gameId = rawGameId === "general" ? "" : rawGameId;
  const type = String(mission.mission_type || "");
  const activeFrom = mission.active_from ? Date.parse(String(mission.active_from)) : Number.NaN;
  const activeTo = mission.active_to ? Date.parse(String(mission.active_to)) : Number.NaN;
  const scoped = gameId ? progress.filter(row => String(row.game_id) === gameId) : progress;

  if (type === "save") {
    return scoped.filter(row => {
      const savedAt = Date.parse(String(row.last_activity_at || ""));
      if (!Number.isFinite(savedAt)) return false;
      if (Number.isFinite(activeFrom) && savedAt < activeFrom) return false;
      if (Number.isFinite(activeTo) && savedAt > activeTo) return false;
      return true;
    }).length;
  }

  if (Number.isFinite(activeFrom)) {
    const events = missionEvents.filter(row => {
      if (String(row.event_type || "") === "teacher_adjustment") return false;
      if (gameId && String(row.game_id) !== gameId) return false;
      const occurredAt = Date.parse(String(row.occurred_at || ""));
      if (!Number.isFinite(occurredAt) || occurredAt < activeFrom) return false;
      if (Number.isFinite(activeTo) && occurredAt > activeTo) return false;
      return true;
    });
    if (type === "sessions") return events.filter(e=>e.details?.sessionCounted!==false).length;
    if (type === "variety") return new Set(events.map(row => String(row.game_id || "")).filter(Boolean)).size;
    if (type === "xp") return events.reduce((sum, row) => sum + Math.max(0, Number(row.xp_delta || 0)), 0);
    if (type === "accuracy") return events.reduce((max, row) => Math.max(max, Number(row.accuracy || 0)), 0);
    return 0;
  }

  if (type === "sessions") {
    return scoped.reduce((sum, row) => sum + Number(row.sessions || 0), 0);
  }
  if (type === "variety") {
    return scoped.filter(row => Number(row.sessions || 0) > 0).length;
  }
  if (type === "xp") {
    return scoped.reduce((sum, row) => sum + Number(row.xp || 0), 0);
  }
  if (type === "accuracy") {
    const attempts = scoped.reduce((sum, row) => sum + Number(row.attempts || 0), 0);
    const successes = scoped.reduce((sum, row) => sum + Number(row.successes || 0), 0);
    return attempts ? Math.round((successes / attempts) * 100) : 0;
  }
  return 0;
}

function missionTypeLabel(type: unknown) {
  return ({
    sessions:"Partidas",
    save:"Progreso guardado",
    variety:"Juegos distintos",
    xp:"XP conseguido",
    accuracy:"Precisión",
  } as Record<string, string>)[String(type || "")] || "Objetivo";
}


function missionFinishedAt(mission: any, events: any[]) {
  const target = Math.max(0, Number(mission.target || 0));
  if (!target) return null;
  const gameId = String(mission.game_id || "") === "general" ? "" : String(mission.game_id || "");
  const from = mission.active_from ? Date.parse(String(mission.active_from)) : -Infinity;
  const to = mission.active_to ? Date.parse(String(mission.active_to)) : Infinity;
  const rows = (events || []).filter(event => {
    const at = Date.parse(String(event.occurred_at || ""));
    return event.event_type !== "teacher_adjustment" &&
      (!gameId || String(event.game_id) === gameId) &&
      Number.isFinite(at) && at >= from && at <= to;
  }).sort((a,b)=>Date.parse(a.occurred_at)-Date.parse(b.occurred_at));
  let value=0; const games=new Set();
  for(const event of rows){
    if(mission.mission_type==="sessions" && event.details?.sessionCounted!==false)value++;
    if(mission.mission_type==="xp")value+=Math.max(0,Number(event.xp_delta||0));
    if(mission.mission_type==="accuracy")value=Math.max(value,Math.max(0,Number(event.accuracy||0)));
    if(mission.mission_type==="variety"){games.add(String(event.game_id||""));value=games.size;}
    if(value>=target)return event.occurred_at||null;
  }
  return null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  try {
    const { admin, profileId, organizationId } = await requireProfileSession(request);
    const [
      profileResult,
      gamesResult,
      progressResult,
      eventsResult,
      achievementsResult,
      enrollmentsResult,
      missionsResult,
      missionEventsResult,
      adjustmentsResult,
      evaluationsResult,
      gameAccessResult,
      workshopSessionsResult,
    ] = await Promise.all([
      admin.from("profiles")
        .select("id,email,first_name,last_name,avatar,last_login_at,role")
        .eq("id", profileId)
        .single(),
      admin.from("games")
        .select("id,name,subtitle,category,status,sort_order,color,icon,url,banner,active,description,competencies,integration,official")
        .eq("active", true)
        .eq("official", true)
        .order("sort_order"),
      admin.from("game_progress")
        .select("game_id,xp,level,percentage,accuracy,attempts,successes,errors,streak,sessions,achievements_count,missions_completed,feathers,last_activity_at,raw_data")
        .eq("profile_id", profileId),
      admin.from("game_events")
        .select("result_id,game_id,event_type,xp_delta,feathers_delta,accuracy,details,occurred_at")
        .eq("profile_id", profileId)
        .order("occurred_at", { ascending:false })
        .limit(8),
      admin.from("player_achievements")
        .select("game_id,achievement_id,unlocked_at,achievement_definitions(title,description,xp_reward,hidden)")
        .eq("profile_id", profileId)
        .order("unlocked_at", { ascending:false })
        .limit(100),
      admin.from("classroom_enrollments")
        .select("classroom_id,classrooms(name,section,legacy_class_code)")
        .eq("profile_id", profileId)
        .eq("active", true),
      admin.from("mission_definitions")
        .select("id,title,description,game_id,mission_type,target,reward_xp,reward_feathers,active_from,active_to,classroom_id,target_profile_id,featured,priority,organization_id,active,publication_status,created_at,updated_at")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending:false })
        .limit(250),
      admin.from("game_events")
        .select("game_id,event_type,xp_delta,accuracy,occurred_at,details")
        .eq("profile_id", profileId)
        .order("occurred_at", { ascending:false })
        .limit(5000),
      admin.from("game_events")
        .select("xp_delta,feathers_delta,occurred_at")
        .eq("profile_id", profileId)
        .eq("event_type", "teacher_adjustment")
        .order("occurred_at", { ascending:false })
        .limit(1000),
      admin.from("evaluations")
        .select("scope,game_id,score,breakdown,updated_at")
        .eq("profile_id", profileId),
      admin.from("profile_game_access")
        .select("game_id,enabled")
        .eq("profile_id", profileId),
      admin.from("workshop_sessions")
        .select("classroom_id,title,message,target_xp,published,classroom_open,home_enabled,active_from,active_to,game_ids,plan_id,started_at,updated_at")
        .eq("organization_id", organizationId)
        .eq("published", true),
    ]);

    const failure = [
      profileResult.error,
      gamesResult.error,
      progressResult.error,
      eventsResult.error,
      achievementsResult.error,
      enrollmentsResult.error,
      missionsResult.error,
      missionEventsResult.error,
      adjustmentsResult.error,
      evaluationsResult.error,
      gameAccessResult.error,
      workshopSessionsResult.error,
    ].find(Boolean);
    if (failure || !profileResult.data) {
      console.error("student-dashboard query failed", failure);
      return jsonResponse({ ok:false, error:"dashboard_unavailable" }, 503);
    }

    const profile = profileResult.data;
    const progress = progressResult.data || [];
    const accessByGame = new Map((gameAccessResult.data || []).map(row => [String(row.game_id), row.enabled !== false]));
    const classroomIds = new Set((enrollmentsResult.data || []).map(row => String(row.classroom_id || "")).filter(Boolean));
    const workshopSessionRow = (workshopSessionsResult.data || []).find(row => classroomIds.has(String(row.classroom_id || ""))) || null;
    const workshopSelectedGameIds = new Set(
      Array.isArray(workshopSessionRow?.game_ids)
        ? workshopSessionRow.game_ids.map((value: unknown) => String(value || ""))
        : []
    );
    const workshopMode = workshopModeFor(workshopSessionRow);
    const workshopActive = workshopMode === "classroom" || workshopMode === "home";
    const progressByGame = new Map(progress.map(row => [row.game_id, row]));
    const attempts = progress.reduce((sum, row) => sum + Number(row.attempts || 0), 0);
    const successes = progress.reduce((sum, row) => sum + Number(row.successes || 0), 0);
    const baseXp = progress.reduce((sum, row) => sum + Number(row.xp || 0), 0);
    const baseFeathers = progress.reduce((sum, row) => sum + Number(row.feathers || 0), 0);
    const adjustments = adjustmentsResult.data || [];
    const manualXp = adjustments.reduce((sum, row) => sum + Number(row.xp_delta || 0), 0);
    const manualFeathers = adjustments.reduce((sum, row) => sum + Number(row.feathers_delta || 0), 0);
    const xp = Math.max(0, baseXp + manualXp);
    const feathers = Math.max(0, baseFeathers + manualFeathers);
    const sessions = progress.reduce((sum, row) => sum + Number(row.sessions || 0), 0);
    const leveling = levelProgress(xp);
    const level = leveling.level;
    const classroomRelation = (enrollmentsResult.data || [])[0]?.classrooms;
    const classroom = Array.isArray(classroomRelation) ? classroomRelation[0] : classroomRelation || null;
    const workshopStartedAt = workshopSessionRow?.started_at || workshopSessionRow?.updated_at || null;
    const workshopStartedMs = workshopStartedAt ? Date.parse(String(workshopStartedAt)) : Number.NaN;
    const workshopEndsMs = workshopSessionRow?.active_to ? Date.parse(String(workshopSessionRow.active_to)) : Number.NaN;
    const workshopXp = workshopSessionRow
      ? (missionEventsResult.data || []).reduce((sum, row) => {
          const occurredAt = Date.parse(String(row.occurred_at || ""));
          if (!Number.isFinite(occurredAt)) return sum;
          if (Number.isFinite(workshopStartedMs) && occurredAt < workshopStartedMs) return sum;
          if (Number.isFinite(workshopEndsMs) && occurredAt > workshopEndsMs) return sum;
          if (!workshopSelectedGameIds.has(String(row.game_id || ""))) return sum;
          if (String(row.event_type || "") === "teacher_adjustment") return sum;
          return sum + Math.max(0, Number(row.xp_delta || 0));
        }, 0)
      : 0;
    const workshopTargetXp = Math.max(0, Number(workshopSessionRow?.target_xp || 0));
    const workshopCompleted = Boolean(workshopSessionRow && workshopTargetXp > 0 && workshopXp >= workshopTargetXp);
    const workshopSession = workshopSessionRow ? {
      classCode:String(classroom?.legacy_class_code || ""),
      classroomId:String(workshopSessionRow.classroom_id || ""),
      title:String(workshopSessionRow.title || "Taller"),
      message:String(workshopSessionRow.message || ""),
      targetXp:workshopTargetXp,
      progressXp:workshopXp,
      progressPercent:workshopTargetXp > 0 ? Math.min(100, Math.round(workshopXp / workshopTargetXp * 100)) : 0,
      completed:workshopCompleted,
      startedAt:workshopStartedAt,
      published:workshopSessionRow.published === true,
      classroomOpen:workshopSessionRow.classroom_open === true,
      homeEnabled:workshopSessionRow.home_enabled === true,
      homeStart:workshopSessionRow.active_from || "",
      homeEnd:workshopSessionRow.active_to || "",
      gameIds:[...workshopSelectedGameIds],
      planId:String(workshopSessionRow.plan_id || ""),
      mode:workshopMode,
      active:workshopActive,
      updatedAt:workshopSessionRow.updated_at || "",
    } : null;

    const games = (gamesResult.data || []).map(game => {
      const estado = game.status;
      const integration = String(game.integration || "none");
      const access = studentGameAccess(game, accessByGame, workshopSessionRow, workshopSelectedGameIds, workshopActive);
      const row = progressByGame.get(game.id) || {
        game_id:game.id,
        xp:0,
        level:1,
        percentage:0,
        accuracy:0,
        attempts:0,
        successes:0,
        errors:0,
        streak:0,
        sessions:0,
        achievements_count:0,
        missions_completed:0,
        feathers:0,
        last_activity_at:null,
        raw_data:{},
      };
      return {
        gameId:game.id,
        nombre:game.name,
        subtitulo:game.subtitle,
        categoria:game.category,
        estado,
        orden:game.sort_order,
        color:game.color,
        icono:game.icon,
        url:game.url,
        banner:game.banner,
        descripcion:game.description || "",
        competencias:game.competencies || "",
        integration,
        catalogLocked:access.catalogLocked,
        accessEnabled:access.accessEnabled,
        accessSource:access.accessSource,
        lockedByTeacher:access.lockedByTeacher,
        lockedByWorkshop:access.lockedByWorkshop,
        locked:access.locked,
        buttonLabel:studentGameButtonLabel(access, estado, Number(row.sessions || 0)),
        progress:{
          studentId:profile.id,
          gameId:row.game_id,
          gameName:game.name,
          xp:Number(row.xp || 0),
          nivel:Number(row.level || 1),
          percentage:Number(row.percentage || 0),
          accuracy:Number(row.accuracy || 0),
          attempts:Number(row.attempts || 0),
          successes:Number(row.successes || 0),
          errors:Number(row.errors || 0),
          streak:Number(row.streak || 0),
          sessions:Number(row.sessions || 0),
          achievementsCount:Number(row.achievements_count || 0),
          missionsCompleted:Number(row.missions_completed || 0),
          plumas:Number(row.feathers || 0),
          lastActivity:row.last_activity_at || "",
          rawJson:row.raw_data || {},
        },
      };
    });

    const nowMs = Date.now();
    const missionClassroomIds = new Set((enrollmentsResult.data || []).map(row => String(row.classroom_id || "")));
    const gameNameById = new Map((gamesResult.data || []).map(game => [String(game.id), String(game.name || game.id)]));
    const missionProgress = (missionsResult.data || [])
      .filter(mission => {
        if (mission.target_profile_id && String(mission.target_profile_id) !== String(profileId)) return false;
        if (mission.classroom_id && !missionClassroomIds.has(String(mission.classroom_id))) return false;
        const from = mission.active_from ? Date.parse(String(mission.active_from)) : Number.NaN;
        const to = mission.active_to ? Date.parse(String(mission.active_to)) : Number.NaN;
        if (Number.isFinite(from) && from > nowMs) return false;
        if (Number.isFinite(to) && to <= nowMs) return false;
        return true;
      })
      .map(mission => {
        const current = missionProgressValue(mission, progress, missionEventsResult.data || []);
        const target = Math.max(0, Number(mission.target || 0));
        const completed = target > 0 && current >= target;
        const storedGameId = String(mission.game_id || "");
        const gameId = storedGameId === "general" ? "" : storedGameId;
        return {
          id:mission.id,
          title:mission.title,
          description:mission.description,
          missionType:String(mission.mission_type || ""),
          typeLabel:missionTypeLabel(mission.mission_type),
          gameId,
          gameName:gameId ? (gameNameById.get(gameId) || gameId) : "",
          progress:Math.min(current, target),
          rawProgress:current,
          target,
          completed,
          featured:Boolean(mission.featured),
          priority:Number(mission.priority || 0),
          dueAt:mission.active_to || null,
          scope:mission.target_profile_id ? "student" : (mission.classroom_id ? "classroom" : "global"),
          rewardXp:Number(mission.reward_xp || 0),
          rewardPlumas:Number(mission.reward_feathers || 0),
        };
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const aDue = a.dueAt ? Date.parse(String(a.dueAt)) : Number.POSITIVE_INFINITY;
        const bDue = b.dueAt ? Date.parse(String(b.dueAt)) : Number.POSITIVE_INFINITY;
        if (aDue !== bDue) return aDue - bDue;
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.priority - a.priority;
      });

    const percentage = Math.round(average(progress.map(row => Number(row.percentage || 0))));
    const accuracy = attempts ? Math.round((successes / attempts) * 100) : 0;
    const evaluation = learningGrade(progress,missionProgress);
    const grade = evaluation.score;
    const platformAchievements = platformMilestones(xp,grade,attempts);
    const unlocked=platformAchievements.filter(a=>a.unlocked);
    if(unlocked.length){const {error}=await admin.from('platform_achievements').upsert(unlocked.map(a=>({profile_id:profileId,achievement_id:a.id})),{onConflict:'profile_id,achievement_id',ignoreDuplicates:true});if(error)throw error;}
    const {data:milestones,error:milestoneError}=await admin.from('platform_achievements').select('achievement_id,unlocked_at').eq('profile_id',profileId);
    if(milestoneError)throw milestoneError;
    platformAchievements.forEach(a=>{const saved=(milestones||[]).find(m=>m.achievement_id===a.id);if(saved){a.unlocked=true;a.unlockedAt=saved.unlocked_at;}});

    return jsonResponse({
      ok:true,
      source:"supabase",
      student:{
        studentId:profile.id,
        nombre:profile.first_name,
        apellidos:profile.last_name,
        email:profile.email,
        clase:profile.role === "student" ? (classroom?.legacy_class_code || classroom?.name || "") : "Profesor",
        role:profile.role,
        avatar:profile.avatar || {},
        xpGeneral:xp,
        nivelGeneral:level,
        plumas:feathers,
        ajusteXpProfesor:manualXp,
        ajustePlumasProfesor:manualFeathers,
        ultimaSesion:profile.last_login_at || "",
      },
      general:{
        xp,
        baseXp,
        manualXp,
        level,
        ...leveling,
        plumas:feathers,
        basePlumas:baseFeathers,
        manualPlumas:manualFeathers,
        percentage,
        accuracy,
        sessions,
        gamesPlayed:progress.filter(row => Number(row.sessions || 0) > 0).length,
        totalGames:games.filter(game => !game.locked).length,
      },
      games,
      workshopSession,
      events:(eventsResult.data || []).map(row => ({
        resultId:row.result_id,
        gameId:row.game_id,
        eventType:row.event_type,
        xpDelta:Number(row.xp_delta || 0),
        plumasDelta:Number(row.feathers_delta || 0),
        accuracy:Number(row.accuracy || 0),
        details:row.details || {},
        timestamp:row.occurred_at,
      })),
      achievements:(achievementsResult.data || []).map(row => ({
        achievementId:row.achievement_id,
        gameId:row.game_id,
        title:row.achievement_definitions?.title || row.achievement_id,
        description:row.achievement_definitions?.description || "",
        xpReward:Number(row.achievement_definitions?.xp_reward || 0),
        hidden:Boolean(row.achievement_definitions?.hidden),
        unlockedAt:row.unlocked_at,
      })),
      ranking:[],
      missions:missionProgress,
      evaluations:(evaluationsResult.data || []).map(row => ({
        scope:row.scope,
        gameId:row.game_id,
        score:Number(row.score || 0),
        breakdown:row.breakdown || {},
        updatedAt:row.updated_at,
      })),
      grade:evaluation,
      platformAchievements,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("student-dashboard failed", error);
    return jsonResponse({ ok:false, error:"dashboard_unavailable" }, 503);
  }
});
