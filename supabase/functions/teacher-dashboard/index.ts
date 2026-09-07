import {
  corsHeaders,
  jsonResponse,
  requireTeacherSession,
} from "../_shared/lenguarcade.ts";

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function randomPin() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
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

async function resetPinsForFilter(admin: any, organizationId: string, classCode: string) {
  const classroomsResult = await admin.from("classrooms")
    .select("id,name,legacy_class_code")
    .eq("organization_id", organizationId)
    .eq("active", true);
  if (classroomsResult.error) throw classroomsResult.error;

  const classrooms = classroomsResult.data || [];
  const classroomById = new Map(classrooms.map((row: Record<string, unknown>) => [row.id, row]));
  let selectedProfileIds: string[] | null = null;
  const selectedClassrooms = classCode
    ? classrooms.filter((row: Record<string, unknown>) => row.legacy_class_code === classCode || row.id === classCode)
    : classrooms;
  if (classCode && !selectedClassrooms.length) {
    return { ok:false, error:"class_not_found" };
  }

  const enrollmentByProfile = new Map<string, Record<string, unknown>>();
  if (selectedClassrooms.length) {
    let enrollmentQuery = admin.from("classroom_enrollments")
      .select("classroom_id,profile_id")
      .eq("active", true);
    if (classCode) {
      enrollmentQuery = enrollmentQuery.in("classroom_id", selectedClassrooms.map((row: Record<string, unknown>) => row.id));
    }
    const enrollmentsResult = await enrollmentQuery;
    if (enrollmentsResult.error) throw enrollmentsResult.error;
    for (const row of enrollmentsResult.data || []) {
      if (!classroomById.has(row.classroom_id)) continue;
      if (!enrollmentByProfile.has(row.profile_id)) {
        enrollmentByProfile.set(row.profile_id, classroomById.get(row.classroom_id) || {});
      }
    }
    if (classCode) selectedProfileIds = [...enrollmentByProfile.keys()];
  }

  let profilesQuery = admin.from("profiles")
    .select("id,email,first_name,last_name")
    .eq("organization_id", organizationId)
    .eq("role", "student")
    .eq("active", true)
    .order("last_name")
    .order("first_name");
  if (selectedProfileIds) {
    if (!selectedProfileIds.length) return { ok:true, action:"resetPins", count:0, credentials:[] };
    profilesQuery = profilesQuery.in("id", selectedProfileIds);
  }
  const profilesResult = await profilesQuery;
  if (profilesResult.error) throw profilesResult.error;

  const credentials = [];
  for (const profile of profilesResult.data || []) {
    const pin = randomPin();
    const { error } = await admin.rpc("set_profile_pin", {
      target_profile_id:profile.id,
      plain_pin:pin,
    });
    if (error) throw error;
    const classroom = enrollmentByProfile.get(profile.id);
    credentials.push({
      studentId:profile.id,
      email:profile.email,
      nombre:`${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
      clase:classroom?.legacy_class_code || classroom?.name || "",
      pin,
    });
  }

  return { ok:true, action:"resetPins", count:credentials.length, credentials };
}


const MISSION_TYPES = new Set(["sessions", "variety", "xp", "accuracy"]);

function cleanMissionText(value: unknown, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function missionTypeLabel(value: unknown) {
  return ({
    sessions:"Partidas",
    variety:"Juegos distintos",
    xp:"XP conseguido",
    accuracy:"Precisión",
  } as Record<string, string>)[String(value || "")] || "Objetivo";
}

function missionStatus(row: Record<string, unknown>) {
  const now = Date.now();
  const from = row.active_from ? Date.parse(String(row.active_from)) : Number.NaN;
  const to = row.active_to ? Date.parse(String(row.active_to)) : Number.NaN;
  if (Number.isFinite(from) && from > now) return "scheduled";
  if (Number.isFinite(to) && to <= now) return "expired";
  return "active";
}

async function resolveMissionClassroom(
  admin: any,
  organizationId: string,
  classCode: string,
) {
  const clean = cleanMissionText(classCode, 120);
  if (!clean) return null;
  const { data, error } = await admin.from("classrooms")
    .select("id,legacy_class_code")
    .eq("organization_id", organizationId)
    .eq("active", true);
  if (error) throw error;
  const classroom = (data || []).find((row: Record<string, unknown>) =>
    String(row.id) === clean || String(row.legacy_class_code || "") === clean
  );
  if (!classroom) throw new Error("mission_class_not_found");
  return classroom.id;
}

async function handleMissionAction(
  admin: any,
  organizationId: string,
  body: Record<string, unknown>,
) {
  const action = String(body.action || "");
  if (action === "archiveMission") {
    const missionId = cleanMissionText(body.missionId, 160);
    if (!missionId) return jsonResponse({ ok:false, error:"missing_mission_id" }, 400);
    const { data, error } = await admin.from("mission_definitions")
      .update({ active:false, updated_at:new Date().toISOString() })
      .eq("organization_id", organizationId)
      .eq("id", missionId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return jsonResponse({ ok:false, error:"mission_not_found" }, 404);
    return jsonResponse({ ok:true, action:"archiveMission", missionId });
  }

  if (action !== "saveMission") return null;
  const mission = body.mission && typeof body.mission === "object"
    ? body.mission as Record<string, unknown>
    : {};
  const title = cleanMissionText(mission.title, 180);
  const description = cleanMissionText(mission.description, 800);
  const missionType = cleanMissionText(mission.missionType, 40);
  const target = Number(mission.target || 0);
  if (title.length < 3) return jsonResponse({ ok:false, error:"mission_title_required" }, 400);
  if (!MISSION_TYPES.has(missionType)) return jsonResponse({ ok:false, error:"invalid_mission_type" }, 400);
  if (!Number.isFinite(target) || target <= 0 || target > 1000000) {
    return jsonResponse({ ok:false, error:"invalid_mission_target" }, 400);
  }

  let gameId = cleanMissionText(mission.gameId, 80) || null;
  if (missionType === "variety") gameId = null;
  if (gameId) {
    const { data:game, error:gameError } = await admin.from("games")
      .select("id")
      .eq("id", gameId)
      .eq("official", true)
      .eq("active", true)
      .maybeSingle();
    if (gameError) throw gameError;
    if (!game) return jsonResponse({ ok:false, error:"mission_game_not_found" }, 400);
  }

  let classroomId: string | null = null;
  try {
    classroomId = await resolveMissionClassroom(
      admin,
      organizationId,
      cleanMissionText(mission.classCode, 120),
    );
  } catch (error) {
    if (String((error as Error)?.message || error) === "mission_class_not_found") {
      return jsonResponse({ ok:false, error:"mission_class_not_found" }, 400);
    }
    throw error;
  }

  function dateOrNull(value: unknown) {
    const text = cleanMissionText(value, 80);
    if (!text) return null;
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) throw new Error("invalid_mission_date");
    return parsed.toISOString();
  }

  let activeFrom: string | null = null;
  let activeTo: string | null = null;
  try {
    activeFrom = dateOrNull(mission.activeFrom);
    activeTo = dateOrNull(mission.activeTo);
  } catch {
    return jsonResponse({ ok:false, error:"invalid_mission_date" }, 400);
  }
  if (activeFrom && activeTo && Date.parse(activeTo) <= Date.parse(activeFrom)) {
    return jsonResponse({ ok:false, error:"invalid_mission_window" }, 400);
  }

  const featured = Boolean(mission.featured);
  const priority = featured ? 100 : Math.max(-100, Math.min(99, Math.round(Number(mission.priority || 0))));
  const id = cleanMissionText(mission.id, 160) ||
    `mission_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const record = {
    id,
    title,
    description,
    game_id:gameId,
    mission_type:missionType,
    target,
    reward_xp:0,
    reward_feathers:0,
    active_from:activeFrom,
    active_to:activeTo,
    active:true,
    organization_id:organizationId,
    classroom_id:classroomId,
    featured,
    priority,
    updated_at:new Date().toISOString(),
  };

  if (mission.id) {
    const { data:existing, error:existingError } = await admin.from("mission_definitions")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return jsonResponse({ ok:false, error:"mission_not_found" }, 404);
    const { data, error } = await admin.from("mission_definitions")
      .update(record)
      .eq("organization_id", organizationId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return jsonResponse({ ok:true, action:"saveMission", mission:data });
  }

  const { data, error } = await admin.from("mission_definitions")
    .insert(record)
    .select("*")
    .single();
  if (error) throw error;
  return jsonResponse({ ok:true, action:"saveMission", mission:data });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  try {
    const { admin, organizationId } = await requireTeacherSession(request);
    const body = await request.json().catch(() => ({}));
    const classCode = String(body.classCode || "");
    const gameId = String(body.gameId || "");
    const action = String(body.action || "");
    if (action === "saveMission" || action === "archiveMission") {
      const missionResult = await handleMissionAction(admin, organizationId, body);
      if (missionResult) return missionResult;
    }
    if (action === "resetPins") {
      if (String(body.confirmText || "") !== "RESET PIN") {
        return jsonResponse({ ok:false, error:"confirmation_required" }, 400);
      }
      const resetResult = await resetPinsForFilter(admin, organizationId, classCode);
      return jsonResponse(resetResult, resetResult.ok === false ? 404 : 200);
    }
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
      missionsResult,
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
        .select("id,name,icon,color,status,sort_order,integration,official")
        .eq("active", true)
        .eq("official", true)
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
      admin.from("mission_definitions")
        .select("id,title,description,game_id,mission_type,target,active_from,active_to,classroom_id,featured,priority,active,updated_at")
        .eq("organization_id", organizationId)
        .eq("active", true)
        .order("priority", { ascending:false })
        .order("active_to", { ascending:true, nullsFirst:false }),
    ]);
    const failure = [
      profilesResult.error, classroomsResult.error, enrollmentsResult.error,
      gamesResult.error, progressResult.error, eventsResult.error,
      achievementsResult.error, errorsResult.error, missionsResult.error,
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
      missions:(missionsResult.data || []).map(row => ({
        id:row.id,
        title:row.title,
        description:row.description,
        gameId:row.game_id || "",
        gameName:(gamesResult.data || []).find(game => game.id === row.game_id)?.name || "",
        missionType:row.mission_type,
        typeLabel:missionTypeLabel(row.mission_type),
        target:Number(row.target || 0),
        activeFrom:row.active_from || null,
        activeTo:row.active_to || null,
        classCode:row.classroom_id ? String(classroomById.get(row.classroom_id)?.legacy_class_code || row.classroom_id) : "",
        className:row.classroom_id ? String(classroomById.get(row.classroom_id)?.name || "") : "Todas las clases",
        featured:Boolean(row.featured),
        priority:Number(row.priority || 0),
        status:missionStatus(row),
        updatedAt:row.updated_at,
      })),
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
