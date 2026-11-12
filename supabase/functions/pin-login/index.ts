import { corsHeaders, jsonResponse } from "../_shared/lenguarcade.ts";

// Acceso PIN retirado: la identidad de los alumnos se valida exclusivamente
// mediante su cuenta institucional de Google en google-student-login.
Deno.serve((request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);
  return jsonResponse({ ok:false, error:"google_login_required" }, 410);
});
