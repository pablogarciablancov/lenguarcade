import {
  boundedNumber,
  corsHeaders,
  jsonResponse,
  requireProfileSession,
} from "../_shared/lenguarcade.ts";

function cleanAchievement(value: unknown) {
  if (typeof value === "string") {
    return { id:value.slice(0, 120), title:value.slice(0, 180), description:"", xpReward:0, hidden:false };
  }
  const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const id = String(item.id || item.achievementId || "").trim().slice(0, 120);
  return {
    id,
    title:String(item.title || item.name || id || "Logro").slice(0, 180),
    description:String(item.description || "").slice(0, 500),
    xpReward:Math.round(boundedNumber(item.xpReward, 0, 10000)),
    hidden:Boolean(item.hidden),
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers:corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok:false, error:"method_not_allowed" }, 405);

  try {
    const { admin, profileId } = await requireProfileSession(request);
    const body = await request.json().catch(() => ({}));
    const gameId = String(body.gameId || "").trim().slice(0, 80);
    const resultId = String(body.resultId || "").trim().slice(0, 180);
    if (!gameId) return jsonResponse({ ok:false, error:"missing_game_id" }, 400);

    const { data:game } = await admin.from("games").select("id").eq("id", gameId).maybeSingle();
    if (!game) return jsonResponse({ ok:false, error:"unknown_game" }, 400);
    if (resultId) {
      const { data:duplicate } = await admin.from("game_events")
        .select("id")
        .eq("profile_id", profileId)
        .eq("game_id", gameId)
        .eq("result_id", resultId)
        .maybeSingle();
      if (duplicate) return jsonResponse({ ok:true, duplicate:true });
    }

    const { data:old } = await admin.from("game_progress")
      .select("*")
      .eq("profile_id", profileId)
      .eq("game_id", gameId)
      .maybeSingle();
    const progress = body.progress && typeof body.progress === "object" ? body.progress : {};
    const oldXp = Number(old?.xp || 0);
    const oldFeathers = Number(old?.feathers || 0);
    const xpDelta = Math.round(boundedNumber(progress.xpDelta, 0, 5000));
    const feathersDelta = Math.round(boundedNumber(progress.plumasDelta ?? progress.feathersDelta, 0, 500));
    const newXp = progress.xp == null
      ? oldXp + xpDelta
      : Math.max(oldXp, Math.round(boundedNumber(progress.xp, 0, 100000000)));
    const newFeathers = progress.plumas == null && progress.feathers == null
      ? oldFeathers + feathersDelta
      : Math.max(oldFeathers, Math.round(boundedNumber(progress.plumas ?? progress.feathers, 0, 10000000)));
    const now = new Date().toISOString();
    const rawGameData = body.rawGameData && typeof body.rawGameData === "object" ? body.rawGameData : {};
    const achievements = Array.isArray(body.achievements)
      ? body.achievements.map(cleanAchievement).filter(item => item.id)
      : [];
    const shouldCountSession = body.countSession === true ||
      (!body.checkpoint && body.countSession !== false && !body.sessionAlreadyCounted);
    const shouldWriteEvent = body.writeEvent === false ? false : shouldCountSession;

    if (achievements.length) {
      await admin.from("achievement_definitions").upsert(
        achievements.map(item => ({
          game_id:gameId,
          id:item.id,
          title:item.title,
          description:item.description,
          xp_reward:item.xpReward,
          hidden:item.hidden,
        })),
        { onConflict:"game_id,id" },
      );
      await admin.from("player_achievements").upsert(
        achievements.map(item => ({
          profile_id:profileId,
          game_id:gameId,
          achievement_id:item.id,
          unlocked_at:now,
        })),
        { onConflict:"profile_id,game_id,achievement_id", ignoreDuplicates:true },
      );
    }

    const { count:achievementCount } = await admin.from("player_achievements")
      .select("*", { count:"exact", head:true })
      .eq("profile_id", profileId)
      .eq("game_id", gameId);
    const record = {
      profile_id:profileId,
      game_id:gameId,
      xp:newXp,
      level:Math.max(1, Math.round(boundedNumber(progress.level ?? progress.nivel, 1, 10000, Number(old?.level || 1)))),
      percentage:boundedNumber(progress.percentage ?? progress.percent, 0, 100, Number(old?.percentage || 0)),
      accuracy:boundedNumber(progress.accuracy, 0, 100, Number(old?.accuracy || 0)),
      attempts:Math.max(Number(old?.attempts || 0), Math.round(boundedNumber(progress.attempts, 0, 100000000, Number(old?.attempts || 0)))),
      successes:Math.max(Number(old?.successes || 0), Math.round(boundedNumber(progress.successes, 0, 100000000, Number(old?.successes || 0)))),
      errors:Math.max(Number(old?.errors || 0), Math.round(boundedNumber(progress.errors, 0, 100000000, Number(old?.errors || 0)))),
      streak:Math.max(Number(old?.streak || 0), Math.round(boundedNumber(progress.streak, 0, 1000000, Number(old?.streak || 0)))),
      sessions:Number(old?.sessions || 0) + (shouldCountSession ? 1 : 0),
      achievements_count:Number(achievementCount || 0),
      missions_completed:Math.max(Number(old?.missions_completed || 0), Math.round(boundedNumber(progress.missionsCompleted, 0, 100000, Number(old?.missions_completed || 0)))),
      feathers:newFeathers,
      raw_data:rawGameData,
      last_activity_at:now,
    };
    const { error:progressError } = await admin.from("game_progress")
      .upsert(record, { onConflict:"profile_id,game_id" });
    if (progressError) throw progressError;

    if (shouldWriteEvent) {
      const { error:eventError } = await admin.from("game_events").insert({
        result_id:resultId || crypto.randomUUID(),
        profile_id:profileId,
        game_id:gameId,
        event_type:String(body.eventType || "progress_saved").slice(0, 100),
        xp_delta:Math.max(0, newXp - oldXp),
        feathers_delta:Math.max(0, newFeathers - oldFeathers),
        accuracy:record.accuracy,
        details:body.details && typeof body.details === "object" ? body.details : {},
        occurred_at:now,
      });
      if (eventError) throw eventError;
    }

    const save = rawGameData.save && typeof rawGameData.save === "object"
      ? rawGameData.save
      : body.save && typeof body.save === "object" ? body.save : null;
    if (save) {
      const { data:oldSave } = await admin.from("game_saves")
        .select("revision")
        .eq("profile_id", profileId)
        .eq("game_id", gameId)
        .eq("slot", "main")
        .maybeSingle();
      const { error:saveError } = await admin.from("game_saves").upsert({
        profile_id:profileId,
        game_id:gameId,
        slot:"main",
        revision:Number(oldSave?.revision || 0) + 1,
        save_data:save,
        saved_at:now,
      }, { onConflict:"profile_id,game_id,slot" });
      if (saveError) throw saveError;
    }

    const errors = Array.isArray(body.errors) ? body.errors.slice(0, 100) : [];
    if (errors.length) {
      await admin.from("game_errors").insert(errors.map((item: Record<string, unknown>) => ({
        profile_id:profileId,
        game_id:gameId,
        skill:String(item.skill || "").slice(0, 120),
        error_type:String(item.type || item.errorType || "").slice(0, 120),
        error_count:Math.max(1, Math.round(boundedNumber(item.count, 1, 10000, 1))),
        details:item,
        occurred_at:now,
      })));
    }

    return jsonResponse({ ok:true, duplicate:false, record });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("save-progress failed", error);
    return jsonResponse({ ok:false, error:"save_unavailable" }, 503);
  }
});
