import {
  corsHeaders,
  jsonResponse,
  requireTeacherSession,
} from "../_shared/lenguarcade.ts";

const ADMIN_GAME_ID = "lenguarcade_admin";

function cleanReason(value: unknown) {
  return String(value || "").trim().slice(0, 240);
}

function signedInteger(value: unknown, min: number, max: number) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.max(min, Math.min(max, Math.round(number)));
}

async function resetPlayerProgress(
  admin: any,
  targetProfileId: string,
  teacherProfileId: string,
) {
  const tables = [
    "grade_sync_queue",
    "evaluations",
    "game_errors",
    "player_achievements",
    "game_saves",
    "game_events",
    "game_progress",
  ];
  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("profile_id", targetProfileId);
    if (error) throw error;
  }

  if (targetProfileId !== teacherProfileId) {
    const { error:sessionError } = await admin.from("app_sessions")
      .update({ revoked_at:new Date().toISOString() })
      .eq("profile_id", targetProfileId)
      .is("revoked_at", null);
    if (sessionError) throw sessionError;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  try {
    const {
      admin,
      organizationId,
      profileId:teacherProfileId,
    } = await requireTeacherSession(request);
    const body = await request.json().catch(() => ({}));
    const studentId = String(body.studentId || "").trim();
    const action = String(body.action || "detail").trim();
    if (!studentId) return jsonResponse({ ok:false, error:"missing_student" }, 400);

    const { data:managedProfile, error:managedProfileError } = await admin
      .from("profiles")
      .select("id,email,first_name,last_name,last_login_at,role,source,active")
      .eq("id", studentId)
      .eq("organization_id", organizationId)
      .eq("active", true)
      .maybeSingle();
    if (managedProfileError) throw managedProfileError;
    if (!managedProfile) return jsonResponse({ ok:false, error:"student_not_found" }, 404);

    const isStudent = managedProfile.role === "student";
    const isOwnTeacherPlayer = managedProfile.id === teacherProfileId &&
      (managedProfile.role === "teacher" || managedProfile.role === "admin");
    if (!isStudent && !isOwnTeacherPlayer) {
      return jsonResponse({ ok:false, error:"forbidden_target" }, 403);
    }

    let actionResult: Record<string, unknown> | null = null;
    if (action === "adjust") {
      const xpDelta = signedInteger(body.xpDelta, -5000, 5000);
      const feathersDelta = signedInteger(body.feathersDelta, -500, 500);
      const reason = cleanReason(body.reason);
      if (!xpDelta && !feathersDelta) {
        return jsonResponse({ ok:false, error:"empty_adjustment" }, 400);
      }
      if (reason.length < 3) {
        return jsonResponse({ ok:false, error:"adjustment_reason_required" }, 400);
      }
      const now = new Date().toISOString();
      const { error:adjustmentError } = await admin.from("game_events").insert({
        result_id:`teacher_adjustment_${crypto.randomUUID()}`,
        profile_id:studentId,
        game_id:ADMIN_GAME_ID,
        event_type:"teacher_adjustment",
        xp_delta:xpDelta,
        feathers_delta:feathersDelta,
        accuracy:null,
        details:{
          reason,
          source:"teacher_panel",
          teacherProfileId,
        },
        occurred_at:now,
      });
      if (adjustmentError) throw adjustmentError;
      actionResult = { action:"adjust", xpDelta, feathersDelta, reason, occurredAt:now };
    } else if (action === "resetProgress") {
      if (String(body.confirmText || "") !== "BORRAR PROGRESO") {
        return jsonResponse({ ok:false, error:"confirmation_required" }, 400);
      }
      await resetPlayerProgress(admin, studentId, teacherProfileId);
      actionResult = { action:"resetProgress", reset:true };
    } else if (action !== "detail") {
      return jsonResponse({ ok:false, error:"unknown_action" }, 400);
    }

    const [
      gamesResult,
      progressResult,
      eventsResult,
      adjustmentsResult,
      achievementsResult,
      errorsResult,
      enrollmentsResult,
      evaluationsResult,
    ] = await Promise.all([
      admin.from("games")
        .select("id,name,icon,color,status")
        .eq("active", true)
        .eq("official", true)
        .order("sort_order"),
      admin.from("game_progress").select("*").eq("profile_id", studentId),
      admin.from("game_events")
        .select("game_id,event_type,xp_delta,feathers_delta,accuracy,details,occurred_at")
        .eq("profile_id", studentId)
        .order("occurred_at", { ascending:false })
        .limit(20),
      admin.from("game_events")
        .select("xp_delta,feathers_delta,details,occurred_at")
        .eq("profile_id", studentId)
        .eq("event_type", "teacher_adjustment")
        .order("occurred_at", { ascending:false })
        .limit(100),
      admin.from("player_achievements")
        .select("game_id,achievement_id,unlocked_at,achievement_definitions(title,description,xp_reward)")
        .eq("profile_id", studentId)
        .order("unlocked_at", { ascending:false })
        .limit(20),
      admin.from("game_errors")
        .select("game_id,skill,error_type,error_count,occurred_at")
        .eq("profile_id", studentId)
        .order("occurred_at", { ascending:false })
        .limit(20),
      admin.from("classroom_enrollments")
        .select("classrooms(name,legacy_class_code)")
        .eq("profile_id", studentId)
        .eq("active", true)
        .limit(1),
      admin.from("evaluations")
        .select("scope,game_id,score,breakdown,updated_at")
        .eq("profile_id", studentId)
        .order("updated_at", { ascending:false }),
    ]);
    const failure = [
      gamesResult.error, progressResult.error, eventsResult.error, adjustmentsResult.error,
      achievementsResult.error, errorsResult.error, enrollmentsResult.error,
      evaluationsResult.error,
    ].find(Boolean);
    if (failure) throw failure;

    const profile = managedProfile;
    const games = gamesResult.data || [];
    const rows = progressResult.data || [];
    const adjustments = adjustmentsResult.data || [];
    const attempts = rows.reduce((sum, row) => sum + Number(row.attempts || 0), 0);
    const successes = rows.reduce((sum, row) => sum + Number(row.successes || 0), 0);
    const baseXp = rows.reduce((sum, row) => sum + Number(row.xp || 0), 0);
    const baseFeathers = rows.reduce((sum, row) => sum + Number(row.feathers || 0), 0);
    const manualXp = adjustments.reduce((sum, row) => sum + Number(row.xp_delta || 0), 0);
    const manualFeathers = adjustments.reduce((sum, row) => sum + Number(row.feathers_delta || 0), 0);
    const xp = Math.max(0, baseXp + manualXp);
    const feathers = Math.max(0, baseFeathers + manualFeathers);
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
        rawJson:row.raw_data || {},
      };
    });
    const lastActivity = [
      profile.last_login_at,
      ...rows.map(row => row.last_activity_at),
      ...(eventsResult.data || []).map(row => row.occurred_at),
    ].filter(Boolean).sort().pop() || "";
    const computedGrade = attempts ? Math.round((successes / attempts) * 100) / 10 : 0;
    const evaluationRows = evaluationsResult.data || [];
    const generalEvaluation = evaluationRows.find(row => row.scope === "general");
    const isTeacherPlayer = profile.id === teacherProfileId && profile.role !== "student";

    return jsonResponse({
      ok:true,
      source:"supabase",
      actionResult,
      student:{
        studentId:profile.id,
        nombre:`${profile.first_name} ${profile.last_name}`.trim(),
        email:profile.email,
        clase:isTeacherPlayer ? "Profesor" : (classroom?.legacy_class_code || classroom?.name || ""),
        role:profile.role,
        isTeacherPlayer,
        pinConfigured:profile.role === "student",
      },
      general:{
        xp,
        baseXp,
        manualXp,
        level:Math.floor(xp / 500) + 1,
        plumas:feathers,
        basePlumas:baseFeathers,
        manualPlumas:manualFeathers,
        sessions:rows.reduce((sum, row) => sum + Number(row.sessions || 0), 0),
        gamesPlayed:rows.filter(row => Number(row.sessions || 0) > 0).length,
        accuracy:attempts ? Math.round((successes / attempts) * 100) : 0,
      },
      grade:{ score:Number(generalEvaluation?.score ?? computedGrade) },
      evaluations:evaluationRows.map(row => ({
        scope:row.scope,
        gameId:row.game_id,
        score:Number(row.score || 0),
        breakdown:row.breakdown || {},
        updatedAt:row.updated_at,
      })),
      lastActivity,
      progress,
      adjustments:adjustments.map(row => ({
        xpDelta:Number(row.xp_delta || 0),
        plumasDelta:Number(row.feathers_delta || 0),
        reason:String(row.details?.reason || ""),
        timestamp:row.occurred_at,
      })),
      events:(eventsResult.data || []).map(row => ({
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
