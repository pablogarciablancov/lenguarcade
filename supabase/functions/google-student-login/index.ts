import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/lenguarcade.ts";

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isStudentEmail(email: string) {
  return email.endsWith("@alumno.fomento.edu");
}

function isTeacherEmail(email: string) {
  return email.endsWith("@fomento.edu") && !isStudentEmail(email);
}

async function readGoogleUser(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization:`Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  return await response.json().catch(() => null);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization") || "";
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization.startsWith("Bearer ")) {
    return jsonResponse({ ok:false, error:"unauthorized" }, 401);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const googleAccessToken = String(body.googleAccessToken || "").trim();
    const assertedStudentEmail = cleanEmail(body.studentEmail);
    if (!googleAccessToken) return jsonResponse({ ok:false, error:"missing_google_token" }, 400);

    const googleUser = await readGoogleUser(googleAccessToken);
    const googleEmail = cleanEmail(googleUser?.email);
    if (!googleEmail || googleUser?.email_verified === false) {
      return jsonResponse({ ok:false, error:"forbidden_google_account" }, 403);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global:{ headers:{ Authorization:authorization } },
      auth:{ persistSession:false, autoRefreshToken:false },
    });
    const { data:userData, error:userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return jsonResponse({ ok:false, error:"unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth:{ persistSession:false, autoRefreshToken:false },
    });

    let email = googleEmail;
    let organizationId = "";
    let loginSource = "direct_google";

    if (assertedStudentEmail) {
      // Apps Script se ejecuta como el propietario. Su token OAuth acredita que
      // esta afirmación procede del servidor autorizado; el correo del alumno
      // lo obtiene Apps Script con Session.getActiveUser().
      if (!isTeacherEmail(googleEmail)) {
        return jsonResponse({ ok:false, error:"bridge_not_authorized" }, 403);
      }
      if (!isStudentEmail(assertedStudentEmail)) {
        return jsonResponse({ ok:false, error:"invalid_student_email" }, 403);
      }

      const { data:teacherProfile, error:teacherError } = await admin
        .from("profiles")
        .select("id,organization_id")
        .eq("email", googleEmail)
        .in("role", ["teacher", "admin"])
        .eq("active", true)
        .maybeSingle();
      if (teacherError) throw teacherError;
      if (!teacherProfile) {
        return jsonResponse({ ok:false, error:"bridge_not_authorized" }, 403);
      }

      email = assertedStudentEmail;
      organizationId = String(teacherProfile.organization_id || "");
      loginSource = "apps_script_assertion";
    } else if (!isStudentEmail(googleEmail)) {
      // Compatibilidad con un posible acceso Google directo de alumno.
      return jsonResponse({ ok:false, error:"forbidden_google_account" }, 403);
    }

    let profileQuery = admin
      .from("profiles")
      .select("id,email,first_name,last_name,role,organization_id")
      .eq("email", email)
      .eq("role", "student")
      .eq("active", true);
    if (organizationId) profileQuery = profileQuery.eq("organization_id", organizationId);

    const { data:profile, error:profileError } = await profileQuery.maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return jsonResponse({ ok:false, error:"student_not_found" }, 404);

    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    await admin.from("app_sessions")
      .update({ revoked_at:new Date().toISOString() })
      .eq("auth_user_id", userData.user.id)
      .is("revoked_at", null);
    const { error:sessionError } = await admin.from("app_sessions").insert({
      auth_user_id:userData.user.id,
      profile_id:profile.id,
      expires_at:expiresAt,
    });
    if (sessionError) throw sessionError;
    await admin.from("profiles").update({
      last_login_at:new Date().toISOString(),
      auth_user_id:userData.user.id,
    }).eq("id", profile.id);

    return jsonResponse({
      ok:true,
      expiresAt,
      loginSource,
      profile:{
        id:profile.id,
        email:profile.email,
        firstName:profile.first_name,
        lastName:profile.last_name,
        role:profile.role,
      },
    });
  } catch (error) {
    console.error("google-student-login failed", error);
    return jsonResponse({ ok:false, error:"google_student_login_unavailable" }, 503);
  }
});
