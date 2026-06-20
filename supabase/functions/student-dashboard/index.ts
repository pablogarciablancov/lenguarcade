import {
  corsHeaders,
  jsonResponse,
  requireProfileSession,
} from "../_shared/lenguarcade.ts";

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

const integrations: Record<string, { url:string; integration:string }> = {
  maniacgrafia:{
    url:"https://script.google.com/macros/s/AKfycbxgtB6NP9zVvkkEZjodyGhSQbZmFifeFdMf8uDr0QsXoWsp_AxZdb7OFxtS5vKM-VruPw/exec?view=alumno",
    integration:"embedded",
  },
  scrabble:{
    url:"https://script.google.com/macros/s/AKfycbxcVJ1I8jFuhbwjjPPzGFcCdku_LDnXKeZEmnpNYwYo9beCEyNHN8ElzWnXxxjyJFJb/exec",
    integration:"embedded",
  },
  narratoria:{
    url:"https://script.google.com/macros/s/AKfycbyYW1m5zkvLc87XHUqCqNZpY59ZVA6wv6GyxqB_g7u19tRbE22eYZINSV7BHZLkbLpa/exec?page=narratoria",
    integration:"embedded",
  },
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  try {
    const { admin, profileId } = await requireProfileSession(request);
    const [
      profileResult,
      gamesResult,
      progressResult,
      eventsResult,
      achievementsResult,
      enrollmentsResult,
      missionsResult,
    ] = await Promise.all([
      admin.from("profiles")
        .select("id,email,first_name,last_name,avatar,last_login_at,role")
        .eq("id", profileId)
        .single(),
      admin.from("games")
        .select("id,name,subtitle,category,status,sort_order,color,icon,url,banner,active")
        .eq("active", true)
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
        .select("id,title,description,game_id,mission_type,target,reward_xp,reward_feathers")
        .eq("active", true),
    ]);

    const failure = [
      profileResult.error,
      gamesResult.error,
      progressResult.error,
      eventsResult.error,
      achievementsResult.error,
      enrollmentsResult.error,
      missionsResult.error,
    ].find(Boolean);
    if (failure || !profileResult.data) {
      console.error("student-dashboard query failed", failure);
      return jsonResponse({ ok:false, error:"dashboard_unavailable" }, 503);
    }

    const profile = profileResult.data;
    const progress = progressResult.data || [];
    const progressByGame = new Map(progress.map(row => [row.game_id, row]));
    const attempts = progress.reduce((sum, row) => sum + Number(row.attempts || 0), 0);
    const successes = progress.reduce((sum, row) => sum + Number(row.successes || 0), 0);
    const xp = progress.reduce((sum, row) => sum + Number(row.xp || 0), 0);
    const feathers = progress.reduce((sum, row) => sum + Number(row.feathers || 0), 0);
    const sessions = progress.reduce((sum, row) => sum + Number(row.sessions || 0), 0);
    const level = Math.floor(xp / 500) + 1;
    const classroomRelation = (enrollmentsResult.data || [])[0]?.classrooms;
    const classroom = Array.isArray(classroomRelation) ? classroomRelation[0] : classroomRelation || null;

    const games = (gamesResult.data || []).map(game => {
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
        estado:game.status,
        orden:game.sort_order,
        color:game.color,
        icono:game.icon,
        url:game.url,
        banner:game.banner,
        ...(integrations[game.id] || {}),
        locked:String(game.status || "").toLowerCase().includes("coming"),
        buttonLabel:Number(row.sessions || 0) > 0 ? "Continuar" : "Jugar",
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

    const missionProgress = (missionsResult.data || []).map(mission => {
      let current = 0;
      if (mission.mission_type === "sessions") current = sessions;
      if (mission.mission_type === "variety") current = progress.filter(row => Number(row.sessions || 0) > 0).length;
      if (mission.mission_type === "accuracy") current = Math.max(0, ...progress.map(row => Number(row.accuracy || 0)));
      return {
        id:mission.id,
        title:mission.title,
        description:mission.description,
        progress:Math.min(current, Number(mission.target || 0)),
        target:Number(mission.target || 0),
        completed:current >= Number(mission.target || 0),
        rewardXp:Number(mission.reward_xp || 0),
        rewardPlumas:Number(mission.reward_feathers || 0),
      };
    });

    const percentage = Math.round(average(progress.map(row => Number(row.percentage || 0))));
    const accuracy = attempts ? Math.round((successes / attempts) * 100) : 0;
    const grade = Math.round((
      Math.min(10, xp / Math.max(1, progress.length) / 80) * 0.25 +
      Math.min(10, accuracy / 10) * 0.25 +
      Math.min(10, average(progress.map(row => Number(row.missions_completed || 0))) * 2.5) * 0.20 +
      Math.min(10, average(progress.map(row => Number(row.sessions || 0))) * 2) * 0.15 +
      Math.min(10, progress.filter(row => Number(row.sessions || 0) > 0).length * 1.7) * 0.10 +
      Math.min(10, average(progress.map(row => Number(row.achievements_count || 0))) * 2.5) * 0.05
    ) * 10) / 10;

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
        ultimaSesion:profile.last_login_at || "",
      },
      general:{
        xp,
        level,
        nextLevelXp:level * 500,
        levelProgress:Math.round((xp % 500) / 5),
        plumas:feathers,
        percentage,
        accuracy,
        sessions,
        gamesPlayed:progress.filter(row => Number(row.sessions || 0) > 0).length,
        totalGames:games.filter(game => !game.locked).length,
      },
      games,
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
      grade:{ score:grade },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("student-dashboard failed", error);
    return jsonResponse({ ok:false, error:"dashboard_unavailable" }, 503);
  }
});
