import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/lenguarcade.ts";

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isTeacherEmail(email: string) {
  return email.endsWith("@fomento.edu") && !email.endsWith("@alumno.fomento.edu");
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
    const mode = String(body.mode || "teacher").trim().toLowerCase();
    if (!googleAccessToken) return jsonResponse({ ok:false, error:"missing_google_token" }, 400);
    if (!["teacher", "test_student"].includes(mode)) {
      return jsonResponse({ ok:false, error:"invalid_login_mode" }, 400);
    }

    const googleUser = await readGoogleUser(googleAccessToken);
    const email = cleanEmail(googleUser?.email);
    if (!email || !isTeacherEmail(email) || googleUser?.email_verified === false) {
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

    let { data:profile, error:profileError } = await admin
      .from("profiles")
      .select("id,email,first_name,last_name,role,organization_id")
      .eq("email", email)
      .in("role", ["teacher", "admin"])
      .eq("active", true)
      .maybeSingle();
    if (profileError) throw profileError;

    if (!profile) {
      const { data:organization, error:organizationError } = await admin
        .from("organizations")
        .select("id")
        .order("created_at", { ascending:true })
        .limit(1)
        .single();
      if (organizationError || !organization) throw organizationError || new Error("missing_organization");
      const local = email.split("@")[0] || "profesor";
      const readable = local.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
      const { data:created, error:createError } = await admin
        .from("profiles")
        .insert({
          organization_id:organization.id,
          email,
          first_name:String(googleUser?.given_name || "Profe"),
          last_name:String(googleUser?.family_name || readable || email),
          role:"teacher",
          source:"google",
          active:true,
        })
        .select("id,email,first_name,last_name,role,organization_id")
        .single();
      if (createError || !created) throw createError || new Error("teacher_profile_not_created");
      profile = created;
    }

    let sessionProfile = profile;
    let testClassCode = "";

    if (mode === "test_student") {
      const { data:existingClass, error:testClassReadError } = await admin
        .from("classrooms")
        .select("id,legacy_class_code")
        .eq("organization_id", profile.organization_id)
        .eq("legacy_class_code", "PRUEBAS")
        .maybeSingle();
      if (testClassReadError) throw testClassReadError;

      let testClass = existingClass;
      if (!testClass) {
        const { data:createdClass, error:testClassCreateError } = await admin
          .from("classrooms")
          .insert({
            organization_id:profile.organization_id,
            name:"LenguArcade · Pruebas",
            section:"Alumno ficticio",
            legacy_class_code:"PRUEBAS",
            course_state:"ACTIVE",
            source:"test",
            active:true,
          })
          .select("id,legacy_class_code")
          .single();
        if (testClassCreateError || !createdClass) {
          throw testClassCreateError || new Error("test_class_not_created");
        }
        testClass = createdClass;
      } else {
        await admin.from("classrooms")
          .update({ active:true, source:"test" })
          .eq("id", testClass.id);
      }
      testClassCode = String(testClass.legacy_class_code || "PRUEBAS");

      const testEmail = "lenguarcade.pruebas@alumno.fomento.edu";
      let { data:testProfile, error:testProfileReadError } = await admin
        .from("profiles")
        .select("id,email,first_name,last_name,role,organization_id")
        .eq("organization_id", profile.organization_id)
        .eq("email", testEmail)
        .eq("role", "student")
        .maybeSingle();
      if (testProfileReadError) throw testProfileReadError;

      if (!testProfile) {
        const { data:createdTestProfile, error:testProfileCreateError } = await admin
          .from("profiles")
          .insert({
            organization_id:profile.organization_id,
            email:testEmail,
            first_name:"Alumno",
            last_name:"de prueba",
            role:"student",
            source:"test",
            active:true,
          })
          .select("id,email,first_name,last_name,role,organization_id")
          .single();
        if (testProfileCreateError || !createdTestProfile) {
          throw testProfileCreateError || new Error("test_profile_not_created");
        }
        testProfile = createdTestProfile;
      } else {
        await admin.from("profiles")
          .update({ active:true, source:"test", archived_at:null, archive_reason:null, archived_by_classroom_id:null })
          .eq("id", testProfile.id);
      }

      const { error:enrollmentError } = await admin
        .from("classroom_enrollments")
        .upsert({
          classroom_id:testClass.id,
          profile_id:testProfile.id,
          active:true,
        }, { onConflict:"classroom_id,profile_id" });
      if (enrollmentError) throw enrollmentError;

      sessionProfile = testProfile;
    }

    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    await admin.from("app_sessions")
      .update({ revoked_at:new Date().toISOString() })
      .eq("auth_user_id", userData.user.id)
      .is("revoked_at", null);
    const { error:sessionError } = await admin.from("app_sessions").insert({
      auth_user_id:userData.user.id,
      profile_id:sessionProfile.id,
      expires_at:expiresAt,
    });
    if (sessionError) throw sessionError;

    await admin.from("profiles").update({
      last_login_at:new Date().toISOString(),
      auth_user_id:userData.user.id,
    }).eq("id", sessionProfile.id);

    return jsonResponse({
      ok:true,
      expiresAt,
      mode,
      testStudent:mode === "test_student",
      classCode:testClassCode,
      profile:{
        id:sessionProfile.id,
        email:sessionProfile.email,
        firstName:sessionProfile.first_name,
        lastName:sessionProfile.last_name,
        role:sessionProfile.role,
      },
    });
  } catch (error) {
    console.error("google-teacher-login failed", error);
    return jsonResponse({ ok:false, error:"google_teacher_login_unavailable" }, 503);
  }
});
