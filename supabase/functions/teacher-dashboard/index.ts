import {
  corsHeaders,
  jsonResponse,
  requireTeacherSession,
} from "../_shared/lenguarcade.ts";

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function gradeFor(rows: Array<Record<string, unknown>>) {
  const attempts = rows.reduce((sum, row) => sum + Number(row.attempts || 0), 0);
  const successes = rows.reduce((sum, row) => sum + Number(row.successes || 0), 0);
  const xp = rows.reduce((sum, row) => sum + Number(row.xp || 0), 0);
  const accuracy = attempts ? (successes / attempts) * 100 : 0;
  return Math.round((
    Math.min(10, xp / Math.max(1, rows.length) / 80) * 0.25 +
    Math.min(10, accuracy / 10) * 0.25 +
    Math.min(10, average(rows.map(row => Number(row.missions_completed || 0))) * 2.5) * 0.20 +
    Math.min(10, average(rows.map(row => Number(row.sessions || 0))) * 2) * 0.15 +
    Math.min(10, rows.filter(row => Number(row.sessions || 0) > 0).length * 1.7) * 0.10 +
    Math.min(10, average(rows.map(row => Number(row.achievements_count || 0))) * 2.5) * 0.05
  ) * 10) / 10;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  try {
    const { admin, organizationId } = await requireTeacherSession(request);
    const body = await request.json().catch(() => ({}));
    const classCode = String(body.classCode || "");
    const gameId = String(body.gameId || "");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [
      profilesResult,
      classroomsResult,
      enrollmentsResult,
      gamesResult,
      progressResult,
      eventsResult,
      achievementsResult,
      errorsResult,
    ] = await Promise.all([
      admin.from("profiles")
        .select("id,email,first_name,last_name,last_login_at")
        .eq("organization_id", organizationId)
        .eq("role", "student")
        .eq("active", true),
      admin.from("classrooms")
        .select("id,name,section,legacy_class_code,classroom_course_id,last_synced_at")
        .eq("organization_id", organizationId)
        .eq("active", true)
        .order("name"),
      admin.from("classroom_enrollments")
        .select("classroom_id,profile_id")
        .eq("active", true),
      admin.from("games")
        .select("id,name,icon,color,status,sort_order")
        .eq("active", true)
        .order("sort_order"),
      admin.from("game_progress")
        .select("profile_id,game_id,xp,level,percentage,accuracy,attempts,successes,errors,streak,sessions,achievements_count,missions_completed,feathers,last_activity_at"),
      admin.from("game_events")
        .select("profile_id,game_id,occurred_at")
        .gte("occurred_at", today.toISOString()),
      admin.from("player_achievements")
        .select("profile_id,game_id"),
      admin.from("game_errors")
        .select("profile_id,game_id,skill,error_type,error_count"),
    ]);
    const failure = [
      profilesResult.error, classroomsResult.error, enrollmentsResult.error,
      gamesResult.error, progressResult.error, eventsResult.error,
      achievementsResult.error, errorsResult.error,
    ].find(Boolean);
    if (failure) throw failure;

    const classrooms = classroomsResult.data || [];
    const classroomById = new Map(classrooms.map(row => [row.id, row]));
    const selectedClassroomIds = new Set(classrooms
      .filter(row => !classCode || row.legacy_class_code === classCode || row.id === classCode)
      .map(row => row.id));
    const enrollmentsByProfile = new Map<string, string[]>();
    for (const row of enrollmentsResult.data || []) {
      if (!classroomById.has(row.classroom_id)) continue;
      const values = enrollmentsByProfile.get(row.profile_id) || [];
      values.push(row.classroom_id);
      enrollmentsByProfile.set(row.profile_id, values);
    }

    const profiles = (profilesResult.data || []).filter(profile => {
      if (!classCode) return true;
      return (enrollmentsByProfile.get(profile.id) || [])
        .some(classroomId => selectedClassroomIds.has(classroomId));
    });
    const profileIds = new Set(profiles.map(profile => profile.id));
    const progress = (progressResult.data || []).filter(row =>
      profileIds.has(row.profile_id) && (!gameId || row.game_id === gameId)
    );
    const progressByProfile = new Map<string, Array<Record<string, unknown>>>();
    for (const row of progress) {
      const values = progressByProfile.get(row.profile_id) || [];
      values.push(row);
      progressByProfile.set(row.profile_id, values);
    }

    const students = profiles.map(profile => {
      const rows = progressByProfile.get(profile.id) || [];
      const attempts = rows.reduce((sum, row) => sum + Number(row.attempts || 0), 0);
      const successes = rows.reduce((sum, row) => sum + Number(row.successes || 0), 0);
      const xp = rows.reduce((sum, row) => sum + Number(row.xp || 0), 0);
      const classroomIds = enrollmentsByProfile.get(profile.id) || [];
      const classroom = classCode
        ? classroomById.get(classroomIds.find(id => selectedClassroomIds.has(id)) || "")
        : classroomById.get(classroomIds[0] || "");
      const lastActivity = rows
        .map(row => String(row.last_activity_at || ""))
        .filter(Boolean)
        .sort()
        .pop() || profile.last_login_at || "";
      return {
        studentId:profile.id,
        nombre:`${profile.first_name} ${profile.last_name}`.trim(),
        email:profile.email,
        clase:classroom?.legacy_class_code || classroom?.name || "",
        pinConfigured:true,
        xp,
        level:Math.floor(xp / 500) + 1,
        percentage:Math.round(average(rows.map(row => Number(row.percentage || 0)))),
        accuracy:attempts ? Math.round((successes / attempts) * 100) : 0,
        sessions:rows.reduce((sum, row) => sum + Number(row.sessions || 0), 0),
        gamesPlayed:rows.filter(row => Number(row.sessions || 0) > 0).length,
        lastActivity,
        grade:gradeFor(rows),
      };
    }).sort((a, b) => b.xp - a.xp);

    const games = gamesResult.data || [];
    const popularGames = games.map(game => {
      const rows = progress.filter(row => row.game_id === game.id);
      return {
        gameId:game.id,
        nombre:game.name,
        icono:game.icon,
        color:game.color,
        sessions:rows.reduce((sum, row) => sum + Number(row.sessions || 0), 0),
      };
    }).sort((a, b) => b.sessions - a.sessions);
    const totalSessions = popularGames.reduce((sum, game) => sum + game.sessions, 0) || 1;
    popularGames.forEach(game => game.percent = Math.round((game.sessions / totalSessions) * 100));

    const errorCounts = new Map<string, number>();
    for (const row of errorsResult.data || []) {
      if (!profileIds.has(row.profile_id) || (gameId && row.game_id !== gameId)) continue;
      const label = row.skill || row.error_type || row.game_id || "General";
      errorCounts.set(label, (errorCounts.get(label) || 0) + Number(row.error_count || 1));
    }
    const errorSummary = [...errorCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const recommendations = [];
    if (!students.length) recommendations.push("No hay alumnos en el filtro seleccionado.");
    if (students.some(student => student.sessions === 0)) {
      recommendations.push("Hay alumnos sin ninguna partida registrada.");
    }
    if (errorSummary[0]) {
      recommendations.push(`Conviene reforzar ${errorSummary[0].label}: es el error mas repetido.`);
    }
    if (!recommendations.length) recommendations.push("La clase mantiene una actividad equilibrada.");

    const focus = students[0] || null;
    const focusProgress = focus
      ? progress.filter(row => row.profile_id === focus.studentId).map(row => {
          const game = games.find(item => item.id === row.game_id);
          return {
            gameId:row.game_id,
            gameName:game?.name || row.game_id,
            percentage:Number(row.percentage || 0),
            xp:Number(row.xp || 0),
            sessions:Number(row.sessions || 0),
            accuracy:Number(row.accuracy || 0),
          };
        })
      : [];

    const eventCount = (eventsResult.data || []).filter(row =>
      profileIds.has(row.profile_id) && (!gameId || row.game_id === gameId)
    ).length;
    const achievementCount = (achievementsResult.data || []).filter(row =>
      profileIds.has(row.profile_id) && (!gameId || row.game_id === gameId)
    ).length;

    return jsonResponse({
      ok:true,
      source:"supabase",
      summary:{
        studentsTotal:students.length,
        activeStudents:students.filter(student => student.sessions > 0).length,
        sessionsToday:eventCount,
        gamesAvailable:games.filter(game => !String(game.status).toLowerCase().includes("coming")).length,
        achievementsTotal:achievementCount,
        averageGrade:Math.round(average(students.map(student => student.grade)) * 10) / 10,
      },
      students,
      games,
      popularGames,
      errorSummary,
      recommendations,
      focus,
      focusProgress,
      classes:classrooms.map(row => ({
        classCode:row.legacy_class_code || row.id,
        nombreVisible:row.name,
        section:row.section,
        classroomCourseId:row.classroom_course_id,
        lastSyncedAt:row.last_synced_at,
      })),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("teacher-dashboard failed", error);
    return jsonResponse({ ok:false, error:"dashboard_unavailable" }, 503);
  }
});
