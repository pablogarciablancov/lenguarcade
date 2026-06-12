import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization") || "";
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization.startsWith("Bearer ")) {
    return jsonResponse({ ok:false, error:"unauthorized" }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok:false, error:"invalid_request" }, 400);
  }

  const email = String(body.email || "").trim().toLowerCase();
  const pin = String(body.pin || "").trim();
  if (!/^[^@\s]+@alumno\.fomento\.edu$/.test(email) || !/^\d{4,8}$/.test(pin)) {
    return jsonResponse({ ok:false, error:"invalid_credentials" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global:{ headers:{ Authorization:authorization } },
    auth:{ persistSession:false, autoRefreshToken:false },
  });
  const { data:userData, error:userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ ok:false, error:"unauthorized" }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth:{ persistSession:false, autoRefreshToken:false },
  });
  const { data, error } = await adminClient.rpc("establish_pin_session", {
    login_email:email,
    plain_pin:pin,
    login_auth_user_id:userData.user.id,
  });
  if (error) {
    console.error("pin-login RPC failed", error);
    return jsonResponse({ ok:false, error:"login_unavailable" }, 503);
  }
  if (!data || !data.ok) {
    const status = data && data.reason === "temporarily_blocked" ? 429 : 401;
    return jsonResponse({ ok:false, error:data && data.reason || "invalid_credentials" }, status);
  }

  return jsonResponse(data);
});
