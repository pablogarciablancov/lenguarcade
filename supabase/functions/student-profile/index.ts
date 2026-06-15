import {
  corsHeaders,
  jsonResponse,
  requireProfileSession,
} from "../_shared/lenguarcade.ts";

const characters = new Set(Array.from({ length:16 }, (_, index) =>
  `avatar-${String(index + 1).padStart(2, "0")}`
));
const backgrounds = new Set([
  "mountains", "castle", "volcano", "forest", "snow", "coast",
  "desert", "moon-city", "arcade", "library", "sky-islands", "autumn-village",
]);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  try {
    const { admin, authUserId, profileId } = await requireProfileSession(request);
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "updateAvatar") {
      const input = body.avatar && typeof body.avatar === "object" ? body.avatar : {};
      const character = String(input.character || "");
      const background = String(input.background || "");
      if (!characters.has(character) || !backgrounds.has(background)) {
        return jsonResponse({ ok:false, error:"invalid_avatar" }, 400);
      }
      const avatar = { version:2, character, background };
      const { error } = await admin.from("profiles").update({ avatar }).eq("id", profileId);
      if (error) throw error;
      return jsonResponse({ ok:true, avatar, message:"Avatar actualizado correctamente." });
    }

    if (action === "changePin") {
      const oldPin = String(body.oldPin || "").trim();
      const newPin = String(body.newPin || "").trim();
      if (!/^\d{4,8}$/.test(oldPin) || !/^\d{4,8}$/.test(newPin)) {
        return jsonResponse({ ok:false, error:"invalid_pin_format" }, 400);
      }
      const { data:changed, error } = await admin.rpc("change_profile_pin", {
        target_profile_id:profileId,
        old_pin:oldPin,
        new_pin:newPin,
      });
      if (error) throw error;
      if (!changed) return jsonResponse({ ok:false, error:"wrong_current_pin" }, 401);
      return jsonResponse({ ok:true, message:"PIN actualizado correctamente." });
    }

    if (action === "logout") {
      await admin.from("app_sessions")
        .update({ revoked_at:new Date().toISOString() })
        .eq("auth_user_id", authUserId)
        .is("revoked_at", null);
      return jsonResponse({ ok:true });
    }

    return jsonResponse({ ok:false, error:"unknown_action" }, 400);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("student-profile failed", error);
    return jsonResponse({ ok:false, error:"profile_unavailable" }, 503);
  }
});
