import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function requireProfileSession(request: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization") || "";
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ ok:false, error:"unauthorized" }), {
      status:401,
      headers:{ ...corsHeaders, "Content-Type":"application/json; charset=utf-8" },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global:{ headers:{ Authorization:authorization } },
    auth:{ persistSession:false, autoRefreshToken:false },
  });
  const { data:userData, error:userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    throw new Response(JSON.stringify({ ok:false, error:"unauthorized" }), {
      status:401,
      headers:{ ...corsHeaders, "Content-Type":"application/json; charset=utf-8" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth:{ persistSession:false, autoRefreshToken:false },
  });
  const now = new Date().toISOString();
  const { data:session, error:sessionError } = await admin
    .from("app_sessions")
    .select("profile_id,expires_at")
    .eq("auth_user_id", userData.user.id)
    .is("revoked_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending:false })
    .limit(1)
    .maybeSingle();
  if (sessionError || !session) {
    throw new Response(JSON.stringify({ ok:false, error:"session_expired" }), {
      status:401,
      headers:{ ...corsHeaders, "Content-Type":"application/json; charset=utf-8" },
    });
  }
  const { data:profile, error:profileError } = await admin
    .from("profiles")
    .select("organization_id,role,active")
    .eq("id", session.profile_id)
    .single();
  if (profileError || !profile?.active) {
    throw new Response(JSON.stringify({ ok:false, error:"session_expired" }), {
      status:401,
      headers:{ ...corsHeaders, "Content-Type":"application/json; charset=utf-8" },
    });
  }
  return {
    admin,
    authUserId:userData.user.id,
    profileId:session.profile_id,
    organizationId:profile.organization_id,
    profileRole:profile.role,
  };
}

export async function requireTeacherSession(request: Request) {
  const session = await requireProfileSession(request);
  if (session.profileRole !== "teacher" && session.profileRole !== "admin") {
    throw new Response(JSON.stringify({ ok:false, error:"forbidden" }), {
      status:403,
      headers:{ ...corsHeaders, "Content-Type":"application/json; charset=utf-8" },
    });
  }
  return session;
}

export function boundedNumber(value: unknown, min: number, max: number, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
