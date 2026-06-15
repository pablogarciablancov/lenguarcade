import {
  corsHeaders,
  jsonResponse,
  requireTeacherSession,
} from "../_shared/lenguarcade.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  try {
    const { admin, organizationId } = await requireTeacherSession(request);
    const body = await request.json().catch(() => ({}));
    const studentId = String(body.studentId || "");
    if (!studentId) return jsonResponse({ ok:false, error:"missing_student" }, 400);

    const [
      profileResult,
      gamesResult,
      progressResult,
      eventsResult,
      achievementsResult,
      errorsResult,
      enrollmentsResult,
      evaluationsResult,
    ] = await Promise.all([
      admin.from("profiles")
        .select("id,email,first_name,last_name,last_login_at")
        .eq("id", studentId)
        .eq("organization_id", organizationId)
        .eq("role", "student")
        .single(),
      admin.from("games").select("id,name,icon,color,status").eq("active", true).order("sort_order"),
      admin.from("game_progress").select("*").eq("profile_id", studentId),
      admin.from("game_events")
        .select("game_id,event_type,xp_delta,feathers_delta,accuracy,occurred_at")
        .eq("profile_id", studentId).order("occurred_at", { ascending:false }).limit(20),
      admin.from("player_achievements")
        .select("game_id,achievement_id,unlocked_at,achievement_definitions(title,description,xp_reward)")
        .eq("profile_id", studentId).order("unlocked_at", { ascending:false }).limit(20),
      admin.from("game_errors")
        .select("game_id,skill,error_type,error_count,occurred_at")
        .eq("profile_id", studentId).order("occurred_at", { ascending:false }).limit(20),
      admin.from("classroom_enrollments")
        .select("classrooms(name,legacy_class_code)")
        .eq("profile_id", studentId).eq("active", true).limit(1),
      admin.from("evaluations")
        .select("score,updated_at")
        .eq("profile_id", studentId).eq("scope", "general").order("updated_at", { ascending:false }).limit(1),
    ]);
    const failure = [
      profileResult.error, gamesResult.error, progressResult.error, eventsResult.error,
      achievementsResult.error, errorsResult.error, enrollmentsResult.error,
      evaluationsResult.error,
    ].find(Boolean);
    if (failure || !profileResult.data) throw failure || new Error("student_not_found");

    const profile = profileResult.data;
    const games = gamesResult.data || [];
    const rows = progressResult.data || [];
    const attempts = rows.reduce((sum, row) => sum + Number(row.attempts || 0), 0);
    const successes = rows.reduce((sum, row) => sum + Number(row.successes || 0), 0);
    const xp = rows.reduce((sum, row) => sum + Number(row.xp || 0), 0);
    const enrollment = (enrollmentsResult.data || [])[0]?.classrooms;
    const classroom = Array.isArray(enrollment) ? enrollment[0] : enrollment || null;
    const progress = games.map(game => {
      const row = rows.find(item => item.game_id === game.id) || {};
      return {
        gameId:game.id,
        gameName:game.name,
        icono:game.icon,
        color:game.color,
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
      };
    });
    const lastActivity = [
      profile.last_login_at,
      ...rows.map(row => row.last_activity_at),
      ...(eventsResult.data || []).map(row => row.occurred_at),
    ].filter(Boolean).sort().pop() || "";
    const computedGrade = attempts ? Math.round((successes / attempts) * 100) / 10 : 0;

    return jsonResponse({
      ok:true,
      source:"supabase",
      student:{
        studentId:profile.id,
        nombre:`${profile.first_name} ${profile.last_name}`.trim(),
        email:profile.email,
        clase:classroom?.legacy_class_code || classroom?.name || "",
        pinConfigured:true,
      },
      general:{
        xp,
        level:Math.floor(xp / 500) + 1,
        sessions:rows.reduce((sum, row) => sum + Number(row.sessions || 0), 0),
        gamesPlayed:rows.filter(row => Number(row.sessions || 0) > 0).length,
        accuracy:attempts ? Math.round((successes / attempts) * 100) : 0,
      },
      grade:{ score:Number(evaluationsResult.data?.[0]?.score ?? computedGrade) },
      lastActivity,
      progress,
      events:(eventsResult.data || []).map(row => ({
        gameId:row.game_id,
        eventType:row.event_type,
        xpDelta:Number(row.xp_delta || 0),
        plumasDelta:Number(row.feathers_delta || 0),
        accuracy:Number(row.accuracy || 0),
        timestamp:row.occurred_at,
      })),
      achievements:(achievementsResult.data || []).map(row => ({
        achievementId:row.achievement_id,
        gameId:row.game_id,
        title:row.achievement_definitions?.title || row.achievement_id,
        description:row.achievement_definitions?.description || "",
        xpReward:Number(row.achievement_definitions?.xp_reward || 0),
        unlockedAt:row.unlocked_at,
      })),
      errors:(errorsResult.data || []).map(row => ({
        gameId:row.game_id,
        skill:row.skill,
        errorType:row.error_type,
        count:Number(row.error_count || 1),
        timestamp:row.occurred_at,
      })),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("teacher-student-detail failed", error);
    return jsonResponse({ ok:false, error:"student_detail_unavailable" }, 503);
  }
});
