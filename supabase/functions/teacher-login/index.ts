import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/lenguarcade.ts";

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
    const userClient = createClient(supabaseUrl, anonKey, {
      global:{ headers:{ Authorization:authorization } },
      auth:{ persistSession:false, autoRefreshToken:false },
    });
    const { data:userData, error:userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return jsonResponse({ ok:false, error:"unauthorized" }, 401);

    const body = await request.json().catch(() => ({}));
    const password = String(body.password || "");
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth:{ persistSession:false, autoRefreshToken:false },
    });
    const { data:result, error } = await admin.rpc("establish_teacher_session", {
      plain_password:password,
      login_auth_user_id:userData.user.id,
    });
    if (error) throw error;
    if (!result?.ok) {
      const status = result?.reason === "temporarily_blocked" ? 429 : 401;
      return jsonResponse({ ok:false, error:result?.reason || "invalid_credentials" }, status);
    }
    return jsonResponse(result);
  } catch (error) {
    console.error("teacher-login failed", error);
    return jsonResponse({ ok:false, error:"login_unavailable" }, 503);
  }
});
