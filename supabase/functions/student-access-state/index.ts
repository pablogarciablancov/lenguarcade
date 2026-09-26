import {
  corsHeaders,
  jsonResponse,
  requireProfileSession,
} from "../_shared/lenguarcade.ts";
import {
  studentGameAccess,
  studentGameButtonLabel,
  workshopModeFor,
} from "../_shared/student-access.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  try {
    // El gateway valida el JWT; requireProfileSession sigue comprobando
    // app_sessions y el perfil activo en cada consulta.
    const { admin, profileId, organizationId } = await requireProfileSession(request, { gatewayVerifiedJwt:true });
    const [gamesResult, accessResult, enrollmentsResult, sessionsResult] = await Promise.all([
      admin.from("games")
        .select("id,status,url,integration,sort_order")
        .eq("active", true)
        .eq("official", true)
        .order("sort_order"),
      admin.from("profile_game_access")
        .select("game_id,enabled")
        .eq("profile_id", profileId),
      admin.from("classroom_enrollments")
        .select("classroom_id,classrooms(name,legacy_class_code)")
        .eq("profile_id", profileId)
        .eq("active", true),
      admin.from("workshop_sessions")
        .select("classroom_id,title,message,target_xp,published,classroom_open,home_enabled,active_from,active_to,game_ids,plan_id,started_at,updated_at")
        .eq("organization_id", organizationId)
        .eq("published", true),
    ]);

    const failure = [gamesResult.error, accessResult.error, enrollmentsResult.error, sessionsResult.error].find(Boolean);
    if (failure) throw failure;

    const classroomIds = new Set((enrollmentsResult.data || [])
      .map(row => String(row.classroom_id || "")).filter(Boolean));
    const sessionRow = (sessionsResult.data || [])
      .find(row => classroomIds.has(String(row.classroom_id || ""))) || null;
    const selectedIds = new Set<string>(Array.isArray(sessionRow?.game_ids)
      ? sessionRow.game_ids.map((id: unknown) => String(id || "")) : []);
    const mode = workshopModeFor(sessionRow);
    const active = mode === "classroom" || mode === "home";
    const accessByGame = new Map<string, boolean>((accessResult.data || [])
      .map(row => [String(row.game_id), row.enabled !== false]));
    const classroomRelation = (enrollmentsResult.data || [])[0]?.classrooms;
    const classroom = Array.isArray(classroomRelation) ? classroomRelation[0] : classroomRelation || null;
    const workshopSession = sessionRow ? {
      classCode:String(classroom?.legacy_class_code || ""),
      classroomId:String(sessionRow.classroom_id || ""),
      title:String(sessionRow.title || "Taller"),
      message:String(sessionRow.message || ""),
      targetXp:Math.max(0, Number(sessionRow.target_xp || 0)),
      startedAt:sessionRow.started_at || sessionRow.updated_at || null,
      published:sessionRow.published === true,
      classroomOpen:sessionRow.classroom_open === true,
      homeEnabled:sessionRow.home_enabled === true,
      homeStart:sessionRow.active_from || "",
      homeEnd:sessionRow.active_to || "",
      gameIds:[...selectedIds],
      planId:String(sessionRow.plan_id || ""),
      mode,
      active,
      updatedAt:sessionRow.updated_at || "",
    } : null;

    const games = (gamesResult.data || []).map(game => {
      const access = studentGameAccess(game, accessByGame, sessionRow, selectedIds, active);
      return {
        gameId:String(game.id),
        estado:game.status,
        catalogLocked:access.catalogLocked,
        accessEnabled:access.accessEnabled,
        accessSource:access.accessSource,
        lockedByTeacher:access.lockedByTeacher,
        lockedByWorkshop:access.lockedByWorkshop,
        locked:access.locked,
        lockedLabel:studentGameButtonLabel(access, game.status, 0),
      };
    });

    const bytes = new TextEncoder().encode(JSON.stringify({ games, workshopSession }));
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    const fingerprint = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
    return jsonResponse({ ok:true, fingerprint, games, workshopSession });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("student-access-state failed", error);
    return jsonResponse({ ok:false, error:"access_state_unavailable" }, 503);
  }
});
