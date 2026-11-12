import { corsHeaders, jsonResponse } from "../_shared/lenguarcade.ts";

// Se conserva el endpoint para no romper clientes antiguos, pero ya no acepta
// claves docentes. El acceso del profesor pasa por Google/Fomento.
Deno.serve((request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);
  return jsonResponse({ ok:false, error:"google_login_required" }, 410);
});
